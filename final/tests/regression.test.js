// Regression checks for the ORIGINAL acceptance criteria AC1–AC5, now running on the refactored modules.
import test from "node:test";
import assert from "node:assert/strict";
import { ROOMS, NOW } from "../src/data/rooms.js";
import { checkAvailability, overlaps } from "../src/domain/availability.js";
import { validateSlot } from "../src/domain/time.js";

const room = id => ROOMS.find(r => r.id === id);
const req = (start, end, date = "2026-11-09") => ({ date, start, end });

test("AC1: end time before start time is rejected", () => {
  const r = checkAvailability(room("R-520"), req("12:00", "11:00"), NOW);
  assert.equal(r.available, false);
  assert.equal(r.status, "invalid");
});

test("AC1: start time in the past (before fixed 09:00) is rejected", () => {
  assert.equal(validateSlot(req("08:30", "09:30"), NOW).code, "past");
});

test("AC1: missing fields are rejected with a clear message", () => {
  const v = validateSlot(req("", "10:00"), NOW);
  assert.equal(v.ok, false);
  assert.match(v.message, /date, a start time and an end time/);
});

test("AC2 boundary: exactly 120 minutes is accepted", () => {
  assert.equal(checkAvailability(room("R-520"), req("15:00", "17:00"), NOW).available, true);
});

test("AC2 boundary: 121 minutes is rejected", () => {
  const r = checkAvailability(room("R-520"), req("15:00", "17:01"), NOW);
  assert.equal(r.available, false);
  assert.match(r.message, /120 minutes/);
});

test("AC3 / F3: a blocked room is never reported as available", () => {
  const r = checkAvailability(room("R-415"), req("15:00", "16:00"), NOW);
  assert.equal(r.available, false);
  assert.equal(r.status, "blocked");
});

test("AC4 boundary: touching intervals are allowed (11:00–12:00 after 10:00–11:00, 09:00–10:00 before it)", () => {
  assert.equal(checkAvailability(room("R-204"), req("11:00", "12:00"), NOW).available, true);
  assert.equal(checkAvailability(room("R-204"), req("09:00", "10:00"), NOW).available, true);
});

test("AC4 boundary: overlapping intervals are rejected (partial and enclosing)", () => {
  assert.equal(checkAvailability(room("R-204"), req("10:30", "11:30"), NOW).status, "conflict");
  assert.equal(checkAvailability(room("R-204"), req("09:30", "11:30"), NOW).status, "conflict");
  assert.equal(overlaps(0, 60, 60, 120), false);
  assert.equal(overlaps(0, 61, 60, 120), true);
});

test("AC5: checking availability never changes booking data, and the data is frozen", () => {
  const before = JSON.stringify(ROOMS);
  checkAvailability(room("R-204"), req("10:30", "11:30"), NOW);
  assert.equal(JSON.stringify(ROOMS), before);
  assert.throws(() => room("R-204").bookings.push({ title: "hack" }), TypeError);
  assert.throws(() => { room("R-204").bookings[0].start = "08:00"; }, TypeError);
});
