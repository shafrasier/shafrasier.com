# Newsletter backend

A small, self-owned newsletter service: a **Cloudflare Worker** (free tier) backed by a
**D1** SQLite database you own, sending double-opt-in and unsubscribe email through
**Resend**. It powers the signup panel on `labs/fugue.html`.

You own all the data. There's nothing to babysit day-to-day; the only ongoing
responsibility is keeping the sending domain healthy in Resend (it warns you if not).

## What it does

- `POST /subscribe` — `{ email, firstName?, lastName?, source?, page? }`. Stores a **pending**
  subscriber and emails a confirmation link (double opt-in). Returns `{ ok: true }`.
- `GET /confirm?token=…` — marks them **confirmed**. Shows a small confirmation page.
- `GET|POST /unsubscribe?token=…` — marks them **unsubscribed** (one-click; also wired into the
  `List-Unsubscribe` email header so Gmail/Apple Mail's native unsubscribe works).
- `GET /admin` — password-protected list of subscribers (email, name, status, source, dates).
- `GET /admin/export.csv` — password-protected CSV export. Your list is always portable.

Each row tracks: email, first/last name, status, source tag, the page they joined from,
and timestamps for **created / confirmed / unsubscribed**.

## One-time setup (~30–45 min)

You'll need a [Cloudflare account](https://dash.cloudflare.com/sign-up) (free) and a
[Resend account](https://resend.com) (free tier). Run everything below from this `newsletter/` folder.

### 1. Install the CLI and log in
```bash
npm install -g wrangler
wrangler login
```

### 2. Create the database and tables
```bash
wrangler d1 create fugue-newsletter
```
Copy the `database_id` it prints into `wrangler.toml` (replace `PASTE_YOUR_D1_DATABASE_ID`). Then:
```bash
wrangler d1 execute fugue-newsletter --file=./schema.sql --remote
```

### 3. Verify a sending domain in Resend
In the Resend dashboard → **Domains** → add the domain you want to send *from*
(e.g. `bringrecords.com`). Resend gives you a few DNS records (SPF/DKIM/DMARC) to add at your
domain registrar. Once it shows **Verified**, set `FROM_EMAIL` in `wrangler.toml` to an address on
that domain (e.g. `newsletter@bringrecords.com`). This step is what keeps you out of spam.

Then create an API key in Resend → **API Keys**, and store it as a secret (not in any file):
```bash
wrangler secret put RESEND_API_KEY      # paste the Resend key
wrangler secret put ADMIN_PASSWORD      # choose a password for /admin
```

### 4. Deploy
```bash
wrangler deploy
```
It prints your Worker URL, e.g. `https://fugue-newsletter.YOURNAME.workers.dev`.
Put that into `wrangler.toml` as `PUBLIC_BASE` (so confirm/unsubscribe links in emails point at
the live Worker), then deploy once more:
```bash
wrangler deploy
```
*(Optional but nicer: add a custom domain/route like `newsletter.bringrecords.com` in the
Cloudflare dashboard → Workers → your worker → Triggers, and use that as `PUBLIC_BASE`.)*

### 5. Point the website at it
In `labs/assets/fugue.js`, find:
```js
const NEWSLETTER = { endpoint:"" };
```
Set it to your Worker's subscribe URL:
```js
const NEWSLETTER = { endpoint:"https://fugue-newsletter.YOURNAME.workers.dev/subscribe" };
```
Commit and deploy the site. That's the only site-side change — done.

## Before going public (abuse protection)

`/subscribe` is public and sends real email, so before you point a live site at it:

1. **Origin allowlist** — `ALLOW_ORIGIN` in `wrangler.toml` already defaults to
   `https://shafrasier.com`. Add any other origins (comma-separated) that should be allowed to
   post, e.g. `"https://shafrasier.com, https://fuguegallery.com"`. Use `"*"` only for local dev.
2. **Rate limit** — add a Cloudflare **WAF rate-limiting rule** (dashboard → your zone/worker →
   Security → WAF → Rate limiting rules): match `URI Path eq "/subscribe"`, e.g. 5 requests per
   minute per client IP, action *Block*. This is the real defense against someone scripting the
   endpoint to blast confirmation emails. (The Worker already caps repeat emails to the *same*
   address via a 5-minute cooldown, and has a honeypot, but the WAF rule covers volume across many
   addresses.)
3. **Optional: Cloudflare Turnstile** — for a stronger guarantee, add a Turnstile widget to the
   form and verify the token in the Worker. Ask and I'll wire it in.

Re-run `wrangler deploy` after any `wrangler.toml` change.

## Using it

- **See your subscribers:** visit `https://<your-worker>/admin` (browser will prompt for the
  password you set). Download CSV from the link there.
- **Send a broadcast:** `POST /admin/broadcast` (HTTP Basic auth, same password) with
  `{ "subject": "...", "html": "..." }`. It sends to every **confirmed** subscriber in batches of
  100 through Resend, each with their own one-click unsubscribe link + `List-Unsubscribe` header.
  Always do a preview to yourself first with `"testTo"`:
  ```bash
  # preview to yourself
  curl -u ":$ADMIN_PASSWORD" https://<your-worker>/admin/broadcast \
    -H 'Content-Type: application/json' \
    -d '{"subject":"This month at the Clearing","html":"<p>Hello…</p>","testTo":"you@example.com"}'

  # send to everyone confirmed (omit testTo)
  curl -u ":$ADMIN_PASSWORD" https://<your-worker>/admin/broadcast \
    -H 'Content-Type: application/json' \
    -d '{"subject":"This month at the Clearing","html":"<p>Hello…</p>"}'
  ```
  Returns `{ ok, sent, failed, total }`. (Resend's free tier caps daily volume — check your plan
  before a large send.)

## Local development
```bash
wrangler dev          # runs the Worker locally
# use --remote to hit the real D1, or set up a local D1 with `wrangler d1 execute … --local`
```

## Porting to fuguegallery.com
Nothing here is tied to shafrasier.com. When you move the page, the Worker, database, and all
subscribers stay exactly where they are — just keep `NEWSLETTER.endpoint` pointed at the same
Worker on the new site, and (optionally) update `ALLOW_ORIGIN`/`SITE_URL`.
