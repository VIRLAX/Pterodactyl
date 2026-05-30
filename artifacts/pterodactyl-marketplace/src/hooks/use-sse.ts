import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getListOrdersQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";

type SSEEvent = {
  type: string;
  data?: any;
  timestamp?: string;
};

export function useAdminSSE(token?: string) {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;

    const url = `/api/admin/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("connected", () => {
      // Connected silently
    });

    es.addEventListener("new_order", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSEEvent["data"];
        toast.success(`📦 Pesanan baru masuk!`, {
          description: `${data?.username ?? "User"} memesan ${data?.productName ?? "produk"} — Rp ${data?.finalPrice?.toLocaleString("id-ID") ?? "—"}`,
          duration: 8000,
          action: {
            label: "Lihat",
            onClick: () => window.location.href = "/admin/orders",
          },
        });
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      } catch { /* ignore parse errors */ }
    });

    es.addEventListener("new_user", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSEEvent["data"];
        toast.info(`👤 User baru mendaftar`, {
          description: data?.username ? `@${data.username} baru saja bergabung` : "Ada user baru",
          duration: 5000,
        });
        qc.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      } catch { /* ignore */ }
    });

    es.addEventListener("new_product", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSEEvent["data"];
        toast.info(`📦 Produk baru ditambahkan`, {
          description: data?.name ?? "Produk baru",
          duration: 4000,
        });
      } catch { /* ignore */ }
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      if (mountedRef.current) {
        reconnectRef.current = setTimeout(connect, 5000);
      }
    };
  }, [token, qc]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);
}
