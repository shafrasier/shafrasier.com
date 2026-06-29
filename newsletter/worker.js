/**
 * Newsletter Worker — the Clearing @ Fugue Gallery / Continuing Education.
 *
 * Routes:
 *   POST /subscribe            { email, firstName?, lastName?, source?, page? }  -> creates a pending
 *                              subscriber and emails a double opt-in confirmation link
 *   GET  /confirm?token=…      confirms the subscription (double opt-in)
 *   GET  /unsubscribe?token=…  one-click unsubscribe (also accepts POST for List-Unsubscribe)
 *   GET  /admin                password-protected subscriber list (HTTP Basic auth)
 *   GET  /admin/export.csv     password-protected CSV export
 *   GET  /                     health check
 *
 * Storage: D1 (binding `DB`, see schema.sql). Email: Resend (RESEND_API_KEY secret).
 *
 * Abuse note: /subscribe is public and sends real email. Two protections live here — a
 * honeypot and a per-address resend cooldown (RESEND_COOLDOWN_MS) so one address can't be
 * mailbombed. For volumetric abuse across many addresses, add a Cloudflare WAF rate-limit
 * rule (and optionally Turnstile) before going public — see README "Before going public".
 */

const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // don't re-send a confirmation to the same address within 5 min

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env, request) });

    try {
      if (path === "/" && method === "GET") return new Response("newsletter ok", { status: 200 });
      if ((path === "/subscribe" || path === "/") && method === "POST") return handleSubscribe(request, env);
      if (path === "/confirm" && method === "GET") return handleConfirm(request, env);
      if (path === "/unsubscribe" && (method === "GET" || method === "POST")) return handleUnsubscribe(request, env);
      if (path === "/admin" && method === "GET") return handleAdmin(request, env);
      if (path === "/admin/export.csv" && method === "GET") return handleExport(request, env);
      return new Response("Not found", { status: 404 });
    } catch (err) {
      return json({ error: "server_error", detail: String(err && err.message || err) }, 500, env, request);
    }
  },
};

/* ----------------------------- handlers ----------------------------- */

async function handleSubscribe(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400, env, request); }

  // honeypot: a real person never fills a hidden field
  if (body.company && String(body.company).trim()) return json({ ok: true }, 200, env, request);
  if (body.nl_extra && String(body.nl_extra).trim()) return json({ ok: true }, 200, env, request);

  const email = normalizeEmail(body.email);
  if (!validEmail(email)) return json({ error: "invalid_email" }, 400, env, request);

  const first  = sanitizeName(body.firstName ?? body.first_name);
  const last   = sanitizeName(body.lastName ?? body.last_name);
  const source = sanitizeShort(body.source);
  const page   = sanitizeShort(body.page);
  const now    = new Date().toISOString();

  const existing = await env.DB.prepare(
    "SELECT id, status, token, last_email_at FROM subscribers WHERE email = ?"
  ).bind(email).first();

  // Uniform response regardless of prior state — never leak who is already subscribed.
  const ok = () => json({ ok: true }, 200, env, request);

  let token, shouldSend;
  if (existing) {
    if (existing.status === "confirmed") {
      // already on the list — quietly keep names fresh, never re-email
      await env.DB.prepare("UPDATE subscribers SET first_name = ?, last_name = ? WHERE id = ?")
        .bind(first, last, existing.id).run();
      return ok();
    }
    const last_email = existing.last_email_at ? Date.parse(existing.last_email_at) : 0;
    shouldSend = (Date.now() - last_email) >= RESEND_COOLDOWN_MS;
    if (shouldSend) {
      token = newToken(); // fresh token only when we actually send a new link
      await env.DB.prepare(
        "UPDATE subscribers SET first_name = ?, last_name = ?, status = 'pending', token = ?, source = ?, page = ?, unsubscribed_at = NULL WHERE id = ?"
      ).bind(first, last, token, source, page, existing.id).run();
    } else {
      // throttled: keep the existing (still-valid) token & link, just freshen names + re-pend
      token = existing.token;
      await env.DB.prepare(
        "UPDATE subscribers SET first_name = ?, last_name = ?, status = 'pending', unsubscribed_at = NULL WHERE id = ?"
      ).bind(first, last, existing.id).run();
    }
  } else {
    token = newToken();
    shouldSend = true;
    await env.DB.prepare(
      "INSERT INTO subscribers (email, first_name, last_name, status, token, source, page, created_at) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)"
    ).bind(email, first, last, token, source, page, now).run();
  }

  if (shouldSend) {
    try {
      await sendConfirmEmail(env, { email, first_name: first, token });
    } catch (err) {
      // row stays pending; surface the failure so the UI can ask them to retry
      return json({ error: "email_failed", detail: String(err && err.message || err) }, 502, env, request);
    }
    await env.DB.prepare("UPDATE subscribers SET last_email_at = ? WHERE email = ?").bind(now, email).run();
  }
  return ok();
}

