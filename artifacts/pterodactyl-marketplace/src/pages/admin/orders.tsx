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
  Globe, User, KeyRound, FileText, Package, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const statusLabel: Record<string, string> = {
  pending: "Menunggu", paid: "Sudah Bayar", confirmed: "Dikonfirmasi",
  rejected: "Ditolak", cancelled: "Dibatalkan",
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
        toast.success("Pesanan diperbarui!");
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setSelectedOrder(null);
      },
      onError: () => toast.error("Gagal memperbarui pesanan"),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kelola Pesanan</h1>
          <p className="text-muted-foreground text-sm">{orders?.length ?? 0} total pesanan</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari invoice, user, produk..." className="pl-9 bg-card/50 border-white/10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-card/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="paid">Sudah Bayar</SelectItem>
              <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="glass-panel border-white/5">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />)}
              </div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-30" />
                <p>Tidak ada pesanan ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Invoice</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">User</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Produk</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Total</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Metode</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tanggal</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-primary">{o.invoiceNumber}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{(o as any).user?.username ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{(o as any).user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{(o as any).product?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{(o as any).product?.category ?? ""}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">Rp {o.finalPrice.toLocaleString("id-ID")}</p>
                          {o.discountAmount > 0 && (
                            <p className="text-xs text-green-400">-Rp {o.discountAmount.toLocaleString("id-ID")}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-white/5 text-foreground border-white/10 capitalize">{o.paymentMethod}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColor[o.status] ?? "bg-white/10"}>{statusLabel[o.status] ?? o.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("id-ID")}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => openOrder(o)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5">
              {/* Order Summary */}
              <div className="bg-background/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-mono text-primary">{selectedOrder.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span>{(selectedOrder as any).user?.username} <span className="text-muted-foreground">({(selectedOrder as any).user?.email})</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produk</span>
                  <span>{(selectedOrder as any).product?.name}</span>
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
                <div className="flex justify-between font-semibold pt-2 border-t border-white/10">
                  <span>Total Bayar</span>
                  <span className="text-primary">Rp {selectedOrder.finalPrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="capitalize">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Payment Proof */}
              {selectedOrder.paymentProofUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Bukti Pembayaran:</p>
                  <img src={selectedOrder.paymentProofUrl} alt="Bukti" className="w-full rounded-lg border border-white/10 max-h-56 object-contain" />
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
              {newStatus === "confirmed" && (
                <div className="space-y-4 border border-green-500/20 rounded-xl p-4 bg-green-500/5">
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
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Tutup</Button>
            <Button onClick={handleUpdateStatus} disabled={updateStatus.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {updateStatus.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
