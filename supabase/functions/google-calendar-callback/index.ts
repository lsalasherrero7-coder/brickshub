import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const origin = state ? decodeURIComponent(state) : "";

    if (error || !code) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${origin}/calendario?gcal=error` },
      });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("Token exchange failed:", tokenData);
      return new Response(null, {
        status: 302,
        headers: { Location: `${origin}/calendario?gcal=error` },
      });
    }

    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete old tokens and insert new
    await supabase.from("google_calendar_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("google_calendar_tokens")
      .insert({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Token insert error:", insertError);
      return new Response(null, {
        status: 302,
        headers: { Location: `${origin}/calendario?gcal=error` },
      });
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `${origin}/calendario?gcal=success` },
    });
  } catch (err) {
    console.error("Callback error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
