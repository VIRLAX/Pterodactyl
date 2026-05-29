import { Router } from "express";
import { db, ordersTable, productsTable, usersTable, discountsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import crypto from "crypto";

const router = Router();

function generateInvoice(): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `INV-${dateStr}-${rand}`;
}

async function enrichOrder(order: any) {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, order.productId)).limit(1);
  const [user] = await db.select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);
  return { ...order, product, user };
}

router.get("/orders", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    let orders;
    if (user.role === "admin") {
      orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
    } else {
      orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.userId)).orderBy(ordersTable.createdAt);
    }
    const enriched = await Promise.all(orders.map(enrichOrder));
    return res.json(enriched.reverse());
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { productId, paymentMethod, discountCode, notes } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) return res.status(400).json({ error: "Product not found" });
    if (product.status === "sold_out") return res.status(400).json({ error: "Product is sold out" });

    let discountAmount = 0;
    let finalPrice = product.price;

    if (discountCode) {
      const [discount] = await db.select().from(discountsTable).where(eq(discountsTable.code, discountCode)).limit(1);
      if (discount && !discount.isUsed) {
        if (!discount.expiresAt || new Date(discount.expiresAt) > new Date()) {
          // For invite discounts, check product eligibility
          if (discount.type === "invite" && !product.eligibleForInviteDiscount) {
            return res.status(400).json({ error: "Invite discount not valid for this product" });
          }
          discountAmount = product.price * (discount.percentOff / 100);
          finalPrice = product.price - discountAmount;
          // Mark discount as used
          await db.update(discountsTable).set({ isUsed: true, usedAt: new Date(), usedByUserId: userId }).where(eq(discountsTable.id, discount.id));
        }
      }
    }

    const [order] = await db.insert(ordersTable).values({
      invoiceNumber: generateInvoice(),
      userId,
      productId,
      originalPrice: product.price,
      discountAmount,
      finalPrice,
      discountCode: discountCode || null,
      paymentMethod,
      status: "pending",
      notes: notes || null,
      updatedAt: new Date(),
    }).returning();

    const enriched = await enrichOrder(order);
    return res.status(201).json(enriched);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const id = Number(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (user.role !== "admin" && order.userId !== user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json(await enrichOrder(order));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, notes } = req.body;
    const [order] = await db.update(ordersTable).set({ status, notes: notes || undefined, updatedAt: new Date() }).where(eq(ordersTable.id, id)).returning();
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(await enrichOrder(order));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders/:id/payment-proof", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const id = Number(req.params.id);
    const { proofBase64 } = req.body;
    if (!proofBase64) return res.status(400).json({ error: "Missing proof" });

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== userId && (req as any).user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Store base64 as data URL (in production use object storage)
    const proofUrl = proofBase64.startsWith("data:") ? proofBase64 : `data:image/jpeg;base64,${proofBase64}`;
    const [updated] = await db.update(ordersTable).set({ paymentProofUrl: proofUrl, status: "paid", updatedAt: new Date() }).where(eq(ordersTable.id, id)).returning();
    return res.json(await enrichOrder(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
