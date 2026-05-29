import { Router } from "express";
import { db, reviewsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin, requireAuth, optionalAuth } from "../middlewares/auth.js";

const router = Router();

async function enrichReview(review: any) {
  const [user] = await db.select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt }).from(usersTable).where(eq(usersTable.id, review.userId)).limit(1);
  return { ...review, user };
}

router.get("/reviews", optionalAuth, async (req, res) => {
  try {
    const { productId } = req.query;
    let reviews;
    if (productId) {
      reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, Number(productId)));
    } else {
      reviews = await db.select().from(reviewsTable);
    }
    const enriched = await Promise.all(reviews.reverse().map(enrichReview));
    return res.json(enriched);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reviews", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { rating, comment, productId } = req.body;
    const [review] = await db.insert(reviewsTable).values({
      userId,
      productId: productId || null,
      rating,
      comment,
    }).returning();
    return res.status(201).json(await enrichReview(review));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reviews/:id/reply", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reply } = req.body;
    const [review] = await db.update(reviewsTable).set({ adminReply: reply }).where(eq(reviewsTable.id, id)).returning();
    if (!review) return res.status(404).json({ error: "Review not found" });
    return res.json(await enrichReview(review));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
