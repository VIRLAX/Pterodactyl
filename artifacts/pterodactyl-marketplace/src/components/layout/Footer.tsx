import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background/50 py-8 backdrop-blur-sm">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <span className="text-lg font-bold neon-text-primary text-primary">PteroStore</span>
          <p className="text-sm text-muted-foreground mt-1">Premium game server hosting marketplace.</p>
        </div>
        <div className="flex space-x-6 text-sm">
          <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">Marketplace</Link>
          <Link href="/report-bug" className="text-muted-foreground hover:text-primary transition-colors">Report Bug</Link>
        </div>
      </div>
    </footer>
  );
}