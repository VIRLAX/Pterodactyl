import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";
import { broadcast } from "../lib/sse.js";

const router = Router();

router.get("/products", async (req, res) => {
  try {
    const { search, category, available } = req.query;
    const conditions = [];
    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
    if (category) conditions.push(eq(productsTable.category, category as string));
    if (available === "true") conditions.push(eq(productsTable.isActive, true));
    const products = await (conditions.length > 0
      ? db.select().from(productsTable).where(and(...conditions))
      : db.select().from(productsTable));
    return res.json(products.sort((a, b) => a.sortOrder - b.sortOrder));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!body.name || body.price === undefined || body.price === null) {
      return res.status(400).json({ error: "Nama dan harga produk wajib diisi" });
    }
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const [product] = await db.insert(productsTable).values({
      name: body.name,
      slug,
      category: body.category || "panel",
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
      description: body.description || "",
      detail: body.detail || "",
      usageInfo: body.usageInfo || "",
      suitableFor: body.suitableFor || "",
      benefits: body.benefits || "",
      badge: body.badge || null,
      status: body.status || "ready",
      stock: body.stock ? Number(body.stock) : null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      sortOrder: Number(body.sortOrder) || 0,
      eligibleForInviteDiscount: body.eligibleForInviteDiscount || false,
    }).returning();
    broadcast("new_product", { id: product.id, name: product.name, price: product.price });
    return res.status(201).json(product);
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Slug produk sudah dipakai, ganti nama produk." });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) return res.status(404).json({ error: "Produk tidak ditemukan" });
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const updateData: any = { ...body };
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice ? Number(body.originalPrice) : null;
    if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);
    const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, id)).returning();
    if (!product) return res.status(404).json({ error: "Produk tidak ditemukan" });
    return res.json(product);
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Slug produk sudah dipakai." });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
