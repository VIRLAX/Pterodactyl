import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth.js";
import { requireAuth } from "../middlewares/auth.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = Router();

const pendingRegistrations = new Map<
  string,
  { otp: string; expires: number; username: string; email: string; passwordHash: string }
>();

const passwordResetStore = new Map<
  string,
  { otp: string; expires: number; userId: number; verified: boolean; resetToken?: string }
>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const masked = local.slice(0, 2) + "***" + local.slice(-1);
  return `${masked}@${domain}`;
}

type OTPEmailType = "register" | "reset";

async function sendOTPEmail(to: string, otp: string, username: string, type: OTPEmailType = "register") {
  const smtpUser = process.env["SMTP_USER"];
  const smtpPass = process.env["SMTP_PASS"];

  const isRegister = type === "register";
  const subject = isRegister
    ? `${otp} — Kode Verifikasi Daftar Akun PteroStore`
    : `${otp} — Kode Reset Password PteroStore`;
  const headingText = isRegister ? `Halo, ${username}!` : `Reset Password, ${username}`;
  const bodyText = isRegister
    ? "Kamu baru saja mendaftar di PteroStore. Masukkan kode OTP berikut untuk memverifikasi email kamu dan menyelesaikan pembuatan akun:"
    : "Kami menerima permintaan reset password untuk akun kamu. Masukkan kode OTP berikut untuk melanjutkan:";
  const accentColor = isRegister ? "#a855f7" : "#ff0a3c";
  const accentColorLight = isRegister ? "rgba(168,85,247,0.12)" : "rgba(255,10,60,0.08)";
  const accentBorder = isRegister ? "rgba(168,85,247,0.35)" : "rgba(255,10,60,0.3)";
  const headerBg = isRegister
    ? "linear-gradient(135deg,#0d0014 0%,#1a0030 100%)"
    : "linear-gradient(135deg,#1a0008 0%,#0d0014 100%)";
  const headerBorder = isRegister ? "rgba(168,85,247,0.2)" : "rgba(255,10,60,0.15)";
  const cardBorder = isRegister ? "rgba(168,85,247,0.2)" : "rgba(255,10,60,0.2)";
  const footerNote = isRegister
    ? "Jika kamu tidak mendaftar di PteroStore, abaikan email ini."
    : "Jika kamu tidak meminta reset password, abaikan email ini. Akun kamu tetap aman.";

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#080810;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080810;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:500px;background:#10101c;border-radius:20px;overflow:hidden;border:1px solid ${cardBorder};">
        <!-- HEADER -->
        <tr>
          <td style="background:${headerBg};padding:36px 40px 28px;text-align:center;border-bottom:1px solid ${headerBorder};">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
              <tr>
                <td style="width:44px;height:44px;background:#ff0a3c;border-radius:10px;text-align:center;vertical-align:middle;font-weight:900;font-size:20px;color:#fff;letter-spacing:-1px;">PS</td>
                <td style="padding-left:10px;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;vertical-align:middle;">PteroStore</td>
              </tr>
            </table>
            <p style="margin:0;color:rgba(255,255,255,0.45);font-size:13px;letter-spacing:0.3px;">Marketplace Panel Pterodactyl</p>
          </td>
        </tr>
        <!-- BODY -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:1.5px;">${isRegister ? "Verifikasi Email" : "Reset Password"}</p>
            <h1 style="margin:0 0 18px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;">${headingText}</h1>
            <p style="margin:0 0 32px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">${bodyText}</p>

            <!-- OTP BOX -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:${accentColorLight};border:2px solid ${accentBorder};border-radius:14px;padding:30px;text-align:center;">
                  <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:2.5px;">Kode OTP Kamu</p>
                  <div style="font-size:48px;font-weight:900;letter-spacing:14px;color:${accentColor};font-family:'Courier New',Courier,monospace;line-height:1;">${otp}</div>
                  <p style="margin:14px 0 0;font-size:12px;color:rgba(255,255,255,0.3);">Berlaku selama <strong style="color:rgba(255,255,255,0.55);">5 menit</strong></p>
                </td>
              </tr>
            </table>

            <!-- WARNING -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:rgba(255,193,7,0.07);border:1px solid rgba(255,193,7,0.18);border-radius:10px;padding:14px 16px;">
                  <p style="margin:0;font-size:13px;color:rgba(255,210,50,0.85);line-height:1.6;">
                    🔒 <strong>Penting:</strong> Jangan pernah bagikan kode ini kepada siapapun. Tim PteroStore tidak akan pernah meminta kode OTP kamu.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.7;">${footerNote}</p>
          </td>
        </tr>
        <!-- FOOTER -->
        <tr>
          <td style="background:rgba(255,255,255,0.02);padding:18px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);">© ${new Date().getFullYear()} PteroStore. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!smtpUser || !smtpPass) {
    console.log(`\n[DEV OTP] ========================`);
    console.log(`  Type   : ${type}`);
    console.log(`  To     : ${to}`);
    console.log(`  Code   : ${otp}`);
    console.log(`================================\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"PteroStore" <${smtpUser}>`,
    to,
    subject,
    html,
  });
}

