import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database, Download, RefreshCw, Clock, HardDrive,
  CheckCircle, AlertCircle, Loader2, CalendarDays, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminBackups() {
  const qc = useQueryClient();
  const { token } = useAuth();
  const [creatingBackup, setCreatingBackup] = useState(false);

  const { data: backups = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-backups"],
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/admin/backups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengambil daftar backup");
      return res.json() as Promise<{ filename: string; size: number; createdAt: string }[]>;
    },
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      setCreatingBackup(true);
      const res = await fetch(`${getApiUrl()}/admin/backup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal membuat backup");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Backup berhasil dibuat!");
      qc.invalidateQueries({ queryKey: ["admin-backups"] });
    },
    onError: () => toast.error("Gagal membuat backup"),
    onSettled: () => setCreatingBackup(false),
  });

  const handleDownload = async (filename: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/admin/backups/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download gagal");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal mengunduh backup");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Backup Data</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Backup otomatis setiap 7 hari · Maks 4 file tersimpan
            </p>
          </div>
          <Button
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_15px_rgba(255,10,60,0.3)]"
          >
            {createBackupMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {createBackupMutation.isPending ? "Membuat..." : "Backup Sekarang"}
          </Button>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="glass-panel border-white/8">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold">Format</p>
                </div>
                <p className="text-xl font-bold text-white">JSON</p>
                <p className="text-xs text-muted-foreground mt-1">Semua tabel tanpa password hash</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-panel border-white/8">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-green-400" />
                  </div>
                  <p className="text-sm font-semibold">Jadwal Otomatis</p>
                </div>
                <p className="text-xl font-bold text-white">7 Hari</p>
                <p className="text-xs text-muted-foreground mt-1">Backup berjalan tanpa intervensi</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="glass-panel border-white/8">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                    <HardDrive className="h-4 w-4 text-yellow-400" />
                  </div>
                  <p className="text-sm font-semibold">Tersimpan</p>
                </div>
                <p className="text-xl font-bold text-white">{backups.length} / 4</p>
                <p className="text-xs text-muted-foreground mt-1">File terlama dihapus otomatis</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Backup list */}
        <Card className="glass-panel border-white/8">
          <CardHeader className="border-b border-white/8 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Daftar Backup
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-white"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-muted-foreground">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Database className="h-7 w-7 opacity-30" />
                </div>
                <p className="font-medium text-white">Belum ada backup</p>
                <p className="text-sm mt-1">Klik "Backup Sekarang" untuk membuat backup pertama</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <AnimatePresence>
                  {backups.map((b, idx) => (
                    <motion.div
                      key={b.filename}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-mono font-medium text-white truncate">{b.filename}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {formatDate(b.createdAt)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <HardDrive className="h-3 w-3" /> {formatBytes(b.size)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {idx === 0 && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">Terbaru</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-muted-foreground hover:text-white border border-white/8 hover:border-white/20 h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => handleDownload(b.filename)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Unduh
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <AlertCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300/80">
            <p className="font-medium text-blue-300 mb-0.5">Format Backup</p>
            <p>Backup berisi semua data (users, products, orders, reviews, dll) dalam format JSON. Password hash <strong>tidak disertakan</strong> untuk keamanan. File disimpan di server di folder <code className="bg-white/10 px-1 rounded text-xs">data/backups/</code>.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
