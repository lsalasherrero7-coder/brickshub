import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Contact, ContactNote, ContactTask } from "@/lib/types";

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contact[];
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
      return data as Contact;
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
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
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
    mutationFn: async (task: { contact_id: string; title: string; description?: string; due_date: string; }) => {
      const { data, error } = await supabase
        .from("contact_tasks")
        .insert(task)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_tasks"] });
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
