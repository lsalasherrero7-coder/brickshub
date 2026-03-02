import { useState, useMemo } from "react";
import { useVisits } from "@/hooks/useVisitData";
import { useProperties } from "@/hooks/usePropertyData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { VISIT_STATUSES } from "@/lib/types";
import type { Visit } from "@/lib/types";
import ScheduleVisitModal from "@/components/ScheduleVisitModal";

const statusColors: Record<string, string> = {
  programada: "bg-info/80 text-info-foreground",
  completada: "bg-success/80 text-success-foreground",
  cancelada: "bg-destructive/40 text-destructive-foreground line-through",
};

export default function CalendarPage() {
  const { data: visits } = useVisits();
  const { data: properties } = useProperties();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const propertyMap = useMemo(() => {
    const map = new Map<string, string>();
    (properties || []).forEach((p) => map.set(p.id, p.address));
    return map;
  }, [properties]);

  const visitsByDate = useMemo(() => {
    const map = new Map<string, Visit[]>();
    (visits || []).forEach((v) => {
      const key = format(new Date(v.visit_date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    return map;
  }, [visits]);

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
          {selectedVisit && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedVisit.client_first_name} {selectedVisit.client_last_name}</span>
              </div>
              {selectedVisit.client_phone && (
                <p className="text-sm text-muted-foreground">📞 {selectedVisit.client_phone}</p>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(selectedVisit.visit_date), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{propertyMap.get(selectedVisit.property_id) || "—"}</span>
              </div>
              {selectedVisit.notes && (
                <p className="text-sm italic text-muted-foreground">"{selectedVisit.notes}"</p>
              )}
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[selectedVisit.status] || ""}`}>
                {VISIT_STATUSES.find((s) => s.value === selectedVisit.status)?.label}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ScheduleVisitModal open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
