import { Link, useLocation } from "wouter";
import { AdminGuard } from "@/components/AdminGuard";
import { LayoutDashboard, ShoppingBag, Users, PackageOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("somya_admin_token");
    setLocation("/admin/login");
  };

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/admin/products", icon: PackageOpen, label: "Products" },
    { href: "/admin/customers", icon: Users, label: "Customers" },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border shrink-0 flex flex-col">
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="font-serif text-2xl font-bold text-sidebar-foreground">Somya Admin</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}

export function getAdminHeaders() {
  const token = localStorage.getItem("somya_admin_token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}
