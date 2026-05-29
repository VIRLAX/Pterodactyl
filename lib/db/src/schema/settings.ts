import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").notNull().default("PteroStore"),
  siteDescription: text("site_description").notNull().default("Marketplace Panel Pterodactyl Terpercaya"),
  whatsappNumber: text("whatsapp_number").notNull().default("628123456789"),
  danaNumber: text("dana_number").notNull().default("08123456789"),
  danaName: text("dana_name").notNull().default("Admin PteroStore"),
  qrisImageUrl: text("qris_image_url"),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: text("maintenance_message"),
  bannerEnabled: boolean("banner_enabled").notNull().default(false),
  bannerText: text("banner_text"),
  bannerColor: text("banner_color").default("#7c3aed"),
  inviteDiscountPercent: integer("invite_discount_percent").notNull().default(10),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const faqsTable = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({ id: true, updatedAt: true });
export const insertFaqSchema = createInsertSchema(faqsTable).omit({ id: true, createdAt: true });
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
export type Faq = typeof faqsTable.$inferSelect;
