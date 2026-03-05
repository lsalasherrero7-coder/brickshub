import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface MarketingCampaign {
  id: string;
  name: string;
  created_at: string;
}

export interface MarketingLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  campaign_id: string;
  status: string;
  assigned_agent_id: string | null;
  next_action_type: string | null;
  next_action_date: string | null;
  next_action_note: string | null;
  contact_id: string | null;
  created_at: string;
  updated_at: string;
  campaign?: MarketingCampaign;
}

export interface MarketingLeadInteraction {
  id: string;
  lead_id: string;
  interaction_type: string;
  notes: string | null;
  created_at: string;
}

// Campaigns
export function useCampaigns() {
  return useQuery({
    queryKey: ["marketing_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as MarketingCampaign[];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .insert({ name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing_campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing_campaigns"] }),
  });
}

// Leads
export function useMarketingLeads() {
  return useQuery({
    queryKey: ["marketing_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .select("*, campaign:marketing_campaigns(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MarketingLead[];
    },
  });
}

export function useMarketingLead(id: string | undefined) {
  return useQuery({
    queryKey: ["marketing_leads", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .select("*, campaign:marketing_campaigns(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as MarketingLead;
    },
  });
}

export function useCreateMarketingLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: {
      name: string;
      phone?: string;
      email?: string;
      campaign_id: string;
    }) => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .insert(lead)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketing_leads"] }),
  });
}

export function useUpdateMarketingLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketing_leads"] });
    },
  });
}

// Interactions
export function useLeadInteractions(leadId: string | undefined) {
  return useQuery({
    queryKey: ["marketing_lead_interactions", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_lead_interactions")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MarketingLeadInteraction[];
    },
  });
}

export function useCreateInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (interaction: {
      lead_id: string;
      interaction_type: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("marketing_lead_interactions")
        .insert(interaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["marketing_lead_interactions", vars.lead_id] });
    },
  });
}

// Overdue leads count for dashboard
export function useOverdueLeadsCount() {
  return useQuery({
    queryKey: ["marketing_leads_overdue"],
    queryFn: async () => {
      const now = new Date();
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      const { data, error } = await supabase
        .from("marketing_leads")
        .select("id", { count: "exact" })
        .lte("next_action_date", endOfToday)
        .not("status", "in", '("convertido","descartado")');
      if (error) throw error;
      return data?.length || 0;
    },
  });
}
