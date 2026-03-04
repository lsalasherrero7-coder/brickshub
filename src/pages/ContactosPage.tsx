import { useState, useMemo } from "react";
import { useContacts } from "@/hooks/useContactData";
import { LEAD_STATUSES, SOURCE_PORTALS, CONTACT_TYPES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Search, User, Phone, MapPin, Globe, Plus, ShoppingCart, Home } from "lucide-react";
import AddContactModal from "@/components/AddContactModal";

const statusColors: Record<string, string> = {
  no_contactado: "bg-muted text-muted-foreground",
  llamado: "bg-info/20 text-foreground",
  no_contesta: "bg-warning/20 text-foreground",
  no_interesado: "bg-destructive/20 text-destructive",
  visita_cerrada: "bg-primary/20 text-primary",
  captado: "bg-success/20 text-success",
  descartado: "bg-muted text-muted-foreground",
};

export default function ContactosPage() {
  const { data: contacts, isLoading } = useContacts();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter((c: any) => {
      const matchSearch = !search || [c.name, c.phone, c.address].some((f: any) => f?.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || c.lead_status === statusFilter;
      const matchType = typeFilter === "all" || c.contact_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [contacts, search, statusFilter, typeFilter]);

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Contactos</h1>
          <p className="text-muted-foreground text-sm">{contacts?.length || 0} contactos</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Añadir Contacto
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, teléfono o dirección..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {LEAD_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {CONTACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay contactos aún</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact: any) => (
            <Link key={contact.id} to={`/contactos/${contact.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        {contact.contact_type === "comprador" ? (
                          <ShoppingCart className="w-4 h-4 text-primary" />
                        ) : (
                          <Home className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        {contact.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {contact.contact_type === "comprador" ? "Comprador" : "Vendedor"}
                      </Badge>
                      <Badge className={`text-xs ${statusColors[contact.lead_status] || ""}`}>
                        {LEAD_STATUSES.find((s) => s.value === contact.lead_status)?.label || contact.lead_status}
                      </Badge>
                    </div>
                  </div>
                  {contact.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{contact.address}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    {SOURCE_PORTALS.find((s) => s.value === contact.source_portal)?.label || contact.source_portal}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AddContactModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}