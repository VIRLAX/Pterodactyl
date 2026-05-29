import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import {
  Monitor, Copy, Check, Trash2, Plus, ChevronDown, ChevronRight,
  Search, Clock, Smartphone, Shield, Infinity,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getApiUrl } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface SessionUser {
  id: number;
  username: string;
  email: string;
  role: string;
  firstSeen: string;
  lastSeen: string;
  userAgent: string | null;
}

interface DeviceSession {
  deviceId: string;
  users: SessionUser[];
  limit: number;
  extraSlots: number;
  lastSeen: string;
}

const DEFAULT_LIMIT = 3;

function useAdminSessions() {
  const { token } = useAuth();
  return useQuery<DeviceSession[]>({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 8000,
  });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getDeviceType(ua: string | null): string {
  if (!ua) return "?";
  if (/mobile|android|iphone/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}

export default function AdminSessions() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data: sessions, isLoading } = useAdminSessions();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extendForm, setExtendForm] = useState<{ deviceId: string; slots: string } | null>(null);
  const [extendLoading, setExtendLoading] = useState(false);
  const [confirmDevice, setConfirmDevice] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<{ deviceId: string; userId: number; username: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Disalin!");
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDeleteDevice() {
    if (!confirmDevice) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/admin/sessions/${encodeURIComponent(confirmDevice)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Semua sesi perangkat dihapus");
      qc.invalidateQueries({ queryKey: ["admin-sessions"] });
      setConfirmDevice(null);
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!confirmUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/admin/sessions/${encodeURIComponent(confirmUser.deviceId)}/user/${confirmUser.userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success(`Sesi ${confirmUser.username} dihapus`);
      qc.invalidateQueries({ queryKey: ["admin-sessions"] });
      setConfirmUser(null);
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleExtend() {
    if (!extendForm) return;
    const slots = parseInt(extendForm.slots);
    if (isNaN(slots) || slots < 0) { toast.error("Angka tidak valid"); return; }
    setExtendLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/admin/sessions/extend-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId: extendForm.deviceId, extraSlots: slots, note: "" }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      toast.success(`Limit diperbarui: ${json.limit} akun`);
      setExtendForm(null);
      qc.invalidateQueries({ queryKey: ["admin-sessions"] });
    } catch {
      toast.error("Gagal memperbarui");
    } finally {
      setExtendLoading(false);
    }
  }

  const filtered = sessions?.filter(s =>
    !search ||
    s.deviceId.toLowerCase().includes(search.toLowerCase()) ||
    s.users.some(u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  ) ?? [];

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Sesi Perangkat</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sessions?.length ?? 0} perangkat • Default: {DEFAULT_LIMIT} akun/perangkat
            </p>
          </div>
          <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-xs gap-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Real-time
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari device ID, username, atau email..."
            className="pl-9 h-9 bg-card/50 border-white/10 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Extend limit form */}
        {extendForm && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Tambah Kuota — <code className="font-mono opacity-70">{extendForm.deviceId.slice(0, 16)}…</code>
            </p>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <p className="text-[11px] text-muted-foreground mb-1">Extra slot (ditambah ke default {DEFAULT_LIMIT})</p>
                <Input
                  type="number" min="0" placeholder="mis: 2"
                  className="h-8 bg-card/50 border-white/10 text-sm"
                  value={extendForm.slots}
                  onChange={e => setExtendForm(f => f ? { ...f, slots: e.target.value } : f)}
                />
              </div>
              {extendForm.slots && !isNaN(parseInt(extendForm.slots)) && (
                <p className="text-xs text-blue-300 pb-1.5">→ Total: <strong>{DEFAULT_LIMIT + parseInt(extendForm.slots)}</strong></p>
              )}
              <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs" onClick={handleExtend} disabled={extendLoading}>
                {extendLoading
                  ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Check className="w-3 h-3" />
                }
                Simpan
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-muted-foreground border border-white/10 text-xs" onClick={() => setExtendForm(null)}>
                Batal
              </Button>
            </div>
          </div>
        )}

        {/* Device list */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Monitor className="h-10 w-10 mb-2 opacity-20" />
            <p className="text-sm">Tidak ada sesi ditemukan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((session) => {
              const isExp = expanded.has(session.deviceId);
              const hasAdmin = session.users.some(u => u.role === "admin");
              const used = session.users.length;
              const lim = session.limit;

              const usageColor = hasAdmin ? "text-yellow-400" :
                used >= lim ? "text-red-400" :
                used >= lim - 1 ? "text-yellow-400" : "text-green-400";

              return (
                <Card key={session.deviceId} className="glass-panel border-white/5">
                  <CardContent className="p-0">
                    {/* Device row */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/3 transition-colors rounded-xl"
                      onClick={() => toggleExpand(session.deviceId)}
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                        {hasAdmin
                          ? <Shield className="w-3.5 h-3.5 text-yellow-400" />
                          : <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <code className="text-xs text-white/50 font-mono truncate max-w-[140px] sm:max-w-[200px]">
                            {session.deviceId}
                          </code>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); copyText(session.deviceId, `dev-${session.deviceId}`); }}
                            className="p-0.5 text-muted-foreground hover:text-white flex-shrink-0"
                          >
                            {copiedId === `dev-${session.deviceId}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs">
                          {hasAdmin ? (
                            <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                              <Infinity className="w-3 h-3" /> Unlimited
                            </span>
                          ) : (
                            <span className={`font-semibold ${usageColor}`}>{used}/{lim}</span>
                          )}
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatDate(session.lastSeen)}
                          </span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-muted-foreground text-xs">{used} akun</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!hasAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 text-xs gap-0.5"
                              onClick={e => { e.stopPropagation(); setExtendForm({ deviceId: session.deviceId, slots: String(session.extraSlots) }); }}
                            >
                              <Plus className="w-3 h-3" /> Kuota
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10"
                              onClick={e => { e.stopPropagation(); setConfirmDevice(session.deviceId); }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {isExp ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Expanded user rows */}
                    {isExp && (
                      <div className="border-t border-white/5">
                        {session.users.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-muted-foreground">Tidak ada akun</div>
                        ) : session.users.map(u => {
                          const isAdminUser = u.role === "admin";
                          return (
                            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/2 border-b border-white/3 last:border-0 transition-colors">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAdminUser ? "bg-yellow-500/20 text-yellow-400" : "bg-primary/20 text-primary"}`}>
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-medium text-white">{u.username}</span>
                                  {isAdminUser && (
                                    <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/25 text-[10px] h-4 px-1.5">Admin</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground ml-0.5">{u.email}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyText(u.email, `email-${u.id}`)}
                                    className="text-muted-foreground hover:text-white"
                                  >
                                    {copiedId === `email-${u.id}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground/60">
                                  <span>{getDeviceType(u.userAgent)}</span>
                                  <span>•</span>
                                  <span>Terakhir: {formatDate(u.lastSeen)}</span>
                                </div>
                              </div>

                              {!isAdminUser && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10 flex-shrink-0"
                                  onClick={() => setConfirmUser({ deviceId: session.deviceId, userId: u.id, username: u.username })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}

                        {session.extraSlots > 0 && !hasAdmin && (
                          <div className="px-4 py-1.5 bg-blue-500/5 border-t border-white/5">
                            <p className="text-[11px] text-blue-400">+{session.extraSlots} slot ekstra • Total: {session.limit} akun</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm delete entire device */}
      <ConfirmDialog
        open={!!confirmDevice}
        title="Hapus semua sesi perangkat?"
        description={`Semua akun yang terdaftar pada perangkat ${confirmDevice?.slice(0, 20)}... akan dihapus dari sistem. Mereka perlu login ulang.`}
        confirmText="Ya, Hapus Perangkat"
        loading={deleteLoading}
        onConfirm={handleDeleteDevice}
        onCancel={() => setConfirmDevice(null)}
      />

      {/* Confirm delete single user session */}
      <ConfirmDialog
        open={!!confirmUser}
        title={`Hapus sesi "${confirmUser?.username}"?`}
        description="Sesi akun ini di perangkat tersebut akan dihapus. User perlu login ulang dari perangkat ini."
        confirmText="Ya, Hapus Sesi"
        loading={deleteLoading}
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmUser(null)}
      />
    </AdminLayout>
  );
}
