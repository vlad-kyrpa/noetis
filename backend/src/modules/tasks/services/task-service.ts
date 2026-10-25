import { and, desc, eq, inArray, isNotNull, like, sql } from 'drizzle-orm';
import { notes, tags, taskLinks, taskNotes, tasks } from '../../../database/schema';
import type { Database } from '../../Database';
import { collectionDiff } from '../../common/utils/collections';
import { failure, success } from '../../common/utils/result';
import type { Task, TaskFilters, TaskInput, TasksService } from '../types';

/** Synchronizes each task relation table using only the requested identifier changes. */
const replaceRelations = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly taskId: string;
  readonly input: TaskInput;
}): Promise<void> => {
  const { database, taskId, input, userId } = params;
  const [storedTasks, storedNotes] = await Promise.all([
    database
      .select({ id: taskLinks.linkedTaskId })
      .from(taskLinks)
      .where(eq(taskLinks.taskId, taskId)),
    database.select({ id: taskNotes.noteId }).from(taskNotes).where(eq(taskNotes.taskId, taskId)),
  ]);
  const [ownedTasks, ownedNotes] = await Promise.all([
    input.linkedTaskIds.length === 0 ? Promise.resolve([]) : database.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.userId, userId), inArray(tasks.id, input.linkedTaskIds))),
    input.linkedNoteIds.length === 0 ? Promise.resolve([]) : database.select({ id: notes.id }).from(notes).where(and(eq(notes.userId, userId), inArray(notes.id, input.linkedNoteIds))),
  ]);
  const taskChanges = collectionDiff({
    current: storedTasks.map((task) => task.id),
    desired: ownedTasks.map((task) => task.id).filter((id) => id !== taskId),
  });
  const noteChanges = collectionDiff({
    current: storedNotes.map((note) => note.id),
    desired: ownedNotes.map((note) => note.id),
  });
  await Promise.all([
    taskChanges.removed.length === 0
      ? Promise.resolve()
      : database
          .delete(taskLinks)
          .where(
            and(eq(taskLinks.taskId, taskId), inArray(taskLinks.linkedTaskId, taskChanges.removed)),
          ),
    noteChanges.removed.length === 0
      ? Promise.resolve()
      : database
          .delete(taskNotes)
          .where(and(eq(taskNotes.taskId, taskId), inArray(taskNotes.noteId, noteChanges.removed))),
  ]);
  await Promise.all([
    ...taskChanges.added.map((linkedTaskId) =>
      database.insert(taskLinks).values({ taskId, linkedTaskId }).onConflictDoNothing(),
    ),
    ...noteChanges.added.map((noteId) =>
      database.insert(taskNotes).values({ taskId, noteId }).onConflictDoNothing(),
    ),
  ]);
};

/** Hydrates stored task content with its documented relation fields. */
const hydrateTask = async (params: {
  readonly database: Database;
  readonly task: typeof tasks.$inferSelect;
}): Promise<Task> => {
  const { database, task } = params;
  const [linkedTasks, linkedNotes] = await Promise.all([
    database
      .select({ id: taskLinks.linkedTaskId })
      .from(taskLinks)
      .where(eq(taskLinks.taskId, task.id)),
    database.select({ id: taskNotes.noteId }).from(taskNotes).where(eq(taskNotes.taskId, task.id)),
  ]);
  return {
    ...task,
    linkedTaskIds: linkedTasks.map((item) => item.id),
    linkedNoteIds: linkedNotes.map((item) => item.id),
  };
};

/** Limits an assigned tag to a tag owned by the current account. */
const ownedTagId = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly tagId: string | null;
}): Promise<string | null> => {
  const { database, userId, tagId } = params;
  if (tagId === null) return null;
  const tag = await database.select({ id: tags.id }).from(tags).where(and(eq(tags.id, tagId), eq(tags.userId, userId))).get();
  return tag?.id ?? null;
};

/** Builds the documented Tasks service on top of the D1 database abstraction. */
export const taskServiceFactory = (params: { readonly database: Database; readonly userId: string }): TasksService => {
  const { database, userId } = params;
  return ({
  create: async (input) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const tagId = await ownedTagId({ database, userId, tagId: input.tagId });
    await database.insert(tasks).values({
      id,
      userId,
      title: input.title,
      description: input.description,
      tagId,
      dueTo: input.dueTo,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    });
    await replaceRelations({ database, userId, taskId: id, input });
    const task = await database.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).get();
    if (task === undefined) throw new Error('Created task was not found');
    return hydrateTask({ database, task });
  },
  update: async ({ id, input }) => {
    const tagId = await ownedTagId({ database, userId, tagId: input.tagId });
    const updated = await database
      .update(tasks)
      .set({
        title: input.title,
        description: input.description,
        tagId,
        dueTo: input.dueTo,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    const task = updated[0];
    if (task === undefined) {
      return failure('Task not found');
    }
    await replaceRelations({ database, userId, taskId: id, input });
    return success(await hydrateTask({ database, task }));
  },
  remove: async (ids) => {
    await database.delete(tasks).where(and(eq(tasks.userId, userId), inArray(tasks.id, ids)));
  },
  get: async (ids) =>
    Promise.all(
      (await database.select().from(tasks).where(and(eq(tasks.userId, userId), inArray(tasks.id, ids)))).map((task) =>
        hydrateTask({ database, task }),
      ),
    ),
  find: async (filters: TaskFilters) => {
    const conditions = [eq(tasks.userId, userId),
      filters.tagId === undefined ? undefined : eq(tasks.tagId, filters.tagId),
      filters.title === undefined
        ? undefined
        : like(sql`lower(${tasks.title})`, `%${filters.title.toLowerCase()}%`),
      filters.status === undefined ? undefined : eq(tasks.status, filters.status),
      filters.dueTo === 'defined'
        ? isNotNull(tasks.dueTo)
        : filters.dueTo === undefined
          ? undefined
          : eq(tasks.dueTo, filters.dueTo),
    ].filter((condition) => condition !== undefined);
    const rows = await database
      .select()
      .from(tasks)
      .where(conditions.length === 0 ? undefined : and(...conditions))
      .orderBy(desc(tasks.updatedAt));
    return Promise.all(rows.map((task) => hydrateTask({ database, task })));
  },
  findNoteByTitleAndLink: async ({ taskId, title }) => {
    const [source, note] = await Promise.all([
      database.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).get(),
      database.select({ id: notes.id }).from(notes).where(and(eq(notes.title, title), eq(notes.userId, userId))).get(),
    ]);
    if (source === undefined || note === undefined) {
      return failure('Task or note not found');
    }
    await database.insert(taskNotes).values({ taskId, noteId: note.id }).onConflictDoNothing();
    return success(note.id);
  },
  findTaskByTitleAndLink: async ({ taskId, title }) => {
    const [source, task] = await Promise.all([
      database.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).get(),
      database.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.title, title), eq(tasks.userId, userId))).get(),
    ]);
    if (source === undefined || task === undefined || task.id === taskId) {
      return failure('Task not found or self-link requested');
    }
    await database
      .insert(taskLinks)
      .values({ taskId, linkedTaskId: task.id })
      .onConflictDoNothing();
    return success(task.id);
  },
  });
};
