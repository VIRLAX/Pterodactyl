import { Router } from "express";
import { db, usersTable, productsTable, ordersTable, reviewsTable, bugReportsTable, inviteRequestsTable, discountsTable, deviceSessionsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.resolve(__dirname, "../../data/backups");
const MAX_BACKUPS = 4;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

async function createBackup(): Promise<string> {
  ensureBackupDir();

  const [users, products, orders, reviews, bugs, invites, discounts, sessions] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(productsTable),
    db.select().from(ordersTable),
    db.select().from(reviewsTable),
    db.select().from(bugReportsTable),
    db.select().from(inviteRequestsTable),
    db.select().from(discountsTable),
    db.select().from(deviceSessionsTable),
  ]);

  // Strip sensitive fields from users
  const safeUsers = users.map(({ passwordHash: _, ...u }) => u);

  const backupData = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    tables: {
      users: safeUsers,
      products,
      orders,
      reviews,
      bugReports: bugs,
      inviteRequests: invites,
      discounts,
      deviceSessions: sessions,
    },
    summary: {
      users: users.length,
      products: products.length,
      orders: orders.length,
    },
  };

  const dateStr = new Date().toISOString().split("T")[0];
  const timeStr = new Date().toISOString().split("T")[1]?.slice(0, 8).replace(/:/g, "-");
  const filename = `backup-${dateStr}-${timeStr}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), "utf8");

  // Remove oldest if over limit
  const allBackups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith("backup-") && f.endsWith(".json"))
    .sort();

  while (allBackups.length > MAX_BACKUPS) {
    const oldest = allBackups.shift()!;
    fs.unlinkSync(path.join(BACKUP_DIR, oldest));
    logger.info({ file: oldest }, "Old backup removed");
  }

  logger.info({ filename, orders: orders.length, users: users.length }, "Backup created");
  return filename;
}

const router = Router();

router.post("/admin/backup", requireAdmin, async (_req, res) => {
  try {
    const filename = await createBackup();
    return res.json({ success: true, filename, message: "Backup berhasil dibuat" });
  } catch (err) {
    logger.error(err, "Backup failed");
    return res.status(500).json({ error: "Gagal membuat backup" });
  }
});

router.get("/admin/backups", requireAdmin, (_req, res) => {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith("backup-") && f.endsWith(".json"))
      .sort()
      .reverse()
      .map(filename => {
        const filepath = path.join(BACKUP_DIR, filename);
        const stat = fs.statSync(filepath);
        return {
          filename,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      });
    return res.json(files);
  } catch (err) {
    logger.error(err, "Failed to list backups");
    return res.status(500).json({ error: "Gagal mengambil daftar backup" });
  }
});

router.get("/admin/backups/:filename", requireAdmin, (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename || !/^backup-[\w-]+\.json$/.test(filename)) {
      return res.status(400).json({ error: "Nama file tidak valid" });
    }
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "File backup tidak ditemukan" });
    }
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    return res.sendFile(filepath);
  } catch (err) {
    logger.error(err, "Failed to download backup");
    return res.status(500).json({ error: "Gagal mengunduh backup" });
  }
});

// SSE real-time events for admin
import { verifyToken } from "../lib/auth.js";
import { addSSEClient, broadcast } from "../lib/sse.js";

router.get("/admin/events", (req, res) => {
  const token = (req.query.token as string) || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const remove = addSSEClient(res, payload.userId);

  // Initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "ok", ts: Date.now() })}\n\n`);

  // Keepalive every 25 seconds
  const keepalive = setInterval(() => {
    try { res.write(": keepalive\n\n"); } catch { clearInterval(keepalive); }
  }, 25000);

  req.on("close", () => {
    clearInterval(keepalive);
    remove();
  });
});

export { createBackup, broadcast, router };
export default router;
