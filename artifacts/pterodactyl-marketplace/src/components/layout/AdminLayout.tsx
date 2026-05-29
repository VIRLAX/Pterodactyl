import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Package, ShoppingCart, Users, Ticket, UserPlus, MessageSquare, Bug, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/discounts", icon: Ticket, label: "Discounts" },
    { href: "/admin/invites", icon: UserPlus, label: "Invites" },
    { href: "/admin/reviews", icon: MessageSquare, label: "Reviews" },
    { href: "/admin/bugs", icon: Bug, label: "Bugs" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-card/30 backdrop-blur-md flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tighter neon-text-primary text-primary">PteroStore Admin</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                  isActive 
                    ? "bg-primary/20 text-primary neon-border-primary border-l-4" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}>
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Button variant="outline" className="w-full justify-start text-muted-foreground border-white/10 hover:bg-white/5" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 pl-0">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}