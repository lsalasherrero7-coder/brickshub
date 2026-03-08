import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useMarketingLeads, useCampaigns, useCreateMarketingLead, useCreateCampaign, useDeleteCampaign, useDeleteMarketingLead, useUpdateMarketingLead } from "@/hooks/useMarketingLeadData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Search, Settings, Trash2, ArrowUpDown, Pencil, UserPlus } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import AddContactModal, { type ContactPrefill } from "@/components/AddContactModal";
import type { MarketingLead } from "@/hooks/useMarketingLeadData";

const MKTG_LEAD_STATUSES = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "en_seguimiento", label: "En seguimiento" },
  { value: "convertido", label: "Convertido" },
  { value: "descartado", label: "Descartado" },
];

const statusColors: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  contactado: "bg-yellow-100 text-yellow-800",
  en_seguimiento: "bg-purple-100 text-purple-800",
  convertido: "bg-green-100 text-green-800",
  descartado: "bg-gray-100 text-gray-800",
};

type SortField = "created_at" | "next_action_date";
type SortDir = "asc" | "desc";

export default function MarketingLeadsPage() {
  const { data: leads, isLoading } = useMarketingLeads();
  const { data: campaigns } = useCampaigns();
  const createLead = useCreateMarketingLead();
  const createCampaign = useCreateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const deleteMarketingLead = useDeleteMarketingLead();
  const updateMarketingLead = useUpdateMarketingLead();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [campaignsOpen, setCampaignsOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [form, setForm] = useState({ name: "", phone: "", email: "", campaign_id: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", phone: "", email: "", campaign_id: "" });

  // Add to contacts modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactPrefill, setContactPrefill] = useState<ContactPrefill | undefined>();

  const handleAddToContacts = (lead: MarketingLead) => {
    setContactPrefill({
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      address: lead.address || "",
      municipality: lead.municipality || "",
      marketing_lead_id: lead.id,
    });
    setContactModalOpen(true);
  };

  const filtered = useMemo(() => {
    if (!leads) return [];
    let result = leads.filter((l) => {
      const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const matchCampaign = campaignFilter === "all" || l.campaign_id === campaignFilter;
      return matchSearch && matchStatus && matchCampaign;
    });
    result.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return result;
  }, [leads, search, statusFilter, campaignFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleAdd = async () => {
    if (!form.name || !form.campaign_id) { toast({ title: "Nombre y campaña son obligatorios", variant: "destructive" }); return; }
    await createLead.mutateAsync({ name: form.name, phone: form.phone || undefined, email: form.email || undefined, campaign_id: form.campaign_id });
    toast({ title: "Lead creado" });
    setForm({ name: "", phone: "", email: "", campaign_id: "" });
    setAddOpen(false);
  };

  const handleAddCampaign = async () => {
    if (!newCampaignName.trim()) return;
    await createCampaign.mutateAsync(newCampaignName.trim());
    toast({ title: "Campaña añadida" });
    setNewCampaignName("");
  };

  const handleEditLead = async () => {
    if (!editForm.name || !editForm.campaign_id) return;
    await updateMarketingLead.mutateAsync({
      id: editForm.id,
      name: editForm.name,
      phone: editForm.phone || null,
      email: editForm.email || null,
      campaign_id: editForm.campaign_id,
    });
    toast({ title: "Lead actualizado" });
    setEditOpen(false);
  };

  const handleDeleteLead = async () => {
    if (!deleteId) return;
    await deleteMarketingLead.mutateAsync(deleteId);
    toast({ title: "Lead eliminado" });
    setDeleteId(null);
  };

  if (isLoading) return <div className="p-8 animate-pulse"><div className="h-8 bg-muted rounded w-48 mb-4" /><div className="h-64 bg-muted rounded" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Leads Marketing</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCampaignsOpen(true)}>
            <Settings className="w-4 h-4 mr-1" /> Campañas
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {MKTG_LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Campaña" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {(campaigns || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Campaña</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                  <span className="flex items-center gap-1">Entrada <ArrowUpDown className="w-3 h-3" /></span>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Próx. acción</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("next_action_date")}>
                  <span className="flex items-center gap-1">Fecha acción <ArrowUpDown className="w-3 h-3" /></span>
                 </TableHead>
                 <TableHead className="w-[80px]"></TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No hay leads</TableCell></TableRow>
              ) : filtered.map((lead) => {
                const actionDate = lead.next_action_date ? parseISO(lead.next_action_date) : null;
                const isOverdue = actionDate && isPast(actionDate) && !isToday(actionDate) && !["convertido", "descartado"].includes(lead.status);
                const isDueToday = actionDate && isToday(actionDate);
                return (
                  <TableRow key={lead.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link to={`/leads/${lead.id}`} className="font-medium text-primary hover:underline">{lead.name}</Link>
                    </TableCell>
                    <TableCell>{lead.phone || "—"}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{lead.email || "—"}</TableCell>
                    <TableCell>{lead.campaign?.name || "—"}</TableCell>
                    <TableCell>{format(parseISO(lead.created_at), "dd/MM/yyyy", { locale: es })}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status] || ""}>{MKTG_LEAD_STATUSES.find((s) => s.value === lead.status)?.label || lead.status}</Badge>
                    </TableCell>
                    <TableCell>{lead.next_action_type || "—"}</TableCell>
                    <TableCell>
                      {actionDate ? (
                        <span className={isOverdue ? "text-destructive font-semibold" : isDueToday ? "text-warning font-semibold" : ""}>
                          {format(actionDate, "dd/MM/yyyy HH:mm", { locale: es })}
                        </span>
                      ) : "—"}
                     </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditForm({ id: lead.id, name: lead.name, phone: lead.phone || "", email: lead.email || "", campaign_id: lead.campaign_id }); setEditOpen(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(lead.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                   </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add lead dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div>
              <Label>Campaña *</Label>
              <Select value={form.campaign_id} onValueChange={(v) => setForm({ ...form, campaign_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar campaña" /></SelectTrigger>
                <SelectContent>
                  {(campaigns || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={createLead.isPending}>Crear Lead</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaigns manager dialog */}
      <Dialog open={campaignsOpen} onOpenChange={setCampaignsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gestionar Campañas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Nueva campaña..." value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} />
              <Button size="sm" onClick={handleAddCampaign}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-auto">
              {(campaigns || []).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">{c.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteCampaign.mutateAsync(c.id).then(() => toast({ title: "Campaña eliminada" }))}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit lead dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Lead</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>Teléfono</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
            <div>
              <Label>Campaña *</Label>
              <Select value={editForm.campaign_id} onValueChange={(v) => setEditForm({ ...editForm, campaign_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar campaña" /></SelectTrigger>
                <SelectContent>
                  {(campaigns || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleEditLead} disabled={updateMarketingLead.isPending}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete lead dialog */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar lead de marketing?"
        description="¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer. El contacto vinculado (si existe) no será eliminado."
        onConfirm={handleDeleteLead}
        isPending={deleteMarketingLead.isPending}
      />
    </div>
  );
}
