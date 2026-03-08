import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProperty, useCreateProperty, useUpdateProperty } from "@/hooks/usePropertyData";
import { PROPERTY_TYPES, PROPERTY_STATUSES, PAMPLONA_ZONES } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Trash2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import PropertyDocuments from "@/components/PropertyDocuments";
import PropertyPhotos from "@/components/PropertyPhotos";
import PropertyActivity from "@/components/PropertyActivity";
import ScheduleVisitModal from "@/components/ScheduleVisitModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

async function syncOwnerToContacts(propertyId: string, ownerName: string | null, ownerPhone: string | null, ownerEmail: string | null, address: string) {
  if (!ownerName) return;

  // Check if contact with same phone already exists
  if (ownerPhone) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, property_id")
      .eq("phone", ownerPhone)
      .maybeSingle();

    if (existing) {
      // Link property and update info
      await supabase.from("contacts").update({
        name: ownerName,
        email: ownerEmail,
        property_id: propertyId,
        address,
        contact_type: "vendedor",
      }).eq("id", existing.id);
      return;
    }
  }

  // Check if contact already linked to this property
  const { data: linkedContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("property_id", propertyId)
    .eq("contact_type", "vendedor")
    .maybeSingle();

  if (linkedContact) {
    await supabase.from("contacts").update({
      name: ownerName,
      phone: ownerPhone,
      email: ownerEmail,
      address,
    }).eq("id", linkedContact.id);
  } else {
    await supabase.from("contacts").insert({
      name: ownerName,
      phone: ownerPhone,
      email: ownerEmail,
      address,
      contact_type: "vendedor",
      property_id: propertyId,
      source_portal: "manual",
    });
  }
}

