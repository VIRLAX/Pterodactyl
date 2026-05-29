import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  useListDiscounts, getListDiscountsQueryKey,
  useCreateDiscount, useDeleteDiscount
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Ticket, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminDiscounts() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: "", type: "owner", percentOff: 10, expiresAt: "" });

  const { data: discounts, isLoading } = useListDiscounts({
    query: { queryKey: getListDiscountsQueryKey() }
  });

  const createDiscount = useCreateDiscount();
  const deleteDiscount = useDeleteDiscount();

  const handleCreate = () => {
    createDiscount.mutate({
      data: {
        code: form.code || undefined,
        type: form.type,
        percentOff: Number(form.percentOff),
        expiresAt: form.expiresAt || undefined,
      } as any
    }, {
      onSuccess: () => {
        toast.success("Token diskon berhasil dibuat!");
        qc.invalidateQueries({ queryKey: getListDiscountsQueryKey() });
        setDialogOpen(false);
        setForm({ code: "", type: "owner", percentOff: 10, expiresAt: "" });
      },
      onError: () => toast.error("Gagal membuat token diskon"),
    });
  };

  const handleDelete = (id: number) => {
    deleteDiscount.mutate({ id }, {
      onSuccess: () => {
        toast.success("Token dihapus!");
        qc.invalidateQueries({ queryKey: getListDiscountsQueryKey() });
        setDeleteId(null);
      },
      onError: () => toast.error("Gagal menghapus token"),
    });
  };

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Token disalin!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const f = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Token Diskon</h1>
            <p className="text-muted-foreground text-sm">{discounts?.length ?? 0} token tersedia</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_10px_rgba(255,10,60,0.3)]">
            <Plus className="h-4 w-4" /> Generate Token
          </Button>
        </div>

        <Card className="glass-panel border-white/5">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />)}
              </div>
            ) : !discounts?.length ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Ticket className="h-12 w-12 mb-3 opacity-30" />
                <p>Belum ada token diskon</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Kode Token</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipe</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Diskon</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Kadaluarsa</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Digunakan Oleh</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.map((d) => (
                      <tr key={d.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-xs">{d.code}</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(d.id, d.code)}>
                              {copiedId === d.id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={d.type === "invite"
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }>
                            {d.type === "invite" ? "Invite" : "Owner"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-green-400">{d.percentOff}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={d.isUsed
                            ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            : "bg-green-500/20 text-green-400 border-green-500/30"
                          }>
                            {d.isUsed ? "Sudah Dipakai" : "Aktif"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString("id-ID") : "Tidak ada"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {d.usedAt ? new Date(d.usedAt).toLocaleDateString("id-ID") : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 text-destructive" onClick={() => setDeleteId(d.id)}>
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Token Diskon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kode Token (kosongkan untuk auto-generate)</Label>
              <Input className="bg-background/50 border-white/10 font-mono uppercase" value={form.code} onChange={e => f("code", e.target.value.toUpperCase())} placeholder="CONTOH10" />
            </div>
            <div className="space-y-2">
              <Label>Tipe Token</Label>
              <Select value={form.type} onValueChange={v => f("type", v)}>
                <SelectTrigger className="bg-background/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="owner">Owner (Semua produk)</SelectItem>
                  <SelectItem value="invite">Invite (Produk tertentu)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Persentase Diskon (%)</Label>
              <Input type="number" min={1} max={100} className="bg-background/50 border-white/10" value={form.percentOff} onChange={e => f("percentOff", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Kadaluarsa (opsional)</Label>
              <Input type="date" className="bg-background/50 border-white/10" value={form.expiresAt} onChange={e => f("expiresAt", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={createDiscount.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {createDiscount.isPending ? "Membuat..." : "Generate Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-card border-white/10 max-w-sm">
          <DialogHeader><DialogTitle>Hapus Token?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground text-sm">Token ini akan dihapus permanen.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteDiscount.isPending}>
              {deleteDiscount.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
