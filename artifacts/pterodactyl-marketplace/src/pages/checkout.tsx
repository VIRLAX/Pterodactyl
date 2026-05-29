import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="glass-panel w-full max-w-lg">
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Complete your purchase here.</p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Confirm Payment
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}