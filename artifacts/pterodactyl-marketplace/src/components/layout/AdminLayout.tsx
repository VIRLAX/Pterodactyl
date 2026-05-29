import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Ticket,
  UserPlus, MessageSquare, Bug, Settings, LogOut, Menu, X,
  ChevronRight, Bell, Monitor, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetAdminStats } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/products", icon: Package, label: "Produk" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Pesanan", badgeKey: "pendingOrders" },
  { href: "/admin/users", icon: Users, label: "Pengguna" },
  { href: "/admin/discounts", icon: Ticket, label: "Token Diskon" },
  { href: "/admin/invites", icon: UserPlus, label: "Invite", badgeKey: "pendingInvites" },
  { href: "/admin/reviews", icon: MessageSquare, label: "Ulasan" },
  { href: "/admin/bugs", icon: Bug, label: "Bug Report", badgeKey: "pendingBugs" },
  { href: "/admin/sessions", icon: Monitor, label: "Sesi Akun" },
  { href: "/admin/settings", icon: Settings, label: "Pengaturan" },
];

function SidebarContent({ user, location, stats, onLogout }: any) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_12px_rgba(255,10,60,0.2)]">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight block leading-none">PteroStore</span>
            <span className="text-[10px] text-primary/80 font-medium uppercase tracking-widest">Admin Panel</span>
          </div>
        </Link>
      </div>

      {/* User card */}
      <div className="px-3 py-3 border-b border-white/8">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/15"
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(255,10,60,0.3)]">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-card" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.username}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 flex-shrink-0">Admin</Badge>
        </motion.div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <p className="px-3 pb-1 pt-1 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Menu</p>
        {navItems.map((item, idx) => {
          const isActive = item.exact
            ? location === item.href
            : location.startsWith(item.href);
          const badge = item.badgeKey ? (stats as any)?.[item.badgeKey] ?? 0 : 0;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 + idx * 0.03, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={item.href}>
                <div className={`relative flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 group ${
                  isActive
                    ? "bg-primary/15 text-white shadow-[0_0_12px_rgba(255,10,60,0.12)]"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}>
                  {isActive && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(255,10,60,0.6)]"
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? "text-primary" : "group-hover:text-white/80"}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {badge > 0 && (
                      <Badge className="bg-primary text-white text-[10px] h-4 px-1.5 min-w-4 flex items-center justify-center border-0">
                        {badge}
                      </Badge>
                    )}
                    {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/8">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10 gap-3 transition-all duration-200"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: stats } = useGetAdminStats();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Memuat Admin Panel...</p>
        </motion.div>
      </div>
    );
  }

  const totalAlerts = (stats?.pendingOrders ?? 0) + (stats?.pendingInvites ?? 0) + (stats?.pendingBugs ?? 0);
  const currentPage = navItems.find(i =>
    i.exact ? location === i.href : (i.href !== "/admin" && location.startsWith(i.href))
  )?.label ?? "Admin Panel";

  const handleLogout = () => { logout(); setLocation("/"); };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed h-full z-20 border-r border-white/8 bg-gradient-to-b from-card/80 to-background/90 backdrop-blur-xl">
        <SidebarContent user={user} location={location} stats={stats} onLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="lg:hidden fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-card to-background border-r border-white/10 z-40 flex flex-col"
          >
            <div className="absolute top-3 right-3">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent user={user} location={location} stats={stats} onLogout={handleLogout} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 border-b border-white/8 bg-background/80 backdrop-blur-xl flex items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-muted-foreground/50">Admin</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
            <span className="text-sm font-medium text-white">{currentPage}</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <motion.div whileTap={{ scale: 0.92 }}>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white h-9 w-9">
                <Bell className="h-4 w-4" />
                <AnimatePresence>
                  {totalAlerts > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_6px_rgba(255,10,60,0.8)]"
                    />
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white text-xs gap-1.5 h-8 px-3 border border-white/8 hover:border-white/15 transition-colors">
                Lihat Toko
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 p-4 md:p-6 lg:p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
