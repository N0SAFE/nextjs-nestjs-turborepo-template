CREATE TABLE "seed_version" (
	"version" text PRIMARY KEY NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL
);
