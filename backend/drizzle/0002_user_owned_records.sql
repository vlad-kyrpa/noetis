DROP TABLE `view_tags`;
--> statement-breakpoint
DROP TABLE `task_notes`;
--> statement-breakpoint
DROP TABLE `task_links`;
--> statement-breakpoint
DROP TABLE `note_links`;
--> statement-breakpoint
DROP TABLE `note_tasks`;
--> statement-breakpoint
DROP TABLE `note_tags`;
--> statement-breakpoint
DROP TABLE `expenses`;
--> statement-breakpoint
DROP TABLE `views`;
--> statement-breakpoint
DROP TABLE `tasks`;
--> statement-breakpoint
DROP TABLE `notes`;
--> statement-breakpoint
DROP TABLE `tags`;
--> statement-breakpoint
CREATE TABLE `tags` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade, `label` text NOT NULL, `created_at` integer NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_user_label_unique` ON `tags` (`user_id`,`label`);
--> statement-breakpoint
CREATE TABLE `notes` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade, `title` text NOT NULL, `body` text NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE INDEX `notes_title_index` ON `notes` (`title`);
--> statement-breakpoint
CREATE TABLE `tasks` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade, `tag_id` text REFERENCES `tags`(`id`) ON DELETE set null, `title` text NOT NULL, `description` text, `due_to` text, `status` text NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE INDEX `tasks_title_index` ON `tasks` (`title`);
--> statement-breakpoint
CREATE INDEX `tasks_status_index` ON `tasks` (`status`);
--> statement-breakpoint
CREATE TABLE `expenses` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade, `amount` integer NOT NULL, `tag_id` text REFERENCES `tags`(`id`) ON DELETE set null, `description` text, `created_at` integer NOT NULL, `updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE INDEX `expenses_created_at_index` ON `expenses` (`created_at`);
--> statement-breakpoint
CREATE TABLE `views` (`id` text PRIMARY KEY NOT NULL, `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade, `type` text NOT NULL, `period` text NOT NULL, `title` text NOT NULL, `created_at` integer NOT NULL, `updated_at` integer NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `views_user_type_title_unique` ON `views` (`user_id`,`type`,`title`);
--> statement-breakpoint
CREATE TABLE `note_tags` (`note_id` text NOT NULL REFERENCES `notes`(`id`) ON DELETE cascade, `tag_id` text NOT NULL REFERENCES `tags`(`id`) ON DELETE cascade, PRIMARY KEY(`note_id`,`tag_id`));
--> statement-breakpoint
CREATE TABLE `note_tasks` (`note_id` text NOT NULL REFERENCES `notes`(`id`) ON DELETE cascade, `task_id` text NOT NULL REFERENCES `tasks`(`id`) ON DELETE cascade, PRIMARY KEY(`note_id`,`task_id`));
--> statement-breakpoint
CREATE TABLE `note_links` (`note_id` text NOT NULL REFERENCES `notes`(`id`) ON DELETE cascade, `linked_note_id` text NOT NULL REFERENCES `notes`(`id`) ON DELETE cascade, PRIMARY KEY(`note_id`,`linked_note_id`));
--> statement-breakpoint
CREATE TABLE `task_links` (`task_id` text NOT NULL REFERENCES `tasks`(`id`) ON DELETE cascade, `linked_task_id` text NOT NULL REFERENCES `tasks`(`id`) ON DELETE cascade, PRIMARY KEY(`task_id`,`linked_task_id`));
--> statement-breakpoint
CREATE TABLE `task_notes` (`task_id` text NOT NULL REFERENCES `tasks`(`id`) ON DELETE cascade, `note_id` text NOT NULL REFERENCES `notes`(`id`) ON DELETE cascade, PRIMARY KEY(`task_id`,`note_id`));
--> statement-breakpoint
CREATE TABLE `view_tags` (`view_id` text NOT NULL REFERENCES `views`(`id`) ON DELETE cascade, `tag_id` text NOT NULL REFERENCES `tags`(`id`) ON DELETE cascade, PRIMARY KEY(`view_id`,`tag_id`));
