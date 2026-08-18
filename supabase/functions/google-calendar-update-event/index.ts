// Updates an existing event on the signed-in user's primary Google Calendar
// (title, time, attendees) — used by the "Editar" action on a JetFlow
// meeting. Doesn't touch conferenceData, so an existing Meet link is kept
// as-is. Same auth/token-refresh flow as the other calendar functions.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = "245398876872-amkfu3q4pp1q3bg7aug1r0kht7n4pmm4.apps.googleusercontent.com";
const MAX_DURATION_MINUTES = 8 * 60;

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

// São Paulo has had no DST since 2019 — the offset is always -03:00, so wall
// time can be read straight off the UTC fields of (instant - 3h).
function toSaoPauloISOString(d: Date) {
  const shifted = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:00-03:00`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const eventId = String(body.eventId || "").trim();
    const title = String(body.title || "").trim();
    const dateParam = String(body.date || "");
    const timeParam = String(body.time || "");
    const durationMinutes = Number(body.durationMinutes);
    const guests: string[] = Array.isArray(body.guests)
      ? [...new Set(body.guests.map((g: unknown) => String(g).trim()).filter(Boolean))]
      : [];

    if (!eventId) return jsonResponse({ error: "Reunião não identificada." }, 400);
    if (!title) return jsonResponse({ error: "Título é obrigatório." }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return jsonResponse({ error: "Data inválida." }, 400);
    if (!/^\d{2}:\d{2}$/.test(timeParam)) return jsonResponse({ error: "Horário inválido." }, 400);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > MAX_DURATION_MINUTES) {
      return jsonResponse({ error: "Duração inválida." }, 400);
    }

    const startDate = new Date(`${dateParam}T${timeParam}:00-03:00`);
    if (isNaN(startDate.getTime())) return jsonResponse({ error: "Data/horário inválidos." }, 400);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);

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
      return jsonResponse({ error: "Conecte sua Google Agenda antes de editar uma reunião.", reauthRequired: true });
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

    const eventBody = {
      summary: title,
      start: { dateTime: toSaoPauloISOString(startDate), timeZone: "America/Sao_Paulo" },
      end: { dateTime: toSaoPauloISOString(endDate), timeZone: "America/Sao_Paulo" },
      attendees: guests.map((email) => ({ email })),
    };

    const updateUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`);
    updateUrl.searchParams.set("sendUpdates", "all");

    const updateRes = await fetch(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    });
    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      const reason = updateData.error?.errors?.[0]?.reason || "";
      const reauthRequired = updateRes.status === 403 && /insufficient/i.test(reason || updateData.error?.message || "");
      return jsonResponse(
        { error: updateData.error?.message || "Erro ao atualizar reunião na Google Agenda.", reauthRequired },
        reauthRequired ? 200 : 502
      );
    }

    let meetLink: string | null = updateData.hangoutLink || null;
    if (!meetLink && updateData.conferenceData?.entryPoints) {
      const videoEntry = updateData.conferenceData.entryPoints.find((p: any) => p.entryPointType === "video");
      meetLink = videoEntry?.uri || null;
    }

    return jsonResponse({
      event: {
        id: updateData.id,
        htmlLink: updateData.htmlLink,
        meetLink,
        start: updateData.start?.dateTime,
        end: updateData.end?.dateTime,
      },
    });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
