import { useState, useMemo } from "react";
import { useContacts, useUpdateContact, useDeleteContact } from "@/hooks/useContactData";
import { LEAD_STATUSES, SOURCE_PORTALS, CONTACT_TYPES, TEMPERATURE_TAGS, STATUS_TAGS, TEMPERATURE_TAG_COLORS, STATUS_TAG_COLORS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Search, Phone, MapPin, Globe, Plus, ShoppingCart, Home, Trash2, Pencil, Building2 } from "lucide-react";
import AddContactModal from "@/components/AddContactModal";
import InlineTagSelect from "@/components/InlineTagSelect";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  no_contactado: "bg-muted text-muted-foreground",
  llamado: "bg-info/20 text-foreground",
  no_contesta: "bg-warning/20 text-foreground",
  no_interesado: "bg-destructive/20 text-destructive",
  visita_cerrada: "bg-primary/20 text-primary",
  captado: "bg-success/20 text-success",
  descartado: "bg-muted text-muted-foreground",
};

function ContactCard({ contact, onTagChange, onDelete, navigate }: {
  contact: any;
  onTagChange: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
  navigate: (path: string) => void;
}) {
  const isBuyer = contact.contact_type === "comprador";
  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <Link to={`/contactos/${contact.id}`} className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {isBuyer ? <ShoppingCart className="w-4 h-4 text-primary" /> : <Home className="w-4 h-4 text-primary" />}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{contact.name}</p>
              {contact.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</p>}
            </div>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/contactos/${contact.id}`)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(contact.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <Badge className={`text-xs ${statusColors[contact.lead_status] || ""}`}>
            {LEAD_STATUSES.find((s) => s.value === contact.lead_status)?.label || contact.lead_status}
          </Badge>
        </div>

        {/* Inline editable tags */}
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.preventDefault()}>
          <InlineTagSelect
            value={contact.temperature_tag}
            options={TEMPERATURE_TAGS}
            colorMap={TEMPERATURE_TAG_COLORS}
            placeholder="+ Temp."
            onChange={(v) => onTagChange(contact.id, "temperature_tag", v)}
          />
          <InlineTagSelect
            value={contact.status_tag}
            options={STATUS_TAGS}
            colorMap={STATUS_TAG_COLORS}
            placeholder="+ Estado"
            onChange={(v) => onTagChange(contact.id, "status_tag", v)}
          />
        </div>

        {contact.address && (
          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{contact.address}</p>
        )}

        {/* Vendedor: show origin */}
        {!isBuyer && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            {SOURCE_PORTALS.find((s) => s.value === contact.source_portal)?.label || contact.source_portal}
          </div>
        )}

        {/* Vendedor: show linked property */}
        {!isBuyer && contact.property_id && (
          <Link to={`/propiedades/${contact.property_id}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
            <Building2 className="w-3 h-3" /> Ver propiedad vinculada
          </Link>
        )}

        {/* Link back to origin lead/captacion */}
        {contact.lead_id && (
          <Link to={`/captacion`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            <Globe className="w-3 h-3" /> Desde captación
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContactosPage() {
  const { data: contacts, isLoading } = useContacts();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tempTagFilter, setTempTagFilter] = useState("all");
  const [statusTagFilter, setStatusTagFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleTagChange = async (contactId: string, field: string, value: string) => {
    try {
      await updateContact.mutateAsync({ id: contactId, [field]: value } as any);
      toast({ title: "Etiqueta actualizada" });
    } catch {
      toast({ title: "Error al actualizar", variant: "destructive" });
    }
  };

  const handleDelete = async (cascades: string[]) => {
    if (!deleteId) return;
    try {
      await deleteContact.mutateAsync({ id: deleteId, cascades });
      toast({ title: "Contacto eliminado" });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const filterContacts = (type: string) => {
    if (!contacts) return [];
    return contacts.filter((c: any) => {
      if (c.contact_type !== type) return false;
      const matchSearch = !search || [c.name, c.phone, c.address].some((f: any) => f?.toLowerCase().includes(search.toLowerCase()));
      const matchTempTag = tempTagFilter === "all" || c.temperature_tag === tempTagFilter;
      const matchStatusTag = statusTagFilter === "all" || c.status_tag === statusTagFilter;
      return matchSearch && matchTempTag && matchStatusTag;
    });
  };

  const compradores = useMemo(() => filterContacts("comprador"), [contacts, search, tempTagFilter, statusTagFilter]);
  const vendedores = useMemo(() => filterContacts("vendedor"), [contacts, search, tempTagFilter, statusTagFilter]);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  const renderGrid = (list: any[]) => (
    list.length === 0 ? (
      <Card><CardContent className="py-12 text-center text-muted-foreground">No hay contactos en esta categoría</CardContent></Card>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((contact: any) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onTagChange={handleTagChange}
            onDelete={setDeleteId}
            navigate={navigate}
          />
        ))}
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Contactos</h1>
          <p className="text-muted-foreground text-sm">{contacts?.length || 0} contactos</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />Añadir Contacto
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, teléfono o dirección..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tempTagFilter} onValueChange={setTempTagFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Temperatura" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas temp.</SelectItem>
            {TEMPERATURE_TAGS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusTagFilter} onValueChange={setStatusTagFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Etiqueta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etiq.</SelectItem>
            {STATUS_TAGS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="compradores">
        <TabsList>
          <TabsTrigger value="compradores">
            <ShoppingCart className="w-4 h-4 mr-1" />Compradores ({compradores.length})
          </TabsTrigger>
          <TabsTrigger value="vendedores">
            <Home className="w-4 h-4 mr-1" />Vendedores ({vendedores.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="compradores">
          {renderGrid(compradores)}
        </TabsContent>
        <TabsContent value="vendedores">
          {renderGrid(vendedores)}
        </TabsContent>
      </Tabs>

      <AddContactModal open={addOpen} onOpenChange={setAddOpen} />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar contacto?"
        description="¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer."
        cascadeOptions={[
          { key: "notes", label: "Notas del contacto", defaultChecked: true },
          { key: "tasks", label: "Tareas del contacto", defaultChecked: true },
          { key: "buyer_profile", label: "Perfil de comprador", defaultChecked: true },
        ]}
        onConfirm={handleDelete}
        isPending={deleteContact.isPending}
      />
    </div>
  );
}
