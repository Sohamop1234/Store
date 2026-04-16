import { useListCustomers, getListCustomersQueryKey } from "@workspace/api-client-react";
import { AdminLayout, getAdminHeaders } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export function AdminCustomers() {
  const { data: customers, isLoading } = useListCustomers({
    request: getAdminHeaders(),
    query: { queryKey: getListCustomersQueryKey() }
  });

  if (isLoading || !customers) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold text-foreground">Customers</h1>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{customer.email}</div>
                      <div className="text-xs text-muted-foreground">{customer.phone}</div>
                    </TableCell>
                    <TableCell>{customer.city}</TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>₹{customer.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(customer.createdAt), "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
