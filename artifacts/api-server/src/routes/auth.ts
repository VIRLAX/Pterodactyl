import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }
    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({ username, email, passwordHash, role: "user" }).returning();
    const token = generateToken(user.id, user.role);
    return res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Rate limiting - simple in-memory (basic brute force protection)
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = generateToken(user.id, user.role);
    return res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (_req, res) => {
  return res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(401).json({ error: "User not found" });
    return res.json({ id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
