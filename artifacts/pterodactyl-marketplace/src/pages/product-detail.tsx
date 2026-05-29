import { useParams, useLocation } from "wouter";
import { useGetProduct, getGetProductQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Server, Shield, Clock, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const { data: product, isLoading } = useGetProduct(Number(id), {
    query: {
      enabled: !!id,
      queryKey: getGetProductQueryKey(Number(id))
    }
  });

  const createOrder = useCreateOrder();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please login to purchase");
      setLocation("/login");
      return;
    }
    
    // Create order with default Dana
    createOrder.mutate({
      data: {
        productId: Number(id),
        paymentMethod: "dana"
      }
    }, {
      onSuccess: (order) => {
        setLocation(`/checkout/${order.id}`);
      },
      onError: () => {
        toast.error("Failed to initiate checkout");
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!product) return <div>Product not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 neon-text-primary text-white">{product.name}</h1>
              <p className="text-xl text-muted-foreground">{product.description}</p>
            </div>
            
            <div className="glass-panel p-8 rounded-xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Technical Details</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed whitespace-pre-line">{product.detail}</p>
              
              <h3 className="text-xl font-bold mb-4">Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.benefits.split(',').map((benefit, i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center mr-3">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <span>{benefit.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <Card className="glass-panel border-primary/30 neon-border-primary sticky top-24">
              <CardContent className="p-8">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Price</p>
                  <div className="flex items-end">
                    <span className="text-5xl font-extrabold text-white">Rp {product.price.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-2 mb-1">/mo</span>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Setup Time</span>
                    <span className="font-medium text-white">Instant</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium text-white">{product.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-green-400 capitalize">{product.status.replace('_', ' ')}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(255,10,60,0.5)]"
                  onClick={handleCheckout}
                  disabled={createOrder.isPending || product.status !== "ready"}
                >
                  {createOrder.isPending ? "Processing..." : product.status !== "ready" ? "Out of Stock" : "Checkout Now"}
                </Button>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
}