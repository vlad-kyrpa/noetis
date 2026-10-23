import { and, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { noteLinks, noteTags, noteTasks, notes, tags } from '../../../database/schema';
import type { Database } from '../../Database';
import { collectionDiff } from '../../common/utils/collections';
import { failure, success } from '../../common/utils/result';
import { resolveTags } from '../../tags/services/resolve-tags';
import type { Note, NoteFilters, NoteInput, NotesService } from '../types';

/** Synchronizes note relations after converting public tag labels to internal IDs. */
const replaceRelations = async (params: {
  readonly database: Database;
  readonly noteId: string;
  readonly input: NoteInput;
}): Promise<void> => {
  const { database, noteId, input } = params;

  const [resolvedTags, storedTags, storedTasks, storedLinks] = await Promise.all([
    resolveTags({ database, labels: input.tags }),
    database.select({ id: noteTags.tagId }).from(noteTags).where(eq(noteTags.noteId, noteId)),
    database.select({ id: noteTasks.taskId }).from(noteTasks).where(eq(noteTasks.noteId, noteId)),
    database
      .select({ id: noteLinks.linkedNoteId })
      .from(noteLinks)
      .where(eq(noteLinks.noteId, noteId)),
  ]);

  const tagChanges = collectionDiff({
    current: storedTags.map((tag) => tag.id),
    desired: resolvedTags.map((tag) => tag.id),
  });
  const taskChanges = collectionDiff({
    current: storedTasks.map((task) => task.id),
    desired: input.linkedTaskIds,
  });
  const linkChanges = collectionDiff({
    current: storedLinks.map((link) => link.id),
    desired: input.linkedNoteIds.filter((id) => id !== noteId),
  });

  await Promise.all([
    tagChanges.removed.length === 0
      ? Promise.resolve()
      : database
          .delete(noteTags)
          .where(and(eq(noteTags.noteId, noteId), inArray(noteTags.tagId, tagChanges.removed))),
    taskChanges.removed.length === 0
      ? Promise.resolve()
      : database
          .delete(noteTasks)
          .where(and(eq(noteTasks.noteId, noteId), inArray(noteTasks.taskId, taskChanges.removed))),
    linkChanges.removed.length === 0
      ? Promise.resolve()
      : database
          .delete(noteLinks)
          .where(
            and(eq(noteLinks.noteId, noteId), inArray(noteLinks.linkedNoteId, linkChanges.removed)),
          ),
  ]);

  await Promise.all([
    ...tagChanges.added.map((tagId) =>
      database.insert(noteTags).values({ noteId, tagId }).onConflictDoNothing(),
    ),
    ...taskChanges.added.map((taskId) =>
      database.insert(noteTasks).values({ noteId, taskId }).onConflictDoNothing(),
    ),
    ...linkChanges.added.map((linkedNoteId) =>
      database.insert(noteLinks).values({ noteId, linkedNoteId }).onConflictDoNothing(),
    ),
  ]);
};

/** Hydrates stored note content with its documented relation fields. */
const hydrateNote = async (params: {
  readonly database: Database;
  readonly note: typeof notes.$inferSelect;
}): Promise<Note> => {
  const { database, note } = params;
  const [tagRecords, linkedTasks, linkedNotes] = await Promise.all([
    database
      .select({ label: tags.label })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, note.id)),
    database.select({ id: noteTasks.taskId }).from(noteTasks).where(eq(noteTasks.noteId, note.id)),
    database
      .select({ id: noteLinks.linkedNoteId })
      .from(noteLinks)
      .where(eq(noteLinks.noteId, note.id)),
  ]);

  return {
    ...note,
    tags: tagRecords.map((item) => item.label),
    linkedTaskIds: linkedTasks.map((item) => item.id),
    linkedNoteIds: linkedNotes.map((item) => item.id),
  };
};

/** Builds the documented Notes service on top of the D1 database abstraction. */
export const noteServiceFactory = (database: Database): NotesService => ({
  create: async (input) => {
    const id = crypto.randomUUID();
    const now = new Date();
    await database.insert(notes).values({
      id,
      title: input.title,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    });

    await replaceRelations({ database, noteId: id, input });

    const note = await database.select().from(notes).where(eq(notes.id, id)).get();
    if (note === undefined) {
      throw new Error('Created note was not found');
    }

    return hydrateNote({ database, note });
  },

  update: async ({ id, input }) => {
    const updated = await database
      .update(notes)
      .set({ title: input.title, body: input.body, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();

    const note = updated[0];
    if (note === undefined) {
      return failure('Note not found');
    }

    await replaceRelations({ database, noteId: id, input });
    return success(await hydrateNote({ database, note }));
  },

  remove: async (ids) => {
    await database.delete(notes).where(inArray(notes.id, ids));
  },

  get: async (ids) =>
    Promise.all(
      (await database.select().from(notes).where(inArray(notes.id, ids))).map((note) =>
        hydrateNote({ database, note }),
      ),
    ),

  find: async (filters: NoteFilters) => {
    const conditions = [
      filters.title === undefined
        ? undefined
        : like(sql`lower(${notes.title})`, `%${filters.title.toLowerCase()}%`),
      filters.body === undefined
        ? undefined
        : like(sql`lower(${notes.body})`, `%${filters.body.toLowerCase()}%`),
      filters.tag === undefined
        ? undefined
        : sql`${notes.id} in (
            select ${noteTags.noteId}
            from ${noteTags}
            inner join ${tags} on ${noteTags.tagId} = ${tags.id}
            where ${tags.label} = ${filters.tag}
          )`,
    ].filter((condition) => condition !== undefined);

    const rows = await database
      .select()
      .from(notes)
      .where(conditions.length === 0 ? undefined : and(...conditions))
      .orderBy(desc(notes.updatedAt));

    return Promise.all(rows.map((note) => hydrateNote({ database, note })));
  },
});
