import { and, desc, eq, inArray, isNotNull, like, sql } from "drizzle-orm";
import { notes, taskLinks, taskNotes, tasks } from "../../../database/schema";
import type { Database } from "../../Database";
import { collectionDiff } from "../../common/utils/collections";
import type { Task, TaskFilters, TaskInput, TasksService } from "../types";

/** Synchronizes each task relation table using only the requested identifier changes. */
const replaceRelations = async (params: { readonly database: Database; readonly taskId: string; readonly input: TaskInput }): Promise<void> => {
  const { database, taskId, input } = params;
  const [storedTasks, storedNotes] = await Promise.all([
    database.select({ id: taskLinks.linkedTaskId }).from(taskLinks).where(eq(taskLinks.taskId, taskId)),
    database.select({ id: taskNotes.noteId }).from(taskNotes).where(eq(taskNotes.taskId, taskId)),
  ]);
  const taskChanges = collectionDiff({
    current: storedTasks.map((task) => task.id),
    desired: input.linkedTaskIds.filter((id) => id !== taskId),
  });
  const noteChanges = collectionDiff({
    current: storedNotes.map((note) => note.id),
    desired: input.linkedNoteIds,
  });
  await Promise.all([
    taskChanges.removed.length === 0
      ? Promise.resolve()
      : database.delete(taskLinks).where(and(eq(taskLinks.taskId, taskId), inArray(taskLinks.linkedTaskId, taskChanges.removed))),
    noteChanges.removed.length === 0
      ? Promise.resolve()
      : database.delete(taskNotes).where(and(eq(taskNotes.taskId, taskId), inArray(taskNotes.noteId, noteChanges.removed))),
  ]);
  await Promise.all([
    ...taskChanges.added.map((linkedTaskId) => database.insert(taskLinks).values({ taskId, linkedTaskId }).onConflictDoNothing()),
    ...noteChanges.added.map((noteId) => database.insert(taskNotes).values({ taskId, noteId }).onConflictDoNothing()),
  ]);
};

/** Hydrates stored task content with its documented relation fields. */
const hydrateTask = async (params: { readonly database: Database; readonly task: typeof tasks.$inferSelect }): Promise<Task> => {
  const { database, task } = params;
  const [linkedTasks, linkedNotes] = await Promise.all([
    database.select({ id: taskLinks.linkedTaskId }).from(taskLinks).where(eq(taskLinks.taskId, task.id)),
    database.select({ id: taskNotes.noteId }).from(taskNotes).where(eq(taskNotes.taskId, task.id)),
  ]);
  return { ...task, linkedTaskIds: linkedTasks.map((item) => item.id), linkedNoteIds: linkedNotes.map((item) => item.id) };
};

/** Builds the documented Tasks service on top of the D1 database abstraction. */
export const taskServiceFactory = (database: Database): TasksService => ({
  create: async (input) => {
    const id = crypto.randomUUID();
    const now = new Date();
    await database.insert(tasks).values({ id, title: input.title, description: input.description, tagId: input.tagId, dueTo: input.dueTo, status: input.status, createdAt: now, updatedAt: now });
    await replaceRelations({ database, taskId: id, input });
    const task = await database.select().from(tasks).where(eq(tasks.id, id)).get();
    if (task === undefined) throw new Error("Created task was not found");
    return hydrateTask({ database, task });
  },
  update: async ({ id, input }) => {
    const updated = await database.update(tasks).set({ title: input.title, description: input.description, tagId: input.tagId, dueTo: input.dueTo, status: input.status, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    const task = updated[0];
    if (task === undefined) return null;
    await replaceRelations({ database, taskId: id, input });
    return hydrateTask({ database, task });
  },
  remove: async (ids) => { await database.delete(tasks).where(inArray(tasks.id, ids)); },
  get: async (ids) => Promise.all((await database.select().from(tasks).where(inArray(tasks.id, ids))).map((task) => hydrateTask({ database, task }))),
  find: async (filters: TaskFilters) => {
    const conditions = [
      filters.tagId === undefined ? undefined : eq(tasks.tagId, filters.tagId),
      filters.title === undefined ? undefined : like(sql`lower(${tasks.title})`, `%${filters.title.toLowerCase()}%`),
      filters.status === undefined ? undefined : eq(tasks.status, filters.status),
      filters.dueTo === "defined" ? isNotNull(tasks.dueTo) : filters.dueTo === undefined ? undefined : eq(tasks.dueTo, filters.dueTo),
    ].filter((condition) => condition !== undefined);
    const rows = await database.select().from(tasks).where(conditions.length === 0 ? undefined : and(...conditions)).orderBy(desc(tasks.updatedAt));
    return Promise.all(rows.map((task) => hydrateTask({ database, task })));
  },
  findNoteByTitleAndLink: async ({ taskId, title }) => {
    const note = await database.select({ id: notes.id }).from(notes).where(eq(notes.title, title)).get();
    if (note === undefined) return null;
    await database.insert(taskNotes).values({ taskId, noteId: note.id }).onConflictDoNothing();
    return note.id;
  },
  findTaskByTitleAndLink: async ({ taskId, title }) => {
    const task = await database.select({ id: tasks.id }).from(tasks).where(eq(tasks.title, title)).get();
    if (task === undefined || task.id === taskId) return null;
    await database.insert(taskLinks).values({ taskId, linkedTaskId: task.id }).onConflictDoNothing();
    return task.id;
  },
});
