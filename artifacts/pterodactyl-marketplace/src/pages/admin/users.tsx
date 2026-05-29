import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getApiUrl } from "@/lib/api";
import { Users, Search, Crown, Trash2, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsers() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; username: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: users, isLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey() }
  });

  const filtered = users?.filter(u =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${getApiUrl()}/admin/users/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Gagal menghapus akun");
        return;
      }
      toast.success(`Akun ${confirmDelete.username} berhasil dihapus`);
      qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
      setConfirmDelete(null);
    } catch {
      toast.error("Gagal menghapus akun");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kelola Pengguna</h1>
          <p className="text-muted-foreground text-sm">{users?.length ?? 0} pengguna terdaftar</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari username atau email..."
            className="pl-9 bg-card/50 border-white/10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Card className="glass-panel border-white/5">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />)}
              </div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-30" />
                <p>Tidak ada pengguna ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Pengguna</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Role</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Total Order</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Total Belanja</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Bergabung</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filtered.map((u, idx) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${u.role === "admin" ? "bg-yellow-500/20 text-yellow-400" : "bg-primary/20 text-primary"}`}>
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-white flex items-center gap-2">
                                  {u.username}
                                  {u.role === "admin" && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
                                </p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={u.role === "admin"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            }>
                              {u.role === "admin" ? "Admin" : "User"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{(u as any).totalOrders ?? 0}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-green-400">Rp {((u as any).totalSpent ?? 0).toLocaleString()}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {u.role === "admin" ? (
                              <div className="flex items-center gap-1.5 text-yellow-500/50">
                                <ShieldOff className="h-3.5 w-3.5" />
                                <span className="text-xs">Dilindungi</span>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                onClick={() => setConfirmDelete({ id: u.id, username: u.username })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Hapus akun "${confirmDelete?.username}"?`}
        description={`Akun ini beserta semua data riwayat pesanannya akan dihapus secara permanen dari sistem. Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Ya, Hapus Akun"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </AdminLayout>
  );
}
