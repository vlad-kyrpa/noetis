import { and, desc, eq, gte, inArray, isNotNull, like, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import {
  notes,
  tags,
  taskLinks,
  taskNotes,
  taskTags,
  tasks,
  viewTags,
  views,
} from '../../../database/schema';
import type { Database } from '../../Database';
import { collectionDiff } from '../../common/utils/collections';
import { failure, success } from '../../common/utils/result';
import { resolveTags } from '../../tags/services/resolve-tags';
import type { Task, TaskFilters, TaskInput, TasksService } from '../types';

/** The saved-view type whose tags may scope a task search. */
const TASK_VIEW_TYPE = 'task';

/** Replaces the task's tag links after resolving labels to the user's tag records. */
const replaceTags = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly taskId: string;
  readonly labels: readonly string[];
}): Promise<void> => {
  const { database, labels, taskId, userId } = params;
  const [resolved, stored] = await Promise.all([
    resolveTags({ database, userId, labels }),
    database.select({ id: taskTags.tagId }).from(taskTags).where(eq(taskTags.taskId, taskId)),
  ]);
  const changes = collectionDiff({
    current: stored.map((tag) => tag.id),
    desired: resolved.map((tag) => tag.id),
  });
  await Promise.all([
    changes.removed.length === 0
      ? Promise.resolve()
      : database
          .delete(taskTags)
          .where(and(eq(taskTags.taskId, taskId), inArray(taskTags.tagId, changes.removed))),
    ...changes.added.map((tagId) =>
      database.insert(taskTags).values({ taskId, tagId }).onConflictDoNothing(),
    ),
  ]);
};

/** Synchronizes each task relation table using only the requested identifier changes. */
const replaceRelations = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly taskId: string;
  readonly input: TaskInput;
}): Promise<void> => {
  const { database, taskId, input, userId } = params;
  await replaceTags({ database, userId, taskId, labels: input.tags });
  const [storedTasks, storedNotes] = await Promise.all([
    database
      .select({ id: taskLinks.linkedTaskId })
      .from(taskLinks)
      .where(eq(taskLinks.taskId, taskId)),
    database.select({ id: taskNotes.noteId }).from(taskNotes).where(eq(taskNotes.taskId, taskId)),
  ]);
  const [ownedTasks, ownedNotes] = await Promise.all([
    input.linkedTaskIds.length === 0
      ? Promise.resolve([])
      : database
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.userId, userId), inArray(tasks.id, input.linkedTaskIds))),
    input.linkedNoteIds.length === 0
      ? Promise.resolve([])
      : database
          .select({ id: notes.id })
          .from(notes)
          .where(and(eq(notes.userId, userId), inArray(notes.id, input.linkedNoteIds))),
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
  const [tagRecords, linkedTasks, linkedNotes] = await Promise.all([
    database
      .select({ label: tags.label })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, task.id)),
    database
      .select({ id: taskLinks.linkedTaskId })
      .from(taskLinks)
      .where(eq(taskLinks.taskId, task.id)),
    database.select({ id: taskNotes.noteId }).from(taskNotes).where(eq(taskNotes.taskId, task.id)),
  ]);
  return {
    ...task,
    tags: tagRecords.map((item) => item.label),
    linkedTaskIds: linkedTasks.map((item) => item.id),
    linkedNoteIds: linkedNotes.map((item) => item.id),
  };
};

/** Tag ids a task must all carry; `null` means a requested tag or view cannot match anything. */
type RequiredTagIds = readonly string[] | null;

/** Looks up the tag ids of an owned task view, or `null` when the view is unknown or foreign. */
const findViewTagIds = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly viewId: string | undefined;
}): Promise<RequiredTagIds> => {
  const { database, userId, viewId } = params;
  if (viewId === undefined) return [];
  const view = await database
    .select({ id: views.id })
    .from(views)
    .where(and(eq(views.id, viewId), eq(views.userId, userId), eq(views.type, TASK_VIEW_TYPE)))
    .get();
  if (view === undefined) return null;
  const linked = await database
    .select({ id: viewTags.tagId })
    .from(viewTags)
    .where(eq(viewTags.viewId, viewId));
  return linked.map((tag) => tag.id);
};

/** Resolves full, lower-cased labels to owned tag ids, or `null` if any label is unknown. */
const findLabelTagIds = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly labels: readonly string[] | undefined;
}): Promise<RequiredTagIds> => {
  const { database, labels, userId } = params;
  if (labels === undefined || labels.length === 0) return [];
  const found = await database
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(tags.label, [...labels])));
  return found.length === labels.length ? found.map((tag) => tag.id) : null;
};

