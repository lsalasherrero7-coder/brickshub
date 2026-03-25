import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AccountSettings {
  id: string;
  irpf_rate: number;
  created_at: string;
  updated_at: string;
}

export function useAccountSettings() {
  return useQuery({
    queryKey: ["accounting_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      return data as AccountSettings;
    },
  });
}

export function useUpdateAccountSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      irpf_rate,
    }: {
      id: string;
      irpf_rate: number;
    }) => {
      const { data, error } = await supabase
        .from("accounting_settings")
        .update({
          irpf_rate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as AccountSettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting_settings"] });
    },
  });
}
