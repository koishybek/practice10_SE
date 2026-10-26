// Baseline regression checks run against the INITIAL version (AC1–AC5).
const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../app.js");

test("AC1: end before start is rejected", () => {
  assert.equal(app.checkAvailability("2026-11-09", "12:00", "11:00").ok, false);
});
test("AC1: start in the past is rejected", () => {
  assert.equal(app.checkAvailability("2026-11-09", "08:00", "08:30").ok, false);
});
test("AC2: exactly 120 minutes is accepted", () => {
  assert.equal(app.checkAvailability("2026-11-09", "15:00", "17:00").ok, true);
});
test("AC2: 121 minutes is rejected", () => {
  assert.equal(app.checkAvailability("2026-11-09", "15:00", "17:01").ok, false);
});
test("AC3: blocked room is never available", () => {
  app.room.blocked = true;
  try { assert.equal(app.checkAvailability("2026-11-09", "15:00", "16:00").ok, false); }
  finally { app.room.blocked = false; }
});
test("AC4: touching interval (11:00–12:00 after 10:00–11:00) is allowed", () => {
  assert.equal(app.checkAvailability("2026-11-09", "11:00", "12:00").ok, true);
});
test("AC4: overlapping interval (10:30–11:30) is rejected", () => {
  assert.equal(app.checkAvailability("2026-11-09", "10:30", "11:30").ok, false);
});
test("AC5: booking data is not mutated by a check", () => {
  const before = JSON.stringify(app.room.bookings);
  app.checkAvailability("2026-11-09", "10:30", "11:30");
  assert.equal(JSON.stringify(app.room.bookings), before);
  assert.throws(() => { "use strict"; app.room.bookings.push({}); });
});
