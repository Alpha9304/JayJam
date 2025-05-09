CREATE TABLE `bannedUsers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`finalized_event_id` integer,
	`pending_event_id` integer,
	FOREIGN KEY (`finalized_event_id`) REFERENCES `finalized_events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pending_event_id`) REFERENCES `pending_events`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "fk_check" CHECK("channels"."finalized_event_id" IS NOT NULL OR "channels"."pending_event_id" IS NOT NULL )
);
--> statement-breakpoint
CREATE TABLE `class_participants` (
	`user_id` integer NOT NULL,
	`class_id` integer NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`user_id`, `class_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`section_id` text NOT NULL,
	`group_id` integer,
	`num_students` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finalized_event_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `finalized_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `finalized_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_creator_id` integer NOT NULL,
	`location` text,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`type` text DEFAULT 'custom' NOT NULL,
	`externalId` text,
	FOREIGN KEY (`event_creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `googleTokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`refresh_token` text,
	`scope` text NOT NULL,
	`expiry_date` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`num_students` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `location_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`option_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_id`) REFERENCES `event_location_options`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`modified_at` integer NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pending_event_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer,
	`user_id` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `pending_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pending_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_creator_id` integer,
	`participant_limit` integer,
	`possible_start_time` integer NOT NULL,
	`possible_end_time` integer NOT NULL,
	`registration_deadline` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `event_location_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`location` text NOT NULL,
	`location_vote_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `pending_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `time_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`time_vote_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `pending_events`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `randomInts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`randInt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`user_email` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`theme` text DEFAULT 'light' NOT NULL,
	`updatedAt` integer NOT NULL,
	`user_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `time_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`option_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_id`) REFERENCES `time_options`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`hashId` text,
	`sis_link` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`verified` integer NOT NULL,
	`profilePic` blob,
	`pronouns` text,
	`major` text,
	`settings_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verificationCode` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`userId` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verificationCode_code_unique` ON `verificationCode` (`code`);