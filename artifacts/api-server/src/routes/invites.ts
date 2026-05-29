import { Router } from "express";
import { db, inviteRequestsTable, usersTable, discountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { generateCode } from "../lib/auth.js";

const router = Router();

async function enrichInvite(invite: any) {
  const [user] = await db.select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, invite.userId)).limit(1);
  return { ...invite, user };
}

router.get("/invites", requireAdmin, async (_req, res) => {
  try {
    const invites = await db.select().from(inviteRequestsTable).orderBy(inviteRequestsTable.createdAt);
    const enriched = await Promise.all(invites.reverse().map(enrichInvite));
    return res.json(enriched);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/invites", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { screenshotBase64 } = req.body;
    if (!screenshotBase64) return res.status(400).json({ error: "Missing screenshot" });

    const screenshotUrl = screenshotBase64.startsWith("data:") ? screenshotBase64 : `data:image/jpeg;base64,${screenshotBase64}`;
    const [invite] = await db.insert(inviteRequestsTable).values({
      userId,
      screenshotUrl,
      status: "pending",
      whatsappNotified: false,
    }).returning();
    return res.status(201).json(await enrichInvite(invite));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/invites/:id/validate", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [invite] = await db.select().from(inviteRequestsTable).where(eq(inviteRequestsTable.id, id)).limit(1);
    if (!invite) return res.status(404).json({ error: "Invite not found" });

    const token = generateCode("INV");
    // Create the discount token
    await db.insert(discountsTable).values({
      code: token,
      type: "invite",
      percentOff: 10,
      isUsed: false,
    });

    const [updated] = await db.update(inviteRequestsTable).set({ status: "approved", generatedToken: token }).where(eq(inviteRequestsTable.id, id)).returning();
    return res.json(await enrichInvite(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