/** Unions every tag requirement of the filters; any unmatched requirement yields `null`. */
const resolveRequiredTagIds = async (params: {
  readonly database: Database;
  readonly userId: string;
  readonly filters: TaskFilters;
}): Promise<RequiredTagIds> => {
  const { database, filters, userId } = params;
  const requirements = await Promise.all([
    findViewTagIds({ database, userId, viewId: filters.viewId }),
    findLabelTagIds({ database, userId, labels: filters.tags }),
  ]);
  const directTagIds = filters.tagId === undefined ? [] : [filters.tagId];
  return requirements.some((requirement) => requirement === null)
    ? null
    : [...new Set([...directTagIds, ...requirements.flatMap((requirement) => requirement ?? [])])];
};

/** Builds the "task has all of these tags" condition; no required tags adds no condition. */
const hasAllTagsCondition = (tagIds: readonly string[]): SQL | undefined =>
  tagIds.length === 0
    ? undefined
    : sql`${tasks.id} in (
        select ${taskTags.taskId}
        from ${taskTags}
        where ${inArray(taskTags.tagId, [...tagIds])}
        group by ${taskTags.taskId}
        having count(distinct ${taskTags.tagId}) = ${tagIds.length}
      )`;

/** Maps the `dueTo` filter to its condition: exact day, any defined date, or none. */
const dueToCondition = (dueTo: string | undefined): SQL | undefined => {
  if (dueTo === undefined) return undefined;
  return dueTo === 'defined' ? isNotNull(tasks.dueTo) : eq(tasks.dueTo, dueTo);
};

/** Builds the documented Tasks service on top of the D1 database abstraction. */
export const taskServiceFactory = (params: {
  readonly database: Database;
  readonly userId: string;
}): TasksService => {
  const { database, userId } = params;
  return {
    create: async (input) => {
      const id = crypto.randomUUID();
      const now = new Date();
      await database.insert(tasks).values({
        id,
        userId,
        title: input.title,
        description: input.description,
        dueTo: input.dueTo,
        status: input.status,
        createdAt: now,
        updatedAt: now,
      });
      await replaceRelations({ database, userId, taskId: id, input });
      const task = await database
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .get();
      if (task === undefined) throw new Error('Created task was not found');
      return hydrateTask({ database, task });
    },
    update: async ({ id, input }) => {
      const updated = await database
        .update(tasks)
        .set({
          title: input.title,
          description: input.description,
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
        (
          await database
            .select()
            .from(tasks)
            .where(and(eq(tasks.userId, userId), inArray(tasks.id, ids)))
        ).map((task) => hydrateTask({ database, task })),
      ),
    find: async (filters: TaskFilters) => {
      const requiredTagIds = await resolveRequiredTagIds({ database, userId, filters });
      if (requiredTagIds === null) return [];
      // ISO dates compare correctly as strings, so ranges need no date parsing.
      const conditions = [
        eq(tasks.userId, userId),
        hasAllTagsCondition(requiredTagIds),
        filters.title === undefined
          ? undefined
          : like(sql`lower(${tasks.title})`, `%${filters.title.toLowerCase()}%`),
        filters.status === undefined ? undefined : eq(tasks.status, filters.status),
        dueToCondition(filters.dueTo),
        filters.dueFrom === undefined ? undefined : gte(tasks.dueTo, filters.dueFrom),
        filters.dueUntil === undefined ? undefined : lte(tasks.dueTo, filters.dueUntil),
      ].filter((condition) => condition !== undefined);
      const rows = await database
        .select()
        .from(tasks)
        .where(and(...conditions))
        .orderBy(desc(tasks.updatedAt));
      return Promise.all(rows.map((task) => hydrateTask({ database, task })));
    },
    findNoteByTitleAndLink: async ({ taskId, title }) => {
      const [source, note] = await Promise.all([
        database
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
          .get(),
        database
          .select({ id: notes.id })
          .from(notes)
          .where(and(eq(notes.title, title), eq(notes.userId, userId)))
          .get(),
      ]);
      if (source === undefined || note === undefined) {
        return failure('Task or note not found');
      }
      await database.insert(taskNotes).values({ taskId, noteId: note.id }).onConflictDoNothing();
      return success(note.id);
    },
    findTaskByTitleAndLink: async ({ taskId, title }) => {
      const [source, task] = await Promise.all([
        database
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
          .get(),
        database
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.title, title), eq(tasks.userId, userId)))
          .get(),
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
  };
};
