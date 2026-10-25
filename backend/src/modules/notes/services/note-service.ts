import { and, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { noteLinks, noteTags, noteTasks, notes, tags, tasks } from '../../../database/schema';
import type { Database } from '../../Database';
import { collectionDiff } from '../../common/utils/collections';
import { failure, success } from '../../common/utils/result';
import { resolveTags } from '../../tags/services/resolve-tags';
import type { Note, NoteFilters, NoteInput, NoteSummary, NotesService } from '../types';

/** Synchronizes note relations after converting public tag labels to internal IDs. */
const replaceRelations = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly noteId: string;
  readonly input: NoteInput;
}): Promise<void> => {
  const { database, noteId, input, userId } = params;

  const [resolvedTags, storedTags, storedTasks, storedLinks] = await Promise.all([
    resolveTags({ database, userId, labels: input.tags }),
    database.select({ id: noteTags.tagId }).from(noteTags).where(eq(noteTags.noteId, noteId)),
    database.select({ id: noteTasks.taskId }).from(noteTasks).where(eq(noteTasks.noteId, noteId)),
    database
      .select({ id: noteLinks.linkedNoteId })
      .from(noteLinks)
      .where(eq(noteLinks.noteId, noteId)),
  ]);
  const [ownedTasks, ownedNotes] = await Promise.all([
    input.linkedTaskIds.length === 0 ? Promise.resolve([]) : database.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.userId, userId), inArray(tasks.id, input.linkedTaskIds))),
    input.linkedNoteIds.length === 0 ? Promise.resolve([]) : database.select({ id: notes.id }).from(notes).where(and(eq(notes.userId, userId), inArray(notes.id, input.linkedNoteIds))),
  ]);

  const tagChanges = collectionDiff({
    current: storedTags.map((tag) => tag.id),
    desired: resolvedTags.map((tag) => tag.id),
  });
  const taskChanges = collectionDiff({
    current: storedTasks.map((task) => task.id),
    desired: ownedTasks.map((task) => task.id),
  });
  const linkChanges = collectionDiff({
    current: storedLinks.map((link) => link.id),
    desired: ownedNotes.map((note) => note.id).filter((id) => id !== noteId),
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

/** Loads relations shared by complete notes and lightweight collection summaries. */
const hydrateRelations = async (params: {
  readonly database: Database;
  readonly noteId: string;
}): Promise<Pick<NoteSummary, 'tags' | 'linkedTaskIds' | 'linkedNoteIds'>> => {
  const { database, noteId } = params;
  const [tagRecords, linkedTasks, linkedNotes] = await Promise.all([
    database
      .select({ label: tags.label })
      .from(noteTags)
      .innerJoin(tags, eq(noteTags.tagId, tags.id))
      .where(eq(noteTags.noteId, noteId)),
    database.select({ id: noteTasks.taskId }).from(noteTasks).where(eq(noteTasks.noteId, noteId)),
    database
      .select({ id: noteLinks.linkedNoteId })
      .from(noteLinks)
      .where(eq(noteLinks.noteId, noteId)),
  ]);

  return {
    tags: tagRecords.map((item) => item.label),
    linkedTaskIds: linkedTasks.map((item) => item.id),
    linkedNoteIds: linkedNotes.map((item) => item.id),
  };
};

/** Hydrates stored note content with its documented relation fields. */
const hydrateNote = async (params: {
  readonly database: Database;
  readonly note: typeof notes.$inferSelect;
}): Promise<Note> => ({
  ...params.note,
  ...(await hydrateRelations({ database: params.database, noteId: params.note.id })),
});

/** Hydrates a selected note summary without loading its full body from storage. */
const hydrateNoteSummary = async (params: {
  readonly database: Database;
  readonly note: Pick<typeof notes.$inferSelect, 'id' | 'userId' | 'title' | 'createdAt' | 'updatedAt'>;
}): Promise<NoteSummary> => ({
  ...params.note,
  ...(await hydrateRelations({ database: params.database, noteId: params.note.id })),
});

/** Builds the documented Notes service on top of the D1 database abstraction. */
export const noteServiceFactory = (params: { readonly database: Database; readonly userId: string }): NotesService => {
  const { database, userId } = params;
  return ({
  create: async (input) => {
    const id = crypto.randomUUID();
    const now = new Date();
    await database.insert(notes).values({
      id,
      userId,
      title: input.title,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    });

    await replaceRelations({ database, userId, noteId: id, input });

    const note = await database.select().from(notes).where(and(eq(notes.id, id), eq(notes.userId, userId))).get();
    if (note === undefined) {
      throw new Error('Created note was not found');
    }

    return hydrateNote({ database, note });
  },

  update: async ({ id, input }) => {
    const updated = await database
      .update(notes)
      .set({ title: input.title, body: input.body, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();

    const note = updated[0];
    if (note === undefined) {
      return failure('Note not found');
    }

    await replaceRelations({ database, userId, noteId: id, input });
    return success(await hydrateNote({ database, note }));
  },

  remove: async (ids) => {
    await database.delete(notes).where(and(eq(notes.userId, userId), inArray(notes.id, ids)));
  },

  get: async (ids) =>
    Promise.all(
      (await database.select().from(notes).where(and(eq(notes.userId, userId), inArray(notes.id, ids)))).map((note) =>
        hydrateNote({ database, note }),
      ),
    ),

  find: async (filters: NoteFilters) => {
    const conditions = [eq(notes.userId, userId),
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
      .select({
        id: notes.id,
        userId: notes.userId,
        title: notes.title,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(conditions.length === 0 ? undefined : and(...conditions))
      .orderBy(desc(notes.updatedAt));

    return Promise.all(rows.map((note) => hydrateNoteSummary({ database, note })));
  },
  });
};
