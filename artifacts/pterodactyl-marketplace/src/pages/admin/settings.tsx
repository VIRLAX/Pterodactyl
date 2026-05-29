import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6 neon-text-primary text-primary">Site Settings</h1>
      <Card className="glass-panel">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Settings features coming soon.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}