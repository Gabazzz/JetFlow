// Public endpoint — this is exactly the "Authorized redirect URI" configured
// in the Google Cloud OAuth client, so it can't require a Supabase JWT
// (Google's redirect never carries one). Identity is recovered instead via
// the one-time state token minted by google-oauth-start.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = "245398876872-amkfu3q4pp1q3bg7aug1r0kht7n4pmm4.apps.googleusercontent.com";
const REDIRECT_URI = "https://lgrusomfgvblcsgbiwdb.supabase.co/functions/v1/google-oauth-callback";
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function htmlPage(title: string, message: string, ok: boolean) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#0A0A0A;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:#161616;border:1px solid #252525;border-radius:12px;padding:32px;max-width:380px;text-align:center}
  h1{font-size:18px;margin:0 0 8px}
  p{color:${ok ? "#65FF4B" : "#EF4444"};font-size:14px;margin:0}
</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

function respondHtml(title: string, message: string, ok: boolean) {
  return new Response(htmlPage(title, message, ok), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return respondHtml("Conexão cancelada", "Você não concluiu a autorização no Google. Pode fechar esta aba.", false);
  }
  if (!code || !state) {
    return respondHtml("Erro", "Parâmetros ausentes na resposta do Google.", false);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: stateRow, error: stateErr } = await admin
    .from("google_oauth_state")
    .select("user_id, created_at")
    .eq("state", state)
    .maybeSingle();

  if (stateErr || !stateRow) {
    return respondHtml("Erro", "Sessão de conexão inválida ou expirada. Tente conectar novamente pelo JetFlow.", false);
  }
  // One-time use — remove immediately regardless of what happens next.
  await admin.from("google_oauth_state").delete().eq("state", state);

  const ageMs = Date.now() - new Date(stateRow.created_at as string).getTime();
  if (ageMs > STATE_MAX_AGE_MS) {
    return respondHtml("Erro", "Essa tentativa de conexão expirou. Tente novamente pelo JetFlow.", false);
  }

  const { data: clientSecret, error: secretErr } = await admin.rpc("get_google_client_secret");
  if (secretErr || !clientSecret) {
    return respondHtml("Erro", "Configuração ausente no servidor.", false);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: clientSecret as string,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.refresh_token) {
    return respondHtml(
      "Erro ao conectar",
      tokenData.error_description || "Não foi possível obter acesso à sua Agenda. Tente novamente.",
      false
    );
  }

  let googleEmail: string | null = null;
  try {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userInfoRes.ok) {
      const info = await userInfoRes.json();
      googleEmail = info.email ?? null;
    }
  } catch (_e) {
    // Not critical — the connection still works without the display email.
  }

  const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString();

  const { error: upsertErr } = await admin.from("google_calendar_tokens").upsert({
    user_id: stateRow.user_id,
    refresh_token: tokenData.refresh_token,
    access_token: tokenData.access_token,
    access_token_expires_at: expiresAt,
    google_email: googleEmail,
    connected_at: new Date().toISOString(),
  });
  if (upsertErr) {
    return respondHtml("Erro", "Não foi possível salvar a conexão. Tente novamente.", false);
  }

  return respondHtml("Google Agenda conectada!", "Pode fechar esta aba e voltar para o JetFlow.", true);
});
