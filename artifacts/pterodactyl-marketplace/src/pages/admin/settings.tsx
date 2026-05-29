import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  useGetSettings, getGetSettingsQueryKey,
  useUpdateSettings,
  useListFaqs, getListFaqsQueryKey,
  useCreateFaq, useUpdateFaq, useDeleteFaq
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const qc = useQueryClient();
  const [faqDialog, setFaqDialog] = useState<{ mode: "create" | "edit"; faq?: any } | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", sortOrder: 0 });
  const [settingsForm, setSettingsForm] = useState<any>({});

  const { data: settings, isLoading: settingsLoading } = useGetSettings({
    query: { queryKey: getGetSettingsQueryKey() }
  });
  const { data: faqs, isLoading: faqsLoading } = useListFaqs({
    query: { queryKey: getListFaqsQueryKey() }
  });

  const updateSettings = useUpdateSettings();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  useEffect(() => {
    if (settings) setSettingsForm({ ...settings });
  }, [settings]);

  const sf = (field: string, val: any) => setSettingsForm((p: any) => ({ ...p, [field]: val }));

  const handleSaveSettings = () => {
    const { id, createdAt, updatedAt, ...data } = settingsForm;
    updateSettings.mutate({ data }, {
      onSuccess: () => {
        toast.success("Pengaturan berhasil disimpan!");
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: () => toast.error("Gagal menyimpan pengaturan"),
    });
  };

  const handleSaveFaq = () => {
    if (faqDialog?.mode === "create") {
      createFaq.mutate({ data: { question: faqForm.question, answer: faqForm.answer, sortOrder: Number(faqForm.sortOrder) } }, {
        onSuccess: () => { toast.success("FAQ ditambahkan!"); qc.invalidateQueries({ queryKey: getListFaqsQueryKey() }); setFaqDialog(null); },
        onError: () => toast.error("Gagal menambah FAQ"),
      });
    } else if (faqDialog?.mode === "edit" && faqDialog.faq) {
      updateFaq.mutate({ id: faqDialog.faq.id, data: { question: faqForm.question, answer: faqForm.answer, sortOrder: Number(faqForm.sortOrder) } }, {
        onSuccess: () => { toast.success("FAQ diupdate!"); qc.invalidateQueries({ queryKey: getListFaqsQueryKey() }); setFaqDialog(null); },
        onError: () => toast.error("Gagal mengupdate FAQ"),
      });
    }
  };

  const handleDeleteFaq = (id: number) => {
    if (!confirm("Hapus FAQ ini?")) return;
    deleteFaq.mutate({ id }, {
      onSuccess: () => { toast.success("FAQ dihapus!"); qc.invalidateQueries({ queryKey: getListFaqsQueryKey() }); },
      onError: () => toast.error("Gagal menghapus FAQ"),
    });
  };

  const openFaqCreate = () => { setFaqForm({ question: "", answer: "", sortOrder: 0 }); setFaqDialog({ mode: "create" }); };
  const openFaqEdit = (faq: any) => { setFaqForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder }); setFaqDialog({ mode: "edit", faq }); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pengaturan Situs</h1>
          <p className="text-muted-foreground text-sm">Kelola konfigurasi PteroStore</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="bg-card/50 border border-white/10">
            <TabsTrigger value="general" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Umum</TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Pembayaran</TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Kontak</TabsTrigger>
            <TabsTrigger value="faqs" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">FAQ</TabsTrigger>
          </TabsList>

          {settingsLoading ? (
            <div className="h-64 bg-white/5 rounded-xl animate-pulse mt-4" />
          ) : (
            <>
              <TabsContent value="general" className="mt-4">
                <Card className="glass-panel border-white/5">
                  <CardHeader><CardTitle className="text-base">Pengaturan Umum</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Situs</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.siteName || ""} onChange={e => sf("siteName", e.target.value)} placeholder="PteroStore" />
                      </div>
                      <div className="space-y-2">
                        <Label>Tagline</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.tagline || ""} onChange={e => sf("tagline", e.target.value)} />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>Deskripsi</Label>
                        <Textarea className="bg-background/50 border-white/10 resize-none" rows={3} value={settingsForm.description || ""} onChange={e => sf("description", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Link WhatsApp</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.whatsappLink || ""} onChange={e => sf("whatsappLink", e.target.value)} placeholder="https://wa.me/62..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Link Discord</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.discordLink || ""} onChange={e => sf("discordLink", e.target.value)} placeholder="https://discord.gg/..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Link TikTok</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.tiktokLink || ""} onChange={e => sf("tiktokLink", e.target.value)} placeholder="https://tiktok.com/@..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Link Instagram</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.instagramLink || ""} onChange={e => sf("instagramLink", e.target.value)} placeholder="https://instagram.com/..." />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Switch checked={!!settingsForm.maintenanceMode} onCheckedChange={v => sf("maintenanceMode", v)} />
                      <div>
                        <Label>Mode Maintenance</Label>
                        <p className="text-xs text-muted-foreground">Saat aktif, toko tidak dapat diakses pengunjung biasa</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payment" className="mt-4">
                <Card className="glass-panel border-white/5">
                  <CardHeader><CardTitle className="text-base">Pengaturan Pembayaran</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nomor Dana</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.danaNumber || ""} onChange={e => sf("danaNumber", e.target.value)} placeholder="08xxxxxxxxxx" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nama Pemilik Dana</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.danaName || ""} onChange={e => sf("danaName", e.target.value)} placeholder="Nama pemilik rekening" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>QRIS URL/Data (gambar atau string)</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.qrisData || settingsForm.qrisImageUrl || ""} onChange={e => sf("qrisImageUrl", e.target.value)} placeholder="URL gambar QRIS atau data string..." />
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex items-start gap-4 p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
                        <div className="flex-1 space-y-2">
                          <Label className="text-secondary font-semibold">Diskon Token Invite (%)</Label>
                          <p className="text-xs text-muted-foreground">Persentase diskon yang diberikan kepada user yang menggunakan token dari program invite. Contoh: 10 = diskon 10%</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              className="bg-background/50 border-white/10 w-32"
                              value={settingsForm.inviteDiscountPercent ?? 10}
                              onChange={e => sf("inviteDiscountPercent", Number(e.target.value))}
                            />
                            <span className="text-muted-foreground text-sm">% diskon untuk pemegang token invite</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="mt-4">
                <Card className="glass-panel border-white/5">
                  <CardHeader><CardTitle className="text-base">Info Kontak</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Support</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.supportEmail || ""} onChange={e => sf("supportEmail", e.target.value)} placeholder="support@pterostore.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Jam Operasional</Label>
                        <Input className="bg-background/50 border-white/10" value={settingsForm.operatingHours || ""} onChange={e => sf("operatingHours", e.target.value)} placeholder="08.00 - 22.00 WIB" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label>Pesan Selamat Datang</Label>
                        <Textarea className="bg-background/50 border-white/10 resize-none" rows={3} value={settingsForm.welcomeMessage || ""} onChange={e => sf("welcomeMessage", e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="faqs" className="mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold">Kelola FAQ</h3>
                    <Button onClick={openFaqCreate} size="sm" className="bg-primary hover:bg-primary/90 text-white gap-2">
                      <Plus className="h-4 w-4" /> Tambah FAQ
                    </Button>
                  </div>
                  {faqsLoading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
                  ) : !faqs?.length ? (
                    <div className="flex flex-col items-center py-12 text-muted-foreground">
                      <HelpCircle className="h-10 w-10 mb-3 opacity-30" />
                      <p>Belum ada FAQ</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {faqs.map((faq) => (
                        <Card key={faq.id} className="glass-panel border-white/5">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-white text-sm mb-1">{faq.question}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" onClick={() => openFaqEdit(faq)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/20 text-destructive" onClick={() => handleDeleteFaq(faq.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Save button (not shown for FAQ tab) */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={updateSettings.isPending} className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_10px_rgba(255,10,60,0.3)]">
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </div>

      {/* FAQ Dialog */}
      <Dialog open={!!faqDialog} onOpenChange={() => setFaqDialog(null)}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>{faqDialog?.mode === "create" ? "Tambah FAQ" : "Edit FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Pertanyaan</Label>
              <Input className="bg-background/50 border-white/10" value={faqForm.question} onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Jawaban</Label>
              <Textarea className="bg-background/50 border-white/10 resize-none" rows={4} value={faqForm.answer} onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" className="bg-background/50 border-white/10" value={faqForm.sortOrder} onChange={e => setFaqForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFaqDialog(null)}>Batal</Button>
            <Button onClick={handleSaveFaq} disabled={createFaq.isPending || updateFaq.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {createFaq.isPending || updateFaq.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
