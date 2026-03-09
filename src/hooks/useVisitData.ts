import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Visit } from "@/lib/types";
import { syncVisitToCalendar } from "@/hooks/useGoogleCalendar";

export function useVisits() {
  return useQuery({
    queryKey: ["visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .order("visit_date", { ascending: true });
      if (error) throw error;
      return data as Visit[];
    },
  });
}

export function usePropertyVisits(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["visits", "property", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .eq("property_id", propertyId!)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data as Visit[];
    },
  });
}

async function buildVisitEvent(visit: any, propertyAddress?: string) {
  const start = new Date(visit.visit_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const clientName = `${visit.client_first_name} ${visit.client_last_name}`.trim();
  const descParts = [`Visita a propiedad`, `Cliente: ${clientName}`];
  if (visit.client_phone) descParts.push(`Teléfono: ${visit.client_phone}`);
  if (propertyAddress) descParts.push(`Dirección: ${propertyAddress}`);
  if (visit.notes) descParts.push(`Notas: ${visit.notes}`);
  return {
    summary: `Visita - ${clientName}`,
    description: descParts.join("\n"),
    start_datetime: start.toISOString(),
    end_datetime: end.toISOString(),
    location: propertyAddress,
  };
}

async function getPropertyAddress(propertyId: string): Promise<string | undefined> {
  const { data } = await supabase
    .from("properties")
    .select("address")
    .eq("id", propertyId)
    .single();
  return data?.address;
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (visit: {
      property_id: string;
      client_first_name: string;
      client_last_name: string;
      client_phone?: string;
      visit_date: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("visits")
        .insert(visit)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      // Sync to Google Calendar
      const address = await getPropertyAddress(data.property_id);
      const event = await buildVisitEvent(data, address);
      syncVisitToCalendar("create", data.id, event);
    },
  });
}

export function useUpdateVisitStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("visits")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      if (data.status === "cancelada") {
        syncVisitToCalendar("delete", data.id);
      } else {
        const address = await getPropertyAddress(data.property_id);
        const event = await buildVisitEvent(data, address);
        syncVisitToCalendar("update", data.id, event);
      }
    },
  });
}

export function useUpdateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      client_first_name?: string;
      client_last_name?: string;
      client_phone?: string | null;
      visit_date?: string;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("visits")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      const address = await getPropertyAddress(data.property_id);
      const event = await buildVisitEvent(data, address);
      syncVisitToCalendar("update", data.id, event);
    },
  });
}

export function useDeleteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Sync delete to Google Calendar before deleting from DB
      await syncVisitToCalendar("delete", id);
      const { error } = await supabase.from("visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}
