import { and, eq, inArray, ne } from 'drizzle-orm';
import { viewTags, views, tags } from '../../../database/schema';
import type { Database } from '../../Database';
import { collectionDiff } from '../../common/utils/collections';
import { failure, success } from '../../common/utils/result';
import { resolveTags } from '../../tags/services/resolve-tags';
import type { View, ViewsService } from '../types';

/** Converts a stored view into the public model with tag labels rather than database identifiers. */
const hydrateView = async (params: {
  readonly database: Database;
  readonly view: typeof views.$inferSelect;
}): Promise<View> => {
  const { database, view } = params;
  const linkedTags = await database
    .select({ label: tags.label })
    .from(viewTags)
    .innerJoin(tags, eq(viewTags.tagId, tags.id))
    .where(eq(viewTags.viewId, view.id));
  return { ...view, tags: linkedTags.map((tag) => tag.label) };
};
/** Replaces view tags after resolving public labels to existing or newly-created tag records. */
const replaceTags = async (params: {
  readonly database: Database;
  readonly viewId: string;
  readonly labels: readonly string[];
}): Promise<void> => {
  const { database, viewId, labels } = params;
  const [resolved, stored] = await Promise.all([
    resolveTags({ database, labels }),
    database.select({ id: viewTags.tagId }).from(viewTags).where(eq(viewTags.viewId, viewId)),
  ]);
  const changes = collectionDiff({
    current: stored.map((tag) => tag.id),
    desired: resolved.map((tag) => tag.id),
  });
  await Promise.all([
    changes.removed.length === 0
      ? Promise.resolve()
      : database
          .delete(viewTags)
          .where(and(eq(viewTags.viewId, viewId), inArray(viewTags.tagId, changes.removed))),
    ...changes.added.map((tagId) =>
      database.insert(viewTags).values({ viewId, tagId }).onConflictDoNothing(),
    ),
  ]);
};
/** Builds the saved Views service on top of the D1 database abstraction. */
export const viewServiceFactory = (database: Database): ViewsService => ({
  create: async (input) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const inserted = await database
      .insert(views)
      .values({
        id,
        type: input.type,
        period: input.period,
        title: input.title,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    const view = inserted[0];
    if (view === undefined) {
      return failure('View title already exists for this type');
    }
    await replaceTags({ database, viewId: id, labels: input.tags });
    return success(await hydrateView({ database, view }));
  },
  find: async (filters) =>
    Promise.all(
      (
        await database
          .select()
          .from(views)
          .where(filters.type === undefined ? undefined : eq(views.type, filters.type))
      ).map((view) => hydrateView({ database, view })),
    ),
  get: async (id) => {
    const view = await database.select().from(views).where(eq(views.id, id)).get();
    return view === undefined ? null : hydrateView({ database, view });
  },
  update: async ({ id, input }) => {
    const current = await database
      .select({ id: views.id })
      .from(views)
      .where(eq(views.id, id))
      .get();
    if (current === undefined) {
      return failure('View not found');
    }
    const duplicate = await database
      .select({ id: views.id })
      .from(views)
      .where(and(eq(views.type, input.type), eq(views.title, input.title), ne(views.id, id)))
      .get();
    if (duplicate !== undefined) {
      return failure('View title already exists for this type');
    }
    const updated = await database
      .update(views)
      .set({ type: input.type, period: input.period, title: input.title, updatedAt: new Date() })
      .where(eq(views.id, id))
      .returning();
    const view = updated[0];
    if (view === undefined) {
      return failure('View not found');
    }
    await replaceTags({ database, viewId: id, labels: input.tags });
    return success(await hydrateView({ database, view }));
  },
  remove: async (ids) => {
    await database.delete(views).where(inArray(views.id, ids));
  },
});
