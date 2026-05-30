import { Router, type IRouter } from "express";
import { getClientCount } from "../lib/sse.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    version: process.env["npm_package_version"] ?? "1.0.0",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: "MB",
    },
    realtime: {
      adminClients: getClientCount(),
    },
    environment: process.env["NODE_ENV"] ?? "development",
  });
});

router.get("/health", (_req, res) => res.redirect("/api/healthz"));

export default router;
