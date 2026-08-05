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
const BUILD = 2;

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
  sheet_().appendRow([new Date(), first, last, phone, pct, plus, d.show ? "yes" : "no"]);
  notify_(first, last, phone, pct, plus);
  return json_({ ok: true });
}

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1); // drop headers
  let going = 0, maybe = 0;
  const guests = [];
  for (const r of rows) {
    const [, first, last, , pctRaw, plus, show] = r;
    const pct = Number(pctRaw) || 0;
    const heads = 1 + (Number(plus) || 0);
    // GOING means the slider was dragged all the way — full commitment counts.
    // Anything in between is a maybe; 0 is a no.
    if (pct >= 100) going += heads;
    else if (pct > 0) maybe += heads;
    // The list shows everyone opted-in who is coming at all (pct > 0),
    // ranked: the 100%s on top, then descending percent, ties by last name.
    // A 90% shows up under the sure things with their number beside them.
    if (show === "yes" && pct > 0) {
      guests.push({ n: last + ", " + first, p: Number(plus) || 0, pct: pct, sort: (last + " " + first).toLowerCase() });
    }
  }
  guests.sort((a, b) => (b.pct - a.pct) || (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));
  guests.forEach((g) => delete g.sort);
  return json_({ build: BUILD, going: going, maybe: maybe, guests: guests });
}

// The row is already saved by the time this runs — a mail failure (quota,
// scope, anything) must never cost an RSVP, so it stays inside a try.
function notify_(first, last, phone, pct, plus) {
  if (!NOTIFY) return;
  try {
    const heads = 1 + plus;
    const verdict = pct >= 100 ? "IN" : pct === 0 ? "out" : pct + "% — leaning " + (pct >= 50 ? "yes" : "no");
    MailApp.sendEmail({
      to: NOTIFY,
      subject: "DISCO_SPACE — " + first + " " + last + " (" + verdict + ")",
      body: [
        first + " " + last + " just RSVP'd.",
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
