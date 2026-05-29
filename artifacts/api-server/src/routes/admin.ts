import { Router } from "express";
import { db, usersTable, ordersTable, productsTable, reviewsTable, inviteRequestsTable, bugReportsTable } from "@workspace/db";
import { eq, gte, and, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

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

export default router;
