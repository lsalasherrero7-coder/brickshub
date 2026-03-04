import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PROPERTY_TYPES, CONTACT_TYPES, GARAGE_OPTIONS, FLOOR_OPTIONS, PAMPLONA_ZONES } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useProperties } from "@/hooks/usePropertyData";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Link2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddContactModal({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { data: properties } = useProperties();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", last_name: "", phone: "", email: "",
    contact_type: "comprador" as string,
    // Vendedor fields
    address: "",
    // Buyer profile fields
    property_type: "", bedrooms_min: "", bathrooms_min: "",
    budget_min: "", budget_max: "",
    garage: "indiferente", preferred_floor: "indiferente",
    preferred_zones: [] as string[],
  });

  const matchedProperty = useMemo(() => {
    if (form.contact_type !== "vendedor" || !form.address || !properties) return null;
    return properties.find((p) => p.address.toLowerCase().trim() === form.address.toLowerCase().trim());
  }, [form.contact_type, form.address, properties]);

  const toggleZone = (zone: string) => {
    setForm((prev) => ({
      ...prev,
      preferred_zones: prev.preferred_zones.includes(zone)
        ? prev.preferred_zones.filter((z) => z !== zone)
        : [...prev.preferred_zones, zone],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);

    try {
      const fullName = [form.name, form.last_name].filter(Boolean).join(" ");

      // Create contact
      const { data: contact, error } = await supabase.from("contacts").insert({
        name: fullName,
        last_name: form.last_name || null,
        phone: form.phone || null,
        email: form.email || null,
        contact_type: form.contact_type,
        address: form.contact_type === "vendedor" ? form.address || null : null,
        property_id: matchedProperty?.id || null,
        source_portal: "manual",
      }).select().single();

      if (error) throw error;

      // If buyer, create buyer profile
      if (form.contact_type === "comprador" && contact) {
        await supabase.from("buyer_profiles").insert({
          contact_id: contact.id,
          property_type: form.property_type || null,
          bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
          bathrooms_min: form.bathrooms_min ? Number(form.bathrooms_min) : null,
          budget_min: form.budget_min ? Number(form.budget_min) : null,
          budget_max: form.budget_max ? Number(form.budget_max) : null,
          garage: form.garage,
          preferred_floor: form.preferred_floor,
          preferred_zones: form.preferred_zones,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contacto creado correctamente");
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Error al crear contacto");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "", last_name: "", phone: "", email: "",
      contact_type: "comprador", address: "",
      property_type: "", bedrooms_min: "", bathrooms_min: "",
      budget_min: "", budget_max: "",
      garage: "indiferente", preferred_floor: "indiferente",
      preferred_zones: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Añadir Contacto</DialogTitle></DialogHeader>

        <div className="space-y-4">
          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Apellidos</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>

          {/* Contact type */}
          <div>
            <Label>Tipo de contacto</Label>
            <Select value={form.contact_type} onValueChange={(v) => setForm({ ...form, contact_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Vendedor fields */}
          {form.contact_type === "vendedor" && (
            <div>
              <Label>Dirección de la propiedad</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección de la propiedad..." />
              {matchedProperty && (
                <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                  <Link2 className="w-4 h-4" />
                  <span>Coincide con propiedad existente: {matchedProperty.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Comprador fields */}
          {form.contact_type === "comprador" && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-foreground">Perfil de comprador</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de propiedad</Label>
                  <Select value={form.property_type} onValueChange={(v) => setForm({ ...form, property_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.filter(t => ["piso","casa","local","terreno"].includes(t.value)).map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dormitorios</Label>
                  <Select value={form.bedrooms_min} onValueChange={(v) => setForm({ ...form, bedrooms_min: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["1","2","3","4"].map((v) => <SelectItem key={v} value={v}>{v === "4" ? "4+" : v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Baños</Label>
                  <Select value={form.bathrooms_min} onValueChange={(v) => setForm({ ...form, bathrooms_min: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {["1","2","3"].map((v) => <SelectItem key={v} value={v}>{v === "3" ? "3+" : v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Garaje</Label>
                  <Select value={form.garage} onValueChange={(v) => setForm({ ...form, garage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GARAGE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Presupuesto mín (€)</Label><Input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} /></div>
                <div><Label>Presupuesto máx (€)</Label><Input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></div>
              </div>
              <div>
                <Label>Planta preferida</Label>
                <Select value={form.preferred_floor} onValueChange={(v) => setForm({ ...form, preferred_floor: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FLOOR_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zonas preferidas</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-40 overflow-y-auto border rounded-md p-2">
                  {PAMPLONA_ZONES.map((zone) => (
                    <Badge
                      key={zone}
                      variant={form.preferred_zones.includes(zone) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleZone(zone)}
                    >
                      {zone}
                      {form.preferred_zones.includes(zone) && <X className="w-3 h-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}