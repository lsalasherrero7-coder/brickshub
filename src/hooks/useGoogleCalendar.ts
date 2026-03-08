import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { action: "status" },
      });
      if (error) throw error;
      return data as { connected: boolean };
    },
    refetchInterval: false,
  });
}

export function useGoogleCalendarConnect() {
  const connect = async () => {
    const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
      body: { action: "connect", origin: window.location.origin },
    });
    if (error) {
      toast.error("Error al conectar con Google Calendar");
      return;
    }
    window.location.href = data.url;
  };
  return { connect };
}

export function useGoogleCalendarDisconnect() {
  const qc = useQueryClient();
  const disconnect = async () => {
    const { error } = await supabase.functions.invoke("google-calendar-auth", {
      body: { action: "disconnect" },
    });
    if (error) {
      toast.error("Error al desconectar");
      return;
    }
    qc.invalidateQueries({ queryKey: ["google-calendar-status"] });
    toast.success("Google Calendar desconectado");
  };
  return { disconnect };
}

export async function syncVisitToCalendar(
  action: "create" | "update" | "delete",
  entityId: string,
  event?: {
    summary: string;
    description?: string;
    start_datetime: string;
    end_datetime: string;
    location?: string;
  }
) {
  try {
    await supabase.functions.invoke("google-calendar-sync", {
      body: {
        action,
        entity_type: "visit",
        entity_id: entityId,
        event,
      },
    });
  } catch {
    // Silent fail - don't block CRM operations
    console.warn("Google Calendar sync failed for visit", entityId);
  }
}
