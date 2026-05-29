import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/auth.js";
import nodemailer from "nodemailer";

const router = Router();

const otpStore = new Map<string, { otp: string; expires: number; userId: number; role: string }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const masked = local.slice(0, 2) + "***" + local.slice(-1);
  return `${masked}@${domain}`;
}

async function sendOTPEmail(to: string, otp: string, username: string) {
  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];

  if (!smtpUser || !smtpPass) {
    console.log(`[DEV] OTP for ${to}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const html = `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#111118;border-radius:16px;overflow:hidden;border:1px solid rgba(255,10,60,0.2);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0008 0%,#0d0014 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,10,60,0.15);">
            <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="width:36px;height:36px;background:#ff0a3c;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#fff;">PS</div>
              <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">PteroStore</span>
            </div>
            <p style="margin:0;color:rgba(255,255,255,0.5);font-size:13px;">Marketplace Panel Pterodactyl</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;font-weight:600;">Kode Verifikasi</p>
            <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">Selamat datang kembali, ${username}!</h1>
            <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">
              Kami menerima permintaan login ke akun PteroStore kamu. Masukkan kode OTP berikut untuk melanjutkan:
            </p>
            <!-- OTP Box -->
            <div style="background:rgba(255,10,60,0.08);border:2px solid rgba(255,10,60,0.3);border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:2px;">Kode OTP</p>
              <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#ff0a3c;font-family:'Courier New',monospace;">${otp}</div>
              <p style="margin:12px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">Berlaku selama <strong style="color:rgba(255,255,255,0.6);">5 menit</strong></p>
            </div>
            <div style="background:rgba(255,193,7,0.08);border:1px solid rgba(255,193,7,0.2);border-radius:10px;padding:16px;margin-bottom:28px;">
              <p style="margin:0;font-size:13px;color:rgba(255,193,7,0.9);line-height:1.6;">
                🔒 <strong>Keamanan:</strong> Jangan bagikan kode ini kepada siapapun, termasuk tim PteroStore. Kami tidak pernah meminta kode OTP kamu.
              </p>
            </div>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;">
              Jika kamu tidak melakukan login, abaikan email ini. Akun kamu tetap aman.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:rgba(255,255,255,0.02);padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);">© 2026 PteroStore. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"PteroStore" <${smtpUser}>`,
    to,
    subject: `${otp} — Kode OTP Login PteroStore`,
    html,
  });
}

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
      return res.status(400).json({ error: "Email dan password wajib diisi" });
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Email atau password salah. Periksa kembali." });
    }

    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000;
    otpStore.set(email.toLowerCase(), { otp, expires, userId: user.id, role: user.role });

    try {
      await sendOTPEmail(email, otp, user.username);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
    }

    return res.json({
      step: "otp_required",
      maskedEmail: maskEmail(email),
      message: "Kode OTP telah dikirim ke email kamu",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email dan OTP wajib diisi" });
    }

    const record = otpStore.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ error: "OTP tidak ditemukan. Silakan login ulang." });
    }
    if (Date.now() > record.expires) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: "OTP sudah kadaluarsa. Silakan login ulang." });
    }
    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Kode OTP salah. Periksa email kamu dan coba lagi." });
    }

    otpStore.delete(email.toLowerCase());

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, record.userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

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
