import app from "./app";
import { logger } from "./lib/logger";
import { seedAdmin } from "./lib/seed.js";
import { createBackup } from "./routes/backup.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function startAutoBackup() {
  // Check if a backup is due
  const backupDir = path.resolve(__dirname, "../data/backups");
  let lastBackupTime = 0;

  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith("backup-") && f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length > 0) {
      const latestFile = files[0]!;
      const stat = fs.statSync(path.join(backupDir, latestFile));
      lastBackupTime = stat.mtime.getTime();
    }
  }

  const now = Date.now();
  const timeSinceLast = now - lastBackupTime;
  const nextBackupIn = Math.max(0, BACKUP_INTERVAL_MS - timeSinceLast);

  logger.info({ nextBackupIn: Math.round(nextBackupIn / 1000 / 60) }, "Auto-backup scheduled (minutes)");

  setTimeout(() => {
    createBackup().then(() => logger.info("Auto-backup created")).catch((err) => logger.error(err, "Auto-backup failed"));
    // Then repeat every 7 days
    setInterval(() => {
      createBackup().then(() => logger.info("Auto-backup created")).catch((err) => logger.error(err, "Auto-backup failed"));
    }, BACKUP_INTERVAL_MS);
  }, nextBackupIn);
}

seedAdmin().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
    startAutoBackup();
  });
});
