import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

router.get("/products", async (req, res) => {
  try {
    const { search, category, available } = req.query;
    let query = db.select().from(productsTable);
    const conditions = [];
    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
    if (category) conditions.push(eq(productsTable.category, category as string));
    if (available === "true") conditions.push(eq(productsTable.isActive, true));
    const products = await (conditions.length > 0
      ? db.select().from(productsTable).where(and(...conditions))
      : db.select().from(productsTable));
    const sorted = products.sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json(sorted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const [product] = await db.insert(productsTable).values({
      ...body,
      slug,
      status: body.status || "ready",
      isActive: body.isActive !== undefined ? body.isActive : true,
      sortOrder: body.sortOrder || 0,
      eligibleForInviteDiscount: body.eligibleForInviteDiscount || false,
    }).returning();
    return res.status(201).json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [product] = await db.update(productsTable).set(req.body).where(eq(productsTable.id, id)).returning();
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    console.error(err);
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
