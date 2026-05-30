import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.set("trust proxy", 1);

/* ─────────────────────────── Security Headers (Helmet) ─────────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow CDN fonts/scripts in frontend
    crossOriginEmbedderPolicy: false,
    xFrameOptions: { action: "deny" },
    xXssProtection: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: process.env.NODE_ENV === "production"
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

/* ─────────────────────────── Logger ─────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

/* ─────────────────────────── CORS ─────────────────────────── */
// ALLOWED_ORIGINS: comma-separated list of allowed origins
// Set to "*" to allow all (default — penting untuk universal deployment)
// Contoh: ALLOWED_ORIGINS=https://pterostore.com,https://www.pterostore.com
const allowedOriginsRaw = process.env["ALLOWED_ORIGINS"] ?? "*";
const allowedOrigins = allowedOriginsRaw.split(",").map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    // Allow all origins if wildcard
    if (allowedOrigins.includes("*")) return callback(null, true);
    // Check against allowed list
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ─────────────────────────── Body Parser ─────────────────────────── */
app.use(express.json({ limit: "5mb" })); // 5mb for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

/* ─────────────────────────── XSS Input Sanitization ─────────────────────────── */
function stripTags(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  }
  if (Array.isArray(value)) return value.map(stripTags);
  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      clean[k] = stripTags(v);
    }
    return clean;
  }
  return value;
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    req.body = stripTags(req.body);
  }
  next();
});

/* ─────────────────────────── Rate Limiting ─────────────────────────── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: "Terlalu banyak request. Coba lagi sebentar." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: "Terlalu banyak request ke admin panel." },
  standardHeaders: true,
  legacyHeaders: false,
});

const mutationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: { error: "Terlalu banyak operasi. Tunggu sebentar." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/admin", adminLimiter);
app.use("/api/orders", mutationLimiter);
app.use("/api", generalLimiter);

/* ─────────────────────────── Block Suspicious Patterns ─────────────────────────── */
const BLOCKED_PATTERNS = [
  /(\.\.\/)|(\.\.\\)/,
  /(<script|<iframe|<object|<embed|onerror|onload)/i,
];

app.use((req: Request, res: Response, next: NextFunction) => {
  const target = req.url;
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(target)) {
      logger.warn({ url: req.url, ip: req.ip }, "Blocked suspicious request pattern");
      return res.status(400).json({ error: "Permintaan tidak valid" });
    }
  }
  next();
});

/* ─────────────────────────── API Routes ─────────────────────────── */
app.use("/api", router);

/* ─────────────────────────── Serve Frontend Static Files (Production) ─────────────────────────── */
// Jika ada frontend build di ../pterodactyl-marketplace/dist/public,
// serve sebagai static files. Ini memungkinkan API + Frontend jalan di 1 server.
const frontendDist = path.resolve(__dirname, "../../pterodactyl-marketplace/dist/public");
const frontendDistAlt = path.resolve(__dirname, "../../../artifacts/pterodactyl-marketplace/dist/public");

const staticPath = fs.existsSync(frontendDist) ? frontendDist
  : fs.existsSync(frontendDistAlt) ? frontendDistAlt
  : null;

if (staticPath) {
  logger.info({ staticPath }, "Serving frontend static files");
  app.use(express.static(staticPath));
  // SPA fallback — semua non-API routes serve index.html
  app.get("*", (_req: Request, res: Response) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: "Frontend not found. Build the frontend first." });
    }
  });
} else {
  /* ─── 404 for API-only mode ─── */
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Endpoint tidak ditemukan" });
  });
}

/* ─────────────────────────── Global Error Handler ─────────────────────────── */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  if (err.message?.includes("CORS")) {
    return res.status(403).json({ error: "CORS: Origin tidak diizinkan" });
  }
  res.status(500).json({ error: "Internal server error" });
});

export default app;