const DUMMY_ADMINS = ["admin@pterostore.com"];

router.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: "Username minimal 3 karakter" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter" });
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar. Silakan login." });
    }
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Username sudah dipakai. Coba yang lain." });
    }

    const passwordHash = hashPassword(password);
    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000;
    pendingRegistrations.set(email.toLowerCase(), { otp, expires, username, email, passwordHash });

    try {
      await sendOTPEmail(email, otp, username, "register");
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
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

router.post("/auth/verify-registration", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email dan OTP wajib diisi" });
    }

    const record = pendingRegistrations.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ error: "Sesi registrasi tidak ditemukan. Silakan daftar ulang." });
    }
    if (Date.now() > record.expires) {
      pendingRegistrations.delete(email.toLowerCase());
      return res.status(400).json({ error: "OTP sudah kadaluarsa. Silakan daftar ulang." });
    }
    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Kode OTP salah. Periksa email kamu." });
    }

    pendingRegistrations.delete(email.toLowerCase());

    const alreadyExists = await db.select().from(usersTable).where(eq(usersTable.email, record.email)).limit(1);
    if (alreadyExists.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar." });
    }

    const [user] = await db.insert(usersTable).values({
      username: record.username,
      email: record.email,
      passwordHash: record.passwordHash,
      role: "user",
    }).returning();

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
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Email atau password salah. Periksa kembali." });
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

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email wajib diisi" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!user) {
      return res.json({ step: "otp_required", maskedEmail: maskEmail(email), message: "Jika email terdaftar, OTP akan dikirim." });
    }

    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000;
    passwordResetStore.set(email.toLowerCase(), { otp, expires, userId: user.id, verified: false });

    try {
      await sendOTPEmail(email, otp, user.username, "reset");
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }

    return res.json({
      step: "otp_required",
      maskedEmail: maskEmail(email),
      message: "Kode OTP reset password telah dikirim",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email dan OTP wajib diisi" });
    }

    const record = passwordResetStore.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ error: "Sesi reset tidak ditemukan. Silakan minta OTP lagi." });
    }
    if (Date.now() > record.expires) {
      passwordResetStore.delete(email.toLowerCase());
      return res.status(400).json({ error: "OTP sudah kadaluarsa. Silakan minta OTP baru." });
    }
    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Kode OTP salah. Coba lagi." });
    }

    const resetToken = generateResetToken();
    passwordResetStore.set(email.toLowerCase(), { ...record, verified: true, resetToken });

    return res.json({ resetToken, message: "OTP valid. Silakan buat password baru." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter" });
    }

    const record = passwordResetStore.get(email.toLowerCase());
    if (!record || !record.verified || record.resetToken !== resetToken) {
      return res.status(400).json({ error: "Token reset tidak valid. Silakan ulangi proses." });
    }

    passwordResetStore.delete(email.toLowerCase());

    const passwordHash = hashPassword(newPassword);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, record.userId));

    return res.json({ message: "Password berhasil direset. Silakan login." });
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
