// Kicks off the "Conectar Google Agenda" flow: mints a one-time state token
// tied to the caller (so the public callback function can recover which
// JetFlow user is completing the consent screen) and returns the Google
// consent URL for the frontend to redirect to.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = "245398876872-amkfu3q4pp1q3bg7aug1r0kht7n4pmm4.apps.googleusercontent.com";
const REDIRECT_URI = "https://lgrusomfgvblcsgbiwdb.supabase.co/functions/v1/google-oauth-callback";
// calendar.events covers both reading and creating/editing events on the
// user's calendars — the readonly scope used before doesn't allow creating
// the "Nova Reunião" events, so this widens it in place. Existing connected
// users need to reconnect once (prompt=consent below always re-shows the
// grant screen, and the callback upserts the token row on the new scope).
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await anon.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const state = crypto.randomUUID();
    const { error: insertErr } = await admin
      .from("google_oauth_state")
      .insert({ state, user_id: user.id });
    if (insertErr) throw insertErr;

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPE);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);

    return new Response(JSON.stringify({ url: url.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
