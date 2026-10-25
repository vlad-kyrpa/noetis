import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/** Stores account credentials separately from the public user representation. */
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    passwordSalt: text('password_salt').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    uniqueIndex('users_username_unique').on(table.username),
    uniqueIndex('users_email_unique').on(table.email),
  ],
);

/** Stores revocable sessions without exposing refresh tokens through user records. */
export const userRefreshTokens = sqliteTable(
  'user_refresh_tokens',
  {
    sessionId: text('session_id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshToken: text('refresh_token').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('user_refresh_tokens_user_id_index').on(table.userId)],
);

/** Stores user-created labels shared by every feature. */
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  label: text('label').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
/** Stores saved views over one supported record type. */
export const views = sqliteTable(
  'views',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: ['note', 'expense', 'task'] }).notNull(),
    period: text('period', { enum: ['day', 'week', 'month', 'year'] }).notNull(),
    title: text('title').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('views_type_title_unique').on(table.type, table.title)],
);
/** Associates saved views with their public tag labels through durable tag records. */
export const viewTags = sqliteTable(
  'view_tags',
  {
    viewId: text('view_id')
      .notNull()
      .references(() => views.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.viewId, table.tagId] })],
);
/** Stores durable note content. */
export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('notes_title_index').on(table.title)],
);
/** Stores task content and its lifecycle state. */
export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    tagId: text('tag_id').references(() => tags.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    dueTo: text('due_to'),
    status: text('status', { enum: ['undone', 'inProgress', 'done'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('tasks_title_index').on(table.title),
    index('tasks_status_index').on(table.status),
  ],
);
/** Associates notes with labels without duplicating label text. */
export const noteTags = sqliteTable(
  'note_tags',
  {
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.noteId, table.tagId] })],
);
/** Associates notes with tasks. */
export const noteTasks = sqliteTable(
  'note_tasks',
  {
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.noteId, table.taskId] })],
);
/** Captures directed note-to-note context links. */
export const noteLinks = sqliteTable(
  'note_links',
  {
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    linkedNoteId: text('linked_note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.noteId, table.linkedNoteId] })],
);
/** Captures directed task dependencies and related work. */
export const taskLinks = sqliteTable(
  'task_links',
  {
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    linkedTaskId: text('linked_task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.linkedTaskId] })],
);
/** Associates tasks with supporting notes. */
export const taskNotes = sqliteTable(
  'task_notes',
  {
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    noteId: text('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.noteId] })],
);
/** Stores signed cash-flow records. */
export const expenses = sqliteTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    amount: integer('amount').notNull(),
    tagId: text('tag_id').references(() => tags.id, { onDelete: 'set null' }),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('expenses_created_at_index').on(table.createdAt)],
);
/** Exposes the complete Drizzle schema to the D1 adapter. */
export const schema = {
  users,
  userRefreshTokens,
  tags,
  views,
  viewTags,
  notes,
  tasks,
  noteTags,
  noteTasks,
  noteLinks,
  taskLinks,
  taskNotes,
  expenses,
};
