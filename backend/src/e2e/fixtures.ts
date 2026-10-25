import {
  expenses,
  noteTags,
  noteTasks,
  notes,
  tags,
  taskLinks,
  taskNotes,
  tasks,
  users,
  views,
  viewTags,
} from '../database/schema';
import type { Database } from '../modules/Database';

/** Identifies the account represented by ordinary authenticated test requests. */
const defaultOwnerId = 'e2e-test-user';

/** Creates the foreign account used by endpoint ownership scenarios. */
export const seedOtherUser = async (database: Database): Promise<void> => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  await database.insert(users).values({
    id: 'e2e-other-user', username: 'e2e-other', email: 'other@example.test', passwordHash: 'unused', passwordSalt: 'unused', createdAt: now, updatedAt: now,
  });
};

/**
 * Provides fixture builders for API integration tests.
 *
 * A fixture is inserted into the same ephemeral D1 binding that serves the Worker request.
 * Tests can override collection properties to express only the records relevant to their case;
 * relation rows are inserted after their owning records to preserve foreign-key validity.
 */

/** Describes a complete, directly seedable API database state. */
export interface ApiFixture {
  readonly tags: (typeof tags.$inferInsert)[];
  readonly notes: (typeof notes.$inferInsert)[];
  readonly tasks: (typeof tasks.$inferInsert)[];
  readonly expenses: (typeof expenses.$inferInsert)[];
  readonly views: (typeof views.$inferInsert)[];
  readonly viewTags: (typeof viewTags.$inferInsert)[];
  readonly noteTags: (typeof noteTags.$inferInsert)[];
  readonly noteTasks: (typeof noteTasks.$inferInsert)[];
  readonly taskLinks: (typeof taskLinks.$inferInsert)[];
  readonly taskNotes: (typeof taskNotes.$inferInsert)[];
}

/** Allows a test to override only the fixture collections relevant to its scenario. */
export type ApiFixtureOverrides = Partial<ApiFixture>;

/** Supplies deterministic records that make relationship-focused API scenarios concise. */
export const createApiFixture = (overrides: ApiFixtureOverrides = {}): ApiFixture => {
  // Fixed timestamps keep fixture ordering and JSON assertions deterministic.
  const createdAt = new Date('2026-01-02T03:04:05.000Z');
  const updatedAt = new Date('2026-01-03T04:05:06.000Z');

  return {
    // These identifiers are intentionally stable so test requests can refer to seeded records directly.
    tags: [{ id: 'tag-work', userId: 'e2e-test-user', label: 'work', createdAt }],
    notes: [
      { id: 'note-plan', userId: 'e2e-test-user', title: 'Project plan', body: 'Prepare milestones.', createdAt, updatedAt },
    ],
    tasks: [
      {
        id: 'task-ship',
        userId: 'e2e-test-user',
        title: 'Ship API',
        description: 'Release the integration tests.',
        tagId: 'tag-work',
        dueTo: '2026-02-01',
        status: 'inProgress',
        createdAt,
        updatedAt,
      },
    ],
    expenses: [
      {
        id: 'expense-hosting',
        userId: 'e2e-test-user',
        amount: -2500,
        tagId: 'tag-work',
        description: 'Hosting subscription',
        createdAt,
        updatedAt,
      },
    ],
    views: [],
    viewTags: [],
    noteTags: [{ noteId: 'note-plan', tagId: 'tag-work' }],
    noteTasks: [{ noteId: 'note-plan', taskId: 'task-ship' }],
    taskLinks: [],
    taskNotes: [{ taskId: 'task-ship', noteId: 'note-plan' }],
    ...overrides,
  };
};

/** Inserts a fixture in foreign-key-safe order so tests can declare state rather than SQL. */
export const seedApiFixture = async (params: {
  readonly database: Database;
  readonly fixture: ApiFixture;
}): Promise<void> => {
  const { database, fixture } = params;

  // Insert independent records first; notes, tasks, and expenses can reference tags.
  await Promise.all([
    fixture.tags.length === 0 ? Promise.resolve() : database.insert(tags).values(fixture.tags.map((tag) => ({ ...tag, userId: tag.userId ?? defaultOwnerId }))),
    fixture.notes.length === 0 ? Promise.resolve() : database.insert(notes).values(fixture.notes.map((note) => ({ ...note, userId: note.userId ?? defaultOwnerId }))),
  ]);
  await Promise.all([
    fixture.tasks.length === 0 ? Promise.resolve() : database.insert(tasks).values(fixture.tasks.map((task) => ({ ...task, userId: task.userId ?? defaultOwnerId }))),
    fixture.expenses.length === 0
      ? Promise.resolve()
      : database.insert(expenses).values(fixture.expenses.map((expense) => ({ ...expense, userId: expense.userId ?? defaultOwnerId }))),
    fixture.views.length === 0 ? Promise.resolve() : database.insert(views).values(fixture.views.map((view) => ({ ...view, userId: view.userId ?? defaultOwnerId }))),
  ]);
  // Insert relationship rows only after every referenced record exists.
  await Promise.all([
    fixture.noteTags.length === 0
      ? Promise.resolve()
      : database.insert(noteTags).values(fixture.noteTags),
    fixture.noteTasks.length === 0
      ? Promise.resolve()
      : database.insert(noteTasks).values(fixture.noteTasks),
    fixture.taskLinks.length === 0
      ? Promise.resolve()
      : database.insert(taskLinks).values(fixture.taskLinks),
    fixture.taskNotes.length === 0
      ? Promise.resolve()
      : database.insert(taskNotes).values(fixture.taskNotes),
    fixture.viewTags.length === 0
      ? Promise.resolve()
      : database.insert(viewTags).values(fixture.viewTags),
  ]);
};
