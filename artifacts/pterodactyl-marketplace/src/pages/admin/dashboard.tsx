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
  Clock, CheckCircle, UserPlus, Bug, Star, Zap, Radio
} from "lucide-react";
import { motion } from "framer-motion";
import { useAdminSSE } from "@/hooks/use-sse";
import { useAuth } from "@/hooks/use-auth";

function StatCard({ title, value, sub, icon: Icon, color, delay = 0 }: {
  title: string; value: string | number; sub?: string;
  icon: any; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="glass-panel border-white/8 hover:border-white/20 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(255,255,255,0.04)]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-white/10 rounded-xl p-3 text-sm shadow-2xl">
        <p className="text-muted-foreground mb-2 text-xs">{label}</p>
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
  const { token } = useAuth();
  useAdminSSE(token ?? undefined);

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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Selamat datang kembali di PteroStore Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/15 text-primary border-primary/25 gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" />
              Live
            </Badge>
            <Badge className="bg-green-500/15 text-green-400 border-green-500/25 gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
              Online
            </Badge>
          </div>
        </motion.div>

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
              <StatCard title="Total Pengguna" value={stats?.totalUsers ?? 0} icon={Users} color="bg-blue-500/20 text-blue-400" delay={0} />
              <StatCard title="Total Pesanan" value={stats?.totalOrders ?? 0} sub={`${stats?.pendingOrders ?? 0} menunggu`} icon={ShoppingCart} color="bg-primary/20 text-primary" delay={0.05} />
              <StatCard title="Total Produk" value={stats?.totalProducts ?? 0} icon={Package} color="bg-purple-500/20 text-purple-400" delay={0.1} />
              <StatCard title="Total Review" value={stats?.totalReviews ?? 0} icon={Star} color="bg-yellow-500/20 text-yellow-400" delay={0.15} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Pendapatan Total" value={`Rp ${(stats?.totalRevenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="bg-green-500/20 text-green-400" delay={0.2} />
              <StatCard title="Revenue Hari Ini" value={`Rp ${(stats?.todayRevenue ?? 0).toLocaleString()}`} icon={Zap} color="bg-primary/20 text-primary" delay={0.25} />
              <StatCard title="Invite Pending" value={stats?.pendingInvites ?? 0} icon={UserPlus} color="bg-orange-500/20 text-orange-400" delay={0.3} />
              <StatCard title="Bug Pending" value={stats?.pendingBugs ?? 0} icon={Bug} color="bg-red-500/20 text-red-400" delay={0.35} />
            </div>
          </>
        )}

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card className="glass-panel border-white/8">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Revenue 7 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={formattedChart}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(350 100% 55%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(350 100% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="#444" tick={{ fontSize: 11, fill: "#666" }} />
                    <YAxis stroke="#444" tick={{ fontSize: 11, fill: "#666" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(350 100% 55%)" fill="url(#revenueGrad)" strokeWidth={2.5} dot={{ fill: "hsl(350 100% 55%)", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/8">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-purple-400" />
                Pesanan 7 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={formattedChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="#444" tick={{ fontSize: 11, fill: "#666" }} />
                    <YAxis stroke="#444" tick={{ fontSize: 11, fill: "#666" }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="orders" name="Pesanan" fill="hsl(270 100% 65%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="glass-panel border-white/8 hover:border-primary/20 transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <p className="font-semibold text-sm">Pesanan Pending</p>
              </div>
              <p className="text-3xl font-bold text-primary">{stats?.pendingOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Menunggu konfirmasi pembayaran</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/8 hover:border-green-500/20 transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center group-hover:bg-green-500/25 transition-colors">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <p className="font-semibold text-sm">Dikonfirmasi</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{stats?.confirmedOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Berhasil diselesaikan</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/8 hover:border-purple-500/20 transition-all group">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center group-hover:bg-purple-500/25 transition-colors">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </div>
                <p className="font-semibold text-sm">Revenue Minggu Ini</p>
              </div>
              <p className="text-2xl font-bold text-purple-400">Rp {(stats?.weekRevenue ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">7 hari terakhir</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
