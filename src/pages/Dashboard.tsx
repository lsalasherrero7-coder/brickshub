import { useState } from "react";
import { usePropertyStats } from "@/hooks/usePropertyData";
import { useProperties } from "@/hooks/usePropertyData";
import { Building2, AlertTriangle, CheckCircle, TrendingUp, CalendarPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { DOCUMENT_TYPES } from "@/lib/types";
import ScheduleVisitModal from "@/components/ScheduleVisitModal";

export default function Dashboard() {
  const { data: stats, isLoading } = usePropertyStats();
  const { data: properties } = useProperties();
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Panel de Control</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Propiedades",
      value: stats?.total || 0,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Disponibles",
      value: stats?.byStatus.disponible || 0,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Reservadas",
      value: stats?.byStatus.reservado || 0,
      icon: TrendingUp,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Doc. Incompleta",
      value: stats?.incompleteCount || 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  const requiredDocs = stats?.requiredDocs || [];

  // Get properties with incomplete docs details
  const incompleteDetails = (properties || [])
    .map((p) => {
      const propertyDocs = stats?.docsMap?.get(p.id) || new Set<string>();
      const missing = requiredDocs.filter((d) => !propertyDocs.has(d));
      return { property: p, missing };
    })
    .filter((item) => item.missing.length > 0)
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Panel de Control</h1>
          <p className="text-muted-foreground mt-1">Resumen de tu cartera inmobiliaria</p>
        </div>
        <Button onClick={() => setScheduleOpen(true)} size="lg">
          <CalendarPlus className="w-5 h-5 mr-2" />
          Agendar Visita
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-display font-bold mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Propiedades por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: "disponible", count: stats?.byStatus.disponible || 0 },
                { status: "reservado", count: stats?.byStatus.reservado || 0 },
                { status: "en_oferta", count: stats?.byStatus.en_oferta || 0 },
                { status: "vendido", count: stats?.byStatus.vendido || 0 },
                { status: "retirado", count: stats?.byStatus.retirado || 0 },
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <StatusBadge status={item.status} size="md" />
                  <span className="text-lg font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Documentación Incompleta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incompleteDetails.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Todas las propiedades tienen documentación completa ✓
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-auto">
                {incompleteDetails.map(({ property, missing }) => (
                  <Link
                    key={property.id}
                    to={`/propiedades/${property.id}`}
                    className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{property.address}</p>
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                        {missing.length} faltan
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {missing
                        .map((d) => DOCUMENT_TYPES.find((dt) => dt.value === d)?.label || d)
                        .join(", ")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ScheduleVisitModal open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
