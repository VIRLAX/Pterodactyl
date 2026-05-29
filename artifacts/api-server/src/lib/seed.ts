import { db, usersTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { hashPassword } from "./auth.js";
import { logger } from "./logger.js";

const ADMIN_EMAIL = "admin@pterostore.com";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "aldev123";

export async function seedAdmin() {
  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL))
      .limit(1);

    if (existing.length > 0) {
      const admin = existing[0];
      if (!admin.passwordHash.startsWith("$2")) {
        const newHash = hashPassword(ADMIN_PASSWORD);
        await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, admin.id));
        logger.info("Admin password upgraded to bcrypt.");
      } else {
        logger.info("Admin account already exists, skipping seed.");
      }
      return;
    }

    await db.insert(usersTable).values({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "admin",
    });

    logger.info({ email: ADMIN_EMAIL }, "Admin account created successfully.");
  } catch (err) {
    logger.error({ err }, "Failed to seed admin account.");
  }
}
