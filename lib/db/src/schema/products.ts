import { pgTable, serial, text, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull().default("panel"),
  price: real("price").notNull(),
  originalPrice: real("original_price"),
  description: text("description").notNull(),
  detail: text("detail").notNull(),
  usageInfo: text("usage_info").notNull().default(""),
  suitableFor: text("suitable_for").notNull().default(""),
  benefits: text("benefits").notNull().default(""),
  badge: text("badge"),
  status: text("status").notNull().default("ready"),
  stock: integer("stock"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  eligibleForInviteDiscount: boolean("eligible_for_invite_discount").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
