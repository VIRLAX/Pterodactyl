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
  useListBugs, getListBugsQueryKey,
  useUpdateBugStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bug, Eye, CheckCircle, Wrench } from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  fixing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  solved: "bg-green-500/20 text-green-400 border-green-500/30",
};
const statusLabel: Record<string, string> = { pending: "Menunggu", fixing: "Sedang Diperbaiki", solved: "Selesai" };

export default function AdminBugs() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBug, setSelectedBug] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: bugs, isLoading } = useListBugs({
    query: { queryKey: getListBugsQueryKey() }
  });

  const updateBugStatus = useUpdateBugStatus();

  const filtered = bugs?.filter(b => filterStatus === "all" || b.status === filterStatus) ?? [];

  const handleUpdateStatus = () => {
    if (!selectedBug || !newStatus) return;
    updateBugStatus.mutate({ id: selectedBug.id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast.success("Status laporan diperbarui!");
        qc.invalidateQueries({ queryKey: getListBugsQueryKey() });
        setSelectedBug(null);
      },
      onError: () => toast.error("Gagal memperbarui status"),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Laporan Bug</h1>
            <p className="text-muted-foreground text-sm">
              {bugs?.filter(b => b.status === "pending").length ?? 0} laporan menunggu
            </p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-44 bg-card/50 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="fixing">Sedang Diperbaiki</SelectItem>
              <SelectItem value="solved">Selesai</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Bug className="h-12 w-12 mb-3 opacity-30" />
            <p>Tidak ada laporan bug</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bug) => (
              <Card key={bug.id} className="glass-panel border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white text-sm">{bug.title}</h3>
                        <Badge className={statusColor[bug.status] || ""}>{statusLabel[bug.status] ?? bug.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{bug.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{new Date(bug.createdAt).toLocaleString("id-ID")}</span>
                        {bug.screenshotUrl && <span className="text-blue-400">Ada screenshot</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {bug.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-blue-500/20 text-blue-400"
                          title="Tandai sedang diperbaiki"
                          onClick={() => updateBugStatus.mutate({ id: bug.id, data: { status: "fixing" } }, {
                            onSuccess: () => { toast.success("Status diperbarui!"); qc.invalidateQueries({ queryKey: getListBugsQueryKey() }); },
                          })}
                        >
                          <Wrench className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {bug.status === "fixing" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-green-500/20 text-green-400"
                          title="Tandai selesai"
                          onClick={() => updateBugStatus.mutate({ id: bug.id, data: { status: "solved" } }, {
                            onSuccess: () => { toast.success("Bug ditandai selesai!"); qc.invalidateQueries({ queryKey: getListBugsQueryKey() }); },
                          })}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => { setSelectedBug(bug); setNewStatus(bug.status); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBug} onOpenChange={() => setSelectedBug(null)}>
        <DialogContent className="bg-card border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Laporan Bug</DialogTitle>
          </DialogHeader>
          {selectedBug && (
            <div className="space-y-4">
              <div className="bg-background/50 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Judul</p>
                  <p className="font-semibold text-white">{selectedBug.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Deskripsi</p>
                  <p className="text-sm">{selectedBug.description}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusColor[selectedBug.status]}>{statusLabel[selectedBug.status]}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dilaporkan</span>
                  <span>{new Date(selectedBug.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {selectedBug.screenshotUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Screenshot:</p>
                  <img src={selectedBug.screenshotUrl} alt="Screenshot" className="w-full rounded-lg border border-white/10 max-h-64 object-contain" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="fixing">Sedang Diperbaiki</SelectItem>
                    <SelectItem value="solved">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedBug(null)}>Tutup</Button>
            <Button onClick={handleUpdateStatus} disabled={updateBugStatus.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {updateBugStatus.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
