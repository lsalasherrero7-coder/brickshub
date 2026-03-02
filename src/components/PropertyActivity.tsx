import { usePropertyVisits, useUpdateVisitStatus } from "@/hooks/useVisitData";
import { VISIT_STATUSES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  programada: { icon: Clock, color: "text-info", bg: "bg-info/10" },
  completada: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  cancelada: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function PropertyActivity({ propertyId }: { propertyId: string }) {
  const { data: visits, isLoading } = usePropertyVisits(propertyId);
  const updateStatus = useUpdateVisitStatus();

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Visita marcada como ${VISIT_STATUSES.find((s) => s.value === status)?.label}`);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>;
  }

  if (!visits?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No hay visitas registradas para esta propiedad</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => {
        const config = statusConfig[visit.status] || statusConfig.programada;
        const StatusIcon = config.icon;
        const visitDate = new Date(visit.visit_date);

        return (
          <Card key={visit.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="font-medium text-sm">
                        {visit.client_first_name} {visit.client_last_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {format(visitDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                    {visit.client_phone && (
                      <p className="text-xs text-muted-foreground mt-1">📞 {visit.client_phone}</p>
                    )}
                    {visit.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{visit.notes}"</p>
                    )}
                    <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {VISIT_STATUSES.find((s) => s.value === visit.status)?.label}
                    </span>
                  </div>
                </div>

                {visit.status === "programada" && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-success border-success/30 hover:bg-success/10 h-8 text-xs"
                      onClick={() => handleStatusChange(visit.id, "completada")}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Completada
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8 text-xs"
                      onClick={() => handleStatusChange(visit.id, "cancelada")}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
