/**
 * DISCO SPACE — RSVP backend (Google Apps Script)
 * ------------------------------------------------
 * Lives INSIDE Sha's RSVP Google Sheet and serves shafrasier.com/26:
 *   doPost — appends one RSVP row
 *   doGet  — returns counts + the opted-in guest list, alphabetized by last name
 *
 * The guest list ranks 100%s first, then descending percent (ties by last
 * name); each sub-100 entry carries its percent so the site can show it.
 *
 * DEPLOY (one time, ~2 minutes):
 *   1. Open the RSVP sheet → Extensions → Apps Script
 *   2. Delete whatever is in the editor, paste this whole file, save
 *   3. Deploy → New deployment → type: Web app
 *        Execute as: Me
 *        Who has access: Anyone          ← required, or guests' fetches 401
 *   4. Authorize when prompted, copy the /exec URL
 *   5. Paste that URL into APPS_SCRIPT_URL at the top of 26/index.html
 *      (or send it to Claude and it gets wired + deployed for you)
 *
 * SHEET LAYOUT (row 1 headers, created automatically on first RSVP):
 *   When | First | Last | Phone | Going % | Plus ones | Show on list
 *
 * Notes:
 *   - Duplicates aren't blocked (someone re-RSVPing just appends a new row);
 *     if a name shows twice, delete the stale row — the site re-reads live.
 *   - Counts are PEOPLE, not rows: a 100% with +2 counts as 3 going.
 */

// Every RSVP emails you here. Set to "" to turn notifications off.
const NOTIFY = "frasier.sha@gmail.com";

// Bump when this file changes; visible in doGet so a deploy can be verified.
const BUILD = 6;

// The percentage at which an RSVP counts as GOING rather than a maybe.
const GOING_AT = 50;

const HEADERS = ["When", "First", "Last", "Phone", "Going %", "Plus ones", "Show on list"];

function sheet_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const first = String(d.first || "").trim().slice(0, 60);
  const last = String(d.last || "").trim().slice(0, 60);
  const phone = String(d.phone || "").trim().slice(0, 30);
  // The RSVP is a sliding scale: 0 (no) … 100 (definitely going).
  const pct = Math.max(0, Math.min(100, Math.round(Number(d.pct) || 0)));
  const plus = Math.max(0, Math.min(3, Number(d.plus) || 0));
  if (!first || !last) {
    return json_({ ok: false, error: "missing fields" });
  }

  // One row per person: an RSVP from the same phone number (or, failing that,
  // the same name) REPLACES the earlier answer instead of stacking a duplicate.
  // Someone who said 60% and comes back later to say 100% just moves up.
  const sh = sheet_();
  const rows = sh.getDataRange().getValues();
  const keyPhone = phone.replace(/\D/g, "");
  const keyName = (first + " " + last).toLowerCase().replace(/\s+/g, " ");
  let found = 0;
  for (let i = 1; i < rows.length; i++) {
    const rPhone = String(rows[i][3] || "").replace(/\D/g, "");
    const rName = (String(rows[i][1] || "") + " " + String(rows[i][2] || ""))
      .toLowerCase().replace(/\s+/g, " ").trim();
    if ((keyPhone && rPhone === keyPhone) || rName === keyName) { found = i + 1; break; }
  }
  const row = [new Date(), first, last, phone, pct, plus, d.show ? "yes" : "no"];
  if (found) sh.getRange(found, 1, 1, HEADERS.length).setValues([row]);
  else sh.appendRow(row);

  notify_(first, last, phone, pct, plus, !!found);
  return json_({ ok: true, updated: !!found });
}

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1); // drop headers
  let going = 0, maybe = 0;
  const guests = [];
  for (const r of rows) {
    const [, first, last, , pctRaw, plus, show] = r;
    const pct = Number(pctRaw) || 0;
    const heads = 1 + (Number(plus) || 0);
    // Half-way or better counts as going — the same line the site draws when it
    // answers "we look forward to seeing you". Below that is a maybe; 0 is a no.
    if (pct >= GOING_AT) going += heads;
    else if (pct > 0) maybe += heads;
    // Everyone coming at all (pct > 0) appears, ranked: the 100%s on top, then
    // descending percent, ties by last name. A 90% shows up under the sure
    // things with their number beside them. There is no opting out — the
    // "Show on list" column is kept for the record but no longer consulted.
    if (pct > 0) {
      guests.push({ n: last + ", " + first, p: Number(plus) || 0, pct: pct, sort: (last + " " + first).toLowerCase() });
    }
  }
  guests.sort((a, b) => (b.pct - a.pct) || (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));
  guests.forEach((g) => delete g.sort);
  return json_({ build: BUILD, going: going, maybe: maybe, guests: guests });
}

// The row is already saved by the time this runs — a mail failure (quota,
// scope, anything) must never cost an RSVP, so it stays inside a try.
function notify_(first, last, phone, pct, plus, updated) {
  if (!NOTIFY) return;
  try {
    const heads = 1 + plus;
    const verdict = pct >= 100 ? "IN" : pct === 0 ? "out" : pct + (pct >= GOING_AT ? "% — in" : "% — maybe");
    MailApp.sendEmail({
      to: NOTIFY,
      // ASCII only: an em dash here arrives mangled in Mail on iOS
      subject: "DISCO_SPACE: " + first + " " + last + " (" + verdict + ")" + (updated ? " [updated]" : ""),
      body: [
        first + " " + last + (updated ? " changed their RSVP." : " just RSVP'd."),
        "",
        "Going:    " + pct + "%",
        "Bringing: " + (plus ? plus + " (" + heads + " heads)" : "just them"),
        "Phone:    " + phone,
        "",
        "The sheet: " + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      ].join("\n"),
    });
  } catch (err) {
    console.error("notify failed: " + err);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
