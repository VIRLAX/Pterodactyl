import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// ─── PORT ────────────────────────────────────────────────────────────────────
// Replit menyediakan PORT otomatis. Di hosting lain, default ke 3000.
const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);

// ─── BASE PATH ────────────────────────────────────────────────────────────────
// Replit menggunakan path prefix. Di hosting lain, default ke "/".
const basePath = process.env.BASE_PATH ?? "/";

// ─── API URL (untuk dev proxy) ────────────────────────────────────────────────
// Di Replit: API server berjalan di port berbeda dan dihandle Replit proxy.
// Di hosting lain: set API_SERVER_URL ke URL API server (misal http://localhost:8080)
const apiServerUrl = process.env.API_SERVER_URL ?? "http://localhost:8080";

const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Plugin Replit hanya di-load saat running di Replit
    ...(process.env.NODE_ENV !== "production" && isReplit
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: false,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: false,
    },
    // ─── Proxy /api ke API server (untuk dev mode tanpa VITE_API_URL) ─────────
    // Di Replit, Replit sudah handle routing jadi proxy ini tidak aktif.
    // Di hosting lain (local dev), request ke /api akan di-forward ke API server.
    proxy: isReplit ? undefined : {
      "/api": {
        target: apiServerUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
