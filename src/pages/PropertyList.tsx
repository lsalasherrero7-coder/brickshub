import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProperties } from "@/hooks/usePropertyData";
import { usePropertyStats } from "@/hooks/usePropertyData";
import { PROPERTY_TYPES, PROPERTY_STATUSES } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, LayoutGrid, List, Home, MapPin, Bed, Bath, Ruler, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

export default function PropertyList() {
  const { data: properties, isLoading } = useProperties();
  const { data: stats } = usePropertyStats();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!properties) return [];
    return properties.filter((p) => {
      const matchSearch =
        !search ||
        p.address.toLowerCase().includes(search.toLowerCase()) ||
        (p.owner_name && p.owner_name.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchType = typeFilter === "all" || p.property_type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [properties, search, statusFilter, typeFilter]);

  const getMissingDocsCount = (propertyId: string) => {
    if (!stats?.docsMap || !stats?.requiredDocs) return 6;
    const docs = stats.docsMap.get(propertyId) || new Set<string>();
    return stats.requiredDocs.filter((d) => !docs.has(d)).length;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "—";
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  };

  const handleDelete = async (cascades: string[]) => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      if (cascades.includes("visits")) await supabase.from("visits").delete().eq("property_id", deleteId);
      if (cascades.includes("documents")) await supabase.from("property_documents").delete().eq("property_id", deleteId);
      if (cascades.includes("photos")) await supabase.from("property_photos").delete().eq("property_id", deleteId);
      if (cascades.includes("contacts")) await supabase.from("contacts").update({ property_id: null }).eq("property_id", deleteId);
      const { error } = await supabase.from("properties").delete().eq("id", deleteId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Propiedad eliminada");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Propiedades</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} propiedades encontradas</p>
        </div>
        <Link to="/propiedades/nueva">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Propiedad
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por dirección o propietario..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {PROPERTY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-lg p-1">
              <button onClick={() => setViewMode("table")} className={`p-1.5 rounded ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("cards")} className={`p-1.5 rounded ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-12 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : viewMode === "table" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dirección</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead className="text-center">Docs</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No se encontraron propiedades</TableCell></TableRow>
              ) : filtered.map((p) => {
                const missingDocs = getMissingDocsCount(p.id);
                return (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link to={`/propiedades/${p.id}`} className="font-medium text-foreground hover:text-primary">{p.address}</Link>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        {p.surface_area && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{p.surface_area} m²</span>}
                        {p.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms}</span>}
                        {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{PROPERTY_TYPES.find((t) => t.value === p.property_type)?.label || p.property_type}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right font-medium">{formatPrice(p.listing_price)}</TableCell>
                    <TableCell className="text-sm">{p.owner_name || "—"}</TableCell>
                    <TableCell className="text-center">
                      {missingDocs > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                          <AlertTriangle className="w-3 h-3" />{missingDocs}
                        </span>
                      ) : <span className="text-xs text-success font-medium">✓</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); navigate(`/propiedades/${p.id}`); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.preventDefault(); setDeleteId(p.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const missingDocs = getMissingDocsCount(p.id);
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <StatusBadge status={p.status} />
                    <div className="flex items-center gap-1">
                      {missingDocs > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                          <AlertTriangle className="w-3 h-3" />{missingDocs} docs
                        </span>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/propiedades/${p.id}`)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Link to={`/propiedades/${p.id}`}>
                    <h3 className="font-semibold text-sm mb-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />{p.address}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      {p.surface_area && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{p.surface_area} m²</span>}
                      {p.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{p.bedrooms} hab.</span>}
                      {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{p.bathrooms} baños</span>}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <p className="text-lg font-display font-bold">{formatPrice(p.listing_price)}</p>
                      <p className="text-xs text-muted-foreground">{p.owner_name || "Sin propietario"}</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar propiedad?"
        description="¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer."
        cascadeOptions={[
          { key: "visits", label: "Visitas vinculadas", defaultChecked: true },
          { key: "documents", label: "Documentos asociados", defaultChecked: true },
          { key: "photos", label: "Fotos asociadas", defaultChecked: true },
          { key: "contacts", label: "Desvincular contacto propietario (no se elimina)", defaultChecked: false },
        ]}
        onConfirm={handleDelete}
        isPending={deleting}
      />
    </div>
  );
}
