import { Link, useLocation } from "react-router-dom";
import { Building2, LayoutDashboard, Plus, CalendarDays, Target, Users, Megaphone, Calculator, UserPlus, LogOut, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const navItems = [
    { to: "/", label: "Panel", icon: LayoutDashboard },
    { to: "/propiedades", label: "Propiedades", icon: Building2 },
    { to: "/captacion", label: "Captación", icon: Target },
    { to: "/leads", label: "Leads", icon: Megaphone },
    { to: "/contactos", label: "Contactos", icon: Users },
    { to: "/calendario", label: "Calendario", icon: CalendarDays },
    { to: "/contabilidad", label: "Contabilidad", icon: Receipt },
    { to: "/hipoteca", label: "Cálculo Hipoteca", icon: Calculator },
    { to: "/usuarios", label: "Usuarios", icon: UserPlus },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">BrickHub</h1>
              <p className="text-xs text-sidebar-foreground/60">CRM Inmobiliario</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 space-y-2 border-t border-sidebar-border">
          <Link to="/propiedades/nueva">
            <Button className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Propiedad
            </Button>
          </Link>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut} className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
