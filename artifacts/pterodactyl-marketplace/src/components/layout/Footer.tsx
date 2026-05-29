import { Link } from "wouter";
import { MessageCircle, ExternalLink } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-card/30 backdrop-blur-md">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">PS</span>
              </div>
              <span className="text-lg font-bold text-primary" style={{ textShadow: "0 0 10px hsl(350 100% 55% / 0.4)" }}>
                PteroStore
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-4">
              Platform terpercaya untuk panel Pterodactyl di Indonesia. Setup instan, harga terjangkau, support 24/7.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex items-center gap-2 text-sm bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Discord
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Navigasi</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                { href: "/", label: "Beranda" },
                { href: "/marketplace", label: "Marketplace" },
                { href: "/orders", label: "Pesanan Saya" },
                { href: "/report-bug", label: "Report Bug" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>Email: support@pterostore.com</li>
              <li>WhatsApp: 0812-3456-7890</li>
              <li>Jam: 08.00 - 22.00 WIB</li>
              <li className="pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                  <span className="text-green-400">Online sekarang</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {year} PteroStore. All rights reserved. Made with ❤️ for Indonesian Gamers.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
            <span className="text-xs text-muted-foreground">Semua sistem normal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
