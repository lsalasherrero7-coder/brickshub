import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useContact, useUpdateContact,
  useBuyerProfile, useSuggestedProperties, useDeleteContact,
} from "@/hooks/useContactData";
import { useContactInteractions, useCreateContactInteraction } from "@/hooks/useContactInteractions";
import { usePropertyVisits } from "@/hooks/useVisitData";
import { LEAD_STATUSES, SOURCE_PORTALS, PROPERTY_TYPES, GARAGE_OPTIONS, FLOOR_OPTIONS, TEMPERATURE_TAGS, STATUS_TAGS, TEMPERATURE_TAG_COLORS, STATUS_TAG_COLORS } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import InlineTagSelect from "@/components/InlineTagSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Phone, MapPin, Globe, Building2, Plus, Calendar as CalendarIcon, Mail, Home, ShoppingCart, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";

const ACTION_TYPES = [
  { value: "Llamar", label: "Llamar" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Email", label: "Email" },
  { value: "Reunión", label: "Reunión" },
  { value: "Visita", label: "Visita" },
  { value: "Email marketing", label: "Email marketing" },
  { value: "Invitación a evento", label: "Invitación a evento" },
  { value: "Otro", label: "Otro" },
];

const INTERACTION_TYPES = [
  { value: "llamada", label: "Llamada" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "reunion", label: "Reunión" },
  { value: "visita", label: "Visita" },
  { value: "otro", label: "Otro" },
];

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: contact, isLoading } = useContact(id);
  const { data: buyerProfile } = useBuyerProfile(id);
  const { data: suggestedProperties } = useSuggestedProperties(
    contact?.contact_type === "comprador" ? id : undefined
  );
  const { data: propertyVisits } = usePropertyVisits(contact?.property_id || undefined);
  const { data: interactions } = useContactInteractions(id);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const createInteraction = useCreateContactInteraction();

  const [deleteContactOpen, setDeleteContactOpen] = useState(false);

  // Next action state (vendedor)
  const [actionType, setActionType] = useState("");
  const [actionDate, setActionDate] = useState<Date | undefined>();
  const [actionTime, setActionTime] = useState("10:00");
  const [actionNote, setActionNote] = useState("");

  // Interaction state (vendedor)
  const [intType, setIntType] = useState("llamada");
  const [intNotes, setIntNotes] = useState("");

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!contact) {
    return <div className="text-center py-12 text-muted-foreground">Contacto no encontrado</div>;
  }




  const handleDeleteContact = async (cascades: string[]) => {
    await deleteContact.mutateAsync({ id: contact.id, cascades });
    toast({ title: "Contacto eliminado" });
    navigate("/contactos");
  };

  const handleTagChange = async (field: string, value: string | null) => {
    await updateContact.mutateAsync({ id: contact.id, [field]: value } as any);
    toast({ title: "Etiqueta actualizada" });
  };

  const handleSaveNextAction = async () => {
    if (!actionType || !actionDate) { toast({ title: "Tipo y fecha son obligatorios", variant: "destructive" }); return; }
    const [h, m] = actionTime.split(":").map(Number);
    const dt = new Date(actionDate);
    dt.setHours(h, m, 0, 0);

    await updateContact.mutateAsync({
      id: contact.id,
      next_action_type: actionType,
      next_action_date: dt.toISOString(),
      next_action_note: actionNote || null,
    } as any);

    toast({ title: "Próxima acción guardada y añadida al calendario" });
    setActionType("");
    setActionDate(undefined);
    setActionTime("10:00");
    setActionNote("");
  };

  const handleAddInteraction = async () => {
    if (!intNotes.trim()) { toast({ title: "Escribe una nota", variant: "destructive" }); return; }
    await createInteraction.mutateAsync({ contact_id: contact.id, interaction_type: intType, notes: intNotes });
    toast({ title: "Interacción registrada" });
    setIntNotes("");
  };

  const portalLabel = SOURCE_PORTALS.find((s) => s.value === contact.source_portal)?.label || contact.source_portal;
  const isBuyer = contact.contact_type === "comprador";
  const isVendedor = contact.contact_type === "vendedor";

  const formatEuro = (v: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/contactos")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBuyer ? "bg-info/10" : "bg-primary/10"}`}>
            {isBuyer ? <ShoppingCart className="w-5 h-5 text-info" /> : <Home className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{contact.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{isBuyer ? "Comprador" : "Vendedor"}</Badge>
              <p className="text-muted-foreground text-sm">Detalle del contacto</p>
            </div>
          </div>
        </div>
        <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteContactOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" />Eliminar
        </Button>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">Nombre</p><p className="font-medium">{contact.name}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">Teléfono</p><p className="font-medium">{contact.phone || "—"}</p></div>
            </div>
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{contact.email}</p></div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">Dirección</p><p className="font-medium">{contact.address || "—"}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">Portal</p><p className="font-medium">{portalLabel}</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estado</p>
              <Select
                value={contact.lead_status}
                onValueChange={async (value) => {
                  await updateContact.mutateAsync({ id: contact.id, lead_status: value });
                  toast({ title: "Estado actualizado" });
                }}
              >
                <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {contact.property_id && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Propiedad vinculada</p>
                  <Link to={`/propiedades/${contact.property_id}`} className="text-primary hover:underline text-sm font-medium">Ver propiedad</Link>
                </div>
              </div>
            )}
            {/* Tags editable from detail */}
            <div className="col-span-full flex items-center gap-3 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Etiquetas:</span>
              <InlineTagSelect
                value={contact.temperature_tag}
                options={TEMPERATURE_TAGS}
                colorMap={TEMPERATURE_TAG_COLORS}
                placeholder="+ Temp."
                onChange={(v) => handleTagChange("temperature_tag", v)}
              />
              <InlineTagSelect
                value={contact.status_tag}
                options={STATUS_TAGS}
                colorMap={STATUS_TAG_COLORS}
                placeholder="+ Estado"
                onChange={(v) => handleTagChange("status_tag", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buyer Profile Card */}
      {isBuyer && buyerProfile && (
        <Card>
          <CardHeader><CardTitle className="text-base font-display">Perfil de comprador</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
              {buyerProfile.property_type && (
                <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-medium">{PROPERTY_TYPES.find(t => t.value === buyerProfile.property_type)?.label || buyerProfile.property_type}</p></div>
              )}
              {buyerProfile.bedrooms_min && (
                <div><p className="text-xs text-muted-foreground">Dormitorios</p><p className="font-medium">{buyerProfile.bedrooms_min}+</p></div>
              )}
              {buyerProfile.bathrooms_min && (
                <div><p className="text-xs text-muted-foreground">Baños</p><p className="font-medium">{buyerProfile.bathrooms_min}+</p></div>
              )}
              {(buyerProfile.budget_min || buyerProfile.budget_max) && (
                <div><p className="text-xs text-muted-foreground">Presupuesto</p><p className="font-medium">{buyerProfile.budget_min ? formatEuro(buyerProfile.budget_min) : "—"} - {buyerProfile.budget_max ? formatEuro(buyerProfile.budget_max) : "—"}</p></div>
              )}
              {buyerProfile.garage && buyerProfile.garage !== "indiferente" && (
                <div><p className="text-xs text-muted-foreground">Garaje</p><p className="font-medium">{GARAGE_OPTIONS.find(o => o.value === buyerProfile.garage)?.label}</p></div>
              )}
              {buyerProfile.preferred_floor && buyerProfile.preferred_floor !== "indiferente" && (
                <div><p className="text-xs text-muted-foreground">Planta</p><p className="font-medium">{FLOOR_OPTIONS.find(o => o.value === buyerProfile.preferred_floor)?.label}</p></div>
              )}
              {buyerProfile.preferred_zones && buyerProfile.preferred_zones.length > 0 && (
                <div className="col-span-full">
                  <p className="text-xs text-muted-foreground mb-1">Zonas preferidas</p>
                  <div className="flex flex-wrap gap-1">{buyerProfile.preferred_zones.map((z: string) => <Badge key={z} variant="secondary" className="text-xs">{z}</Badge>)}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendedor: Next Action + Interactions */}
      {isVendedor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próxima Acción */}
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-5 h-5" /> Próxima Acción</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(contact as any).next_action_type && (
                <div className="p-3 rounded-lg bg-muted mb-3">
                  <p className="font-medium text-sm">{(contact as any).next_action_type}</p>
                  {(contact as any).next_action_date && (
                    <p className="text-xs text-muted-foreground">{format(parseISO((contact as any).next_action_date), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                  )}
                  {(contact as any).next_action_note && <p className="text-xs mt-1">{(contact as any).next_action_note}</p>}
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
              <Button className="w-full" onClick={handleSaveNextAction} disabled={updateContact.isPending}>
                Guardar próxima acción
              </Button>
            </CardContent>
          </Card>

          {/* Historial de interacciones */}
          <Card>
            <CardHeader><CardTitle className="text-base">Historial de interacciones</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
      )}

      {/* Tabs */}
      <Tabs defaultValue={contact.property_id ? "visitas" : isBuyer ? "sugeridas" : "visitas"}>
        <TabsList>
          {contact.property_id && <TabsTrigger value="visitas"><Clock className="w-4 h-4 mr-1" />Visitas</TabsTrigger>}
          {isBuyer && <TabsTrigger value="sugeridas"><Building2 className="w-4 h-4 mr-1" />Propiedades sugeridas</TabsTrigger>}
        </TabsList>

        {contact.property_id && (
          <TabsContent value="visitas">
            <Card>
              <CardHeader><CardTitle className="text-base">Visitas programadas</CardTitle></CardHeader>
              <CardContent>
                {propertyVisits && propertyVisits.length > 0 ? (
                  <div className="space-y-3">
                    {propertyVisits.map((visit) => {
                      const statusIcon = visit.status === "completada" ? <CheckCircle className="w-4 h-4 text-success" /> : visit.status === "cancelada" ? <XCircle className="w-4 h-4 text-destructive" /> : <Clock className="w-4 h-4 text-warning" />;
                      return (
                        <div key={visit.id} className="flex items-start gap-3 border rounded-lg p-3">
                          {statusIcon}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{visit.client_first_name} {visit.client_last_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <CalendarIcon className="w-3 h-3" />
                              {format(new Date(visit.visit_date), "dd MMM yyyy HH:mm", { locale: es })}
                            </p>
                            {visit.notes && <p className="text-xs text-muted-foreground mt-1">{visit.notes}</p>}
                          </div>
                          <Badge variant={visit.status === "completada" ? "secondary" : visit.status === "cancelada" ? "destructive" : "outline"} className="text-xs capitalize">
                            {visit.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin visitas registradas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isBuyer && (
          <TabsContent value="sugeridas">
            <Card>
              <CardHeader><CardTitle className="text-base">Propiedades sugeridas</CardTitle></CardHeader>
              <CardContent>
                {suggestedProperties && suggestedProperties.length > 0 ? (
                  <div className="space-y-3">
                    {suggestedProperties.map((p) => (
                      <Link key={p.id} to={`/propiedades/${p.id}`} className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{p.address}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {p.property_type && <span>{PROPERTY_TYPES.find(t => t.value === p.property_type)?.label}</span>}
                              {p.bedrooms != null && <span>{p.bedrooms} hab.</span>}
                              {p.bathrooms != null && <span>{p.bathrooms} baños</span>}
                              {p.surface_area && <span>{p.surface_area} m²</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={p.status} />
                            {p.listing_price && <p className="text-sm font-semibold mt-1">{formatEuro(p.listing_price)}</p>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {buyerProfile ? "No hay propiedades que coincidan con el perfil" : "No hay perfil de comprador configurado"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Delete contact dialog */}
      <DeleteConfirmDialog
        open={deleteContactOpen}
        onOpenChange={setDeleteContactOpen}
        title="¿Eliminar contacto?"
        description="¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer."
        cascadeOptions={[
          { key: "notes", label: "Notas del contacto", defaultChecked: true },
          { key: "tasks", label: "Tareas del contacto", defaultChecked: true },
          { key: "buyer_profile", label: "Perfil de comprador", defaultChecked: true },
        ]}
        onConfirm={handleDeleteContact}
        isPending={deleteContact.isPending}
      />

    </div>
  );
}
