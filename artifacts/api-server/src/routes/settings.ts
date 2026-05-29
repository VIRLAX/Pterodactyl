import { Router } from "express";
import { db, siteSettingsTable, faqsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

async function getOrCreateSettings() {
  const settings = await db.select().from(siteSettingsTable).limit(1);
  if (settings.length > 0) return settings[0];
  const [created] = await db.insert(siteSettingsTable).values({}).returning();
  return created;
}

router.get("/settings", async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json(settings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const [updated] = await db.update(siteSettingsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(siteSettingsTable.id, settings.id)).returning();
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/settings/faqs", async (_req, res) => {
  try {
    const faqs = await db.select().from(faqsTable).orderBy(faqsTable.sortOrder);
    return res.json(faqs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/settings/faqs", requireAdmin, async (req, res) => {
  try {
    const { question, answer, sortOrder } = req.body;
    const [faq] = await db.insert(faqsTable).values({ question, answer, sortOrder: sortOrder || 0 }).returning();
    return res.status(201).json(faq);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings/faqs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [faq] = await db.update(faqsTable).set(req.body).where(eq(faqsTable.id, id)).returning();
    if (!faq) return res.status(404).json({ error: "FAQ not found" });
    return res.json(faq);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/settings/faqs/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(faqsTable).where(eq(faqsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
