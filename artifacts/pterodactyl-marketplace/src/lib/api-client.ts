import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// ─── API Base URL ───────────────────────────────────────────────────────────
// Di Replit: tidak perlu di-set (pakai relative URL lewat proxy Replit)
// Di hosting lain: set VITE_API_URL ke URL API server kamu
// Contoh: VITE_API_URL=https://api.pterostore.com
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");
if (apiUrl) {
  setBaseUrl(apiUrl);
}

// ─── Auth Token ─────────────────────────────────────────────────────────────
// Attach JWT token dari localStorage ke setiap request API
setAuthTokenGetter(() => {
  return localStorage.getItem("pterostore_token");
});

export {};
