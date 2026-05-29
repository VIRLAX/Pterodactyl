import { Router } from "express";
import { db, discountsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { generateCode } from "../lib/auth.js";

const router = Router();

router.get("/discounts", requireAdmin, async (_req, res) => {
  try {
    const discounts = await db.select().from(discountsTable).orderBy(discountsTable.createdAt);
    return res.json(discounts.reverse());
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/discounts", requireAdmin, async (req, res) => {
  try {
    const { percentOff, type, expiresAt } = req.body;
    const code = req.body.code || generateCode(type === "invite" ? "INV" : "DISC");
    const [discount] = await db.insert(discountsTable).values({
      code,
      type: type || "owner",
      percentOff,
      isUsed: false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning();
    return res.status(201).json(discount);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/discounts/validate", requireAuth, async (req, res) => {
  try {
    const { code, productId } = req.body;
    const [discount] = await db.select().from(discountsTable).where(eq(discountsTable.code, code)).limit(1);
    if (!discount) {
      return res.status(400).json({ valid: false, percentOff: 0, discountAmount: 0, finalPrice: 0, message: "Token tidak valid" });
    }
    if (discount.isUsed) {
      return res.status(400).json({ valid: false, percentOff: 0, discountAmount: 0, finalPrice: 0, message: "Token sudah digunakan" });
    }
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return res.status(400).json({ valid: false, percentOff: 0, discountAmount: 0, finalPrice: 0, message: "Token sudah kadaluarsa" });
    }

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) {
      return res.status(400).json({ valid: false, percentOff: 0, discountAmount: 0, finalPrice: 0, message: "Produk tidak ditemukan" });
    }

    if (discount.type === "invite" && !product.eligibleForInviteDiscount) {
      return res.status(400).json({ valid: false, percentOff: 0, discountAmount: 0, finalPrice: 0, message: "Token invite tidak berlaku untuk produk ini" });
    }

    const discountAmount = product.price * (discount.percentOff / 100);
    const finalPrice = product.price - discountAmount;
    return res.json({ valid: true, percentOff: discount.percentOff, discountAmount, finalPrice, message: `Diskon ${discount.percentOff}% berhasil diterapkan!` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/discounts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(discountsTable).where(eq(discountsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
