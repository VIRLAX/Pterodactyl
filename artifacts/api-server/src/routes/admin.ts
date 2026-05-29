import { Router } from "express";
import { db, usersTable, ordersTable, productsTable, reviewsTable, inviteRequestsTable, bugReportsTable, deviceSessionsTable, deviceLimitsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

const DEFAULT_DEVICE_LIMIT = 3;

router.get("/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable);
    const orders = await db.select().from(ordersTable);
    const products = await db.select().from(productsTable);
    const reviews = await db.select().from(reviewsTable);
    const invites = await db.select().from(inviteRequestsTable).where(eq(inviteRequestsTable.status, "pending"));
    const bugs = await db.select().from(bugReportsTable).where(eq(bugReportsTable.status, "pending"));

    const totalRevenue = orders.filter(o => o.status === "confirmed").reduce((s, o) => s + o.finalPrice, 0);
    const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "paid").length;
    const confirmedOrders = orders.filter(o => o.status === "confirmed").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const week = new Date(today);
    week.setDate(week.getDate() - 7);

    const todayRevenue = orders.filter(o => o.status === "confirmed" && new Date(o.createdAt) >= today).reduce((s, o) => s + o.finalPrice, 0);
    const weekRevenue = orders.filter(o => o.status === "confirmed" && new Date(o.createdAt) >= week).reduce((s, o) => s + o.finalPrice, 0);

    return res.json({
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders,
      confirmedOrders,
      totalProducts: products.length,
      totalReviews: reviews.length,
      pendingInvites: invites.length,
      pendingBugs: bugs.length,
      todayRevenue,
      weekRevenue,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    const orders = await db.select().from(ordersTable);
    const enriched = users.reverse().map(u => {
      const userOrders = orders.filter(o => o.userId === u.id);
      const totalSpent = userOrders.filter(o => o.status === "confirmed").reduce((s, o) => s + o.finalPrice, 0);
      return { id: u.id, username: u.username, email: u.email, role: u.role, createdAt: u.createdAt, totalOrders: userOrders.length, totalSpent };
    });
    return res.json(enriched);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/transactions-chart", requireAdmin, async (_req, res) => {
  try {
    const orders = await db.select().from(ordersTable);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter(o => {
        const oDate = new Date(o.createdAt);
        return oDate >= d && oDate < next;
      });
      const revenue = dayOrders.filter(o => o.status === "confirmed").reduce((s, o) => s + o.finalPrice, 0);
      days.push({
        date: d.toISOString().split("T")[0],
        orders: dayOrders.length,
        revenue,
      });
    }
    return res.json(days);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/sessions", requireAdmin, async (_req, res) => {
  try {
    const sessions = await db.select().from(deviceSessionsTable);
    const limits = await db.select().from(deviceLimitsTable);

    const deviceMap = new Map<string, { deviceId: string; users: any[]; limit: number; extraSlots: number; lastSeen: Date }>();

    for (const s of sessions) {
      const [user] = await db
        .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, s.userId))
        .limit(1);

      if (!user) continue;

      if (!deviceMap.has(s.deviceId)) {
        const limitRow = limits.find(l => l.deviceId === s.deviceId);
        deviceMap.set(s.deviceId, {
          deviceId: s.deviceId,
          users: [],
          limit: DEFAULT_DEVICE_LIMIT + (limitRow?.extraSlots ?? 0),
          extraSlots: limitRow?.extraSlots ?? 0,
          lastSeen: s.lastSeen,
        });
      }

      const entry = deviceMap.get(s.deviceId)!;
      entry.users.push({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstSeen: s.firstSeen,
        lastSeen: s.lastSeen,
        userAgent: s.userAgent,
      });

      if (s.lastSeen > entry.lastSeen) {
        entry.lastSeen = s.lastSeen;
      }
    }

    const result = Array.from(deviceMap.values()).sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/sessions/extend-limit", requireAdmin, async (req, res) => {
  try {
    const { deviceId, extraSlots, note } = req.body;
    if (!deviceId || typeof extraSlots !== "number" || extraSlots < 0) {
      return res.status(400).json({ error: "deviceId dan extraSlots wajib diisi" });
    }

    const existing = await db.select().from(deviceLimitsTable).where(eq(deviceLimitsTable.deviceId, deviceId)).limit(1);

    if (existing.length > 0) {
      await db
        .update(deviceLimitsTable)
        .set({ extraSlots, note: note ?? null, updatedAt: new Date() })
        .where(eq(deviceLimitsTable.deviceId, deviceId));
    } else {
      await db.insert(deviceLimitsTable).values({
        deviceId,
        extraSlots,
        note: note ?? null,
      });
    }

    return res.json({ success: true, deviceId, limit: DEFAULT_DEVICE_LIMIT + extraSlots });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/sessions/:deviceId/user/:userId", requireAdmin, async (req, res) => {
  try {
    const { deviceId, userId } = req.params;
    await db
      .delete(deviceSessionsTable)
      .where(and(
        eq(deviceSessionsTable.deviceId, deviceId),
        eq(deviceSessionsTable.userId, Number(userId))
      ));
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/sessions/:deviceId", requireAdmin, async (req, res) => {
  try {
    const { deviceId } = req.params;
    await db.delete(deviceSessionsTable).where(eq(deviceSessionsTable.deviceId, deviceId));
    await db.delete(deviceLimitsTable).where(eq(deviceLimitsTable.deviceId, deviceId));
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: "ID tidak valid" });
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
