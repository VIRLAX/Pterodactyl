import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  useGetOrder, getGetOrderQueryKey,
  useValidateDiscount, useUploadPaymentProof
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, Copy, Check, AlertCircle, Upload,
  Smartphone, QrCode, Clock, Package
} from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"dana" | "qris">("dana");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: order, isLoading } = useGetOrder(Number(orderId), {
    query: {
      enabled: !!orderId && isAuthenticated,
      queryKey: getGetOrderQueryKey(Number(orderId)),
      refetchInterval: 5000,
    }
  });

  const validateDiscount = useValidateDiscount();
  const uploadProof = useUploadPaymentProof();

  if (!isAuthenticated) { setLocation("/login"); return null; }

  const handleValidateDiscount = () => {
    if (!discountCode.trim() || !order) return;
    validateDiscount.mutate({
      data: { code: discountCode.trim().toUpperCase(), productId: (order as any).productId }
    }, {
      onSuccess: (data: any) => {
        if (data.valid) {
          setDiscountInfo(data);
          toast.success(data.message);
        } else {
          toast.error(data.message);
          setDiscountInfo(null);
        }
      },
      onError: () => toast.error("Gagal memvalidasi token"),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadProof = () => {
    if (!proofPreview || !order) return;
    uploadProof.mutate({ id: order.id, data: { proofBase64: proofPreview } }, {
      onSuccess: () => {
        toast.success("Bukti pembayaran berhasil diupload! Menunggu konfirmasi admin.");
        qc.invalidateQueries({ queryKey: getGetOrderQueryKey(Number(orderId)) });
      },
      onError: () => toast.error("Gagal mengupload bukti"),
    });
  };

  const copyDana = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Menunggu Pembayaran", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
    paid: { label: "Bukti Diterima — Menunggu Konfirmasi", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
    confirmed: { label: "Pembayaran Dikonfirmasi!", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
    rejected: { label: "Pembayaran Ditolak", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
            <Button className="mt-4" onClick={() => setLocation("/marketplace")}>Kembali ke Marketplace</Button>
          </div>
        </main>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Status Banner */}
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${statusInfo.color}`}>
            <StatusIcon className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{statusInfo.label}</p>
              <p className="text-xs opacity-80">Invoice: {order.invoiceNumber}</p>
            </div>
          </div>

          {/* Order Summary */}
          <Card className="glass-panel border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Ringkasan Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-background/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produk</span>
                  <span className="font-medium text-white">{(order as any).product?.name ?? `Produk #${(order as any).productId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kategori</span>
                  <span>{(order as any).product?.category ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga Normal</span>
                  <span>Rp {order.originalPrice.toLocaleString()}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Diskon ({order.discountCode})</span>
                    <span>-Rp {order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-white/10 text-white">
                  <span>Total Bayar</span>
                  <span className="text-primary text-lg">Rp {order.finalPrice.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Only show payment section if still pending */}
          {order.status === "pending" && (
            <>
              {/* Payment Method */}
              <Card className="glass-panel border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Metode Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod("dana")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === "dana" ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <Smartphone className="h-6 w-6 text-blue-400" />
                      <span className="text-sm font-semibold">Dana</span>
                      <span className="text-xs text-muted-foreground">Transfer manual</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("qris")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === "qris" ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <QrCode className="h-6 w-6 text-green-400" />
                      <span className="text-sm font-semibold">QRIS</span>
                      <span className="text-xs text-muted-foreground">Scan QR code</span>
                    </button>
                  </div>

                  {paymentMethod === "dana" && (
                    <div className="bg-background/50 rounded-xl p-5 space-y-3">
                      <p className="text-sm text-muted-foreground font-medium">Transfer ke nomor Dana berikut:</p>
                      <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Nomor Dana</p>
                          <p className="font-mono font-bold text-white text-lg">0812-3456-7890</p>
                          <p className="text-xs text-muted-foreground mt-0.5">a.n. PteroStore</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:bg-primary/10"
                          onClick={() => copyDana("081234567890")}
                        >
                          {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-3 border border-primary/20">
                        <div>
                          <p className="text-xs text-muted-foreground">Jumlah Transfer</p>
                          <p className="font-mono font-bold text-primary text-xl">Rp {order.finalPrice.toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => copyDana(order.finalPrice.toString())}>
                          {copied ? <Check className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">⚠️ Transfer tepat sesuai nominal untuk mempercepat konfirmasi</p>
                    </div>
                  )}

                  {paymentMethod === "qris" && (
                    <div className="bg-background/50 rounded-xl p-5 flex flex-col items-center gap-4">
                      <p className="text-sm text-muted-foreground">Scan QR code di bawah dengan aplikasi e-wallet apapun</p>
                      <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center border border-white/20">
                        <QrCode className="h-24 w-24 text-black" />
                      </div>
                      <p className="text-xs text-muted-foreground">Bayar tepat: <span className="text-white font-bold">Rp {order.finalPrice.toLocaleString()}</span></p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upload Proof */}
              <Card className="glass-panel border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Upload Bukti Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                  {proofPreview ? (
                    <div className="space-y-3">
                      <img src={proofPreview} alt="Bukti" className="w-full max-h-56 object-contain rounded-xl border border-white/10" />
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 border-white/10" onClick={() => { setProofFile(null); setProofPreview(null); }}>
                          Ganti Foto
                        </Button>
                        <Button
                          className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
                          onClick={handleUploadProof}
                          disabled={uploadProof.isPending}
                        >
                          <Upload className="h-4 w-4" />
                          {uploadProof.isPending ? "Mengupload..." : "Kirim Bukti"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/20 hover:border-primary/50 rounded-xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium">Klik untuk upload bukti transfer</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — maks 5MB</p>
                      </div>
                    </button>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Paid — waiting confirmation */}
          {order.status === "paid" && (
            <Card className="glass-panel border-blue-500/30">
              <CardContent className="p-6 text-center space-y-3">
                <Clock className="h-12 w-12 text-blue-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Bukti Pembayaran Diterima</h3>
                <p className="text-muted-foreground text-sm">Admin sedang memverifikasi pembayaran Anda. Proses biasanya memakan waktu 1-30 menit.</p>
                {order.paymentProofUrl && (
                  <img src={order.paymentProofUrl} alt="Bukti" className="w-full max-h-48 object-contain rounded-lg border border-white/10 mt-2" />
                )}
              </CardContent>
            </Card>
          )}

          {/* Confirmed */}
          {order.status === "confirmed" && (
            <Card className="glass-panel border-green-500/30">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Pembayaran Berhasil!</h3>
                <p className="text-muted-foreground text-sm">Pesanan Anda telah dikonfirmasi. Panel Pterodactyl sedang disiapkan dan akan segera aktif.</p>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="outline" className="border-white/10" onClick={() => setLocation("/orders")}>
                    Lihat Pesanan
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setLocation("/marketplace")}>
                    Beli Lagi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setLocation("/orders")}>
            ← Kembali ke Riwayat Pesanan
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
