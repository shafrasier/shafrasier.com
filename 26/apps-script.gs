/**
 * DISCO SPACE — RSVP backend (Google Apps Script)
 * ------------------------------------------------
 * Lives INSIDE Sha's RSVP Google Sheet and serves shafrasier.com/26:
 *   doPost — appends one RSVP row
 *   doGet  — returns counts + the opted-in guest list, alphabetized by last name
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
 *   When | First | Last | Phone | Answer | Plus ones | Show on list
 *
 * Notes:
 *   - Duplicates aren't blocked (someone re-RSVPing just appends a new row);
 *     if a name shows twice, delete the stale row — the site re-reads live.
 *   - Counts are PEOPLE, not rows: a "going" with +2 counts as 3.
 */

const HEADERS = ["When", "First", "Last", "Phone", "Answer", "Plus ones", "Show on list"];

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
  const answer = ["going", "maybe", "cant"].indexOf(d.answer) >= 0 ? d.answer : "";
  const plus = Math.max(0, Math.min(3, Number(d.plus) || 0));
  if (!first || !last || !answer) {
    return json_({ ok: false, error: "missing fields" });
  }
  sheet_().appendRow([new Date(), first, last, phone, answer, plus, d.show ? "yes" : "no"]);
  return json_({ ok: true });
}

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1); // drop headers
  let going = 0, maybe = 0;
  const guests = [];
  for (const r of rows) {
    const [, first, last, , answer, plus, show] = r;
    const heads = 1 + (Number(plus) || 0);
    if (answer === "going") going += heads;
    if (answer === "maybe") maybe += heads;
    // The list shows people who are coming (or might) AND opted in.
    if (show === "yes" && (answer === "going" || answer === "maybe")) {
      guests.push({ n: last + ", " + first, p: Number(plus) || 0, sort: (last + " " + first).toLowerCase() });
    }
  }
  guests.sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));
  guests.forEach((g) => delete g.sort);
  return json_({ going: going, maybe: maybe, guests: guests });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
