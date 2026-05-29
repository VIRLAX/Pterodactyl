import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  useListProducts, getListProductsQueryKey,
  useCreateProduct, useUpdateProduct, useDeleteProduct
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  name: "", description: "", detail: "", benefits: "",
  price: 0, originalPrice: 0, badge: "",
  status: "ready", isActive: true, sortOrder: 0,
  eligibleForInviteDiscount: false,
};

const badgeOptions = ["", "popular", "recommended", "best seller", "new", "hot"];
const statusOptions = [
  { value: "ready", label: "✅ Ready" },
  { value: "sold_out", label: "❌ Habis" },
  { value: "maintenance", label: "🔧 Maintenance" },
];

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: products, isLoading } = useListProducts({ search }, {
    query: { queryKey: getListProductsQueryKey({ search }) }
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const openCreate = () => {
    setEditProduct(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description,
      detail: p.detail || "",
      benefits: p.benefits || "",
      price: p.price,
      originalPrice: p.originalPrice || 0,
      badge: p.badge || "",
      status: p.status,
      isActive: p.isActive,
      sortOrder: p.sortOrder || 0,
      eligibleForInviteDiscount: p.eligibleForInviteDiscount || false,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Nama produk wajib diisi"); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error("Harga harus lebih dari 0"); return; }

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      detail: form.detail.trim(),
      benefits: form.benefits.trim(),
      price: Number(form.price),
      originalPrice: Number(form.originalPrice) > 0 ? Number(form.originalPrice) : undefined,
      badge: form.badge || null,
      status: form.status,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      eligibleForInviteDiscount: form.eligibleForInviteDiscount,
      category: "panel",
    };

    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, data }, {
        onSuccess: () => {
          toast.success("Produk berhasil diupdate!");
          qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
          setDialogOpen(false);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? "Gagal mengupdate produk";
          toast.error(msg);
        },
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => {
          toast.success("Produk berhasil ditambahkan!");
          qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
          setDialogOpen(false);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? "Gagal menambahkan produk";
          toast.error(msg);
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        toast.success("Produk dihapus!");
        qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
        setDeleteId(null);
      },
      onError: () => toast.error("Gagal menghapus produk"),
    });
  };

  const f = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Kelola Produk</h1>
            <p className="text-muted-foreground text-sm">{products?.length ?? 0} produk terdaftar</p>
          </div>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_10px_rgba(255,10,60,0.3)]">
            <Plus className="h-4 w-4" /> Tambah Produk
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." className="pl-9 bg-card/50 border-white/10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="glass-panel border-white/5">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />)}
              </div>
            ) : !products?.length ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Package className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">Belum ada produk</p>
                <p className="text-xs mt-1">Klik "Tambah Produk" untuk mulai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nama Produk</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Harga</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Badge</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Aktif</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-white">{p.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{p.description || "—"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">Rp {p.price.toLocaleString("id-ID")}</p>
                          {p.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">Rp {p.originalPrice.toLocaleString("id-ID")}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={
                            p.status === "ready" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                            p.status === "sold_out" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                            "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }>
                            {p.status === "ready" ? "Ready" : p.status === "sold_out" ? "Habis" : "Maintenance"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {p.badge ? (
                            <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">{p.badge}</Badge>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${p.isActive ? "text-green-400" : "text-red-400"}`}>
                            {p.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 text-destructive" onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-2">
              <Label>Nama Produk <span className="text-primary">*</span></Label>
              <Input
                className="bg-background/50 border-white/10 focus:border-primary/50"
                value={form.name}
                onChange={e => f("name", e.target.value)}
                placeholder="misal: Panel Pterodactyl 4GB"
              />
            </div>

            <div className="space-y-2">
              <Label>Harga (Rp) <span className="text-primary">*</span></Label>
              <Input
                type="number" min="0"
                className="bg-background/50 border-white/10 focus:border-primary/50"
                value={form.price}
                onChange={e => f("price", e.target.value)}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label>Harga Asli / Coret (Rp)</Label>
              <Input
                type="number" min="0"
                className="bg-background/50 border-white/10"
                value={form.originalPrice || ""}
                onChange={e => f("originalPrice", e.target.value)}
                placeholder="75000 (opsional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => f("status", v)}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Badge / Label</Label>
              <Select value={form.badge || "_none"} onValueChange={v => f("badge", v === "_none" ? "" : v)}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue placeholder="Pilih badge..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="_none">Tidak ada</SelectItem>
                  {badgeOptions.filter(b => b).map(b => (
                    <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urutan Tampil</Label>
              <Input
                type="number" min="0"
                className="bg-background/50 border-white/10"
                value={form.sortOrder}
                onChange={e => f("sortOrder", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Deskripsi Singkat</Label>
              <Textarea
                className="bg-background/50 border-white/10 resize-none"
                rows={2}
                value={form.description}
                onChange={e => f("description", e.target.value)}
                placeholder="Deskripsi singkat yang ditampilkan di card produk..."
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Detail / Spesifikasi Lengkap</Label>
              <Textarea
                className="bg-background/50 border-white/10 resize-none"
                rows={4}
                value={form.detail}
                onChange={e => f("detail", e.target.value)}
                placeholder="Spesifikasi teknis, fitur detail, informasi tambahan..."
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Benefit <span className="text-xs text-muted-foreground">(pisahkan dengan koma)</span></Label>
              <Input
                className="bg-background/50 border-white/10"
                value={form.benefits}
                onChange={e => f("benefits", e.target.value)}
                placeholder="DDoS Protection, 99.9% Uptime, 24/7 Support, Backup Harian"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-white/5">
              <Switch checked={form.isActive} onCheckedChange={v => f("isActive", v)} />
              <div>
                <Label className="cursor-pointer">Produk Aktif</Label>
                <p className="text-xs text-muted-foreground">Tampil di halaman marketplace</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-white/5">
              <Switch checked={form.eligibleForInviteDiscount} onCheckedChange={v => f("eligibleForInviteDiscount", v)} />
              <div>
                <Label className="cursor-pointer">Support Token Invite</Label>
                <p className="text-xs text-muted-foreground">Bisa pakai diskon invite</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="border-white/10">Batal</Button>
            <Button
              onClick={handleSave}
              disabled={createProduct.isPending || updateProduct.isPending}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {createProduct.isPending || updateProduct.isPending ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
              ) : (
                editProduct ? "Simpan Perubahan" : "Tambah Produk"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" /> Hapus Produk?
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">Tindakan ini tidak bisa dibatalkan. Produk akan dihapus permanen dari sistem.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
