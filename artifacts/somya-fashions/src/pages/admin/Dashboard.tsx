import { useAdminGetStats, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import { AdminLayout, getAdminHeaders } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Banknote, Users, PackageOpen, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export function AdminDashboard() {
  const { data: stats, isLoading } = useAdminGetStats({ 
    request: getAdminHeaders(),
    query: { queryKey: getAdminGetStatsQueryKey() } 
  });

  if (isLoading || !stats) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center h-full min-h-[500px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    { title: "Total Revenue", value: `₹${stats.totalRevenue.toFixed(2)}`, icon: Banknote, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "Total Customers", value: stats.totalCustomers, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Total Products", value: stats.totalProducts, icon: PackageOpen, color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif font-bold text-foreground">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold font-serif">Recent Orders</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>₹{order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {stats.recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No recent orders
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
