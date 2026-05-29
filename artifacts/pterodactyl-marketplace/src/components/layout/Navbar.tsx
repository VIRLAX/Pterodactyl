import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, ShoppingCart, Menu, X,
  LayoutDashboard, Bug, Home, Store, ChevronDown, Zap
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/report-bug", label: "Report Bug", icon: Bug },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/8 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_10px_rgba(255,10,60,0.2)]"
          >
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="text-lg font-bold tracking-tight text-white" style={{ textShadow: "0 0 20px hsl(350 100% 55% / 0.4)" }}>
            Ptero<span className="text-primary">Store</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-0.5 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white hover:bg-white/6 gap-2 rounded-xl transition-all">
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Desktop right actions */}
        <div className="ml-auto hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {user?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 gap-2 rounded-xl border border-primary/20 hover:border-primary/40 transition-all text-xs">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <motion.div whileTap={{ scale: 0.92 }}>
                <Link href="/orders">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white h-9 w-9 rounded-xl hover:bg-white/6">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white rounded-xl hover:bg-white/6 h-9 px-3 transition-all">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_8px_rgba(255,10,60,0.3)]">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-24 truncate text-sm">{user?.username}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold text-white">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {user?.role === "admin" && (
                      <Badge className="mt-1.5 bg-primary/20 text-primary border-primary/30 text-[10px]">Admin</Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator className="bg-white/8" />
                  <DropdownMenuItem className="cursor-pointer hover:bg-white/6 rounded-lg mx-1 gap-2.5" onClick={() => setLocation("/orders")}>
                    <ShoppingCart className="h-4 w-4" />
                    Riwayat Order
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/6 rounded-lg mx-1 gap-2.5" onClick={() => setLocation("/admin")}>
                      <LayoutDashboard className="h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/8" />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 hover:bg-red-500/10 rounded-lg mx-1 mb-1 gap-2.5"
                    onClick={() => { logout(); setLocation("/"); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/login")} className="text-muted-foreground hover:text-white rounded-xl hover:bg-white/6">
                Login
              </Button>
              <Button
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(255,10,60,0.4)] hover:shadow-[0_0_20px_rgba(255,10,60,0.6)] font-semibold rounded-xl transition-all"
                onClick={() => setLocation("/register")}
              >
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="md:hidden ml-auto text-muted-foreground hover:text-white p-2 rounded-xl hover:bg-white/6 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Menu className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-white/8 bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1.5">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-white rounded-xl hover:bg-white/6">
                  <Home className="h-4 w-4" /> Beranda
                </Button>
              </Link>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-white rounded-xl hover:bg-white/6">
                    <link.icon className="h-4 w-4" /> {link.label}
                  </Button>
                </Link>
              ))}
              <div className="border-t border-white/8 pt-3 mt-2 space-y-1.5">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/15 mb-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_8px_rgba(255,10,60,0.3)]">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      {user?.role === "admin" && <Badge className="ml-auto bg-primary/20 text-primary border-primary/30 text-[10px]">Admin</Badge>}
                    </div>
                    <Link href="/orders" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-white rounded-xl hover:bg-white/6">
                        <ShoppingCart className="h-4 w-4" /> Riwayat Order
                      </Button>
                    </Link>
                    {user?.role === "admin" && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-primary hover:text-primary rounded-xl hover:bg-primary/10">
                          <LayoutDashboard className="h-4 w-4" /> Admin Panel
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-red-400 hover:bg-red-500/10 rounded-xl"
                      onClick={() => { logout(); setLocation("/"); setMobileOpen(false); }}
                    >
                      <LogOut className="h-4 w-4" /> Keluar
                    </Button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 border-white/10 rounded-xl hover:border-white/20" onClick={() => { setLocation("/login"); setMobileOpen(false); }}>
                      Login
                    </Button>
                    <Button className="flex-1 bg-primary text-white shadow-[0_0_12px_rgba(255,10,60,0.4)] rounded-xl" onClick={() => { setLocation("/register"); setMobileOpen(false); }}>
                      Register
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
