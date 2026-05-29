import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, ShoppingCart, User as UserIcon } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold tracking-tighter neon-text-primary text-primary">PteroStore</span>
        </Link>
        <div className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/marketplace" className="transition-colors hover:text-primary text-foreground/80">Marketplace</Link>
          <Link href="/report-bug" className="transition-colors hover:text-primary text-foreground/80">Report Bug</Link>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {user?.role === "admin" && (
                <Button variant="ghost" onClick={() => setLocation("/admin")}>Admin Dashboard</Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setLocation("/orders")}>
                <ShoppingCart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logout()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setLocation("/login")}>Login</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_10px_rgba(255,10,60,0.5)]" onClick={() => setLocation("/register")}>Register</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}