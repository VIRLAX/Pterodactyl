import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bugReportsTable = pgTable("bug_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  screenshotUrl: text("screenshot_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBugReportSchema = createInsertSchema(bugReportsTable).omit({ id: true, createdAt: true });
export type InsertBugReport = z.infer<typeof insertBugReportSchema>;
export type BugReport = typeof bugReportsTable.$inferSelect;
