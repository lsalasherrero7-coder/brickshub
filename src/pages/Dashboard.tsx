import { useMemo } from "react";
import { usePropertyStats } from "@/hooks/usePropertyData";
import { useVisits } from "@/hooks/useVisitData";
import { useAllContactTasks } from "@/hooks/useContactData";
import { useContacts } from "@/hooks/useContactData";
import { useMarketingLeads } from "@/hooks/useMarketingLeadData";
import { useProperties } from "@/hooks/usePropertyData";
import { Building2, AlertTriangle, Receipt, Calendar, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, isSameDay, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  type: "visit" | "task" | "contact_action" | "lead_action";
  title: string;
  contactName: string;
  date: Date;
  time: string;
  link: string;
}

export default function Dashboard() {
  const { data: stats, isLoading } = usePropertyStats();
  const { data: visits } = useVisits();
  const { data: tasks } = useAllContactTasks();
  const { data: contacts } = useContacts();
  const { data: marketingLeads } = useMarketingLeads();
  const { data: properties } = useProperties();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const propertyMap = useMemo(() => {
    const map = new Map<string, string>();
    (properties || []).forEach((p) => map.set(p.id, p.address));
    return map;
  }, [properties]);

  const contactMap = useMemo(() => {
    const map = new Map<string, { name: string; last_name?: string | null }>();
    (contacts || []).forEach((c) => map.set(c.id, { name: c.name, last_name: c.last_name }));
    return map;
  }, [contacts]);

  const allEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // Visits
    (visits || []).forEach((v) => {
      const d = new Date(v.visit_date);
      const addr = propertyMap.get(v.property_id) || "";
      events.push({
        id: v.id,
        type: "visit",
        title: `Visita - ${v.client_first_name} ${v.client_last_name}`,
        contactName: `${v.client_first_name} ${v.client_last_name}`,
        date: d,
        time: format(d, "HH:mm"),
        link: `/propiedades/${v.property_id}`,
      });
    });

    // Contact tasks
    (tasks || []).forEach((t: any) => {
      const d = new Date(t.due_date);
      const cName = t.contacts?.name || "Sin contacto";
      events.push({
        id: t.id,
        type: "task",
        title: `${t.title} - ${cName}`,
        contactName: cName,
        date: d,
        time: format(d, "HH:mm"),
        link: `/contactos/${t.contact_id}`,
      });
    });

    // Contact next actions
    (contacts || []).filter((c) => c.next_action_date).forEach((c) => {
      const d = new Date(c.next_action_date!);
      const fullName = [c.name, c.last_name].filter(Boolean).join(" ");
      events.push({
        id: c.id,
        type: "contact_action",
        title: `${c.next_action_type || "Acción"} - ${fullName}`,
        contactName: fullName,
        date: d,
        time: format(d, "HH:mm"),
        link: `/contactos/${c.id}`,
      });
    });

    // Marketing lead next actions
    (marketingLeads || []).filter((l) => l.next_action_date).forEach((l) => {
      const d = new Date(l.next_action_date!);
      events.push({
        id: l.id,
        type: "lead_action",
        title: `${l.next_action_type || "Acción"} - ${l.name}`,
        contactName: l.name,
        date: d,
        time: format(d, "HH:mm"),
        link: `/leads/${l.id}`,
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [visits, tasks, contacts, marketingLeads, propertyMap]);

  const todayEvents = useMemo(
    () => allEvents.filter((e) => isSameDay(e.date, now)),
    [allEvents, now]
  );

  const weekEvents = useMemo(
    () => allEvents.filter((e) => isWithinInterval(e.date, { start: weekStart, end: weekEnd })),
    [allEvents, weekStart, weekEnd]
  );

  // Group week events by day
  const weekDays = useMemo(() => {
    const days: { date: Date; label: string; events: CalendarEvent[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push({
        date: d,
        label: format(d, "EEE d", { locale: es }),
        events: weekEvents.filter((e) => isSameDay(e.date, d)),
      });
    }
    return days;
  }, [weekStart, weekEvents]);

  const formatEuro = (value: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Panel de Control</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
      value: String(stats?.total || 0),
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Doc. Incompleta",
      value: String(stats?.incompleteCount || 0),
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: `Facturación ${new Date().getFullYear()}`,
      value: formatEuro(stats?.yearlyRevenue || 0),
      icon: Receipt,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  const typeColors: Record<string, string> = {
    visit: "bg-primary/10 text-primary border-primary/20",
    task: "bg-warning/10 text-warning border-warning/20",
    contact_action: "bg-accent text-accent-foreground border-accent",
    lead_action: "bg-success/10 text-success border-success/20",
  };

  const typeLabels: Record<string, string> = {
    visit: "Visita",
    task: "Tarea",
    contact_action: "Contacto",
    lead_action: "Lead",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">Resumen de tu cartera inmobiliaria</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Calendar Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Hoy — {format(now, "d 'de' MMMM", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">
                No hay eventos programados para hoy
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {todayEvents.map((ev) => (
                  <Link
                    key={`${ev.type}-${ev.id}`}
                    to={ev.link}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center min-w-[48px]">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                      <span className="text-sm font-semibold">{ev.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${typeColors[ev.type]}`}>
                          {typeLabels[ev.type]}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Esta semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-auto">
              {weekDays.map((day) => (
                <div key={day.label}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isSameDay(day.date, now) ? "text-primary" : "text-muted-foreground"}`}>
                    {day.label}
                    {isSameDay(day.date, now) && <span className="ml-1 text-primary">• hoy</span>}
                  </p>
                  {day.events.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/60 pl-2 mb-2">—</p>
                  ) : (
                    <div className="space-y-1 mb-2">
                      {day.events.map((ev) => (
                        <Link
                          key={`${ev.type}-${ev.id}`}
                          to={ev.link}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-sm"
                        >
                          <span className="text-xs text-muted-foreground w-10 shrink-0">{ev.time}</span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.type === "visit" ? "bg-primary" : ev.type === "task" ? "bg-warning" : ev.type === "lead_action" ? "bg-success" : "bg-accent-foreground"}`} />
                          <span className="truncate">{ev.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
