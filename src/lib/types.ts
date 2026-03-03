import { Tables } from "@/integrations/supabase/types";

export type Property = Tables<"properties">;
export type PropertyDocument = Tables<"property_documents">;
export type PropertyPhoto = Tables<"property_photos">;
export type Visit = Tables<"visits">;
export type Lead = Tables<"leads">;
export type Contact = Tables<"contacts">;
export type ContactNote = Tables<"contact_notes">;
export type ContactTask = Tables<"contact_tasks">;

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

export const LEAD_STATUSES = [
  { value: "no_contactado", label: "No contactado" },
  { value: "llamado", label: "Llamado" },
  { value: "no_contesta", label: "No contesta" },
  { value: "no_interesado", label: "No interesado" },
  { value: "visita_cerrada", label: "Visita cerrada" },
  { value: "captado", label: "Captado" },
  { value: "descartado", label: "Descartado" },
] as const;

export const ADVERTISER_TYPES = [
  { value: "propietario", label: "Propietario" },
  { value: "agencia", label: "Agencia" },
] as const;

export const SOURCE_PORTALS = [
  { value: "idealista", label: "Idealista" },
  { value: "fotocasa", label: "Fotocasa" },
  { value: "manual", label: "Manual" },
] as const;

export const TASK_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "completada", label: "Completada" },
] as const;

export type PropertyType = typeof PROPERTY_TYPES[number]["value"];
export type PropertyStatus = typeof PROPERTY_STATUSES[number]["value"];
export type DocumentType = typeof DOCUMENT_TYPES[number]["value"];
export type VisitStatus = typeof VISIT_STATUSES[number]["value"];
export type LeadStatus = typeof LEAD_STATUSES[number]["value"];
export type AdvertiserType = typeof ADVERTISER_TYPES[number]["value"];
export type SourcePortal = typeof SOURCE_PORTALS[number]["value"];
export type TaskStatus = typeof TASK_STATUSES[number]["value"];
