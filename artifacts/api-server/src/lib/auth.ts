import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env["JWT_SECRET"] ?? "pterostore_fallback_secret_change_me";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  if (hash.startsWith("$2")) {
    return bcrypt.compareSync(password, hash);
  }
  const legacyHash = crypto.createHash("sha256").update(password + "pterostore_salt").digest("hex");
  return legacyHash === hash;
}

export function generateToken(userId: number, role: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, role, exp: Date.now() + 7 * 24 * 3600 * 1000, jti: crypto.randomBytes(8).toString("hex") })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return { userId: data.userId, role: data.role };
  } catch {
    return null;
  }
}

export function generateCode(prefix = "DISC"): string {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}
