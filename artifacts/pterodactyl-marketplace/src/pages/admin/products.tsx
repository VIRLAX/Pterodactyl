import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  name: "", slug: "", description: "", detail: "", benefits: "",
  price: 0, originalPrice: 0, category: "RESS", badge: "",
  status: "ready", isActive: true, sortOrder: 0,
  eligibleForInviteDiscount: false,
};

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
      name: p.name, slug: p.slug, description: p.description, detail: p.detail || "",
      benefits: p.benefits, price: p.price, originalPrice: p.originalPrice || 0,
      category: p.category, badge: p.badge || "", status: p.status,
      isActive: p.isActive, sortOrder: p.sortOrder || 0,
      eligibleForInviteDiscount: p.eligibleForInviteDiscount || false,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice) || undefined,
      sortOrder: Number(form.sortOrder),
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
    };
    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, data }, {
        onSuccess: () => {
          toast.success("Produk berhasil diupdate!");
          qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
          setDialogOpen(false);
        },
        onError: () => toast.error("Gagal mengupdate produk"),
      });
    } else {
      createProduct.mutate({ data }, {
        onSuccess: () => {
          toast.success("Produk berhasil ditambahkan!");
          qc.invalidateQueries({ queryKey: getListProductsQueryKey({}) });
          setDialogOpen(false);
        },
        onError: () => toast.error("Gagal menambahkan produk"),
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

  const categories = ["1GB", "2GB", "3GB", "4GB", "5GB", "6GB", "7GB", "8GB", "9GB", "TK", "OWN", "PT", "ADP", "Unlimited", "RESS"];
  const badgeOptions = ["", "popular", "recommended", "best seller", "new", "hot"];
  const statusOptions = ["ready", "sold_out", "maintenance"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Kelola Produk</h1>
            <p className="text-muted-foreground text-sm">{products?.length ?? 0} produk tersedia</p>
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
                <p>Belum ada produk</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nama</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Kategori</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Harga</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Badge</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-white">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.isActive ? "Aktif" : "Nonaktif"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-secondary/20 text-secondary border-secondary/30">{p.category}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">Rp {p.price.toLocaleString()}</p>
                          {p.originalPrice && <p className="text-xs text-muted-foreground line-through">Rp {p.originalPrice.toLocaleString()}</p>}
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
                          ) : <span className="text-muted-foreground text-xs">-</span>}
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
            <DialogTitle>{editProduct ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Nama Produk *</Label>
              <Input className="bg-background/50 border-white/10" value={form.name} onChange={e => f("name", e.target.value)} placeholder="misal: Panel 4GB" />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input className="bg-background/50 border-white/10" value={form.slug} onChange={e => f("slug", e.target.value)} placeholder="panel-4gb" />
            </div>
            <div className="space-y-2">
              <Label>Harga (Rp) *</Label>
              <Input type="number" className="bg-background/50 border-white/10" value={form.price} onChange={e => f("price", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Harga Asli (coret)</Label>
              <Input type="number" className="bg-background/50 border-white/10" value={form.originalPrice} onChange={e => f("originalPrice", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select value={form.category} onValueChange={v => f("category", v)}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={v => f("status", v)}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Badge</Label>
              <Select value={form.badge || "_none"} onValueChange={v => f("badge", v === "_none" ? "" : v)}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue placeholder="Pilih badge..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {badgeOptions.map(b => <SelectItem key={b || "_none"} value={b || "_none"}>{b || "Tidak ada"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urutan (Sort Order)</Label>
              <Input type="number" className="bg-background/50 border-white/10" value={form.sortOrder} onChange={e => f("sortOrder", e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Deskripsi Singkat *</Label>
              <Textarea className="bg-background/50 border-white/10 resize-none" rows={2} value={form.description} onChange={e => f("description", e.target.value)} placeholder="Deskripsi singkat produk..." />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Detail Lengkap</Label>
              <Textarea className="bg-background/50 border-white/10 resize-none" rows={4} value={form.detail} onChange={e => f("detail", e.target.value)} placeholder="Detail teknis, spesifikasi, dll..." />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Benefit (pisahkan dengan koma)</Label>
              <Input className="bg-background/50 border-white/10" value={form.benefits} onChange={e => f("benefits", e.target.value)} placeholder="DDoS Protection, 99.9% Uptime, 24/7 Support" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={v => f("isActive", v)} />
              <Label>Produk Aktif</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.eligibleForInviteDiscount} onCheckedChange={v => f("eligibleForInviteDiscount", v)} />
              <Label>Support Token Invite</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="border-white/10">Batal</Button>
            <Button
              onClick={handleSave}
              disabled={createProduct.isPending || updateProduct.isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {createProduct.isPending || updateProduct.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Produk?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">Tindakan ini tidak bisa dibatalkan. Produk akan dihapus permanen.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
