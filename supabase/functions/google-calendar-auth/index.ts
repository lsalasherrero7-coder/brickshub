import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    if (!GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID not configured");

    const { action, origin } = await req.json();

    // Check connection status
    if (action === "status") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data } = await supabase
        .from("google_calendar_tokens")
        .select("id, expires_at")
        .limit(1)
        .single();

      return new Response(
        JSON.stringify({ connected: !!data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Disconnect
    if (action === "disconnect") {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("google_calendar_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("google_calendar_event_map").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OAuth URL — redirect to the app's frontend route
    const REDIRECT_URI = `${origin}/google-callback`;
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" ");

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    console.log("[google-calendar-auth] OAuth URL generated", authUrl);
    console.log("[google-calendar-auth] redirect_uri used", REDIRECT_URI);

    return new Response(
      JSON.stringify({ url: authUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
