import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useMarketingLead, useUpdateMarketingLead, useLeadInteractions, useCreateInteraction,
  useCampaigns, useDeleteMarketingLead,
} from "@/hooks/useMarketingLeadData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarIcon, Plus, Phone, Mail, Globe, User, Clock, Trash2 } from "lucide-react";
import LinkedContactPanel from "@/components/LinkedContactPanel";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const MKTG_LEAD_STATUSES = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "en_seguimiento", label: "En seguimiento" },
  { value: "convertido", label: "Convertido" },
  { value: "descartado", label: "Descartado" },
];

const INTERACTION_TYPES = [
  { value: "llamada", label: "Llamada" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "reunion", label: "Reunión" },
  { value: "otro", label: "Otro" },
];

const ACTION_TYPES = [
  { value: "Llamar", label: "Llamar" },
  { value: "Email marketing", label: "Email marketing" },
  { value: "Invitación a evento", label: "Invitación a evento" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Reunión", label: "Reunión" },
  { value: "Otro", label: "Otro" },
];

export default function MarketingLeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: lead, isLoading } = useMarketingLead(id);
  const { data: interactions } = useLeadInteractions(id);
  const { data: campaigns } = useCampaigns();
  const updateLead = useUpdateMarketingLead();
  const createInteraction = useCreateInteraction();

  // Interaction form
  const [intType, setIntType] = useState("llamada");
  const [intNotes, setIntNotes] = useState("");

  // Next action form
  const [actionType, setActionType] = useState("");
  const [actionDate, setActionDate] = useState<Date | undefined>();
  const [actionTime, setActionTime] = useState("10:00");
  const [actionNote, setActionNote] = useState("");

  if (isLoading || !lead) return <div className="p-8 animate-pulse"><div className="h-8 bg-muted rounded w-48" /></div>;

  const handleAddInteraction = async () => {
    if (!intNotes.trim()) { toast({ title: "Escribe una nota", variant: "destructive" }); return; }
    await createInteraction.mutateAsync({ lead_id: lead.id, interaction_type: intType, notes: intNotes });
    toast({ title: "Interacción registrada" });
    setIntNotes("");
  };

  const handleSaveNextAction = async () => {
    if (!actionType || !actionDate) { toast({ title: "Tipo y fecha son obligatorios", variant: "destructive" }); return; }
    const [h, m] = actionTime.split(":").map(Number);
    const dt = new Date(actionDate);
    dt.setHours(h, m, 0, 0);

    await updateLead.mutateAsync({
      id: lead.id,
      next_action_type: actionType,
      next_action_date: dt.toISOString(),
      next_action_note: actionNote || null,
    });

    queryClient.invalidateQueries({ queryKey: ["visits"] });
    toast({ title: "Próxima acción guardada y añadida al calendario" });
    setActionType("");
    setActionDate(undefined);
    setActionTime("10:00");
    setActionNote("");
  };

  const handleStatusChange = async (newStatus: string) => {
    // If changing from a non-terminal status and there's no next action set (except descartado), block
    if (newStatus !== "descartado" && newStatus !== "convertido" && !lead.next_action_date && !actionType) {
      toast({ title: "Define una próxima acción antes de cambiar el estado", variant: "destructive" });
      return;
    }

    if (newStatus === "convertido") {
      // Create contact from lead
      const { error } = await supabase.from("contacts").insert({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        contact_type: "comprador",
        source_portal: "manual",
        lead_status: "contactado",
      }).select().single();
      if (!error) {
        // Get the created contact id and link
        const { data: newContact } = await supabase
          .from("contacts")
          .select("id")
          .eq("name", lead.name)
          .eq("phone", lead.phone || "")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (newContact) {
          await updateLead.mutateAsync({ id: lead.id, status: newStatus, contact_id: newContact.id });
          // Copy interactions as contact notes
          if (interactions && interactions.length > 0) {
            const notes = interactions.map((i) => ({
              contact_id: newContact.id,
              content: `[${INTERACTION_TYPES.find((t) => t.value === i.interaction_type)?.label || i.interaction_type}] ${i.notes || ""}`,
            }));
            await supabase.from("contact_notes").insert(notes);
          }
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          toast({ title: "Lead convertido a contacto" });
          return;
        }
      }
    }

    await updateLead.mutateAsync({ id: lead.id, status: newStatus });
    toast({ title: "Estado actualizado" });
  };

  const campaignName = lead.campaign?.name || campaigns?.find((c) => c.id === lead.campaign_id)?.name || "—";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/leads")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{lead.name}</h1>
          <p className="text-muted-foreground text-sm">Lead de marketing</p>
        </div>
        <Select value={lead.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MKTG_LEAD_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Data */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5" /> Datos de contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{lead.phone || "Sin teléfono"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{lead.email || "Sin email"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>Campaña: <strong>{campaignName}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span>Entrada: {format(parseISO(lead.created_at), "dd/MM/yyyy", { locale: es })}</span>
            </div>
            {lead.contact_id && (
              <LinkedContactPanel contactId={lead.contact_id} />
            )}
          </CardContent>
        </Card>

        {/* Next Action */}
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5" /> Próxima Acción</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {lead.next_action_type && (
              <div className="p-3 rounded-lg bg-muted mb-3">
                <p className="font-medium text-sm">{lead.next_action_type}</p>
                {lead.next_action_date && (
                  <p className="text-xs text-muted-foreground">{format(parseISO(lead.next_action_date), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                )}
                {lead.next_action_note && <p className="text-xs mt-1">{lead.next_action_note}</p>}
              </div>
            )}
            <div>
              <Label>Tipo de acción *</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !actionDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {actionDate ? format(actionDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={actionDate} onSelect={setActionDate} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={actionTime} onChange={(e) => setActionTime(e.target.value)} />
            </div>
            <div>
              <Label>Nota (opcional)</Label>
              <Input value={actionNote} onChange={(e) => setActionNote(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSaveNextAction} disabled={updateLead.isPending}>
              Guardar próxima acción
            </Button>
          </CardContent>
        </Card>

        {/* Interaction History */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Historial de interacciones</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Add interaction form */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Select value={intType} onValueChange={setIntType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea placeholder="Notas de la interacción..." value={intNotes} onChange={(e) => setIntNotes(e.target.value)} rows={2} />
              <Button size="sm" onClick={handleAddInteraction} disabled={createInteraction.isPending}>
                <Plus className="w-4 h-4 mr-1" /> Añadir
              </Button>
            </div>

            {/* Interactions list */}
            <div className="space-y-3 max-h-96 overflow-auto">
              {(!interactions || interactions.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin interacciones aún</p>
              ) : interactions.map((i) => (
                <div key={i.id} className="border-l-2 border-primary/30 pl-3 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {INTERACTION_TYPES.find((t) => t.value === i.interaction_type)?.label || i.interaction_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(i.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm">{i.notes}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
