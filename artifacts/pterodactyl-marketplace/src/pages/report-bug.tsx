import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSubmitBug } from "@workspace/api-client-react";
import { Bug, Upload, CheckCircle, X, Image } from "lucide-react";
import { toast } from "sonner";

export default function ReportBug() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitBug = useSubmitBug();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Judul dan deskripsi wajib diisi!");
      return;
    }

    submitBug.mutate({
      data: {
        title: form.title.trim(),
        description: form.description.trim(),
        screenshotBase64: screenshot || undefined,
      } as any
    }, {
      onSuccess: () => {
        setSubmitted(true);
        toast.success("Laporan bug berhasil dikirim!");
      },
      onError: () => toast.error("Gagal mengirim laporan. Coba lagi."),
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="glass-panel max-w-md w-full border-green-500/30">
            <CardContent className="p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Laporan Terkirim!</h2>
              <p className="text-muted-foreground text-sm">
                Terima kasih sudah melaporkan. Tim kami akan segera meninjau dan memperbaiki masalah ini.
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => { setSubmitted(false); setForm({ title: "", description: "" }); setScreenshot(null); }}
              >
                Kirim Laporan Lain
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
              <Bug className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Laporkan Bug</h1>
            <p className="text-muted-foreground">
              Temukan masalah? Bantu kami memperbaikinya dengan melaporkan bug yang kamu temukan.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Laporan Diterima", desc: "Laporan kamu langsung masuk ke dashboard admin" },
              { label: "Ditinjau Cepat", desc: "Tim kami meninjau dalam 1x24 jam" },
              { label: "Notifikasi Update", desc: "Kamu akan diberitahu saat bug diperbaiki" },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 bg-white/3 rounded-xl border border-white/5">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-xs font-semibold text-white mb-1">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bug className="h-4 w-4 text-primary" /> Form Laporan Bug
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Bug <span className="text-primary">*</span></Label>
                  <Input
                    id="title"
                    className="bg-background/50 border-white/10 focus:border-primary/50"
                    placeholder="Singkat dan jelas, misal: Tombol checkout tidak merespons"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground text-right">{form.title.length}/100</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc">Deskripsi Lengkap <span className="text-primary">*</span></Label>
                  <Textarea
                    id="desc"
                    className="bg-background/50 border-white/10 focus:border-primary/50 resize-none"
                    rows={5}
                    placeholder={`Jelaskan masalah secara detail:\n• Apa yang terjadi?\n• Langkah-langkah untuk mereproduksi\n• Apa yang seharusnya terjadi?`}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Screenshot (opsional)</Label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                  {screenshot ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img src={screenshot} alt="Screenshot" className="w-full max-h-48 object-contain rounded-xl border border-white/10" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 bg-background/80 hover:bg-background"
                          onClick={() => { setScreenshot(null); setScreenshotName(""); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{screenshotName}</span>
                        <Button type="button" variant="link" className="text-xs p-0 h-auto text-primary" onClick={() => fileRef.current?.click()}>
                          Ganti
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/15 hover:border-primary/40 rounded-xl p-8 flex flex-col items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Klik untuk upload screenshot</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WebP</p>
                      </div>
                    </button>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
                  <span className="text-yellow-400 text-lg">💡</span>
                  <p className="text-xs text-yellow-300/80">
                    Semakin detail laporanmu, semakin cepat bug bisa diperbaiki. Sertakan langkah-langkah untuk mereproduksi masalah dan screenshot jika memungkinkan.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold gap-2 shadow-[0_0_15px_rgba(255,10,60,0.3)]"
                  disabled={submitBug.isPending || !form.title.trim() || !form.description.trim()}
                >
                  <Bug className="h-4 w-4" />
                  {submitBug.isPending ? "Mengirim Laporan..." : "Kirim Laporan Bug"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
