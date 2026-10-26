// Smart Campus Room Availability Checker — INITIAL VERSION (baseline, single room)
// Reconstructed minimal version of the Assignment #03 / Practice #06 prototype.
// Everything lives in one file: data, rules, and DOM code are mixed together.

var NOW = "2026-11-09T09:00"; // fixed current time (fictional)

var room = {
  name: "Room 204",
  blocked: false,
  bookings: [
    { date: "2026-11-09", start: "10:00", end: "11:00", title: "Algorithms lecture" },
    { date: "2026-11-09", start: "13:00", end: "14:30", title: "Student club meeting" }
  ]
};
Object.freeze(room.bookings);
room.bookings.forEach(function (b) { Object.freeze(b); });

function toMin(date, time) {
  var d = date.split("-"), t = time.split(":");
  return Date.UTC(+d[0], +d[1] - 1, +d[2], +t[0], +t[1]) / 60000;
}

// Called by the "Check" button
function checkAvailability(date, start, end) {
  if (!date || !start || !end) return { ok: false, msg: "Please fill in date, start and end time." };
  var s = toMin(date, start), e = toMin(date, end);
  var nowParts = NOW.split("T");
  var now = toMin(nowParts[0], nowParts[1]);
  if (e <= s) return { ok: false, msg: "End time must be after start time." };
  if (s < now) return { ok: false, msg: "Start time cannot be in the past." };
  if (e - s > 120) return { ok: false, msg: "Bookings are limited to 120 minutes." };
  if (room.blocked) return { ok: false, msg: room.name + " is blocked and cannot be booked." };
  for (var i = 0; i < room.bookings.length; i++) {
    var b = room.bookings[i];
    if (b.date !== date) continue;
    var bs = toMin(b.date, b.start), be = toMin(b.date, b.end);
    if (s < be && e > bs) return { ok: false, msg: "Overlaps with \"" + b.title + "\" (" + b.start + "–" + b.end + ")." };
  }
  return { ok: true, msg: room.name + " is available." };
}

// Called on every input change for live hints (DUPLICATES the validation above)
function liveHint(date, start, end) {
  if (!date || !start || !end) return "";
  var s = toMin(date, start), e = toMin(date, end);
  var nowParts = NOW.split("T");
  var now = toMin(nowParts[0], nowParts[1]);
  if (e <= s) return "End time must be after start time.";
  if (s < now) return "Start time cannot be in the past.";
  if (e - s > 120) return "Bookings are limited to 120 minutes.";
  return "";
}

// Renders today's schedule (DUPLICATES the overlap check to colour conflicts)
function scheduleHtml(date, start, end) {
  var html = "";
  for (var i = 0; i < room.bookings.length; i++) {
    var b = room.bookings[i];
    if (b.date !== date) continue;
    var conflict = false;
    if (start && end) {
      var s = toMin(date, start), e = toMin(date, end);
      var bs = toMin(b.date, b.start), be = toMin(b.date, b.end);
      conflict = s < be && e > bs;
    }
    html += "<li" + (conflict ? " class=\"conflict\"" : "") + ">" + b.start + "–" + b.end + " " + b.title + "</li>";
  }
  return html || "<li>No bookings on this day.</li>";
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    var f = document.getElementById("form");
    var out = document.getElementById("result");
    var hint = document.getElementById("hint");
    var list = document.getElementById("schedule");
    function vals() { return [f.date.value, f.start.value, f.end.value]; }
    f.addEventListener("input", function () {
      var v = vals();
      hint.textContent = liveHint(v[0], v[1], v[2]);
      list.innerHTML = scheduleHtml(v[0], v[1], v[2]);
    });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = vals();
      var r = checkAvailability(v[0], v[1], v[2]);
      out.textContent = r.msg;
      out.className = r.ok ? "ok" : "bad";
      list.innerHTML = scheduleHtml(v[0], v[1], v[2]);
    });
    list.innerHTML = scheduleHtml(f.date.value, "", "");
  });
}

if (typeof module !== "undefined") {
  module.exports = { checkAvailability: checkAvailability, liveHint: liveHint, room: room, NOW: NOW };
}
