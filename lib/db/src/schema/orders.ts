import { pgTable, serial, text, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  originalPrice: real("original_price").notNull(),
  discountAmount: real("discount_amount").notNull().default(0),
  finalPrice: real("final_price").notNull(),
  discountCode: text("discount_code"),
  paymentMethod: text("payment_method").notNull(),
  paymentProofUrl: text("payment_proof_url"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  deliveryDomain: text("delivery_domain"),
  deliveryUsername: text("delivery_username"),
  deliveryPassword: text("delivery_password"),
  deliveryTos: text("delivery_tos"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
