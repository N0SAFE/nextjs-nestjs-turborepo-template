ALTER TABLE "invite" DROP CONSTRAINT "invite_created_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "invite" ADD COLUMN "invited_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_invited_user_id_user_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" DROP COLUMN "created_by_user_id";