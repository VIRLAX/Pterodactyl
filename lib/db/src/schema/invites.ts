import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const inviteRequestsTable = pgTable("invite_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  screenshotUrl: text("screenshot_url").notNull(),
  status: text("status").notNull().default("pending"),
  generatedToken: text("generated_token"),
  whatsappNotified: boolean("whatsapp_notified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInviteRequestSchema = createInsertSchema(inviteRequestsTable).omit({ id: true, createdAt: true });
export type InsertInviteRequest = z.infer<typeof insertInviteRequestSchema>;
export type InviteRequest = typeof inviteRequestsTable.$inferSelect;
