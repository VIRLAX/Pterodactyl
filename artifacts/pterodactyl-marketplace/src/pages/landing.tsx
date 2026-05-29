import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  useListProducts, getListProductsQueryKey,
  useListReviews, getListReviewsQueryKey,
  useListFaqs, getListFaqsQueryKey,
  useGetAdminStats, getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server, Zap, Shield, Clock, Star, Users, ShoppingCart,
  TrendingUp, ChevronRight, MessageCircle, Check, HelpCircle,
  ChevronDown
} from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
      ))}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
      >
        <span className="font-medium text-white pr-4">{question}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();

  const { data: products, isLoading: productsLoading } = useListProducts({ available: true }, {
    query: { queryKey: getListProductsQueryKey({ available: true }) }
  });
  const { data: reviews } = useListReviews({}, {
    query: { queryKey: getListReviewsQueryKey({}) }
  });
  const { data: faqs } = useListFaqs({
    query: { queryKey: getListFaqsQueryKey() }
  });
  const { data: stats } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() }
  });

  const featuredProducts = products?.filter(p => p.isActive && (p.badge === "popular" || p.badge === "recommended" || p.badge === "best seller")).slice(0, 3) || [];
  const displayProducts = featuredProducts.length >= 3 ? featuredProducts : (products?.slice(0, 3) || []);
  const topReviews = reviews?.filter(r => r.rating >= 4).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-36 md:pb-28 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-secondary/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto relative z-10 text-center">
          <Badge className="mb-6 bg-primary/15 text-primary border-primary/30 px-4 py-1.5 text-sm font-medium">
            ✨ Platform Hosting Panel #1 Indonesia
          </Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="text-white">Next-Gen </span>
            <span style={{ color: "hsl(350 100% 60%)", textShadow: "0 0 40px hsl(350 100% 55% / 0.6)" }}>
              Pterodactyl
            </span>
            <br />
            <span className="text-white">Panels</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Panel game server performa tinggi dengan setup instan, proteksi DDoS premium, dan uptime 99.9% — khusus untuk gamer Indonesia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="h-13 px-8 text-base bg-primary hover:bg-primary/90 text-white shadow-[0_0_25px_rgba(255,10,60,0.5)] font-bold rounded-xl gap-2"
              onClick={() => setLocation("/marketplace")}
            >
              <ShoppingCart className="h-5 w-5" />
              Lihat Semua Panel
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-base border-white/15 hover:bg-white/5 rounded-xl gap-2"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Pelajari Lebih Lanjut
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            {[
              { label: "Pengguna Aktif", value: stats ? `${stats.totalUsers}+` : "100+", icon: Users },
              { label: "Pesanan Selesai", value: stats ? `${stats.confirmedOrders}+` : "500+", icon: ShoppingCart },
              { label: "Produk Tersedia", value: stats ? `${stats.totalProducts}+` : "15+", icon: Server },
              { label: "Uptime", value: "99.9%", icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-card/20 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Mengapa PteroStore?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Dibangun untuk performa, dirancang untuk kemudahan. Nikmati panel game server terbaik.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Setup Instan", desc: "Panel siap dalam hitungan menit setelah konfirmasi pembayaran.", color: "text-yellow-400 bg-yellow-500/10" },
              { icon: Shield, title: "Proteksi DDoS", desc: "Perlindungan enterprise-grade untuk menjaga server Anda tetap online.", color: "text-blue-400 bg-blue-500/10" },
              { icon: Clock, title: "Uptime 99.9%", desc: "Infrastruktur high-availability untuk gaming tanpa gangguan.", color: "text-green-400 bg-green-500/10" },
              { icon: MessageCircle, title: "Support 24/7", desc: "Tim support siap membantu kapanpun kamu butuh bantuan.", color: "text-purple-400 bg-purple-500/10" },
            ].map((f, i) => (
              <Card key={i} className="glass-panel border-white/5 hover:border-white/15 transition-all duration-300 hover:translate-y-[-2px]">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Panel Terpopuler</h2>
              <p className="text-muted-foreground">Pilihan favorit komunitas gamer Indonesia.</p>
            </div>
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-2 hidden sm:flex" onClick={() => setLocation("/marketplace")}>
              Lihat Semua <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-96 rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          ) : displayProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <Card key={product.id} className="glass-panel border-white/10 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,10,60,0.15)] flex flex-col relative overflow-hidden group">
                  {product.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-primary text-white font-bold shadow-[0_0_10px_rgba(255,10,60,0.5)] capitalize">
                        {product.badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{product.name}</CardTitle>
                    <Badge className="w-fit bg-secondary/20 text-secondary border-secondary/30 text-xs">{product.category}</Badge>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div>
                      <span className="text-3xl font-extrabold text-white">Rp {product.price.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm">/bulan</span>
                      {product.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through">Rp {product.originalPrice.toLocaleString()}/bulan</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="space-y-2">
                      {product.benefits.split(",").slice(0, 4).map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                          <span>{b.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-white/8 hover:bg-primary hover:text-white transition-all duration-200 border border-white/10 hover:border-primary"
                      onClick={() => setLocation(`/product/${product.id}`)}
                    >
                      Pilih Panel
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Belum ada produk tersedia.</div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Button variant="outline" className="border-white/10" onClick={() => setLocation("/marketplace")}>
              Lihat Semua Panel
            </Button>
          </div>
        </div>
      </section>

      {/* Invite Promo */}
      <section className="py-16 bg-gradient-to-br from-secondary/15 via-background to-primary/15 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30">🎁 Program Invite</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">Invite Teman, Dapat Diskon!</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Ajak teman masuk ke grup WhatsApp kami, upload screenshot buktinya, dan dapatkan token diskon eksklusif untuk pembelian panel berikutnya!
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { step: "1", label: "Join Grup WhatsApp" },
                { step: "2", label: "Upload Screenshot" },
                { step: "3", label: "Dapat Token Diskon" },
              ].map(({ step, label }) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary font-bold">
                    {step}
                  </div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-white shadow-[0_0_20px_rgba(150,10,255,0.4)] font-bold gap-2"
              onClick={() => setLocation("/marketplace")}
            >
              <MessageCircle className="h-5 w-5" />
              Submit Bukti Invite
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {topReviews.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Kata Mereka</h2>
              <p className="text-muted-foreground">Review asli dari pelanggan setia PteroStore</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topReviews.map((review) => (
                <Card key={review.id} className="glass-panel border-white/5 hover:border-white/10 transition-colors">
                  <CardContent className="p-6 space-y-4">
                    <StarRating rating={review.rating} />
                    <p className="text-sm text-muted-foreground leading-relaxed">"{review.comment}"</p>
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {(review as any).user?.username?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{(review as any).user?.username ?? "User"}</p>
                        <p className="text-xs text-muted-foreground">Pelanggan Terverifikasi</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <section className="py-20 bg-card/20 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 mb-4">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Pertanyaan Umum</h2>
                <p className="text-muted-foreground">Pertanyaan yang sering ditanyakan oleh pelanggan kami</p>
              </div>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Siap Mulai?</h2>
            <p className="text-muted-foreground mb-8">
              Bergabung dengan ratusan gamer yang sudah mempercayakan panel Pterodactyl mereka ke PteroStore.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(255,10,60,0.4)] font-bold"
                onClick={() => setLocation("/marketplace")}
              >
                Lihat Panel Sekarang
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 border-white/15 hover:bg-white/5"
                onClick={() => setLocation("/register")}
              >
                Daftar Gratis
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
