CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`room` text NOT NULL,
	`date` text NOT NULL,
	`start_hour` integer NOT NULL,
	`end_hour` integer NOT NULL
);
