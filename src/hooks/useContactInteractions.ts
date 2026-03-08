import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ContactInteraction {
  id: string;
  contact_id: string;
  interaction_type: string;
  notes: string | null;
  created_at: string;
}

export function useContactInteractions(contactId: string | undefined) {
  return useQuery({
    queryKey: ["contact_interactions", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_interactions")
        .select("*")
        .eq("contact_id", contactId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactInteraction[];
    },
  });
}

export function useCreateContactInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (interaction: { contact_id: string; interaction_type: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("contact_interactions")
        .insert(interaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["contact_interactions", vars.contact_id] });
    },
  });
}
