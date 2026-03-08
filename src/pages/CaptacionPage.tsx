import { useState, useMemo } from "react";
import { useLeads, useCreateLead, useUpdateLeadStatus, useUpdateLead, useDeleteLead } from "@/hooks/useLeadData";
import { useProperties } from "@/hooks/usePropertyData";
import { useCreateVisit } from "@/hooks/useVisitData";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUSES, ADVERTISER_TYPES, SOURCE_PORTALS } from "@/lib/types";
import type { Lead } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ExternalLink, Link2, CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

const statusColors: Record<string, string> = {
  no_contactado: "bg-muted text-muted-foreground",
  llamado: "bg-info/20 text-info-foreground",
  no_contesta: "bg-warning/20 text-warning-foreground",
  no_interesado: "bg-destructive/20 text-destructive",
  visita_cerrada: "bg-primary/20 text-primary",
  captado: "bg-success/20 text-success",
  descartado: "bg-muted text-muted-foreground line-through",
};

export default function CaptacionPage() {
  const { data: leads, isLoading } = useLeads();
  const { data: properties } = useProperties();
  const createLead = useCreateLead();
  const updateStatus = useUpdateLeadStatus();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createVisit = useCreateVisit();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newLead, setNewLead] = useState({ address: "", listing_url: "", advertiser_type: "propietario", name: "", phone: "", source_portal: "manual" });
  const [editOpen, setEditOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Visit scheduling modal state
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [pendingVisitLead, setPendingVisitLead] = useState<Lead | null>(null);
  const [visitDate, setVisitDate] = useState<Date>();
  const [visitTime, setVisitTime] = useState("10:00");
  const [visitNotes, setVisitNotes] = useState("");

  const filtered = useMemo(() => {
    if (!leads) return [];
    return leads.filter((l) => {
      const matchSearch = !search || [l.address, l.name, l.phone].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || l.lead_status === statusFilter;
      const matchType = typeFilter === "all" || l.advertiser_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [leads, search, statusFilter, typeFilter]);

  // Check if address matches existing property
  const propertyMatch = useMemo(() => {
    if (!properties) return new Map<string, string>();
    const map = new Map<string, string>();
    properties.forEach((p) => {
      map.set(p.address.toLowerCase().trim(), p.id);
    });
    return map;
  }, [properties]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const lead = leads?.find((l) => l.id === leadId);
    if (!lead) return;

    // Intercept "visita_cerrada" to open scheduling modal
    if (newStatus === "visita_cerrada") {
      setPendingVisitLead(lead);
      setVisitDate(undefined);
      setVisitTime("10:00");
      setVisitNotes("");
      setVisitModalOpen(true);
      return;
    }

    await executeStatusChange(lead, newStatus);
  };

  const executeStatusChange = async (lead: Lead, newStatus: string) => {
    const leadId = lead.id;
    const oldStatus = lead.lead_status;

    try {
      await updateStatus.mutateAsync({ id: leadId, lead_status: newStatus });

      // Auto-create contact if moving from no_contactado to any other status
      if (oldStatus === "no_contactado" && newStatus !== "no_contactado") {
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id")
          .eq("lead_id", leadId)
          .maybeSingle();

        if (!existingContact) {
          await supabase.from("contacts").insert({
            name: lead.name || "Sin nombre",
            phone: lead.phone,
            address: lead.address,
            lead_status: newStatus,
            source_portal: lead.source_portal,
            lead_id: leadId,
          });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          toast({ title: "Contacto creado", description: `${lead.name || "Sin nombre"} añadido a Contactos` });
        } else {
          // Update existing contact status
          await supabase.from("contacts").update({ lead_status: newStatus }).eq("lead_id", leadId);
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
        }
      } else if (oldStatus !== "no_contactado") {
        // Update contact status if it exists
        await supabase.from("contacts").update({ lead_status: newStatus }).eq("lead_id", leadId);
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
      }

      // Auto-create property when status is "captado"
      if (newStatus === "captado") {
        const { data: newProperty, error } = await supabase
          .from("properties")
          .insert({
            address: lead.address,
            owner_name: lead.name,
            owner_phone: lead.phone,
            status: "disponible",
          })
          .select()
          .single();

        if (!error && newProperty) {
          // Link property to lead and contact
          await supabase.from("leads").update({ property_id: newProperty.id }).eq("id", leadId);
          await supabase.from("contacts").update({ property_id: newProperty.id }).eq("lead_id", leadId);
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          queryClient.invalidateQueries({ queryKey: ["contacts"] });
          queryClient.invalidateQueries({ queryKey: ["properties"] });
          toast({ title: "Propiedad creada", description: `"${lead.address}" añadida al portfolio con ${lead.name || "propietario"} como contacto.` });
        }
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el estado", variant: "destructive" });
    }
  };

  const handleConfirmVisit = async () => {
    if (!pendingVisitLead || !visitDate) return;
    const lead = pendingVisitLead;

    try {
      // First execute the status change
      await executeStatusChange(lead, "visita_cerrada");

      // Find or determine property_id
      const propertyId = lead.property_id || propertyMatch.get(lead.address.toLowerCase().trim());

      if (propertyId) {
        const [hours, minutes] = visitTime.split(":").map(Number);
        const dateTime = new Date(visitDate);
        dateTime.setHours(hours, minutes, 0, 0);

        await createVisit.mutateAsync({
          property_id: propertyId,
          client_first_name: lead.name || "Sin nombre",
          client_last_name: "",
          client_phone: lead.phone || undefined,
          visit_date: dateTime.toISOString(),
          notes: visitNotes.trim() || undefined,
        });
        toast({ title: "Visita agendada", description: `Visita programada para ${format(dateTime, "dd/MM/yyyy HH:mm")}` });
      } else {
        toast({ title: "Estado actualizado", description: "No se encontró propiedad vinculada para crear la visita en el calendario." });
      }
    } catch {
      toast({ title: "Error", description: "No se pudo agendar la visita", variant: "destructive" });
    } finally {
      setVisitModalOpen(false);
      setPendingVisitLead(null);
    }
  };

  const handleAddLead = async () => {
    if (!newLead.address.trim()) return;
    try {
      await createLead.mutateAsync(newLead);
      setAddOpen(false);
      setNewLead({ address: "", listing_url: "", advertiser_type: "propietario", name: "", phone: "", source_portal: "manual" });
      toast({ title: "Lead añadido" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Captación</h1>
          <p className="text-muted-foreground text-sm">{leads?.length || 0} leads en total</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por dirección, nombre o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {ADVERTISER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dirección</TableHead>
                <TableHead>Enlace</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay leads</TableCell></TableRow>
              ) : (
                filtered.map((lead) => {
                  const matchedPropertyId = propertyMatch.get(lead.address.toLowerCase().trim());
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {lead.address}
                          {(matchedPropertyId || lead.property_id) && (
                            <a href={`/propiedades/${matchedPropertyId || lead.property_id}`} title="Ya existe en el portfolio">
                              <Link2 className="w-4 h-4 text-primary" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.listing_url ? (
                          <a href={lead.listing_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Ver
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ADVERTISER_TYPES.find((t) => t.value === lead.advertiser_type)?.label || lead.advertiser_type}</Badge>
                      </TableCell>
                      <TableCell>{lead.name || "—"}</TableCell>
                      <TableCell>{lead.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{SOURCE_PORTALS.find((s) => s.value === lead.source_portal)?.label || lead.source_portal}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={lead.lead_status} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Lead Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Dirección *</Label><Input value={newLead.address} onChange={(e) => setNewLead({ ...newLead, address: e.target.value })} /></div>
            <div><Label>Enlace al anuncio</Label><Input value={newLead.listing_url} onChange={(e) => setNewLead({ ...newLead, listing_url: e.target.value })} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de anunciante</Label>
                <Select value={newLead.advertiser_type} onValueChange={(v) => setNewLead({ ...newLead, advertiser_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ADVERTISER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Portal de origen</Label>
                <Select value={newLead.source_portal} onValueChange={(v) => setNewLead({ ...newLead, source_portal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCE_PORTALS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Nombre</Label><Input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddLead} disabled={!newLead.address.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Visit Dialog */}
      <Dialog open={visitModalOpen} onOpenChange={(open) => { if (!open) { setVisitModalOpen(false); setPendingVisitLead(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Agendar Visita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Dirección</Label>
              <p className="font-medium text-sm">{pendingVisitLead?.address}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Cliente</Label>
              <p className="font-medium text-sm">{pendingVisitLead?.name || "Sin nombre"} {pendingVisitLead?.phone ? `· ${pendingVisitLead.phone}` : ""}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !visitDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {visitDate ? format(visitDate, "dd/MM/yyyy") : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={visitDate} onSelect={setVisitDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Hora *</Label>
                <Input type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} rows={2} placeholder="Notas opcionales..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setVisitModalOpen(false); setPendingVisitLead(null); }}>Cancelar</Button>
            <Button onClick={handleConfirmVisit} disabled={!visitDate || createVisit.isPending}>
              {createVisit.isPending ? "Agendando..." : "Confirmar Visita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
