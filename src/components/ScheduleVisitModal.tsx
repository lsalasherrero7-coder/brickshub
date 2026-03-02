import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useProperties } from "@/hooks/usePropertyData";
import { useCreateVisit } from "@/hooks/useVisitData";
import { toast } from "sonner";

interface ScheduleVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledPropertyId?: string;
}

export default function ScheduleVisitModal({ open, onOpenChange, prefilledPropertyId }: ScheduleVisitModalProps) {
  const { data: properties } = useProperties();
  const createVisit = useCreateVisit();

  const [propertyId, setPropertyId] = useState(prefilledPropertyId || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    if (!prefilledPropertyId) setPropertyId("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setDate(undefined);
    setTime("10:00");
    setNotes("");
  };

  const handleSave = async () => {
    if (!propertyId) { toast.error("Selecciona una propiedad"); return; }
    if (!firstName.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (!lastName.trim()) { toast.error("El apellido es obligatorio"); return; }
    if (!date) { toast.error("Selecciona una fecha"); return; }

    const [hours, minutes] = time.split(":").map(Number);
    const visitDate = new Date(date);
    visitDate.setHours(hours, minutes, 0, 0);

    try {
      await createVisit.mutateAsync({
        property_id: propertyId,
        client_first_name: firstName.trim(),
        client_last_name: lastName.trim(),
        client_phone: phone.trim() || undefined,
        visit_date: visitDate.toISOString(),
        notes: notes.trim() || undefined,
      });
      toast.success("Visita agendada correctamente");
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al agendar visita");
    }
  };

  // Filter properties for search
  const propertyOptions = (properties || []).map((p) => ({
    value: p.id,
    label: p.address,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Agendar Visita</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Property selector */}
          <div>
            <Label>Propiedad *</Label>
            {prefilledPropertyId ? (
              <Input
                value={propertyOptions.find((p) => p.value === prefilledPropertyId)?.label || ""}
                disabled
                className="mt-1"
              />
            ) : (
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona una propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {propertyOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Client fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" className="mt-1" />
            </div>
            <div>
              <Label>Apellidos *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellidos" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" className="mt-1" />
          </div>

          {/* Date and time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal mt-1", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Hora *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notas opcionales..." className="mt-1" />
          </div>

          <Button onClick={handleSave} disabled={createVisit.isPending} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {createVisit.isPending ? "Guardando..." : "Guardar Visita"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
