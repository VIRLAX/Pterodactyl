import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useListProducts, getListProductsQueryKey, useSubmitInvite } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  Server, Search, Check, Upload, X, Gift, MessageCircle,
  Cpu, HardDrive, Shield, Zap, ChevronRight, Activity,
  Database, Globe, Lock, Star
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";

const badgeStyle: Record<string, string> = {
  popular: "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.6)]",
  recommended: "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.6)]",
  "best seller": "bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.6)]",
  new: "bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.6)]",
  hot: "bg-primary text-white shadow-[0_0_12px_rgba(255,10,60,0.6)]",
};

const BENEFIT_ICONS: Record<string, any> = {
  default: Check,
  ddos: Shield,
  uptime: Activity,
  backup: Database,
  domain: Globe,
  ssl: Lock,
  speed: Zap,
  cpu: Cpu,
  storage: HardDrive,
};

function getBenefitIcon(benefit: string) {
  const b = benefit.toLowerCase();
  if (b.includes("ddos") || b.includes("proteksi")) return Shield;
  if (b.includes("uptime") || b.includes("aktif")) return Activity;
  if (b.includes("backup")) return Database;
  if (b.includes("domain") || b.includes("subdomain")) return Globe;
  if (b.includes("ssl") || b.includes("secure")) return Lock;
  if (b.includes("speed") || b.includes("cepat")) return Zap;
  if (b.includes("cpu") || b.includes("proses")) return Cpu;
  if (b.includes("disk") || b.includes("storage") || b.includes("gb")) return HardDrive;
  return Check;
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } }
};

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const params = {
    available: true,
    ...(search ? { search } : {}),
  };

  const { data: products, isLoading } = useListProducts(params, {
    query: { queryKey: getListProductsQueryKey(params) }
  });

  const submitInvite = useSubmitInvite();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitInvite = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    if (!screenshot) { toast.error("Upload screenshot terlebih dahulu!"); return; }
    submitInvite.mutate({ data: { screenshotBase64: screenshot } }, {
      onSuccess: () => {
        toast.success("Bukti invite berhasil dikirim! Admin akan memverifikasi.");
        setInviteOpen(false);
        setScreenshot(null);
        setScreenshotName("");
      },
      onError: () => toast.error("Gagal mengirim bukti. Coba lagi."),
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">

        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/10 blur-3xl rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 py-14 relative">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
                <Server className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Panel Pterodactyl</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
                Server Panel<br />
                <span className="text-primary">Terpercaya</span>
              </h1>
              <p className="text-muted-foreground text-base mb-8">
                Kelola game server mu dengan mudah. Panel Pterodactyl siap pakai, stabil, dan dilindungi DDoS.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari panel..."
                  className="pl-11 pr-4 h-12 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl text-base"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Products Section */}
        <div className="container mx-auto px-4 py-10">

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {isLoading ? "Memuat..." : `${products?.length ?? 0} panel tersedia`}
              </span>
            </div>
            <Button
              onClick={() => setInviteOpen(true)}
              variant="outline"
              className="gap-2 border-secondary/30 text-secondary hover:bg-secondary/10 hover:border-secondary/50 text-sm"
            >
              <Gift className="h-4 w-4" />
              Dapatkan Diskon Invite
            </Button>
          </motion.div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : !products?.length ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-28 text-muted-foreground"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                <Server className="h-10 w-10 opacity-30" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Panel tidak ditemukan</h3>
              <p className="text-sm mb-4">Coba kata kunci lain</p>
              {search && (
                <Button variant="ghost" onClick={() => setSearch("")} className="text-primary">
                  Hapus pencarian
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {products.map((product) => {
                const benefits = product.benefits ? product.benefits.split(",").map(b => b.trim()).filter(Boolean) : [];
                const isUnavailable = !product.isActive || product.status !== "ready";
                const discountPct = product.originalPrice && product.originalPrice > product.price
                  ? Math.round((1 - product.price / product.originalPrice) * 100)
                  : 0;

                return (
                  <motion.div key={product.id} variants={cardVariants}>
                    <div className={`relative group h-full rounded-2xl border overflow-hidden transition-all duration-300 ${
                      isUnavailable
                        ? "border-white/5 opacity-60"
                        : "border-white/10 hover:border-primary/40 hover:shadow-[0_0_40px_rgba(255,10,60,0.12)] cursor-pointer"
                    } bg-gradient-to-b from-white/[0.04] to-transparent`}
                      onClick={() => !isUnavailable && setLocation(`/product/${product.id}`)}
                    >
                      {/* Top glow line */}
                      <div className={`absolute top-0 left-0 right-0 h-px transition-opacity duration-300 ${
                        isUnavailable ? "bg-white/5" : "bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100"
                      }`} />

                      {/* Unavailable overlay */}
                      {isUnavailable && (
                        <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                          <Badge className="bg-red-500/80 text-white text-sm px-4 py-1.5">
                            {product.status === "sold_out" ? "Habis" : "Maintenance"}
                          </Badge>
                        </div>
                      )}

                      {/* Badge */}
                      {product.badge && (
                        <div className="absolute top-4 right-4 z-20">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${badgeStyle[product.badge] ?? "bg-primary text-white"}`}>
                            {product.badge === "best seller" ? <><Star className="inline h-3 w-3 mr-0.5" />Best Seller</> : product.badge}
                          </span>
                        </div>
                      )}

                      <div className="p-6 flex flex-col h-full">
                        {/* Server Icon + Name */}
                        <div className="flex items-start gap-4 mb-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            isUnavailable ? "bg-white/5" : "bg-primary/10 group-hover:bg-primary/20 border border-primary/20"
                          }`}>
                            <Server className={`h-6 w-6 ${isUnavailable ? "text-white/20" : "text-primary"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors duration-200 line-clamp-1">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-5">
                          <div className="flex items-end gap-2">
                            {product.originalPrice && product.originalPrice > product.price ? (
                              <>
                                <span className="text-sm text-muted-foreground line-through">
                                  Rp {product.originalPrice.toLocaleString("id-ID")}
                                </span>
                                <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5 font-medium">
                                  Hemat {discountPct}%
                                </span>
                              </>
                            ) : null}
                          </div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-3xl font-black text-white">
                              Rp {product.price.toLocaleString("id-ID")}
                            </span>
                            <span className="text-muted-foreground text-sm">/bln</span>
                          </div>
                        </div>

                        {/* Benefits */}
                        {benefits.length > 0 && (
                          <div className="space-y-2 mb-6 flex-1">
                            {benefits.slice(0, 4).map((b, i) => {
                              const Icon = getBenefitIcon(b);
                              return (
                                <div key={i} className="flex items-center gap-2.5">
                                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 bg-green-500/15">
                                    <Icon className="h-2.5 w-2.5 text-green-400" />
                                  </div>
                                  <span className="text-xs text-muted-foreground leading-snug">{b}</span>
                                </div>
                              );
                            })}
                            {benefits.length > 4 && (
                              <p className="text-xs text-muted-foreground/60 pl-6">+{benefits.length - 4} fitur lainnya</p>
                            )}
                          </div>
                        )}

                        {/* Separator */}
                        <div className="h-px bg-white/5 mb-4" />

                        {/* CTA Button */}
                        <button
                          disabled={isUnavailable}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            isUnavailable
                              ? "bg-white/5 text-white/30 cursor-not-allowed"
                              : "bg-white/5 hover:bg-primary text-white/70 hover:text-white border border-white/10 hover:border-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(255,10,60,0.3)]"
                          }`}
                        >
                          {isUnavailable ? "Tidak Tersedia" : (
                            <>Lihat Detail <ChevronRight className="h-4 w-4" /></>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />

      {/* Invite Dialog */}
      <AnimatePresence>
        {inviteOpen && (
          <Dialog open={inviteOpen} onOpenChange={v => { setInviteOpen(v); if (!v) { setScreenshot(null); setScreenshotName(""); } }}>
            <DialogContent className="bg-card border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-secondary" />
                  Dapatkan Token Diskon
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                  <p className="text-secondary font-semibold text-sm mb-3">Cara Mendapatkan Diskon:</p>
                  <ol className="space-y-2">
                    {[
                      "Ajak teman kamu join grup WhatsApp PteroStore",
                      "Screenshot saat teman berhasil bergabung",
                      "Upload screenshot di sini",
                      "Admin verifikasi & kirim token diskon ke akunmu"
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <span className="w-4 h-4 rounded-full bg-secondary/30 flex items-center justify-center text-secondary font-bold text-[10px] flex-shrink-0 mt-0.5">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div className="space-y-2">
                  <Label>Screenshot Bukti Invite <span className="text-primary">*</span></Label>
                  {screenshot ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img src={screenshot} alt="Preview" className="w-full max-h-48 object-contain rounded-xl border border-white/10" />
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="absolute top-2 right-2 h-7 w-7 bg-background/80"
                          onClick={() => { setScreenshot(null); setScreenshotName(""); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{screenshotName}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/20 hover:border-secondary/50 rounded-xl p-8 flex flex-col items-center gap-3 transition-all cursor-pointer hover:bg-secondary/5"
                    >
                      <Upload className="h-7 w-7 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Klik untuk upload screenshot</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setInviteOpen(false)}>Batal</Button>
                <Button
                  onClick={handleSubmitInvite}
                  disabled={submitInvite.isPending || !screenshot}
                  className="bg-secondary hover:bg-secondary/90 text-white gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {submitInvite.isPending ? "Mengirim..." : "Kirim Bukti"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
