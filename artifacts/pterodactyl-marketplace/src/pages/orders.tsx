import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6 neon-text-primary text-primary">Your Orders</h1>
        <Card className="glass-panel">
          <CardContent className="p-6">
            <p className="text-muted-foreground">You have no orders yet.</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}