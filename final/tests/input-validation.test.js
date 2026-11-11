// Practice #10 regression test for risk R1: malformed date/time strings must never be reported as "available".
// The browser's <input type="date|time"> normally sanitises values, but the domain functions are the single
// source of truth and are also called directly (tests, future callers, agents), so they must validate format.
import test from "node:test";
import assert from "node:assert/strict";
import { ROOMS, NOW } from "../src/data/rooms.js";
import { checkAvailability } from "../src/domain/availability.js";
import { validateSlot } from "../src/domain/time.js";

const hall = ROOMS.find(r => r.id === "R-204");
const req = (start, end, date = "2026-11-09") => ({ date, start, end });

test("R1: non-time strings are rejected, not reported as available", () => {
  assert.equal(checkAvailability(hall, req("10:30", "xx"), NOW).status, "invalid");
  assert.equal(validateSlot(req("abc", "11:00"), NOW).ok, false);
});

test("R1: malformed or impossible dates are rejected", () => {
  assert.equal(checkAvailability(hall, req("10:30", "11:30", "not-a-date"), NOW).status, "invalid");
  assert.equal(validateSlot(req("10:30", "11:30", "2026-02-30"), NOW).ok, false);
});

test("R1: out-of-range clock values (25:00, 10:75) are rejected with a format message", () => {
  const v = validateSlot(req("10:30", "25:00"), NOW);
  assert.equal(v.ok, false);
  assert.equal(v.code, "format");
  assert.equal(validateSlot(req("10:75", "11:30"), NOW).code, "format");
});

test("R1 guard: valid HH:MM input still behaves exactly as before (AC1/AC2/AC4 unchanged)", () => {
  assert.equal(checkAvailability(hall, req("10:30", "11:30"), NOW).status, "conflict");
  assert.equal(checkAvailability(hall, req("11:00", "12:00"), NOW).status, "available");
  assert.equal(validateSlot(req("15:00", "17:01"), NOW).code, "too-long");
});
