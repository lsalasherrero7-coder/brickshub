import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProperty, useCreateProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/usePropertyData";
import { PROPERTY_TYPES, PROPERTY_STATUSES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PropertyDocuments from "@/components/PropertyDocuments";
import PropertyPhotos from "@/components/PropertyPhotos";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PropertyForm() {
  const { id } = useParams();
  const isNew = !id || id === "nueva";
  const navigate = useNavigate();
  const { data: existing, isLoading } = useProperty(isNew ? undefined : id);

  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();

  const [form, setForm] = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize form from existing data
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
      if (isNew) {
        const result = await createMutation.mutateAsync({
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
        });
        toast.success("Propiedad creada correctamente");
        navigate(`/propiedades/${result.id}`);
      } else {
        await updateMutation.mutateAsync({
          id: id!,
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
        });
        toast.success("Propiedad actualizada correctamente");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      toast.success("Propiedad eliminada");
      navigate("/propiedades");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar");
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar propiedad?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán todos los documentos y fotos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
        </TabsList>

        <TabsContent value="datos" className="mt-6 space-y-6">
          {/* Basic data */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Datos Básicos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Dirección completa *</Label>
                <Input
                  value={form.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Calle, número, piso, ciudad..."
                />
              </div>
              <div>
                <Label>Tipo de propiedad</Label>
                <Select value={form.property_type || "piso"} onValueChange={(v) => updateField("property_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.status || "disponible"} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Superficie (m²)</Label>
                <Input
                  type="number"
                  value={form.surface_area || ""}
                  onChange={(e) => updateField("surface_area", e.target.value)}
                />
              </div>
              <div>
                <Label>Planta</Label>
                <Input
                  value={form.floor || ""}
                  onChange={(e) => updateField("floor", e.target.value)}
                  placeholder="Ej: 3ª, Bajo, Ático"
                />
              </div>
              <div>
                <Label>Dormitorios</Label>
                <Input
                  type="number"
                  value={form.bedrooms ?? ""}
                  onChange={(e) => updateField("bedrooms", e.target.value)}
                />
              </div>
              <div>
                <Label>Baños</Label>
                <Input
                  type="number"
                  value={form.bathrooms ?? ""}
                  onChange={(e) => updateField("bathrooms", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Economic data */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Datos Económicos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Precio de venta (€)</Label>
                <Input
                  type="number"
                  value={form.listing_price || ""}
                  onChange={(e) => updateField("listing_price", e.target.value)}
                />
              </div>
              <div>
                <Label>Precio mínimo (€)</Label>
                <Input
                  type="number"
                  value={form.min_price || ""}
                  onChange={(e) => updateField("min_price", e.target.value)}
                />
              </div>
              <div>
                <Label>Comisión agencia (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.commission_pct ?? 3}
                  onChange={(e) => updateField("commission_pct", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Owner */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Propietario</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={form.owner_name || ""} onChange={(e) => updateField("owner_name", e.target.value)} />
              </div>
              <div>
                <Label>DNI/NIE</Label>
                <Input value={form.owner_dni || ""} onChange={(e) => updateField("owner_dni", e.target.value)} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.owner_phone || ""} onChange={(e) => updateField("owner_phone", e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.owner_email || ""}
                  onChange={(e) => updateField("owner_email", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Notas Internas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={form.notes || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Observaciones internas sobre la propiedad..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {!isNew && (
          <TabsContent value="fotos" className="mt-6">
            <PropertyPhotos propertyId={id!} />
          </TabsContent>
        )}

        {!isNew && (
          <TabsContent value="documentos" className="mt-6">
            <PropertyDocuments propertyId={id!} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
