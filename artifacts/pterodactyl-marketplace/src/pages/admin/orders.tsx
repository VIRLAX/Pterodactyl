import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  useListOrders, getListOrdersQueryKey, useUpdateOrderStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart, Search, Eye, Clock, CheckCircle, XCircle,
  Globe, User, KeyRound, FileText, Package, ChevronRight,
  Calendar, CreditCard, Hash,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig: Record<string, { label: string; color: string; dot: string; icon: any }> = {
  pending:   { label: "Menunggu",      color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25", dot: "bg-yellow-400", icon: Clock },
  paid:      { label: "Sudah Bayar",   color: "bg-blue-500/15 text-blue-400 border-blue-500/25",      dot: "bg-blue-400",   icon: CreditCard },
  confirmed: { label: "Dikonfirmasi",  color: "bg-green-500/15 text-green-400 border-green-500/25",   dot: "bg-green-400",  icon: CheckCircle },
  rejected:  { label: "Ditolak",       color: "bg-red-500/15 text-red-400 border-red-500/25",         dot: "bg-red-400",    icon: XCircle },
  cancelled: { label: "Dibatalkan",    color: "bg-gray-500/15 text-gray-400 border-gray-500/25",      dot: "bg-gray-400",   icon: XCircle },
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [delivery, setDelivery] = useState({ domain: "", username: "", password: "", tos: "" });

  const { data: orders, isLoading } = useListOrders({
    query: { queryKey: getListOrdersQueryKey() }
  });

  const updateStatus = useUpdateOrderStatus();

  const filtered = orders?.filter(o => {
    const matchSearch = !search
      || o.invoiceNumber.toLowerCase().includes(search.toLowerCase())
      || (o as any).user?.username?.toLowerCase().includes(search.toLowerCase())
      || (o as any).product?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  }) ?? [];

  const openOrder = (o: any) => {
    setSelectedOrder(o);
    setNewStatus(o.status);
    setNotes(o.notes ?? "");
    setDelivery({
      domain: o.deliveryDomain ?? "",
      username: o.deliveryUsername ?? "",
      password: o.deliveryPassword ?? "",
      tos: o.deliveryTos ?? "",
    });
  };

  const handleUpdateStatus = () => {
    if (!selectedOrder || !newStatus) return;
    const payload: any = { status: newStatus };
    if (notes) payload.notes = notes;
    if (newStatus === "confirmed") {
      if (delivery.domain) payload.deliveryDomain = delivery.domain;
      if (delivery.username) payload.deliveryUsername = delivery.username;
      if (delivery.password) payload.deliveryPassword = delivery.password;
      if (delivery.tos) payload.deliveryTos = delivery.tos;
    }
    updateStatus.mutate({ id: selectedOrder.id, data: payload }, {
      onSuccess: () => {
        toast.success("Pesanan berhasil diperbarui!");
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setSelectedOrder(null);
      },
      onError: () => toast.error("Gagal memperbarui pesanan"),
    });
  };

  const pendingCount = orders?.filter(o => o.status === "pending" || o.status === "paid").length ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Kelola Pesanan</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {orders?.length ?? 0} total pesanan
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-yellow-400">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                  {pendingCount} perlu tindakan
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari invoice, user, produk..."
              className="pl-9 bg-card/50 border-white/10 h-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-card/50 border-white/10 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">⏳ Menunggu</SelectItem>
              <SelectItem value="paid">💳 Sudah Bayar</SelectItem>
              <SelectItem value="confirmed">✅ Dikonfirmasi</SelectItem>
              <SelectItem value="rejected">❌ Ditolak</SelectItem>
              <SelectItem value="cancelled">🚫 Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 opacity-30" />
            </div>
            <p className="font-medium text-white">Tidak ada pesanan</p>
            <p className="text-sm mt-1">Coba ubah filter atau kata pencarian</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {filtered.map((o, idx) => {
                const sc = statusConfig[o.status] ?? statusConfig.pending;
                const StatusIcon = sc.icon;
                const isUrgent = o.status === "pending" || o.status === "paid";

                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Card
                      className={`border transition-all duration-200 cursor-pointer group hover:shadow-lg ${
                        isUrgent
                          ? "border-yellow-500/20 bg-yellow-500/3 hover:border-yellow-500/40"
                          : "border-white/5 bg-card/40 hover:border-white/15"
                      }`}
                      onClick={() => openOrder(o)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Status icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.color}`}>
                            <StatusIcon className="h-4.5 w-4.5" />
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md">
                                {o.invoiceNumber}
                              </span>
                              <Badge className={`${sc.color} text-[11px] px-1.5 py-0.5 gap-1 flex items-center`}>
                                <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                                {sc.label}
                              </Badge>
                              {isUrgent && (
                                <span className="text-[10px] text-yellow-400 animate-pulse font-medium">● Perlu Aksi</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="text-white/70 font-medium">{(o as any).user?.username ?? "—"}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {(o as any).product?.name ?? "—"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>

                          {/* Price + arrow */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="font-bold text-white text-sm">Rp {o.finalPrice.toLocaleString("id-ID")}</p>
                              {o.discountAmount > 0 && (
                                <p className="text-[11px] text-green-400">-Rp {o.discountAmount.toLocaleString("id-ID")}</p>
                              )}
                              <p className="text-[11px] text-muted-foreground capitalize">{o.paymentMethod}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Detail Pesanan
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                {(() => {
                  const sc = statusConfig[selectedOrder.status] ?? statusConfig.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <Badge className={`${sc.color} gap-1.5 text-sm px-3 py-1`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {sc.label}
                    </Badge>
                  );
                })()}
                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {selectedOrder.invoiceNumber}
                </span>
              </div>

              {/* Order Summary */}
              <div className="bg-background/50 rounded-xl p-4 space-y-2.5 text-sm border border-white/5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="text-white">{(selectedOrder as any).user?.username} <span className="text-muted-foreground text-xs">({(selectedOrder as any).user?.email})</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produk</span>
                  <span className="text-white">{(selectedOrder as any).product?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga Asli</span>
                  <span>Rp {selectedOrder.originalPrice.toLocaleString("id-ID")}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diskon ({selectedOrder.discountCode})</span>
                    <span className="text-green-400">-Rp {selectedOrder.discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t border-white/8">
                  <span>Total Bayar</span>
                  <span className="text-primary text-base">Rp {selectedOrder.finalPrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="capitalize">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span className="text-xs">{new Date(selectedOrder.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Payment Proof */}
              {selectedOrder.paymentProofUrl && (
                <div>
                  <p className="text-sm font-medium mb-2 text-muted-foreground">Bukti Pembayaran:</p>
                  <img src={selectedOrder.paymentProofUrl} alt="Bukti" className="w-full rounded-xl border border-white/10 max-h-60 object-contain bg-black/20" />
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="pending">⏳ Menunggu</SelectItem>
                    <SelectItem value="paid">💳 Sudah Bayar</SelectItem>
                    <SelectItem value="confirmed">✅ Konfirmasi (Selesai)</SelectItem>
                    <SelectItem value="rejected">❌ Tolak</SelectItem>
                    <SelectItem value="cancelled">🚫 Batalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Catatan */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Catatan (opsional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Catatan untuk user..."
                  className="bg-background/50 border-white/10 resize-none"
                  rows={2}
                />
              </div>

              {/* Delivery Info — only show when confirming */}
              <AnimatePresence>
                {newStatus === "confirmed" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 border border-green-500/20 rounded-xl p-4 bg-green-500/5"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-400" />
                      <p className="text-sm font-semibold text-green-300">Data Pengiriman Panel</p>
                      <span className="text-xs text-muted-foreground">(akan ditampilkan ke user)</span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="h-3.5 w-3.5 text-blue-400" /> Domain Panel
                        </Label>
                        <Input
                          value={delivery.domain}
                          onChange={e => setDelivery(d => ({ ...d, domain: e.target.value }))}
                          placeholder="https://panel.example.com"
                          className="bg-background/50 border-white/10 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <User className="h-3.5 w-3.5 text-purple-400" /> Username
                        </Label>
                        <Input
                          value={delivery.username}
                          onChange={e => setDelivery(d => ({ ...d, username: e.target.value }))}
                          placeholder="username panel"
                          className="bg-background/50 border-white/10 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <KeyRound className="h-3.5 w-3.5 text-yellow-400" /> Password
                        </Label>
                        <Input
                          value={delivery.password}
                          onChange={e => setDelivery(d => ({ ...d, password: e.target.value }))}
                          placeholder="password panel"
                          className="bg-background/50 border-white/10 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5 text-orange-400" /> Syarat & Ketentuan (TOS)
                        </Label>
                        <Textarea
                          value={delivery.tos}
                          onChange={e => setDelivery(d => ({ ...d, tos: e.target.value }))}
                          placeholder="Tuliskan syarat & ketentuan penggunaan panel..."
                          className="bg-background/50 border-white/10 resize-none text-sm"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-xs text-yellow-400/80">⚠️ Data ini akan langsung tampil di halaman checkout user setelah kamu klik Simpan.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="border border-white/10">
              Tutup
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updateStatus.isPending}
              className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_15px_rgba(255,10,60,0.3)]"
            >
              {updateStatus.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {updateStatus.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
