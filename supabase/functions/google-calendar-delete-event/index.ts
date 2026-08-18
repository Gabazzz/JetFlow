// Deletes an event from the signed-in user's primary Google Calendar —
// used by the "Excluir" action in the Agenda day list. sendUpdates=all so
// Google notifies whoever was invited that the meeting was cancelled. Same
// auth/token-refresh flow as the other calendar functions.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = "245398876872-amkfu3q4pp1q3bg7aug1r0kht7n4pmm4.apps.googleusercontent.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const eventId = String(body.eventId || "").trim();
    if (!eventId) return jsonResponse({ error: "Reunião não identificada." }, 400);

    const authHeader = req.headers.get("Authorization") ?? "";
    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userErr } = await anon.auth.getUser();
    if (userErr || !user) return jsonResponse({ error: "Não autenticado." }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tokenRow } = await admin
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!tokenRow) {
      return jsonResponse({ error: "Conecte sua Google Agenda antes de excluir uma reunião.", reauthRequired: true });
    }

    let accessToken: string | null = tokenRow.access_token;
    const expiresAt = tokenRow.access_token_expires_at
      ? new Date(tokenRow.access_token_expires_at as string).getTime()
      : 0;
    const needsRefresh = !accessToken || expiresAt - Date.now() < 60_000;

    if (needsRefresh) {
      const { data: clientSecret } = await admin.rpc("get_google_client_secret");
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: clientSecret as string,
          refresh_token: tokenRow.refresh_token as string,
          grant_type: "refresh_token",
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshRes.ok) {
        await admin.from("google_calendar_tokens").delete().eq("user_id", user.id);
        return jsonResponse({ error: "Sua conexão com o Google expirou.", reauthRequired: true });
      }
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString();
      await admin
        .from("google_calendar_tokens")
        .update({ access_token: accessToken, access_token_expires_at: newExpiresAt })
        .eq("user_id", user.id);
    }

    const deleteUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`);
    deleteUrl.searchParams.set("sendUpdates", "all");

    const deleteRes = await fetch(deleteUrl.toString(), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Google returns 204 (no body) on success, and treats deleting an
    // already-gone event as a 410 — both count as "done" from here.
    if (!deleteRes.ok && deleteRes.status !== 410) {
      const errData = await deleteRes.json().catch(() => ({}));
      const reason = errData.error?.errors?.[0]?.reason || "";
      const reauthRequired = deleteRes.status === 403 && /insufficient/i.test(reason || errData.error?.message || "");
      return jsonResponse(
        { error: errData.error?.message || "Erro ao excluir reunião na Google Agenda.", reauthRequired },
        reauthRequired ? 200 : 502
      );
    }

    return jsonResponse({ deleted: true });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
