import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

/* ─────────────────────────── Security Headers (Helmet) ─────────────────────────── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    xFrameOptions: { action: "deny" },
    xXssProtection: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
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
const allowedOrigins = process.env["ALLOWED_ORIGINS"]?.split(",").map(o => o.trim()) ?? ["*"];
app.use(cors({
  origin: allowedOrigins.includes("*") ? true : allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ─────────────────────────── Body Parser (strict size limit) ─────────────────────────── */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* ─────────────────────────── XSS Input Sanitization ─────────────────────────── */
function stripTags(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/<[^>]*>/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .replace(/data:/gi, "")
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

// Strict limit for auth endpoints (brute force / credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// General limit for all API routes (DDoS mitigation)
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: "Terlalu banyak request. Coba lagi sebentar." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

// Strict limit for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: "Terlalu banyak request ke admin panel." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Extra strict for sensitive mutations
const mutationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { error: "Terlalu banyak operasi. Tunggu sebentar." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/verify-registration", authLimiter);
app.use("/api/auth/verify-reset-otp", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

app.use("/api/admin", adminLimiter);
app.use("/api/orders", mutationLimiter);

app.use("/api", generalLimiter);

/* ─────────────────────────── Block Suspicious Patterns ─────────────────────────── */
const BLOCKED_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /(union|select|insert|drop|delete|update|create|alter|exec|execute|script|javascript)/i,
  /(\.\.\/)|(\.\.\\)/,
  /(<script|<iframe|<object|<embed|onerror|onload|eval\()/i,
];

app.use((req: Request, res: Response, next: NextFunction) => {
  const target = `${req.url} ${JSON.stringify(req.query)}`;
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(target)) {
      logger.warn({ url: req.url, ip: req.ip }, "Blocked suspicious request pattern");
      return res.status(400).json({ error: "Permintaan tidak valid" });
    }
  }
  next();
});

/* ─────────────────────────── Routes ─────────────────────────── */
app.use("/api", router);

/* ─────────────────────────── 404 + Error Handler ─────────────────────────── */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
