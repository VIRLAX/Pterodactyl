import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, ExternalLink, Clock, CheckCircle, XCircle, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Menunggu Bayar", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  paid: { label: "Bukti Dikirim", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  confirmed: { label: "Dikonfirmasi", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  rejected: { label: "Ditolak", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  cancelled: { label: "Dibatalkan", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
};

export default function Orders() {
  const { isAuthenticated, token } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const { data: orders, isLoading } = useListOrders({
    query: {
      enabled: isAuthenticated,
      queryKey: getListOrdersQueryKey(),
    }
  });

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  const completedOrders = orders?.filter(o => ["confirmed", "rejected", "cancelled"].includes(o.status)) ?? [];
  const hasCompleted = completedOrders.length > 0;

  async function handleClearCompleted() {
    if (!confirm(`Hapus ${completedOrders.length} pesanan yang sudah selesai/ditolak/dibatalkan? Pesanan yang masih aktif (belum bayar/menunggu konfirmasi) tidak akan terpengaruh.`)) return;
    setClearing(true);
    try {
      const res = await fetch(`${getApiUrl()}/orders/clear-completed`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      toast.success(`${json.deleted} pesanan berhasil dihapus`);
      qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    } catch {
      toast.error("Gagal menghapus pesanan");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Riwayat Pesanan</h1>
              <p className="text-muted-foreground">Pantau semua pesanan dan status pembayaran Anda</p>
            </div>
            {hasCompleted && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-white/10 gap-2 text-xs mt-1"
                onClick={handleClearCompleted}
                disabled={clearing}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {clearing ? "Membersihkan..." : `Bersihkan Selesai (${completedOrders.length})`}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !orders?.length ? (
            <div className="flex flex-col items-center py-24 text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <ShoppingCart className="h-10 w-10 opacity-40" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Belum Ada Pesanan</h3>
              <p className="text-sm text-center max-w-sm mb-6">Kamu belum pernah memesan panel. Yuk mulai pilih panel Pterodactyl impianmu!</p>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(255,10,60,0.4)]" onClick={() => setLocation("/marketplace")}>
                Lihat Marketplace
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const sc = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                const isActive = order.status === "pending" || order.status === "paid";
                const isConfirmed = order.status === "confirmed";
                const isFinished = !isActive && !isConfirmed;

                return (
                  <Card key={order.id} className={`glass-panel border-white/5 hover:border-white/10 transition-colors ${isFinished ? "opacity-70" : ""}`}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isConfirmed ? "bg-green-500/15" : "bg-primary/10"}`}>
                            <Package className={`h-5 w-5 ${isConfirmed ? "text-green-400" : "text-primary"}`} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-semibold text-white">{(order as any).product?.name ?? `Produk #${(order as any).productId}`}</p>
                              <Badge className={(order as any).product?.category ? "bg-secondary/20 text-secondary border-secondary/30 text-xs" : "hidden"}>
                                {(order as any).product?.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">{order.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2">
                          <p className="text-lg font-bold text-primary">Rp {order.finalPrice.toLocaleString()}</p>
                          {order.discountAmount > 0 && (
                            <p className="text-xs text-green-400">-Rp {order.discountAmount.toLocaleString()} diskon</p>
                          )}
                          <Badge className={`${sc.color} flex items-center gap-1.5`}>
                            <StatusIcon className="h-3 w-3" />
                            {sc.label}
                          </Badge>
                          {isActive && (
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-white gap-2 text-xs"
                              onClick={() => setLocation(`/checkout/${order.id}`)}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {order.status === "pending" ? "Bayar Sekarang" : "Lihat Detail"}
                            </Button>
                          )}
                          {isConfirmed && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-500 text-white gap-2 text-xs"
                              onClick={() => setLocation(`/checkout/${order.id}`)}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Lihat Panel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
