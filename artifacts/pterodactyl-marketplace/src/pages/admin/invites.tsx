import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  useListInvites, getListInvitesQueryKey,
  useValidateInvite
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus, Check, X, Eye, Copy } from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};
const statusLabel: Record<string, string> = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };

export default function AdminInvites() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedInvite, setSelectedInvite] = useState<any>(null);

  const { data: invites, isLoading } = useListInvites({
    query: { queryKey: getListInvitesQueryKey() }
  });

  const validateInvite = useValidateInvite();

  const filtered = invites?.filter(i => filterStatus === "all" || i.status === filterStatus) ?? [];

  const handleApprove = (id: number) => {
    validateInvite.mutate({ id }, {
      onSuccess: (data) => {
        toast.success(`Invite disetujui! Token: ${(data as any).generatedToken}`);
        qc.invalidateQueries({ queryKey: getListInvitesQueryKey() });
        setSelectedInvite(null);
      },
      onError: () => toast.error("Gagal menyetujui invite"),
    });
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token disalin!");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Kelola Invite</h1>
            <p className="text-muted-foreground text-sm">
              {invites?.filter(i => i.status === "pending").length ?? 0} menunggu persetujuan
            </p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-card/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="glass-panel border-white/5">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />)}
              </div>
            ) : !filtered.length ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <UserPlus className="h-12 w-12 mb-3 opacity-30" />
                <p>Tidak ada permintaan invite</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Pengguna</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Token</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tanggal</th>
                      <th className="text-right px-4 py-3 text-muted-foreground font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((invite) => (
                      <tr key={invite.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">
                              {(invite as any).user?.username?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <p className="font-medium text-white">{(invite as any).user?.username ?? "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{(invite as any).user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusColor[invite.status] || ""}>{statusLabel[invite.status] ?? invite.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {invite.generatedToken ? (
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-xs">{invite.generatedToken}</code>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToken(invite.generatedToken!)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : <span className="text-muted-foreground text-xs">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground">{new Date(invite.createdAt).toLocaleDateString("id-ID")}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setSelectedInvite(invite)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {invite.status === "pending" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-500/20 text-green-400" onClick={() => handleApprove(invite.id)}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
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

      {/* Screenshot viewer dialog */}
      <Dialog open={!!selectedInvite} onOpenChange={() => setSelectedInvite(null)}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Invite</DialogTitle>
          </DialogHeader>
          {selectedInvite && (
            <div className="space-y-4">
              <div className="bg-background/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">{(selectedInvite as any).user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{(selectedInvite as any).user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusColor[selectedInvite.status]}>{statusLabel[selectedInvite.status]}</Badge>
                </div>
                {selectedInvite.generatedToken && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Token</span>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-xs">{selectedInvite.generatedToken}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToken(selectedInvite.generatedToken)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal</span>
                  <span>{new Date(selectedInvite.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {selectedInvite.screenshotUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Bukti Screenshot:</p>
                  <img src={selectedInvite.screenshotUrl} alt="Screenshot" className="w-full rounded-lg border border-white/10 max-h-72 object-contain" />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedInvite?.status === "pending" && (
              <Button
                onClick={() => handleApprove(selectedInvite.id)}
                disabled={validateInvite.isPending}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Check className="h-4 w-4" />
                {validateInvite.isPending ? "Memproses..." : "Setujui & Generate Token"}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setSelectedInvite(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
