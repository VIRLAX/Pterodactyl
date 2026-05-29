import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useListProducts, getListProductsQueryKey, useSubmitInvite } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Server, Search, Check, Upload, X, Filter, Gift, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const ALL_CATEGORIES = ["Semua", "1GB", "2GB", "3GB", "4GB", "5GB", "6GB", "7GB", "8GB", "9GB", "TK", "OWN", "PT", "ADP", "Unlimited", "RESS"];
const INITIAL_VISIBLE = 7;

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [showAllCats, setShowAllCats] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleCategories = showAllCats ? ALL_CATEGORIES : ALL_CATEGORIES.slice(0, INITIAL_VISIBLE);
  const hiddenCount = ALL_CATEGORIES.length - INITIAL_VISIBLE;

  const params = {
    available: true,
    ...(search ? { search } : {}),
    ...(selectedCategory !== "Semua" ? { category: selectedCategory } : {}),
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
        toast.success("Bukti invite berhasil dikirim! Admin akan memverifikasi dan memberikan token diskon.");
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
      <main className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
          <p className="text-muted-foreground">Temukan panel Pterodactyl yang tepat untuk kebutuhanmu.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-5">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Search className="h-3.5 w-3.5" /> Cari Panel
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nama panel..."
                  className="pl-9 bg-card/50 border-white/10 focus:border-primary/50"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" /> Kategori
              </label>
              <div className="flex flex-wrap lg:flex-col gap-1.5">
                {visibleCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      selectedCategory === cat
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAllCats(p => !p)}
                className="flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary transition-colors px-1 py-1"
              >
                {showAllCats ? (
                  <><ChevronUp className="h-3.5 w-3.5" /> Sembunyikan</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" /> +{hiddenCount} kategori lainnya</>
                )}
              </button>
            </div>

            {/* Invite Promo Box */}
            <div className="p-5 rounded-2xl border border-secondary/30 bg-gradient-to-b from-secondary/10 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-5 w-5 text-secondary" />
                <h3 className="font-bold text-secondary">Invite & Hemat!</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Ajak teman join grup WhatsApp kami, upload screenshot, dan dapatkan token diskon eksklusif!
              </p>
              <div className="space-y-2 mb-4">
                {["Join grup WA kami", "Upload screenshot bukti", "Terima token diskon"].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-[10px]">
                      {i + 1}
                    </div>
                    <span className="text-muted-foreground">{s}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full bg-secondary hover:bg-secondary/90 text-white text-sm gap-2 shadow-[0_0_15px_rgba(150,10,255,0.3)]"
                onClick={() => setInviteOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                Submit Bukti
              </Button>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />)}
              </div>
            ) : !products?.length ? (
              <div className="flex flex-col items-center py-24 text-muted-foreground">
                <Server className="h-14 w-14 mb-4 opacity-30" />
                <h3 className="text-lg font-medium text-white mb-2">Tidak ada produk ditemukan</h3>
                <p className="text-sm">Coba ubah filter pencarian</p>
                <Button variant="ghost" className="mt-4" onClick={() => { setSearch(""); setSelectedCategory("Semua"); }}>
                  Reset Filter
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-muted-foreground">{products.length} panel ditemukan</p>
                  {(search || selectedCategory !== "Semua") && (
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setSearch(""); setSelectedCategory("Semua"); }}>
                      Reset filter
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((product) => (
                    <Card key={product.id} className="glass-panel border-white/10 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,10,60,0.1)] flex flex-col relative overflow-hidden group">
                      {product.badge && (
                        <div className="absolute top-3.5 right-3.5 z-10">
                          <Badge className="bg-primary text-white font-bold text-xs shadow-[0_0_10px_rgba(255,10,60,0.5)] capitalize">
                            {product.badge}
                          </Badge>
                        </div>
                      )}
                      {!product.isActive || product.status !== "ready" ? (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                          <Badge className="bg-red-500/80 text-white text-sm">
                            {product.status === "sold_out" ? "Habis" : "Maintenance"}
                          </Badge>
                        </div>
                      ) : null}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{product.name}</CardTitle>
                        <Badge className="w-fit bg-secondary/15 text-secondary border-secondary/25 text-xs">{product.category}</Badge>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-3">
                        <div>
                          {product.originalPrice ? (
                            <>
                              <span className="text-sm text-muted-foreground line-through mr-2">Rp {product.originalPrice.toLocaleString()}</span>
                              <span className="text-2xl font-bold text-white">Rp {product.price.toLocaleString()}</span>
                              <span className="text-muted-foreground text-sm">/bln</span>
                              <span className="ml-2 text-xs bg-green-500/15 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">
                                Hemat {Math.round((1 - product.price / product.originalPrice) * 100)}%
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl font-bold text-white">Rp {product.price.toLocaleString()}</span>
                              <span className="text-muted-foreground text-sm">/bln</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                        <div className="space-y-1.5">
                          {product.benefits.split(",").slice(0, 3).map((b, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                              <span className="text-muted-foreground">{b.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full text-sm bg-white/5 hover:bg-primary hover:text-white transition-all border border-white/10 hover:border-primary"
                          onClick={() => setLocation(`/product/${product.id}`)}
                          disabled={product.status !== "ready"}
                        >
                          {product.status === "ready" ? "Lihat Detail" : "Tidak Tersedia"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={v => { setInviteOpen(v); if (!v) { setScreenshot(null); setScreenshotName(""); } }}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-secondary" />
              Submit Bukti Invite
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-sm">
              <p className="text-secondary font-semibold mb-2">Cara Mendapatkan Token Diskon:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                <li>Ajak teman kamu masuk ke grup WhatsApp PteroStore</li>
                <li>Ambil screenshot saat teman kamu berhasil bergabung</li>
                <li>Upload screenshot di sini</li>
                <li>Admin akan verifikasi dan kirimkan token diskon ke akunmu</li>
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
                      type="button"
                      variant="ghost"
                      size="icon"
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
                  className="w-full border-2 border-dashed border-white/20 hover:border-secondary/50 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors cursor-pointer"
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
              <Upload className="h-4 w-4" />
              {submitInvite.isPending ? "Mengirim..." : "Kirim Bukti"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
