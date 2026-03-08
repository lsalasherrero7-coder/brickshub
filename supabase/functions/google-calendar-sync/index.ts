import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getValidAccessToken(supabase: any): Promise<string | null> {
  const { data: tokenRow } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .limit(1)
    .single();

  if (!tokenRow) return null;

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return tokenRow.access_token;
  }

  // Refresh token
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenRow.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Token refresh failed:", data);
    return null;
  }

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await supabase
    .from("google_calendar_tokens")
    .update({
      access_token: data.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tokenRow.id);

  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const accessToken = await getValidAccessToken(supabase);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Google Calendar not connected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, entity_type, entity_id, event } = await req.json();
    // action: "create" | "update" | "delete"
    // entity_type: "visit" | "contact_task"
    // entity_id: uuid
    // event: { summary, description, start_datetime, end_datetime, location? }

    const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    if (action === "create") {
      const body = {
        summary: event.summary,
        description: event.description || "",
        start: { dateTime: event.start_datetime, timeZone: "Europe/Madrid" },
        end: { dateTime: event.end_datetime, timeZone: "Europe/Madrid" },
        ...(event.location ? { location: event.location } : {}),
      };

      const res = await fetch(CALENDAR_API, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("GCal create failed:", data);
        throw new Error(`Google Calendar API error [${res.status}]: ${JSON.stringify(data)}`);
      }

      // Store mapping
      await supabase.from("google_calendar_event_map").upsert({
        entity_type,
        entity_id,
        google_event_id: data.id,
      }, { onConflict: "entity_type,entity_id" });

      return new Response(
        JSON.stringify({ success: true, google_event_id: data.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      // Find existing event mapping
      const { data: mapping } = await supabase
        .from("google_calendar_event_map")
        .select("google_event_id")
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .single();

      if (!mapping) {
        // No existing event, create instead
        const body = {
          summary: event.summary,
          description: event.description || "",
          start: { dateTime: event.start_datetime, timeZone: "Europe/Madrid" },
          end: { dateTime: event.end_datetime, timeZone: "Europe/Madrid" },
          ...(event.location ? { location: event.location } : {}),
        };

        const res = await fetch(CALENDAR_API, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`GCal create error [${res.status}]`);

        await supabase.from("google_calendar_event_map").upsert({
          entity_type,
          entity_id,
          google_event_id: data.id,
        }, { onConflict: "entity_type,entity_id" });

        return new Response(
          JSON.stringify({ success: true, google_event_id: data.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = {
        summary: event.summary,
        description: event.description || "",
        start: { dateTime: event.start_datetime, timeZone: "Europe/Madrid" },
        end: { dateTime: event.end_datetime, timeZone: "Europe/Madrid" },
        ...(event.location ? { location: event.location } : {}),
      };

      const res = await fetch(`${CALENDAR_API}/${mapping.google_event_id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("GCal update failed:", data);
        throw new Error(`GCal update error [${res.status}]`);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      const { data: mapping } = await supabase
        .from("google_calendar_event_map")
        .select("google_event_id")
        .eq("entity_type", entity_type)
        .eq("entity_id", entity_id)
        .single();

      if (mapping) {
        const res = await fetch(`${CALENDAR_API}/${mapping.google_event_id}`, {
          method: "DELETE",
          headers,
        });

        if (!res.ok && res.status !== 404) {
          const text = await res.text();
          console.error("GCal delete failed:", text);
        } else {
          await res.text(); // consume body
        }

        await supabase
          .from("google_calendar_event_map")
          .delete()
          .eq("entity_type", entity_type)
          .eq("entity_id", entity_id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
