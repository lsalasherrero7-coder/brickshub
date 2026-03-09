import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Contact, ContactNote, ContactTask } from "@/lib/types";
import { syncContactNextActionToCalendar, syncContactTaskToCalendar } from "@/hooks/useGoogleCalendar";

function buildContactTaskEvent(task: ContactTask, contactName: string, contact?: { address?: string | null; phone?: string | null; email?: string | null; temperature_tag?: string | null; status_tag?: string | null }) {
  const start = new Date(task.due_date);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const descParts = [`Tarea: ${task.title}`, `Contacto: ${contactName}`];
  if (contact?.phone) descParts.push(`Teléfono: ${contact.phone}`);
  if (contact?.email) descParts.push(`Email: ${contact.email}`);
  if (contact?.address) descParts.push(`Dirección: ${contact.address}`);
  if (contact?.temperature_tag) descParts.push(`Temperatura: ${contact.temperature_tag}`);
  if (contact?.status_tag) descParts.push(`Estado: ${contact.status_tag}`);
  if (task.description?.trim()) descParts.push(`Notas: ${task.description.trim()}`);

  return {
    summary: `${task.title} - ${contactName}`,
    description: descParts.join("\n"),
    start_datetime: start.toISOString(),
    end_datetime: end.toISOString(),
    location: contact?.address || undefined,
  };
}

function buildContactNextActionEvent(contact: Contact) {
  const start = new Date(contact.next_action_date!);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const actionType = contact.next_action_type || "Próxima acción";
  const descParts = [`Tipo: ${actionType}`, `Contacto: ${contact.name}`];
  if (contact.phone) descParts.push(`Teléfono: ${contact.phone}`);
  if (contact.email) descParts.push(`Email: ${contact.email}`);
  if (contact.address) descParts.push(`Dirección: ${contact.address}`);
  if (contact.temperature_tag) descParts.push(`Temperatura: ${contact.temperature_tag}`);
  if (contact.status_tag) descParts.push(`Estado: ${contact.status_tag}`);
  if (contact.next_action_note?.trim()) descParts.push(`Notas: ${contact.next_action_note.trim()}`);

  return {
    summary: `${actionType} - ${contact.name}`,
    description: descParts.join("\n"),
    start_datetime: start.toISOString(),
    end_datetime: end.toISOString(),
    location: contact.address || undefined,
  };
}

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ["contacts", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Contact;
    },
    onSuccess: async (data, vars) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });

      const nextActionTouched =
        "next_action_date" in vars || "next_action_type" in vars || "next_action_note" in vars;

      if (!nextActionTouched) return;

      if (data.next_action_date && data.next_action_type) {
        const event = buildContactNextActionEvent(data);
        await syncContactNextActionToCalendar("update", data.id, event);
      } else {
        await syncContactNextActionToCalendar("delete", data.id);
      }
    },
  });
}

// Notes
export function useContactNotes(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_notes", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_notes")
        .select("*")
        .eq("contact_id", contactId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactNote[];
    },
  });
}

export function useCreateContactNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: { contact_id: string; content: string }) => {
      const { data, error } = await supabase
        .from("contact_notes")
        .insert(note)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_notes", vars.contact_id] });
    },
  });
}

export function useUpdateContactNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content, contact_id }: { id: string; content: string; contact_id: string }) => {
      const { data, error } = await supabase
        .from("contact_notes")
        .update({ content })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_notes", vars.contact_id] });
    },
  });
}

export function useDeleteContactNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contact_id }: { id: string; contact_id: string }) => {
      const { error } = await supabase.from("contact_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_notes", vars.contact_id] });
    },
  });
}

// Tasks
export function useContactTasks(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_tasks", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_tasks")
        .select("*")
        .eq("contact_id", contactId!)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as ContactTask[];
    },
  });
}

export function useAllContactTasks() {
  return useQuery({
    queryKey: ["contact_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_tasks")
        .select("*, contacts(name, address)")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateContactTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: { contact_id: string; title: string; description?: string; due_date: string }) => {
      const { data, error } = await supabase
        .from("contact_tasks")
        .insert(task)
        .select()
        .single();
      if (error) throw error;
      return data as ContactTask;
    },
    onSuccess: async (task) => {
      qc.invalidateQueries({ queryKey: ["contact_tasks"] });

      const { data: contact } = await supabase
        .from("contacts")
        .select("name, address")
        .eq("id", task.contact_id)
        .single();

      if (!contact?.name) return;

      const event = buildContactTaskEvent(task, contact.name, contact.address);
      await syncContactTaskToCalendar("create", task.id, event);
    },
  });
}

export function useUpdateContactTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("contact_tasks")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact_tasks"] });
    },
  });
}

export function useUpdateContactTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; description?: string | null; due_date?: string; contact_id: string }) => {
      const { contact_id, ...dbUpdates } = updates;
      const { data, error } = await supabase
        .from("contact_tasks")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, contact_id } as ContactTask & { contact_id: string };
    },
    onSuccess: async (task) => {
      qc.invalidateQueries({ queryKey: ["contact_tasks"] });

      const { data: contact } = await supabase
        .from("contacts")
        .select("name, address")
        .eq("id", task.contact_id)
        .single();

      if (!contact?.name) return;

      const event = buildContactTaskEvent(task, contact.name, contact.address);
      await syncContactTaskToCalendar("update", task.id, event);
    },
  });
}

export function useDeleteContactTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contact_id }: { id: string; contact_id: string }) => {
      await syncContactTaskToCalendar("delete", id);
      const { error } = await supabase.from("contact_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_tasks", vars.contact_id] });
      qc.invalidateQueries({ queryKey: ["contact_tasks"] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cascades }: { id: string; cascades: string[] }) => {
      if (cascades.includes("notes")) {
        await supabase.from("contact_notes").delete().eq("contact_id", id);
      }
      if (cascades.includes("tasks")) {
        await supabase.from("contact_tasks").delete().eq("contact_id", id);
      }
      if (cascades.includes("buyer_profile")) {
        await supabase.from("buyer_profiles").delete().eq("contact_id", id);
      }
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

// Buyer Profile
export function useBuyerProfile(contactId: string | undefined) {
  return useQuery({
    queryKey: ["buyer_profile", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buyer_profiles")
        .select("*")
        .eq("contact_id", contactId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// Suggested properties for buyer
export function useSuggestedProperties(contactId: string | undefined) {
  return useQuery({
    queryKey: ["suggested_properties", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      // First get buyer profile
      const { data: profile } = await supabase
        .from("buyer_profiles")
        .select("*")
        .eq("contact_id", contactId!)
        .maybeSingle();

      if (!profile) return [];

      // Get available properties
      const { data: properties, error } = await supabase
        .from("properties")
        .select("*")
        .in("status", ["disponible", "prospecto"]);

      if (error || !properties) return [];

      // Filter matches
      return properties.filter((p) => {
        if (profile.property_type && p.property_type !== profile.property_type) return false;
        if (profile.budget_max && p.listing_price && p.listing_price > profile.budget_max) return false;
        if (profile.budget_min && p.listing_price && p.listing_price < profile.budget_min) return false;
        if (profile.bedrooms_min && p.bedrooms && p.bedrooms < profile.bedrooms_min) return false;
        if (profile.bathrooms_min && p.bathrooms && p.bathrooms < profile.bathrooms_min) return false;
        if (profile.preferred_zones && profile.preferred_zones.length > 0 && (p as any).zone) {
          if (!profile.preferred_zones.includes((p as any).zone)) return false;
        }
        return true;
      });
    },
  });
}
