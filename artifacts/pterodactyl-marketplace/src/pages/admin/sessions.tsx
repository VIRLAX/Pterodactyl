import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Monitor, Copy, Check, Trash2, Plus, ChevronDown, ChevronRight,
  Search, User, Shield, Clock, Smartphone,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getApiUrl } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

function useAdminSessions() {
  const { token } = useAuth();
  return useQuery<DeviceSession[]>({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    refetchInterval: 10000,
  });
}

export default function AdminSessions() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { data: sessions, isLoading } = useAdminSessions();
  const [search, setSearch] = useState("");
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extendForm, setExtendForm] = useState<{ deviceId: string; slots: string; note: string } | null>(null);
  const [extendLoading, setExtendLoading] = useState(false);

  const DEFAULT_LIMIT = 3;

  const toggleExpand = (deviceId: string) => {
    setExpandedDevices(prev => {
      const next = new Set(prev);
      next.has(deviceId) ? next.delete(deviceId) : next.add(deviceId);
      return next;
    });
  };

  function copyDeviceId(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deleteDeviceSession(deviceId: string) {
    if (!confirm("Hapus semua sesi untuk perangkat ini?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/admin/sessions/${encodeURIComponent(deviceId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Sesi perangkat dihapus");
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    } catch {
      toast.error("Gagal menghapus sesi");
    }
  }

  async function deleteUserSession(deviceId: string, userId: number) {
    if (!confirm("Hapus sesi user ini dari perangkat?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/admin/sessions/${encodeURIComponent(deviceId)}/user/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success("Sesi user dihapus");
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    } catch {
      toast.error("Gagal menghapus sesi");
    }
  }

  async function handleExtendLimit() {
    if (!extendForm) return;
    const slots = parseInt(extendForm.slots);
    if (isNaN(slots) || slots < 0) {
      toast.error("Jumlah slot harus angka positif");
      return;
    }
    setExtendLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/admin/sessions/extend-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deviceId: extendForm.deviceId, extraSlots: slots, note: extendForm.note }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      toast.success(`Limit diperbarui: ${json.limit} akun untuk perangkat ini`);
      setExtendForm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    } catch {
      toast.error("Gagal memperbarui limit");
    } finally {
      setExtendLoading(false);
    }
  }

  const filtered = sessions?.filter(s =>
    !search ||
    s.deviceId.toLowerCase().includes(search.toLowerCase()) ||
    s.users.some(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function getDeviceType(ua: string | null): string {
    if (!ua) return "Unknown";
    if (/mobile|android|iphone|ipad/i.test(ua)) return "Mobile";
    if (/tablet/i.test(ua)) return "Tablet";
    return "Desktop";
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Sesi Perangkat</h1>
            <p className="text-muted-foreground text-sm">
              {sessions?.length ?? 0} perangkat terdaftar • Batas default: {DEFAULT_LIMIT} akun/perangkat
            </p>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Real-time</Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari device ID, username, atau email..."
            className="pl-9 bg-card/50 border-white/10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {extendForm && (
          <Card className="glass-panel border border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tambah Kuota Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Device ID</p>
                <code className="text-xs text-white/70 break-all bg-white/5 rounded-lg px-3 py-2 block">{extendForm.deviceId}</code>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1.5">Extra Slot (tambahan dari default {DEFAULT_LIMIT})</p>
                  <Input
                    type="number"
                    min="0"
                    placeholder="mis: 2"
                    className="bg-card/50 border-white/10 text-sm"
                    value={extendForm.slots}
                    onChange={e => setExtendForm(f => f ? { ...f, slots: e.target.value } : f)}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1.5">Catatan (opsional)</p>
                  <Input
                    placeholder="mis: permintaan user X"
                    className="bg-card/50 border-white/10 text-sm"
                    value={extendForm.note}
                    onChange={e => setExtendForm(f => f ? { ...f, note: e.target.value } : f)}
                  />
                </div>
              </div>
              {extendForm.slots && !isNaN(parseInt(extendForm.slots)) && (
                <p className="text-xs text-blue-400">
                  Total limit baru: <strong className="text-white">{DEFAULT_LIMIT + parseInt(extendForm.slots)} akun</strong>
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5"
                  onClick={handleExtendLimit}
                  disabled={extendLoading}
                >
                  {extendLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Simpan
                </Button>
                <Button size="sm" variant="ghost" className="text-muted-foreground border border-white/10" onClick={() => setExtendForm(null)}>
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : !filtered.length ? (
          <Card className="glass-panel border-white/5">
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <Monitor className="h-12 w-12 mb-3 opacity-30" />
              <p>Tidak ada sesi perangkat ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((session) => {
              const isExpanded = expandedDevices.has(session.deviceId);
              const usageColor = session.users.length >= session.limit
                ? "text-red-400"
                : session.users.length >= session.limit - 1
                ? "text-yellow-400"
                : "text-green-400";

              return (
                <Card key={session.deviceId} className="glass-panel border-white/5">
                  <CardContent className="p-0">
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/3 transition-colors rounded-t-xl"
                      onClick={() => toggleExpand(session.deviceId)}
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <code className="text-xs text-white/60 font-mono truncate max-w-[180px]">{session.deviceId}</code>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); copyDeviceId(session.deviceId); }}
                            className="p-0.5 rounded text-muted-foreground hover:text-white transition-colors"
                          >
                            {copiedId === session.deviceId ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className={`font-semibold ${usageColor}`}>{session.users.length}/{session.limit} akun</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(session.lastSeen)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 text-xs h-7 px-2 gap-1"
                          onClick={e => { e.stopPropagation(); setExtendForm({ deviceId: session.deviceId, slots: String(session.extraSlots), note: "" }); }}
                        >
                          <Plus className="w-3 h-3" /> Kuota
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); deleteDeviceSession(session.deviceId); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/5 divide-y divide-white/5">
                        {session.users.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-muted-foreground">Tidak ada akun terhubung</div>
                        ) : session.users.map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{u.username}</span>
                                {u.role === "admin" && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] h-4 px-1">Admin</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">{u.email}</span>
                                <button
                                  type="button"
                                  onClick={() => { navigator.clipboard.writeText(u.email); toast.success("Email disalin"); }}
                                  className="p-0.5 rounded text-muted-foreground hover:text-white"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground/60 mt-0.5">
                                Pertama: {formatDate(u.firstSeen)} • Terakhir: {formatDate(u.lastSeen)}
                              </p>
                              {u.userAgent && (
                                <p className="text-xs text-muted-foreground/40 truncate max-w-xs">{getDeviceType(u.userAgent)} · {u.userAgent.slice(0, 60)}…</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10 h-7 w-7 p-0 flex-shrink-0"
                              onClick={() => deleteUserSession(session.deviceId, u.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}

                        {session.extraSlots > 0 && (
                          <div className="px-4 py-2 bg-blue-500/5">
                            <p className="text-xs text-blue-400">
                              Kuota tambahan: +{session.extraSlots} slot (total {session.limit} akun/perangkat)
                            </p>
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
    </AdminLayout>
  );
}
