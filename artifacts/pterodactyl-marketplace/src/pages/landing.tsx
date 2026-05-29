import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Zap, Shield, Clock } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { data: products, isLoading } = useListProducts({ available: true }, {
    query: {
      queryKey: getListProductsQueryKey({ available: true })
    }
  });

  const featuredProducts = products?.filter(p => p.badge === "popular" || p.badge === "recommended").slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-32 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none"></div>
          <div className="container mx-auto relative z-10 text-center">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 px-3 py-1 text-sm font-medium neon-border-primary">
              Premium Hosting Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              <span className="text-white">Next-Gen</span> <br/>
              <span className="neon-text-primary text-primary">Pterodactyl Panels</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              High-performance game server panels with instant setup, DDoS protection, and 99.9% uptime for Indonesian gamers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(255,10,60,0.5)] rounded-md font-bold" onClick={() => setLocation("/marketplace")}>
                View Plans
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 hover:bg-white/5 rounded-md font-bold" onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-card/30 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Choose PteroStore?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Engineered for performance, designed for ease of use. Experience the ultimate game server management.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Instant Setup", desc: "Your panel is ready immediately after payment confirmation." },
                { icon: Shield, title: "DDoS Protection", desc: "Enterprise-grade protection to keep your server online." },
                { icon: Clock, title: "99.9% Uptime", desc: "High availability infrastructure for uninterrupted gaming." }
              ].map((feature, i) => (
                <Card key={i} className="glass-panel border-white/5 bg-background/50 hover:border-primary/50 transition-colors duration-300">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4">Featured Plans</h2>
                <p className="text-muted-foreground">Most popular choices for our community.</p>
              </div>
              <Button variant="link" className="text-primary" onClick={() => setLocation("/marketplace")}>
                View All Plans →
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1,2,3].map(i => <div key={i} className="h-96 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredProducts.length > 0 ? featuredProducts.map((product) => (
                  <Card key={product.id} className="glass-panel border-white/10 hover:neon-border-primary transition-all duration-300 flex flex-col relative overflow-hidden group">
                    {product.badge && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(255,10,60,0.5)]">
                          {product.badge.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{product.name}</CardTitle>
                      <CardDescription>{product.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="mb-6">
                        <span className="text-4xl font-extrabold">Rp {product.price.toLocaleString()}</span>
                        <span className="text-muted-foreground">/mo</span>
                        {product.originalPrice && (
                          <div className="text-sm text-muted-foreground line-through mt-1">
                            Rp {product.originalPrice.toLocaleString()}/mo
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{product.description}</p>
                      
                      <div className="space-y-2">
                        {product.benefits.split(',').slice(0, 4).map((benefit, i) => (
                          <div key={i} className="flex items-center text-sm">
                            <Server className="h-4 w-4 mr-2 text-primary/70" />
                            <span>{benefit.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-white/10 hover:bg-primary hover:text-primary-foreground transition-all" onClick={() => setLocation(`/product/${product.id}`)}>
                        Select Plan
                      </Button>
                    </CardFooter>
                  </Card>
                )) : (
                  <div className="col-span-3 text-center py-12 text-muted-foreground">
                    No products available right now.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Invite System Promo */}
        <section className="py-20 bg-gradient-to-r from-secondary/20 to-primary/20 border-y border-white/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Get Special Discounts</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Invite friends to our WhatsApp group and upload the screenshot proof to get exclusive discount tokens for your next purchase.
            </p>
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-[0_0_15px_rgba(150,10,255,0.5)] font-bold">
              Join & Claim Reward
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}