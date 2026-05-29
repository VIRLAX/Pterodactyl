import { Router } from "express";
import { db, bugReportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, optionalAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/bugs", requireAdmin, async (_req, res) => {
  try {
    const bugs = await db.select().from(bugReportsTable).orderBy(bugReportsTable.createdAt);
    return res.json(bugs.reverse());
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bugs", optionalAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.userId || null;
    const { title, description, screenshotBase64 } = req.body;
    if (!title || !description) return res.status(400).json({ error: "Missing fields" });
    const screenshotUrl = screenshotBase64
      ? (screenshotBase64.startsWith("data:") ? screenshotBase64 : `data:image/jpeg;base64,${screenshotBase64}`)
      : null;
    const [bug] = await db.insert(bugReportsTable).values({
      userId,
      title,
      description,
      screenshotUrl,
      status: "pending",
    }).returning();
    return res.status(201).json(bug);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/bugs/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const [bug] = await db.update(bugReportsTable).set({ status }).where(eq(bugReportsTable.id, id)).returning();
    if (!bug) return res.status(404).json({ error: "Bug report not found" });
    return res.json(bug);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
