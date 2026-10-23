CREATE TABLE `views` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`period` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `views_type_title_unique` ON `views` (`type`,`title`);--> statement-breakpoint
CREATE TABLE `view_tags` (
	`view_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`view_id`, `tag_id`),
	FOREIGN KEY (`view_id`) REFERENCES `views`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
