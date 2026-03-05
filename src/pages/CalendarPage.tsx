import { useState, useMemo } from "react";
import { useVisits, useUpdateVisitStatus } from "@/hooks/useVisitData";
import { useProperties } from "@/hooks/usePropertyData";
import { useAllContactTasks } from "@/hooks/useContactData";
import { useMarketingLeads } from "@/hooks/useMarketingLeadData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, MapPin, Phone, FileText, CheckCircle, XCircle, ListTodo, Megaphone } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { VISIT_STATUSES } from "@/lib/types";
import type { Visit } from "@/lib/types";
import ScheduleVisitModal from "@/components/ScheduleVisitModal";
import { Link } from "react-router-dom";
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const updateStatus = useUpdateVisitStatus();

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

  // Generate calendar days
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Calendario</h1>
          <p className="text-muted-foreground mt-1">Visitas programadas</p>
        </div>
        <Button onClick={() => setScheduleOpen(true)}>
          <CalendarDays className="w-4 h-4 mr-2" />
          Agendar Visita
        </Button>
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
          {/* Header */}
          <div className="grid grid-cols-7 border-b">
            {weekDayHeaders.map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Days */}
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
                    {dayVisits.slice(0, view === "week" ? 10 : 3).map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVisit(v)}
                        className={`w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate ${statusColors[v.status] || statusColors.programada}`}
                      >
                        {format(new Date(v.visit_date), "HH:mm")} {v.client_first_name}
                      </button>
                    ))}
                    {dayVisits.length > (view === "week" ? 10 : 3) && (
                      <p className="text-[10px] text-muted-foreground px-1">+{dayVisits.length - (view === "week" ? 10 : 3)} más</p>
                    )}
                    {dayTasks.slice(0, view === "week" ? 5 : 2).map((t: any) => (
                      <Link
                        key={t.id}
                        to={`/contactos/${t.contact_id}`}
                        className={`w-full block text-[10px] leading-tight px-1.5 py-0.5 rounded truncate ${t.status === "completada" ? "bg-muted text-muted-foreground line-through" : "bg-accent/20 text-accent-foreground"}`}
                      >
                        <ListTodo className="w-2.5 h-2.5 inline mr-0.5" />
                        {format(new Date(t.due_date), "HH:mm")} {t.title}
                      </Link>
                    ))}
                    {dayLeadActions.slice(0, view === "week" ? 3 : 1).map((l: any) => (
                      <Link
                        key={l.id}
                        to={`/leads/${l.id}`}
                        className="w-full block text-[10px] leading-tight px-1.5 py-0.5 rounded truncate bg-purple-100 text-purple-800"
                      >
                        <Megaphone className="w-2.5 h-2.5 inline mr-0.5" />
                        {format(new Date(l.next_action_date), "HH:mm")} {l.name}
                      </Link>
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
                {/* Property */}
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

                {/* Client */}
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

                {/* Date */}
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha y hora</p>
                    <p className="text-sm capitalize">
                      {format(new Date(selectedVisit.visit_date), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {selectedVisit.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Notas</p>
                      <p className="text-sm italic">"{selectedVisit.notes}"</p>
                    </div>
                  </div>
                )}

                {/* Status + change */}
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Estado actual</p>
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[selectedVisit.status] || ""}`}>
                    {VISIT_STATUSES.find((s) => s.value === selectedVisit.status)?.label}
                  </span>
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

      <ScheduleVisitModal open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
