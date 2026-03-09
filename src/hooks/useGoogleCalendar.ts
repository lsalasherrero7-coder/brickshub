import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CalendarAction = "create" | "update" | "delete";

type CalendarEventPayload = {
  summary: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
};

async function syncEntityToCalendar(
  action: CalendarAction,
  entityType: "visit" | "contact_task" | "contact_next_action" | "marketing_lead_next_action",
  entityId: string,
  event?: CalendarEventPayload
) {
  try {
    const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
      body: {
        action,
        entity_type: entityType,
        entity_id: entityId,
        event,
      },
    });

    if (error) {
      console.warn(`[Google Calendar] sync failed (${entityType}/${entityId})`, error.message);
      return;
    }

    if (data?.error) {
      console.warn(`[Google Calendar] sync warning (${entityType}/${entityId})`, data.error);
    }
  } catch {
    // Silent fail - don't block CRM operations
    console.warn("Google Calendar sync failed", entityType, entityId);
  }
}

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
    // Always use the published URL so the redirect URI matches Google Cloud config
    const publishedOrigin = "https://brickshub.lovable.app";
    const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
      body: { action: "connect", origin: publishedOrigin },
    });
    if (error) {
      toast.error("Error al conectar con Google Calendar");
      return;
    }

    console.log("[Google OAuth] connect origin sent:", publishedOrigin);
    console.log("[Google OAuth] full auth URL:", data?.url);
    if (data?.url) {
      const redirectUri = new URL(data.url).searchParams.get("redirect_uri");
      console.log("[Google OAuth] redirect_uri in auth URL:", redirectUri);
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
  action: CalendarAction,
  entityId: string,
  event?: CalendarEventPayload
) {
  await syncEntityToCalendar(action, "visit", entityId, event);
}

export async function syncContactTaskToCalendar(
  action: CalendarAction,
  entityId: string,
  event?: CalendarEventPayload
) {
  await syncEntityToCalendar(action, "contact_task", entityId, event);
}

export async function syncContactNextActionToCalendar(
  action: CalendarAction,
  entityId: string,
  event?: CalendarEventPayload
) {
  await syncEntityToCalendar(action, "contact_next_action", entityId, event);
}

export async function syncMarketingLeadNextActionToCalendar(
  action: CalendarAction,
  entityId: string,
  event?: CalendarEventPayload
) {
  await syncEntityToCalendar(action, "marketing_lead_next_action", entityId, event);
}

