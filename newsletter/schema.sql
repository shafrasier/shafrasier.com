-- Newsletter subscribers for the Clearing @ Fugue Gallery / Continuing Education.
-- Apply with:  wrangler d1 execute fugue-newsletter --file=./schema.sql --remote
CREATE TABLE IF NOT EXISTS subscribers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT    NOT NULL UNIQUE,
  first_name      TEXT,
  last_name       TEXT,
  status          TEXT    NOT NULL DEFAULT 'pending',  -- pending | confirmed | unsubscribed
  token           TEXT    NOT NULL,                     -- opaque secret for confirm + unsubscribe links
  source          TEXT,                                 -- where they signed up (e.g. fugue-concept)
  page            TEXT,                                 -- the page path they signed up from
  created_at      TEXT    NOT NULL,                     -- ISO 8601 — when they first subscribed
  confirmed_at    TEXT,                                 -- ISO 8601 — when they confirmed (double opt-in)
  unsubscribed_at TEXT,                                 -- ISO 8601 — when they unsubscribed
  last_email_at   TEXT                                  -- ISO 8601 — last confirmation email sent (resend cooldown)
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_token  ON subscribers(token);