async function handleConfirm(request, env) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) return page(env, "Invalid link", "This confirmation link is missing its token.");
  const sub = await env.DB.prepare("SELECT id, status FROM subscribers WHERE token = ?").bind(token).first();
  if (!sub) return page(env, "Link expired", "This link is no longer valid. Please subscribe again.");
  if (sub.status !== "confirmed") {
    await env.DB.prepare("UPDATE subscribers SET status = 'confirmed', confirmed_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), sub.id).run();
  }
  return page(env, "You're in", "Your subscription is confirmed. Thank you — see you in the Clearing.", env.SITE_URL);
}

async function handleUnsubscribe(request, env) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (token) {
    const sub = await env.DB.prepare("SELECT id FROM subscribers WHERE token = ?").bind(token).first();
    if (sub) {
      await env.DB.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), sub.id).run();
    }
  }
  if (request.method === "POST") return new Response(null, { status: 204 }); // List-Unsubscribe one-click
  return page(env, "Unsubscribed", "You've been removed from the list. You can resubscribe anytime.", env.SITE_URL);
}

async function handleAdmin(request, env) {
  if (!checkAdmin(request, env)) return authChallenge();
  const { results } = await env.DB.prepare(
    "SELECT email, first_name, last_name, status, source, created_at, confirmed_at FROM subscribers ORDER BY created_at DESC"
  ).all();
  const counts = { confirmed: 0, pending: 0, unsubscribed: 0 };
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  const rows = results.map(r => `<tr>
    <td>${escapeHtml(r.email)}</td>
    <td>${escapeHtml([r.first_name, r.last_name].filter(Boolean).join(" "))}</td>
    <td class="s s-${escapeHtml(r.status)}">${escapeHtml(r.status)}</td>
    <td>${escapeHtml(r.source || "")}</td>
    <td>${escapeHtml((r.created_at || "").slice(0, 10))}</td>
    <td>${escapeHtml((r.confirmed_at || "").slice(0, 10))}</td>
  </tr>`).join("");
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Subscribers</title>
  <style>
    body{font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;margin:2rem;color:#1a1815;background:#f4f2ec}
    h1{font-size:1.1rem;margin:0 0 .3rem} .sub{color:#6f6a60;margin:0 0 1.4rem}
    a.btn{display:inline-block;margin-bottom:1.4rem;color:#1a1815;border-bottom:1px solid #1a1815;text-decoration:none}
    table{border-collapse:collapse;width:100%} th,td{text-align:left;padding:.5rem .8rem;border-bottom:1px solid rgba(26,22,16,.14);white-space:nowrap}
    th{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:#6f6a60}
    .s{font-weight:700} .s-confirmed{color:#15803d} .s-pending{color:#b45309} .s-unsubscribed{color:#9a3412}
  </style>
  <h1>Subscribers — ${escapeHtml(env.SITE_NAME || "")}</h1>
  <p class="sub">${results.length} total · ${counts.confirmed||0} confirmed · ${counts.pending||0} pending · ${counts.unsubscribed||0} unsubscribed</p>
  <a class="btn" href="/admin/export.csv">Download CSV</a>
  <table><thead><tr><th>Email</th><th>Name</th><th>Status</th><th>Source</th><th>Joined</th><th>Confirmed</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="6">No subscribers yet.</td></tr>'}</tbody></table>`;
  return new Response(html, { headers: secureHtmlHeaders() });
}

async function handleExport(request, env) {
  if (!checkAdmin(request, env)) return authChallenge();
  const { results } = await env.DB.prepare(
    "SELECT email, first_name, last_name, status, source, page, created_at, confirmed_at, unsubscribed_at FROM subscribers ORDER BY created_at DESC"
  ).all();
  const cols = ["email", "first_name", "last_name", "status", "source", "page", "created_at", "confirmed_at", "unsubscribed_at"];
  const lines = [cols.join(",")];
  for (const r of results) lines.push(cols.map(c => csvCell(r[c])).join(","));
  return new Response(lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="subscribers.csv"', "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" },
  });
}

/* ----------------------------- email ----------------------------- */

async function sendConfirmEmail(env, sub) {
  const confirmUrl = `${env.PUBLIC_BASE}/confirm?token=${encodeURIComponent(sub.token)}`;
  const unsubUrl   = `${env.PUBLIC_BASE}/unsubscribe?token=${encodeURIComponent(sub.token)}`;
  const name = (sub.first_name || "").trim();
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hello,";
  const site = escapeHtml(env.SITE_NAME || "our newsletter");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f2ec;font-family:Georgia,'Times New Roman',serif;color:#1a1815">
    <div style="max-width:480px;margin:0 auto;padding:40px 28px">
      <p style="font-size:16px;line-height:1.6;margin:0 0 18px">${greeting}</p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px">Please confirm you'd like to receive ${site}.</p>
      <p style="margin:0 0 28px"><a href="${escapeAttr(confirmUrl)}" style="display:inline-block;background:#1a1815;color:#f4f2ec;text-decoration:none;padding:14px 26px;letter-spacing:.04em">Confirm subscription</a></p>
      <p style="font-size:13px;line-height:1.6;color:#6f6a60;margin:0 0 6px">If the button doesn't work, paste this link into your browser:</p>
      <p style="font-size:13px;line-height:1.6;color:#6f6a60;margin:0 0 28px;word-break:break-all"><a href="${escapeAttr(confirmUrl)}" style="color:#6f6a60">${escapeHtml(confirmUrl)}</a></p>
      <p style="font-size:12px;line-height:1.6;color:#9b958a;margin:0;border-top:1px solid rgba(26,22,16,.12);padding-top:16px">
        You're receiving this because someone entered this address at ${site}. If that wasn't you, ignore this email and nothing happens — or <a href="${escapeAttr(unsubUrl)}" style="color:#9b958a">unsubscribe</a>.</p>
    </div></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${env.FROM_NAME || "Newsletter"} <${env.FROM_EMAIL}>`,
      to: [sub.email],
      subject: `Confirm your subscription to ${env.SITE_NAME || "our newsletter"}`,
      html,
      headers: { "List-Unsubscribe": `<${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/* ----------------------------- helpers ----------------------------- */

function corsHeaders(env, request) {
  const allow = (env && env.ALLOW_ORIGIN) || "*";
  let origin = allow;
  if (allow !== "*") {
    const list = allow.split(",").map(s => s.trim()).filter(Boolean);
    const reqOrigin = request && request.headers.get("Origin");
    origin = (reqOrigin && list.includes(reqOrigin)) ? reqOrigin : (list[0] || "*");
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(obj, status, env, request) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(env, request) },
  });
}

function secureHtmlHeaders() {
  return { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" };
}

function page(env, title, message, link) {
  const more = link ? `<p style="margin-top:1.6rem"><a href="${escapeAttr(link)}" style="color:#1a1815;border-bottom:1px solid #1a1815;text-decoration:none">Return to the site</a></p>` : "";
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f4f2ec;color:#1a1815;font-family:Georgia,serif;text-align:center;padding:2rem">
    <div style="max-width:460px">
      <h1 style="font-weight:500;font-size:1.8rem;margin:0 0 .8rem">${escapeHtml(title)}</h1>
      <p style="color:#4a463f;font-size:1.05rem;line-height:1.6;margin:0">${escapeHtml(message)}</p>
      ${more}
    </div>
  </div>`;
  return new Response(html, { headers: secureHtmlHeaders() });
}

function checkAdmin(request, env) {
  const hdr = request.headers.get("Authorization") || "";
  if (!hdr.startsWith("Basic ")) return false;
  let decoded = "";
  try { decoded = atob(hdr.slice(6)); } catch { return false; }
  const i = decoded.indexOf(":");
  const pass = i < 0 ? decoded : decoded.slice(i + 1);
  return !!env.ADMIN_PASSWORD && timingSafeEqual(pass, env.ADMIN_PASSWORD);
}

function authChallenge() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="subscribers", charset="UTF-8"' },
  });
}

function timingSafeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function newToken() {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
}

function normalizeEmail(v) { return String(v == null ? "" : v).trim().toLowerCase(); }
function validEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254; }
function sanitizeName(v) { return v == null ? null : String(v).replace(/[\r\n\t]+/g, " ").trim().slice(0, 80) || null; }
function sanitizeShort(v) { return v == null ? null : String(v).replace(/[\r\n\t]+/g, " ").trim().slice(0, 200) || null; }

function escapeHtml(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const escapeAttr = escapeHtml;
function csvCell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralize spreadsheet formula injection
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
