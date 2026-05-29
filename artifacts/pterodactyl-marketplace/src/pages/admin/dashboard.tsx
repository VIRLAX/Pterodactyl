import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6 neon-text-primary text-primary">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">Rp 0</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}