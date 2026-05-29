import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Search } from "lucide-react";

export default function Marketplace() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useListProducts({ available: true, search }, {
    query: {
      queryKey: getListProductsQueryKey({ available: true, search })
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 neon-text-primary text-primary">Marketplace</h1>
          <p className="text-muted-foreground">Find the perfect server panel for your needs.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-10 bg-card/50 border-white/10 h-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* Invite promo box */}
            <div className="mt-8 p-6 glass-panel neon-border-secondary rounded-xl">
              <h3 className="font-bold text-lg mb-2 text-secondary neon-text-secondary">Invite & Save</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Invite friends to our WhatsApp group, upload a screenshot, and get special discounts!
              </p>
              <Button className="w-full bg-secondary hover:bg-secondary/90 shadow-[0_0_10px_rgba(150,10,255,0.4)]" onClick={() => {}}>
                Submit Proof
              </Button>
            </div>
          </div>

          <div className="w-full md:w-2/3 lg:w-3/4">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-80 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {products.map((product) => (
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
                      <div className="mb-4">
                        <span className="text-3xl font-bold">Rp {product.price.toLocaleString()}</span>
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{product.description}</p>
                      
                      <div className="space-y-2">
                        {product.benefits.split(',').slice(0, 3).map((benefit, i) => (
                          <div key={i} className="flex items-center text-sm">
                            <Server className="h-4 w-4 mr-2 text-primary/70" />
                            <span>{benefit.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-white/10 hover:bg-primary hover:text-primary-foreground transition-all" onClick={() => setLocation(`/product/${product.id}`)}>
                        Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card/30 rounded-xl border border-white/5">
                <p className="text-muted-foreground text-lg">No products found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}