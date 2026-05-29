import { pgTable, serial, text, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const discountsTable = pgTable("discounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("owner"),
  percentOff: real("percent_off").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  usedAt: timestamp("used_at"),
  usedByUserId: integer("used_by_user_id"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDiscountSchema = createInsertSchema(discountsTable).omit({ id: true, createdAt: true });
export type InsertDiscount = z.infer<typeof insertDiscountSchema>;
export type Discount = typeof discountsTable.$inferSelect;
