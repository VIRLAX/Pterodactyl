import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "pterostore_salt").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: number, role: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, role, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", "pterostore_jwt_secret").update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const [payload, sig] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", "pterostore_jwt_secret").update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
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
