import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_HASH = "9beff9ca788decf4843e0fe105c49fee3ca9b8b27f26fcfe585c92c3e9b1d040";
const USER_HASH = "37fcc72c1ecdc37864d966b545680dc27d61fb90d7b88052508a9ae64b89fc79";

async function seed() {
  console.log("Seeding dummy accounts...");

  const existingAdmin = await db.select().from(usersTable).where(eq(usersTable.email, "admin@pterostore.com")).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(usersTable).values({
      username: "admin",
      email: "admin@pterostore.com",
      passwordHash: ADMIN_HASH,
      role: "admin",
    });
    console.log("Created admin: admin@pterostore.com / admin123");
  } else {
    console.log("Admin already exists, skipping.");
  }

  const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, "user@pterostore.com")).limit(1);
  if (existingUser.length === 0) {
    await db.insert(usersTable).values({
      username: "user",
      email: "user@pterostore.com",
      passwordHash: USER_HASH,
      role: "user",
    });
    console.log("Created user: user@pterostore.com / user123");
  } else {
    console.log("User already exists, skipping.");
  }

  console.log("Seeding done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
