import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminOrders() {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6 neon-text-primary text-primary">Manage Orders</h1>
      <Card className="glass-panel">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Order management features coming soon.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}