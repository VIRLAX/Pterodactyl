import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useGetAdminStats, getGetAdminStatsQueryKey,
  useGetTransactionsChart, getGetTransactionsChartQueryKey
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import {
  Users, ShoppingCart, TrendingUp, Package,
  Clock, CheckCircle, UserPlus, Bug, Star
} from "lucide-react";

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: any; color: string;
}) {
  return (
    <Card className="glass-panel border-white/5 hover:border-white/15 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-white/10 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.name === "Revenue" ? `Rp ${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() }
  });

  const { data: chartData, isLoading: chartLoading } = useGetTransactionsChart({
    query: { queryKey: getGetTransactionsChartQueryKey() }
  });

  const formattedChart = chartData?.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
  })) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Selamat datang kembali di PteroStore Admin</p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse inline-block" />
            Online
          </Badge>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Pengguna" value={stats?.totalUsers ?? 0} icon={Users} color="bg-blue-500/20 text-blue-400" />
              <StatCard title="Total Pesanan" value={stats?.totalOrders ?? 0} sub={`${stats?.pendingOrders ?? 0} menunggu`} icon={ShoppingCart} color="bg-primary/20 text-primary" />
              <StatCard title="Total Produk" value={stats?.totalProducts ?? 0} icon={Package} color="bg-purple-500/20 text-purple-400" />
              <StatCard title="Total Review" value={stats?.totalReviews ?? 0} icon={Star} color="bg-yellow-500/20 text-yellow-400" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Pendapatan Total" value={`Rp ${(stats?.totalRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="bg-green-500/20 text-green-400" />
              <StatCard title="Revenue Hari Ini" value={`Rp ${(stats?.todayRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="bg-primary/20 text-primary" />
              <StatCard title="Invite Pending" value={stats?.pendingInvites ?? 0} icon={UserPlus} color="bg-orange-500/20 text-orange-400" />
              <StatCard title="Bug Pending" value={stats?.pendingBugs ?? 0} icon={Bug} color="bg-red-500/20 text-red-400" />
            </div>
          </>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-panel border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Revenue 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="h-48 bg-white/5 rounded animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={formattedChart}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(350 100% 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(350 100% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#555" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(350 100% 55%)" fill="url(#revenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Pesanan 7 Hari Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="h-48 bg-white/5 rounded animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={formattedChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#555" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="orders" name="Pesanan" fill="hsl(270 100% 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-panel border-white/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <p className="font-semibold text-sm">Pesanan Pending</p>
              </div>
              <p className="text-3xl font-bold text-primary">{stats?.pendingOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Menunggu konfirmasi pembayaran</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <p className="font-semibold text-sm">Pesanan Dikonfirmasi</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{stats?.confirmedOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Berhasil diselesaikan</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-white/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </div>
                <p className="font-semibold text-sm">Revenue Minggu Ini</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">Rp {(stats?.weekRevenue ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">7 hari terakhir</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
