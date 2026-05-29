import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportBug() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="glass-panel w-full max-w-lg">
          <CardHeader>
            <CardTitle>Report a Bug</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Describe the issue you're facing.</p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Submit Report
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}