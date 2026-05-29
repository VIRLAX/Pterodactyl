import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetProduct, getGetProductQueryKey,
  useCreateOrder,
  useListReviews, getListReviewsQueryKey,
  useCreateReview,
  useValidateDiscount,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  Server, Shield, Clock, Zap, Check, Star, Reply,
  ChevronLeft, Tag, ShoppingCart
} from "lucide-react";
import { toast } from "sonner";

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`h-4 w-4 transition-colors ${
            s <= (hovered || rating) ? "text-yellow-400 fill-yellow-400" : "text-white/20"
          } ${onRate ? "cursor-pointer" : ""}`}
          onMouseEnter={() => onRate && setHovered(s)}
          onMouseLeave={() => onRate && setHovered(0)}
          onClick={() => onRate?.(s)}
        />
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"dana" | "qris">("dana");

  const { data: product, isLoading } = useGetProduct(Number(id), {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(Number(id)) }
  });

  const { data: reviews } = useListReviews({ productId: Number(id) }, {
    query: {
      enabled: !!id,
      queryKey: getListReviewsQueryKey({ productId: Number(id) }),
    }
  });

  const createOrder = useCreateOrder();
  const createReview = useCreateReview();
  const validateDiscount = useValidateDiscount();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Login dulu untuk melanjutkan pembelian!");
      setLocation("/login");
      return;
    }
    createOrder.mutate({
      data: {
        productId: Number(id),
        paymentMethod,
        discountCode: discountInfo?.valid ? discountCode : undefined,
      }
    }, {
      onSuccess: (order) => setLocation(`/checkout/${order.id}`),
      onError: () => toast.error("Gagal memulai checkout, coba lagi"),
    });
  };

  const handleValidateDiscount = () => {
    if (!discountCode.trim()) return;
    validateDiscount.mutate({ data: { code: discountCode.trim().toUpperCase(), productId: Number(id) } }, {
      onSuccess: (data: any) => {
        if (data.valid) { setDiscountInfo(data); toast.success(data.message); }
        else { toast.error(data.message); setDiscountInfo(null); }
      },
      onError: () => toast.error("Gagal memvalidasi token"),
    });
  };

  const handleSubmitReview = () => {
    if (!isAuthenticated) { toast.error("Login dulu untuk memberikan ulasan!"); return; }
    if (!reviewComment.trim()) { toast.error("Komentar tidak boleh kosong!"); return; }
    createReview.mutate({
      data: { productId: Number(id), rating: reviewRating, comment: reviewComment.trim() }
    }, {
      onSuccess: () => {
        toast.success("Ulasan berhasil dikirim!");
        qc.invalidateQueries({ queryKey: getListReviewsQueryKey({ productId: Number(id) }) });
        setReviewComment("");
        setReviewRating(5);
      },
      onError: () => toast.error("Gagal mengirim ulasan"),
    });
  };

  const discountedPrice = discountInfo?.valid && product
    ? Math.round(product.price * (1 - discountInfo.percentOff / 100))
    : product?.price ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
            <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Server className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium text-white mb-2">Produk tidak ditemukan</h3>
            <Button onClick={() => setLocation("/marketplace")}>Kembali ke Marketplace</Button>
          </div>
        </main>
      </div>
    );
  }

  const avgRating = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const benefits = product.benefits.split(",").map(b => b.trim());

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-white gap-2 -ml-2"
          onClick={() => setLocation("/marketplace")}
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali ke Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-7">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge className="bg-secondary/20 text-secondary border-secondary/30">{product.category}</Badge>
                {product.badge && (
                  <Badge className="bg-primary text-white capitalize">{product.badge}</Badge>
                )}
                <Badge className={product.status === "ready"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
                }>
                  {product.status === "ready" ? "Ready" : product.status === "sold_out" ? "Habis" : "Maintenance"}
                </Badge>
                {reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({reviews.length} ulasan)</span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-3">{product.name}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Zap, label: "Setup Instan", desc: "Siap dalam menit" },
                { icon: Shield, label: "DDoS Protected", desc: "Enterprise grade" },
                { icon: Clock, label: "99.9% Uptime", desc: "SLA terjamin" },
                { icon: Server, label: "Panel Pterodactyl", desc: "Official panel" },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-white/3 rounded-xl border border-white/5 text-center">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center mx-auto mb-2">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <Card className="glass-panel border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Fitur & Benefit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>
                      <span className="text-sm text-muted-foreground">{b}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detail */}
            {product.detail && (
              <Card className="glass-panel border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Spesifikasi Teknis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.detail}</p>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <div id="reviews">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">
                  Ulasan Pelanggan
                  {reviews?.length ? <span className="text-muted-foreground text-base font-normal ml-2">({reviews.length})</span> : null}
                </h2>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-white">{avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">/ 5</span>
                  </div>
                )}
              </div>

              {/* Review form */}
              <Card className="glass-panel border-white/5 mb-5">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Tulis Ulasan Anda</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Rating</Label>
                      <StarRating rating={reviewRating} onRate={setReviewRating} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Komentar</Label>
                      <Textarea
                        className="bg-background/50 border-white/10 resize-none text-sm"
                        rows={3}
                        placeholder="Bagaimana pengalaman kamu dengan panel ini?"
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white gap-2"
                      onClick={handleSubmitReview}
                      disabled={createReview.isPending || !reviewComment.trim()}
                    >
                      <Star className="h-3.5 w-3.5" />
                      {createReview.isPending ? "Mengirim..." : "Kirim Ulasan"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Review list */}
              {!reviews?.length ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Belum ada ulasan. Jadilah yang pertama!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="glass-panel border-white/5">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                            {(review as any).user?.username?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                              <p className="text-sm font-medium text-white">{(review as any).user?.username ?? "User"}</p>
                              <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("id-ID")}</p>
                            </div>
                            <StarRating rating={review.rating} />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        {(review as any).adminReply && (
                          <div className="mt-3 p-3 bg-primary/5 border-l-2 border-primary/30 rounded-r-lg">
                            <p className="text-xs text-primary font-semibold mb-1 flex items-center gap-1">
                              <Reply className="h-3 w-3" /> Balasan Admin
                            </p>
                            <p className="text-sm text-muted-foreground">{(review as any).adminReply}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Order Card */}
          <div>
            <Card className="glass-panel border-primary/30 sticky top-24 shadow-[0_0_30px_rgba(255,10,60,0.1)]">
              <CardContent className="p-6 space-y-5">
                {/* Price */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Harga</p>
                  {discountInfo?.valid ? (
                    <>
                      <p className="text-sm text-muted-foreground line-through">Rp {product.price.toLocaleString()}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-primary">Rp {discountedPrice.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm">/bln</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mt-2">
                        Hemat {discountInfo.percentOff}%
                      </Badge>
                    </>
                  ) : (
                    <>
                      {product.originalPrice && (
                        <p className="text-sm text-muted-foreground line-through">Rp {product.originalPrice.toLocaleString()}</p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-white">Rp {product.price.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm">/bln</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Product info */}
                <div className="space-y-2 text-sm border-y border-white/10 py-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kategori</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Setup</span>
                    <span className="font-medium text-green-400">Instan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-medium">99.9% SLA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${product.status === "ready" ? "text-green-400" : "text-red-400"} capitalize`}>
                      {product.status === "ready" ? "Tersedia" : product.status === "sold_out" ? "Habis" : "Maintenance"}
                    </span>
                  </div>
                </div>

                {/* Payment method selection */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Metode Bayar</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("dana")}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        paymentMethod === "dana" ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      📱 Dana
                    </button>
                    <button
                      onClick={() => setPaymentMethod("qris")}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        paymentMethod === "qris" ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      📷 QRIS
                    </button>
                  </div>
                </div>

                {/* Discount code */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Kode Diskon (opsional)
                  </p>
                  <div className="flex gap-2">
                    <Input
                      className="bg-background/50 border-white/10 text-sm font-mono uppercase flex-1"
                      placeholder="CONTOH10"
                      value={discountCode}
                      onChange={e => { setDiscountCode(e.target.value.toUpperCase()); if (discountInfo) setDiscountInfo(null); }}
                      onKeyDown={e => e.key === "Enter" && handleValidateDiscount()}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-xs flex-shrink-0"
                      onClick={handleValidateDiscount}
                      disabled={validateDiscount.isPending || !discountCode.trim()}
                    >
                      {validateDiscount.isPending ? "..." : "Pakai"}
                    </Button>
                  </div>
                  {discountInfo?.valid && (
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Diskon {discountInfo.percentOff}% berhasil diterapkan!
                    </p>
                  )}
                </div>

                <Button
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(255,10,60,0.4)] gap-2"
                  onClick={handleCheckout}
                  disabled={createOrder.isPending || product.status !== "ready"}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {createOrder.isPending ? "Memproses..." : product.status !== "ready" ? "Tidak Tersedia" : "Beli Sekarang"}
                </Button>

                {!isAuthenticated && (
                  <p className="text-xs text-center text-muted-foreground">
                    <button className="text-primary hover:underline" onClick={() => setLocation("/login")}>Login</button> untuk melanjutkan pembelian
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
