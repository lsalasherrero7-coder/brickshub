import { useState, useMemo, useEffect } from "react";
import { useVisits, useUpdateVisitStatus, useDeleteVisit, useUpdateVisit } from "@/hooks/useVisitData";
import { useProperties } from "@/hooks/usePropertyData";
import { useAllContactTasks, useDeleteContactTask, useUpdateContactTask, useUpdateContact } from "@/hooks/useContactData";
import { useMarketingLeads, useUpdateMarketingLead } from "@/hooks/useMarketingLeadData";
import { useGoogleCalendarStatus, useGoogleCalendarConnect, useGoogleCalendarDisconnect } from "@/hooks/useGoogleCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, MapPin, Phone, FileText, CheckCircle, XCircle, ListTodo, Megaphone, Unplug, Pencil, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { VISIT_STATUSES } from "@/lib/types";
import type { Visit } from "@/lib/types";
import ScheduleVisitModal from "@/components/ScheduleVisitModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import CalendarEventEditModal from "@/components/CalendarEventEditModal";
import type { CalendarEvent } from "@/components/CalendarEventEditModal";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  programada: "bg-info/80 text-info-foreground",
  completada: "bg-success/80 text-success-foreground",
  cancelada: "bg-destructive/40 text-destructive-foreground line-through",
};