export default function PropertyForm() {
  const { id } = useParams();
  const isNew = !id || id === "nueva";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: existing, isLoading } = useProperty(isNew ? undefined : id);

  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();

  const [form, setForm] = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (existing && !initialized) {
    setForm(existing);
    setInitialized(true);
  }

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.address) {
      toast.error("La dirección es obligatoria");
      return;
    }

    try {
      const propertyData = {
        address: form.address,
        surface_area: form.surface_area ? Number(form.surface_area) : null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        floor: form.floor || null,
        property_type: form.property_type || "piso",
        listing_price: form.listing_price ? Number(form.listing_price) : null,
        min_price: form.min_price ? Number(form.min_price) : null,
        commission_pct: form.commission_pct ? Number(form.commission_pct) : 3,
        status: form.status || "disponible",
        owner_name: form.owner_name || null,
        owner_phone: form.owner_phone || null,
        owner_email: form.owner_email || null,
        owner_dni: form.owner_dni || null,
        notes: form.notes || null,
        zone: form.zone || null,
      };

      let savedPropertyId: string;

      if (isNew) {
        const result = await createMutation.mutateAsync(propertyData);
        savedPropertyId = result.id;
        toast.success("Propiedad creada correctamente");
        navigate(`/propiedades/${result.id}`);
      } else {
        await updateMutation.mutateAsync({ id: id!, ...propertyData });
        savedPropertyId = id!;
        toast.success("Propiedad actualizada correctamente");
      }

      // Auto-sync owner to contacts
      if (form.owner_name) {
        await syncOwnerToContacts(savedPropertyId, form.owner_name, form.owner_phone, form.owner_email, form.address);
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
      }
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    }
  };

  const handleDelete = async (cascades: string[]) => {
    setDeleting(true);
    try {
      if (cascades.includes("visits")) {
        await supabase.from("visits").delete().eq("property_id", id!);
      }
      if (cascades.includes("documents")) {
        await supabase.from("property_documents").delete().eq("property_id", id!);
      }
      if (cascades.includes("photos")) {
        await supabase.from("property_photos").delete().eq("property_id", id!);
      }
      if (cascades.includes("contacts")) {
        await supabase.from("contacts").update({ property_id: null }).eq("property_id", id!);
      }
      const { error } = await supabase.from("properties").delete().eq("id", id!);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Propiedad eliminada");
      navigate("/propiedades");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <Card className="animate-pulse"><CardContent className="p-6"><div className="h-64 bg-muted rounded" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/propiedades")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">
              {isNew ? "Nueva Propiedad" : "Editar Propiedad"}
            </h1>
            {!isNew && <p className="text-sm text-muted-foreground mt-0.5">{form.address}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" onClick={() => setScheduleOpen(true)}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Agendar Visita
            </Button>
          )}
          {!isNew && (
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
          <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending || updateMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          {!isNew && <TabsTrigger value="fotos">Fotos</TabsTrigger>}
          {!isNew && <TabsTrigger value="documentos">Documentos</TabsTrigger>}
          {!isNew && <TabsTrigger value="actividad">Actividad</TabsTrigger>}
        </TabsList>

        <TabsContent value="datos" className="mt-6 space-y-6">
          <Card>
            <CardHeader><CardTitle className="font-display text-base">Datos Básicos</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Dirección completa *</Label>
                <Input value={form.address || ""} onChange={(e) => updateField("address", e.target.value)} placeholder="Calle, número, piso, ciudad..." />
              </div>
              <div>
                <Label>Tipo de propiedad</Label>
                <Select value={form.property_type || "piso"} onValueChange={(v) => updateField("property_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status || "disponible"} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROPERTY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zona</Label>
                <Select value={form.zone || ""} onValueChange={(v) => updateField("zone", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar zona" /></SelectTrigger>
                  <SelectContent>{PAMPLONA_ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Superficie (m²)</Label>
                <Input type="number" value={form.surface_area || ""} onChange={(e) => updateField("surface_area", e.target.value)} />
              </div>
              <div>
                <Label>Planta</Label>
                <Input value={form.floor || ""} onChange={(e) => updateField("floor", e.target.value)} placeholder="Ej: 3ª, Bajo, Ático" />
              </div>
              <div>
                <Label>Dormitorios</Label>
                <Input type="number" value={form.bedrooms ?? ""} onChange={(e) => updateField("bedrooms", e.target.value)} />
              </div>
              <div>
                <Label>Baños</Label>
                <Input type="number" value={form.bathrooms ?? ""} onChange={(e) => updateField("bathrooms", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-base">Datos Económicos</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Precio de venta (€)</Label>
                <Input type="number" value={form.listing_price || ""} onChange={(e) => updateField("listing_price", e.target.value)} />
              </div>
              <div>
                <Label>Precio mínimo (€)</Label>
                <Input type="number" value={form.min_price || ""} onChange={(e) => updateField("min_price", e.target.value)} />
              </div>
              <div>
                <Label>Comisión agencia (%)</Label>
                <Input type="number" step="0.1" value={form.commission_pct ?? 3} onChange={(e) => updateField("commission_pct", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-base">Propietario</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nombre</Label><Input value={form.owner_name || ""} onChange={(e) => updateField("owner_name", e.target.value)} /></div>
              <div><Label>DNI/NIE</Label><Input value={form.owner_dni || ""} onChange={(e) => updateField("owner_dni", e.target.value)} /></div>
              <div><Label>Teléfono</Label><Input value={form.owner_phone || ""} onChange={(e) => updateField("owner_phone", e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={form.owner_email || ""} onChange={(e) => updateField("owner_email", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-base">Notas Internas</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={4} value={form.notes || ""} onChange={(e) => updateField("notes", e.target.value)} placeholder="Observaciones internas sobre la propiedad..." />
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && <TabsContent value="fotos" className="mt-6"><PropertyPhotos propertyId={id!} /></TabsContent>}
        {!isNew && <TabsContent value="documentos" className="mt-6"><PropertyDocuments propertyId={id!} /></TabsContent>}
        {!isNew && <TabsContent value="actividad" className="mt-6"><PropertyActivity propertyId={id!} /></TabsContent>}
      </Tabs>

      {!isNew && <ScheduleVisitModal open={scheduleOpen} onOpenChange={setScheduleOpen} prefilledPropertyId={id} />}
      
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
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