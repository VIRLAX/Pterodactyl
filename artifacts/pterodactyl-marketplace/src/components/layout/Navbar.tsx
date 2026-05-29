import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, ShoppingCart, User as UserIcon, Menu, X,
  LayoutDashboard, Bug, Home, Store, ChevronDown
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/report-bug", label: "Report Bug", icon: Bug },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">PS</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-primary" style={{ textShadow: "0 0 10px hsl(350 100% 55% / 0.5)" }}>
            PteroStore
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-1 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-white hover:bg-white/5 gap-2">
                <link.icon className="h-4 w-4" />
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
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/orders">
                <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-white">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-foreground/70 hover:text-white">
                    <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-20 truncate">{user?.username}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-white/10">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-white">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="cursor-pointer hover:bg-white/5" onClick={() => setLocation("/orders")}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Riwayat Order
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem className="cursor-pointer hover:bg-white/5" onClick={() => setLocation("/admin")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive hover:bg-destructive/10"
                    onClick={() => { logout(); setLocation("/"); }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/login")} className="text-foreground/70 hover:text-white">
                Login
              </Button>
              <Button
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_12px_rgba(255,10,60,0.4)] font-semibold"
                onClick={() => setLocation("/register")}
              >
                Register
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-auto text-foreground/70"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-md px-4 py-4 space-y-2">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground/70">
              <Home className="h-4 w-4" /> Beranda
            </Button>
          </Link>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 text-foreground/70">
                <link.icon className="h-4 w-4" /> {link.label}
              </Button>
            </Link>
          ))}
          <div className="border-t border-white/10 pt-2 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  {user?.role === "admin" && <Badge className="ml-auto bg-primary/20 text-primary text-xs">Admin</Badge>}
                </div>
                <Link href="/orders" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-foreground/70">
                    <ShoppingCart className="h-4 w-4" /> Riwayat Order
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-primary">
                      <LayoutDashboard className="h-4 w-4" /> Admin Panel
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
                  onClick={() => { logout(); setLocation("/"); setMobileOpen(false); }}
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-white/10" onClick={() => { setLocation("/login"); setMobileOpen(false); }}>
                  Login
                </Button>
                <Button className="flex-1 bg-primary text-white" onClick={() => { setLocation("/register"); setMobileOpen(false); }}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
