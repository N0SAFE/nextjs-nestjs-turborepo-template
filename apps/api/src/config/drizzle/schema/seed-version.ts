import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const seedVersion = pgTable("seed_version", {
  version: text("version").primaryKey(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});
