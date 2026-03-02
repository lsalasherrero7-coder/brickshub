import { Tables } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;
export type PropertyDocument = Tables<"property_documents">;
export type PropertyPhoto = Tables<"property_photos">;
export type Visit = Tables<"visits">;

export const PROPERTY_TYPES = [
  { value: "piso", label: "Piso" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "comercial", label: "Comercial" },
] as const;

export const PROPERTY_STATUSES = [
  { value: "disponible", label: "Disponible" },
  { value: "reservado", label: "Reservado" },
  { value: "en_oferta", label: "En oferta" },
  { value: "vendido", label: "Vendido" },
  { value: "retirado", label: "Retirado" },
] as const;

export const DOCUMENT_TYPES = [
  { value: "nota_simple", label: "Nota Simple" },
  { value: "escrituras", label: "Escrituras" },
  { value: "cedula_habitabilidad", label: "Cédula de Habitabilidad" },
  { value: "cee", label: "Certificado Eficiencia Energética (CEE)" },
  { value: "encargo_venta", label: "Encargo de Venta" },
  { value: "dni_propietario", label: "DNI Propietario" },
  { value: "otros", label: "Otros" },
] as const;

export const VISIT_STATUSES = [
  { value: "programada", label: "Programada" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

export type PropertyType = typeof PROPERTY_TYPES[number]["value"];
export type PropertyStatus = typeof PROPERTY_STATUSES[number]["value"];
export type DocumentType = typeof DOCUMENT_TYPES[number]["value"];
export type VisitStatus = typeof VISIT_STATUSES[number]["value"];
