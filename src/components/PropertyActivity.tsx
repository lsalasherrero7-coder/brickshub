import { useState } from "react";
import { usePropertyVisits, useUpdateVisitStatus, useUpdateVisit, useDeleteVisit } from "@/hooks/useVisitData";
import { VISIT_STATUSES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, CheckCircle, XCircle, Clock, User, Pencil, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  programada: { icon: Clock, color: "text-info", bg: "bg-info/10" },
  completada: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  cancelada: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

export default function PropertyActivity({ propertyId }: { propertyId: string }) {
  const { data: visits, isLoading } = usePropertyVisits(propertyId);
  const updateStatus = useUpdateVisitStatus();
  const updateVisit = useUpdateVisit();
  const deleteVisit = useDeleteVisit();

  const [editVisit, setEditVisit] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Visita marcada como ${VISIT_STATUSES.find((s) => s.value === status)?.label}`);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    }
  };

  const handleEditSave = async () => {
    if (!editVisit) return;
    try {
      const [hours, minutes] = (editVisit._time || "10:00").split(":").map(Number);
      const visitDate = new Date(editVisit._date || editVisit.visit_date);
      visitDate.setHours(hours, minutes, 0, 0);

      await updateVisit.mutateAsync({
        id: editVisit.id,
        client_first_name: editVisit.client_first_name,
        client_last_name: editVisit.client_last_name,
        client_phone: editVisit.client_phone || null,
        visit_date: visitDate.toISOString(),
        notes: editVisit.notes || null,
      });
      toast.success("Visita actualizada");
      setEditVisit(null);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVisit.mutateAsync(deleteId);
      toast.success("Visita eliminada");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleteId(null);
    }
  };

  const openEdit = (visit: any) => {
    const d = new Date(visit.visit_date);
    setEditVisit({
      ...visit,
      _date: format(d, "yyyy-MM-dd"),
      _time: format(d, "HH:mm"),
    });
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
    <>
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

                  <div className="flex gap-1 shrink-0 flex-wrap items-start">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => openEdit(visit)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(visit.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {visit.status !== "programada" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-info border-info/30 hover:bg-info/10 h-8 text-xs"
                        onClick={() => handleStatusChange(visit.id, "programada")}
                        disabled={updateStatus.isPending}
                      >
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Programada
                      </Button>
                    )}
                    {visit.status !== "completada" && (
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
                    )}
                    {visit.status !== "cancelada" && (
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
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Visit Modal */}
      <Dialog open={!!editVisit} onOpenChange={(o) => !o && setEditVisit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Editar Visita</DialogTitle>
          </DialogHeader>
          {editVisit && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre *</Label>
                  <Input value={editVisit.client_first_name} onChange={(e) => setEditVisit({ ...editVisit, client_first_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Apellidos *</Label>
                  <Input value={editVisit.client_last_name} onChange={(e) => setEditVisit({ ...editVisit, client_last_name: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={editVisit.client_phone || ""} onChange={(e) => setEditVisit({ ...editVisit, client_phone: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha *</Label>
                  <Input type="date" value={editVisit._date} onChange={(e) => setEditVisit({ ...editVisit, _date: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Hora *</Label>
                  <Input type="time" value={editVisit._time} onChange={(e) => setEditVisit({ ...editVisit, _time: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea value={editVisit.notes || ""} onChange={(e) => setEditVisit({ ...editVisit, notes: e.target.value })} rows={2} className="mt-1" />
              </div>
              <Button onClick={handleEditSave} disabled={updateVisit.isPending} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {updateVisit.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="¿Eliminar visita?"
        description="¿Estás seguro de que quieres eliminar esta visita? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        isPending={deleteVisit.isPending}
      />
    </>
  );
}
