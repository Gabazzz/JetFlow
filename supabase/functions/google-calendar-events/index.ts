// Returns the signed-in user's Google Calendar events for a single day
// (America/Sao_Paulo). Refreshes the access token first when needed —
// the refresh token and client secret never leave the server.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = "245398876872-amkfu3q4pp1q3bg7aug1r0kht7n4pmm4.apps.googleusercontent.com";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date"); // YYYY-MM-DD, America/Sao_Paulo
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return new Response(JSON.stringify({ error: "Parâmetro 'date' inválido (esperado YYYY-MM-DD)." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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
        headers: { "Content-Type": "application/json" },
      });
    }

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
      return new Response(JSON.stringify({ connected: false, events: [] }), {
        headers: { "Content-Type": "application/json" },
      });
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
        // Refresh token was revoked/expired — the user needs to reconnect.
        await admin.from("google_calendar_tokens").delete().eq("user_id", user.id);
        return new Response(JSON.stringify({ connected: false, events: [], reauthRequired: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in ?? 3600) * 1000).toISOString();
      await admin
        .from("google_calendar_tokens")
        .update({ access_token: accessToken, access_token_expires_at: newExpiresAt })
        .eq("user_id", user.id);
    }

    // São Paulo has had no DST since 2019 — the offset is always -03:00.
    const timeMin = `${dateParam}T00:00:00-03:00`;
    const timeMax = `${dateParam}T23:59:59-03:00`;

    const eventsUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    eventsUrl.searchParams.set("timeMin", timeMin);
    eventsUrl.searchParams.set("timeMax", timeMax);
    eventsUrl.searchParams.set("singleEvents", "true");
    eventsUrl.searchParams.set("orderBy", "startTime");
    eventsUrl.searchParams.set("maxResults", "50");

    const eventsRes = await fetch(eventsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const eventsData = await eventsRes.json();
    if (!eventsRes.ok) {
      return new Response(JSON.stringify({ error: eventsData.error?.message || "Erro ao buscar eventos." }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const events = (eventsData.items || []).map((ev: any) => {
      let meetLink: string | null = ev.hangoutLink || null;
      if (!meetLink && ev.conferenceData?.entryPoints) {
        const videoEntry = ev.conferenceData.entryPoints.find((p: any) => p.entryPointType === "video");
        meetLink = videoEntry?.uri || null;
      }
      return {
        id: ev.id,
        title: ev.summary || "(Sem título)",
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
        allDay: !ev.start?.dateTime,
        location: ev.location || null,
        meetLink,
        htmlLink: ev.htmlLink,
      };
    });

    return new Response(JSON.stringify({ connected: true, events }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