export default function CalendarPage() {
  const { data: visits } = useVisits();
  const { data: properties } = useProperties();
  const { data: contactTasks } = useAllContactTasks();
  const { data: marketingLeads } = useMarketingLeads();
  const { data: gcalStatus, refetch: refetchGcal } = useGoogleCalendarStatus();
  const { connect: connectGcal } = useGoogleCalendarConnect();
  const { disconnect: disconnectGcal } = useGoogleCalendarDisconnect();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const updateStatus = useUpdateVisitStatus();
  const deleteVisit = useDeleteVisit();
  const updateVisit = useUpdateVisit();
  const deleteTask = useDeleteContactTask();
  const updateTask = useUpdateContactTask();
  const updateContact = useUpdateContact();
  const updateMarketingLead = useUpdateMarketingLead();
  const [searchParams, setSearchParams] = useSearchParams();

  // Edit/Delete state
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; contactId?: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const gcal = searchParams.get("gcal");
    if (gcal === "success") {
      toast.success("Google Calendar conectado correctamente");
      refetchGcal();
      setSearchParams({}, { replace: true });
    } else if (gcal === "error") {
      toast.error("Error al conectar Google Calendar");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, refetchGcal, setSearchParams]);

  const propertyMap = useMemo(() => {
    const map = new Map<string, { address: string; id: string }>();
    (properties || []).forEach((p) => map.set(p.id, { address: p.address, id: p.id }));
    return map;
  }, [properties]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Visita marcada como ${VISIT_STATUSES.find((s) => s.value === status)?.label}`);
      setSelectedVisit((prev) => prev ? { ...prev, status } : null);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsPending(true);
    try {
      if (deleteTarget.type === "visit") {
        await deleteVisit.mutateAsync(deleteTarget.id);
      } else if (deleteTarget.type === "task") {
        await deleteTask.mutateAsync({ id: deleteTarget.id, contact_id: deleteTarget.contactId! });
      } else if (deleteTarget.type === "lead_action") {
        await updateMarketingLead.mutateAsync({
          id: deleteTarget.id,
          next_action_type: null,
          next_action_date: null,
          next_action_note: null,
        });
      } else if (deleteTarget.type === "contact_action") {
        await updateContact.mutateAsync({
          id: deleteTarget.id,
          next_action_type: null,
          next_action_date: null,
          next_action_note: null,
        });
      }
      toast.success("Eliminado correctamente");
      setDeleteOpen(false);
      setSelectedVisit(null);
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setIsPending(false);
    }
  };

  // Edit save handler
  const handleEditSave = async (evt: CalendarEvent) => {
    const newDatetime = new Date(evt.date);
    const [h, m] = evt.time.split(":").map(Number);
    newDatetime.setHours(h, m, 0, 0);
    const isoDate = newDatetime.toISOString();

    try {
      if (evt.type === "visit") {
        await updateVisit.mutateAsync({
          id: evt.id,
          visit_date: isoDate,
          notes: evt.notes || null,
        });
      } else if (evt.type === "task") {
        await updateTask.mutateAsync({
          id: evt.id,
          contact_id: evt.contact_id!,
          title: evt.title,
          due_date: isoDate,
          description: evt.notes || null,
        });
      } else if (evt.type === "lead_action") {
        await updateMarketingLead.mutateAsync({
          id: evt.id,
          next_action_date: isoDate,
          next_action_note: evt.notes || null,
        });
      } else if (evt.type === "contact_action") {
        await updateContact.mutateAsync({
          id: evt.id,
          next_action_date: isoDate,
          next_action_note: evt.notes || null,
        });
      }
      toast.success("Actualizado correctamente");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    }
  };

  // Open edit for visit
  const openEditVisit = (v: Visit, e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date(v.visit_date);
    setEditEvent({
      id: v.id,
      type: "visit",
      date: d,
      time: format(d, "HH:mm"),
      title: `${v.client_first_name} ${v.client_last_name}`,
      notes: v.notes || "",
    });
    setEditOpen(true);
  };

  // Open edit for task
  const openEditTask = (t: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const d = new Date(t.due_date);
    setEditEvent({
      id: t.id,
      type: "task",
      date: d,
      time: format(d, "HH:mm"),
      title: t.title,
      notes: t.description || "",
      contact_id: t.contact_id,
    });
    setEditOpen(true);
  };

  // Open edit for lead action
  const openEditLeadAction = (l: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const d = new Date(l.next_action_date);
    setEditEvent({
      id: l.id,
      type: "lead_action",
      date: d,
      time: format(d, "HH:mm"),
      title: l.name,
      notes: l.next_action_note || "",
      action_type: l.next_action_type,
    });
    setEditOpen(true);
  };

  const visitsByDate = useMemo(() => {
    const map = new Map<string, Visit[]>();
    (visits || []).forEach((v) => {
      const key = format(new Date(v.visit_date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    return map;
  }, [visits]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    (contactTasks || []).forEach((t: any) => {
      const key = format(new Date(t.due_date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [contactTasks]);

  const leadActionsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    (marketingLeads || []).filter((l) => l.next_action_date && !["convertido", "descartado"].includes(l.status)).forEach((l) => {
      const key = format(new Date(l.next_action_date!), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    return map;
  }, [marketingLeads]);

  const navigatePrev = () => setCurrentDate((d) => view === "month" ? addMonths(d, -1) : addWeeks(d, -1));
  const navigateNext = () => setCurrentDate((d) => view === "month" ? addMonths(d, 1) : addWeeks(d, 1));
  const goToday = () => setCurrentDate(new Date());

  const calendarDays = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      const days: Date[] = [];
      let day = start;
      while (day <= end) {
        days.push(day);
        day = addDays(day, 1);
      }
      return days;
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
  }, [currentDate, view]);

  const weekDayHeaders = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Inline action buttons component
  const ActionButtons = ({ onEdit, onDelete }: { onEdit: (e: React.MouseEvent) => void; onDelete: (e: React.MouseEvent) => void }) => (
    <span className="inline-flex gap-0.5 ml-auto shrink-0 opacity-0 group-hover/event:opacity-100 transition-opacity">
      <button onClick={onEdit} className="p-0.5 rounded hover:bg-background/50" title="Editar">
        <Pencil className="w-2.5 h-2.5" />
      </button>
      <button onClick={onDelete} className="p-0.5 rounded hover:bg-destructive/20 text-destructive" title="Eliminar">
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </span>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Calendario</h1>
          <p className="text-muted-foreground mt-1">Visitas programadas</p>
        </div>
        <div className="flex items-center gap-2">
          {gcalStatus?.connected ? (
            <Button variant="outline" size="sm" onClick={disconnectGcal} className="text-destructive border-destructive/30">
              <Unplug className="w-4 h-4 mr-1" />
              Desconectar Google Calendar
            </Button>
          ) : (
            <Button variant="outline" onClick={connectGcal}>
              <CalendarDays className="w-4 h-4 mr-2" />
              Conectar Google Calendar
            </Button>
          )}
          <Button onClick={() => setScheduleOpen(true)}>
            <CalendarDays className="w-4 h-4 mr-2" />
            Agendar Visita
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={navigateNext}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={goToday}>Hoy</Button>
          <h2 className="font-display text-lg font-semibold ml-2 capitalize">
            {format(currentDate, view === "month" ? "MMMM yyyy" : "'Semana del' d 'de' MMMM", { locale: es })}
          </h2>
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          <button
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => setView("month")}
          >Mes</button>
          <button
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => setView("week")}
          >Semana</button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {weekDayHeaders.map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>

          <div className={`grid grid-cols-7 ${view === "week" ? "min-h-[300px]" : ""}`}>
            {calendarDays.map((day, i) => {
              const key = format(day, "yyyy-MM-dd");
              const dayVisits = visitsByDate.get(key) || [];
              const dayTasks = tasksByDate.get(key) || [];
              const dayLeadActions = leadActionsByDate.get(key) || [];
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={i}
                  className={`border-b border-r p-1.5 min-h-[90px] ${view === "week" ? "min-h-[200px]" : ""} ${
                    !isCurrentMonth && view === "month" ? "bg-muted/30" : ""
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary text-primary-foreground" : !isCurrentMonth ? "text-muted-foreground" : ""
                  }`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {/* Visits */}
                    {dayVisits.slice(0, view === "week" ? 10 : 3).map((v) => (
                      <div
                        key={v.id}
                        className={`group/event w-full flex items-center text-[10px] leading-tight px-1.5 py-0.5 rounded ${statusColors[v.status] || statusColors.programada}`}
                      >
                        <button
                          onClick={() => setSelectedVisit(v)}
                          className="truncate text-left flex-1 min-w-0"
                        >
                          {format(new Date(v.visit_date), "HH:mm")} Visita - {v.client_first_name}
                        </button>
                        <ActionButtons
                          onEdit={(e) => openEditVisit(v, e)}
                          onDelete={(e) => { e.stopPropagation(); setDeleteTarget({ type: "visit", id: v.id }); setDeleteOpen(true); }}
                        />
                      </div>
                    ))}
                    {dayVisits.length > (view === "week" ? 10 : 3) && (
                      <p className="text-[10px] text-muted-foreground px-1">+{dayVisits.length - (view === "week" ? 10 : 3)} más</p>
                    )}

                    {/* Tasks */}
                    {dayTasks.slice(0, view === "week" ? 5 : 2).map((t: any) => (
                      <div
                        key={t.id}
                        className={`group/event w-full flex items-center text-[10px] leading-tight px-1.5 py-0.5 rounded ${t.status === "completada" ? "bg-muted text-muted-foreground line-through" : "bg-accent/20 text-accent-foreground"}`}
                      >
                        <Link
                          to={`/contactos/${t.contact_id}`}
                          className="truncate flex-1 min-w-0"
                        >
                          <ListTodo className="w-2.5 h-2.5 inline mr-0.5" />
                          {format(new Date(t.due_date), "HH:mm")} {t.title}
                        </Link>
                        <ActionButtons
                          onEdit={(e) => openEditTask(t, e)}
                          onDelete={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget({ type: "task", id: t.id, contactId: t.contact_id }); setDeleteOpen(true); }}
                        />
                      </div>
                    ))}

                    {/* Lead Actions */}
                    {dayLeadActions.slice(0, view === "week" ? 3 : 1).map((l: any) => (
                      <div
                        key={l.id}
                        className="group/event w-full flex items-center text-[10px] leading-tight px-1.5 py-0.5 rounded bg-purple-100 text-purple-800"
                      >
                        <Link
                          to={`/leads/${l.id}`}
                          className="truncate flex-1 min-w-0"
                        >
                          <Megaphone className="w-2.5 h-2.5 inline mr-0.5" />
                          {format(new Date(l.next_action_date), "HH:mm")} {l.name}
                        </Link>
                        <ActionButtons
                          onEdit={(e) => openEditLeadAction(l, e)}
                          onDelete={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget({ type: "lead_action", id: l.id }); setDeleteOpen(true); }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Visit detail dialog */}
      <Dialog open={!!selectedVisit} onOpenChange={(o) => !o && setSelectedVisit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Detalle de Visita</DialogTitle>
          </DialogHeader>
          {selectedVisit && (() => {
            const prop = propertyMap.get(selectedVisit.property_id);
            const statusColor: Record<string, string> = {
              programada: "bg-info/10 text-info",
              completada: "bg-success/10 text-success",
              cancelada: "bg-destructive/10 text-destructive",
            };
            return (
              <div className="space-y-4 mt-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Propiedad</p>
                    {prop ? (
                      <Link to={`/propiedades/${prop.id}`} className="font-medium text-sm text-primary hover:underline">
                        {prop.address}
                      </Link>
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium text-sm">{selectedVisit.client_first_name} {selectedVisit.client_last_name}</p>
                  </div>
                </div>

                {selectedVisit.client_phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="text-sm">{selectedVisit.client_phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha y hora</p>
                    <p className="text-sm capitalize">
                      {format(new Date(selectedVisit.visit_date), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>

                {selectedVisit.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Notas</p>
                      <p className="text-sm italic">"{selectedVisit.notes}"</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Estado actual</p>
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[selectedVisit.status] || ""}`}>
                        {VISIT_STATUSES.find((s) => s.value === selectedVisit.status)?.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => {
                          const d = new Date(selectedVisit.visit_date);
                          setEditEvent({
                            id: selectedVisit.id,
                            type: "visit",
                            date: d,
                            time: format(d, "HH:mm"),
                            title: `${selectedVisit.client_first_name} ${selectedVisit.client_last_name}`,
                            notes: selectedVisit.notes || "",
                          });
                          setEditOpen(true);
                          setSelectedVisit(null);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => {
                          setDeleteTarget({ type: "visit", id: selectedVisit.id });
                          setDeleteOpen(true);
                          setSelectedVisit(null);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground pt-1">Cambiar estado:</p>
                  <div className="flex gap-1 flex-wrap">
                    {selectedVisit.status !== "programada" && (
                      <Button size="sm" variant="outline" className="text-info border-info/30 hover:bg-info/10 h-8 text-xs" onClick={() => handleStatusChange(selectedVisit.id, "programada")} disabled={updateStatus.isPending}>
                        <Clock className="w-3.5 h-3.5 mr-1" /> Programada
                      </Button>
                    )}
                    {selectedVisit.status !== "completada" && (
                      <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10 h-8 text-xs" onClick={() => handleStatusChange(selectedVisit.id, "completada")} disabled={updateStatus.isPending}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Completada
                      </Button>
                    )}
                    {selectedVisit.status !== "cancelada" && (
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 h-8 text-xs" onClick={() => handleStatusChange(selectedVisit.id, "cancelada")} disabled={updateStatus.isPending}>
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <CalendarEventEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        event={editEvent}
        onSave={handleEditSave}
        isPending={updateVisit.isPending || updateTask.isPending || updateMarketingLead.isPending || updateContact.isPending}
      />

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar evento?"
        description="¿Estás seguro? Esto eliminará también el registro original."
        onConfirm={handleDelete}
        isPending={isPending}
      />

      <ScheduleVisitModal open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
