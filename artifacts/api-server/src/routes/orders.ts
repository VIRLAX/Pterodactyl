import { Router } from "express";
import { db, ordersTable, productsTable, usersTable, discountsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import { broadcast } from "../lib/sse.js";
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
  const [user] = await db
    .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.id, order.userId))
    .limit(1);
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
    if (!product) return res.status(400).json({ error: "Produk tidak ditemukan" });
    if (product.status === "sold_out") return res.status(400).json({ error: "Produk sedang habis" });

    let discountAmount = 0;
    let finalPrice = product.price;
    let appliedCode: string | null = null;

    if (discountCode) {
      const [discount] = await db.select().from(discountsTable).where(eq(discountsTable.code, discountCode)).limit(1);
      if (discount && !discount.isUsed) {
        if (!discount.expiresAt || new Date(discount.expiresAt) > new Date()) {
          if (discount.type === "invite" && !product.eligibleForInviteDiscount) {
            return res.status(400).json({ error: "Token invite tidak berlaku untuk produk ini" });
          }
          discountAmount = product.price * (discount.percentOff / 100);
          finalPrice = product.price - discountAmount;
          appliedCode = discountCode;
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
      discountCode: appliedCode,
      paymentMethod,
      status: "pending",
      notes: notes || null,
      updatedAt: new Date(),
    }).returning();

    const enriched = await enrichOrder(order);
    broadcast("new_order", {
      id: order.id,
      invoiceNumber: order.invoiceNumber,
      finalPrice: order.finalPrice,
      productName: (enriched as any).product?.name,
      username: (enriched as any).user?.username,
    });
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
    if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    if (user.role !== "admin" && order.userId !== user.userId) {
      return res.status(403).json({ error: "Akses ditolak" });
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
    const { status, notes, deliveryDomain, deliveryUsername, deliveryPassword, deliveryTos } = req.body;

    const updateData: any = { status, updatedAt: new Date() };
    if (notes !== undefined) updateData.notes = notes;
    if (deliveryDomain !== undefined) updateData.deliveryDomain = deliveryDomain;
    if (deliveryUsername !== undefined) updateData.deliveryUsername = deliveryUsername;
    if (deliveryPassword !== undefined) updateData.deliveryPassword = deliveryPassword;
    if (deliveryTos !== undefined) updateData.deliveryTos = deliveryTos;

    const [order] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id)).returning();
    if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    return res.json(await enrichOrder(order));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/orders/clear-completed", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const completed = ["confirmed", "rejected", "cancelled"];
    const toDelete = await db.select({ id: ordersTable.id }).from(ordersTable)
      .where(and(eq(ordersTable.userId, userId), inArray(ordersTable.status, completed)));
    if (toDelete.length === 0) return res.json({ deleted: 0 });
    const ids = toDelete.map(o => o.id);
    await db.delete(ordersTable).where(inArray(ordersTable.id, ids));
    return res.json({ deleted: ids.length });
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
    if (!proofBase64) return res.status(400).json({ error: "Bukti pembayaran wajib dilampirkan" });

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    if (order.userId !== userId && (req as any).user.role !== "admin") {
      return res.status(403).json({ error: "Akses ditolak" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ error: "Bukti hanya bisa diupload saat status masih pending" });
    }

    const proofUrl = proofBase64.startsWith("data:") ? proofBase64 : `data:image/jpeg;base64,${proofBase64}`;
    const [updated] = await db.update(ordersTable).set({ paymentProofUrl: proofUrl, status: "paid", updatedAt: new Date() }).where(eq(ordersTable.id, id)).returning();
    return res.json(await enrichOrder(updated));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
