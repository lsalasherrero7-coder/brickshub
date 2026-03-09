import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarEventType = "visit" | "task" | "lead_action" | "contact_action";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: Date;
  time: string;
  title: string;
  notes?: string;
  // For tasks
  contact_id?: string;
  // For lead actions
  lead_id?: string;
  action_type?: string;
}

interface CalendarEventEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onSave: (event: CalendarEvent) => Promise<void>;
  isPending?: boolean;
}

export default function CalendarEventEditModal({
  open,
  onOpenChange,
  event,
  onSave,
  isPending,
}: CalendarEventEditModalProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (event && open) {
      setDate(event.date);
      setTime(event.time);
      setTitle(event.title);
      setNotes(event.notes || "");
    }
  }, [event, open]);

  const handleSave = async () => {
    if (!event || !date) return;
    await onSave({
      ...event,
      date,
      time,
      title,
      notes,
    });
  };

  const getTypeLabel = (type: CalendarEventType) => {
    switch (type) {
      case "visit": return "Visita";
      case "task": return "Tarea";
      case "lead_action": return "Acción Lead Marketing";
      case "contact_action": return "Próxima Acción Contacto";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Editar {event ? getTypeLabel(event.type) : "Evento"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Title - only editable for tasks */}
          {event?.type === "task" && (
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label>Hora</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !date}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
