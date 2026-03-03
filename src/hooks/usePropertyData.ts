import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Property, PropertyDocument, PropertyPhoto } from "@/lib/types";

// Properties
export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Property[];
    },
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ["properties", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Property;
    },
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (property: Partial<Property> & { address: string }) => {
      const { data, error } = await supabase
        .from("properties")
        .insert(property)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Property> & { id: string }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      qc.invalidateQueries({ queryKey: ["properties", vars.id] });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

// Documents
export function usePropertyDocuments(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["property_documents", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId!);
      if (error) throw error;
      return data as PropertyDocument[];
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      propertyId,
      documentType,
      customName,
      file,
    }: {
      propertyId: string;
      documentType: string;
      customName?: string;
      file: File;
    }) => {
      const filePath = `${propertyId}/${documentType}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("property-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("property-documents")
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from("property_documents")
        .insert({
          property_id: propertyId,
          document_type: documentType,
          custom_name: customName || null,
          file_url: urlData.publicUrl,
          file_name: file.name,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["property_documents", vars.propertyId] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await supabase.from("property_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["property_documents", vars.propertyId] }),
  });
}

// Photos
export function usePropertyPhotos(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["property_photos", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_photos")
        .select("*")
        .eq("property_id", propertyId!)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data as PropertyPhoto[];
    },
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, file }: { propertyId: string; file: File }) => {
      const filePath = `${propertyId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("property-photos")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("property-photos")
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from("property_photos")
        .insert({
          property_id: propertyId,
          file_url: urlData.publicUrl,
          file_name: file.name,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["property_photos", vars.propertyId] }),
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await supabase.from("property_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["property_photos", vars.propertyId] }),
  });
}

// Dashboard stats
export function usePropertyStats() {
  return useQuery({
    queryKey: ["property_stats"],
    queryFn: async () => {
      const { data: properties, error } = await supabase
        .from("properties")
        .select("id, status, listing_price, commission_pct, updated_at");
      if (error) throw error;

      const { data: docs, error: docsError } = await supabase
        .from("property_documents")
        .select("property_id, document_type");
      if (docsError) throw docsError;

      const total = properties.length;
      const byStatus = {
        disponible: properties.filter((p) => p.status === "disponible").length,
        reservado: properties.filter((p) => p.status === "reservado").length,
        en_oferta: properties.filter((p) => p.status === "en_oferta").length,
        vendido: properties.filter((p) => p.status === "vendido").length,
        retirado: properties.filter((p) => p.status === "retirado").length,
      };

      const requiredDocs = [
        "nota_simple", "escrituras", "cedula_habitabilidad",
        "cee", "encargo_venta", "dni_propietario",
      ];

      const docsMap = new Map<string, Set<string>>();
      docs.forEach((d) => {
        if (!docsMap.has(d.property_id)) docsMap.set(d.property_id, new Set());
        docsMap.get(d.property_id)!.add(d.document_type);
      });

      const incompleteProperties = properties.filter((p) => {
        const propertyDocs = docsMap.get(p.id) || new Set();
        return requiredDocs.some((d) => !propertyDocs.has(d));
      });

      // Comisión potencial: commission from disponible + reservado
      const potentialCommission = properties
        .filter((p) => p.status === "disponible" || p.status === "reservado")
        .reduce((sum, p) => sum + ((p.listing_price || 0) * (p.commission_pct || 3) / 100), 0);

      // Facturación current year: commission from vendido closed this year
      const currentYear = new Date().getFullYear();
      const yearlyRevenue = properties
        .filter((p) => p.status === "vendido" && new Date(p.updated_at).getFullYear() === currentYear)
        .reduce((sum, p) => sum + ((p.listing_price || 0) * (p.commission_pct || 3) / 100), 0);

      return { total, byStatus, incompleteCount: incompleteProperties.length, incompleteProperties, docsMap, requiredDocs, potentialCommission, yearlyRevenue };
    },
  });
}
