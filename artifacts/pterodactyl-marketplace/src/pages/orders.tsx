import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { ShoppingCart, ExternalLink, Clock, CheckCircle, XCircle, Package } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Menunggu Bayar", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  paid: { label: "Bukti Dikirim", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  confirmed: { label: "Dikonfirmasi", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  rejected: { label: "Ditolak", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  cancelled: { label: "Dibatalkan", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: XCircle },
};

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Riwayat Pesanan</h1>
            <p className="text-muted-foreground">Pantau semua pesanan dan status pembayaran Anda</p>
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
                return (
                  <Card key={order.id} className="glass-panel border-white/5 hover:border-white/10 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="h-5 w-5 text-primary" />
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
                          {(order.status === "pending" || order.status === "paid") && (
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-white gap-2 text-xs"
                              onClick={() => setLocation(`/checkout/${order.id}`)}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {order.status === "pending" ? "Bayar Sekarang" : "Lihat Detail"}
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
