// New feature tests F1–F5: room catalog, filtering and per-room availability.
import test from "node:test";
import assert from "node:assert/strict";
import { ROOMS, NOW } from "../src/data/rooms.js";
import { filterRooms } from "../src/domain/filter.js";
import { checkAvailability } from "../src/domain/availability.js";

const ids = rooms => rooms.map(r => r.id);

test("Catalog: at least four rooms, each with id, name, capacity, equipment, blocked status and bookings", () => {
  assert.ok(ROOMS.length >= 4);
  for (const r of ROOMS) {
    assert.equal(typeof r.id, "string");
    assert.equal(typeof r.name, "string");
    assert.equal(typeof r.capacity, "number");
    assert.ok(Array.isArray(r.equipment));
    assert.equal(typeof r.blocked, "boolean");
    assert.ok(Array.isArray(r.bookings));
  }
});

test("F1 boundary: exact capacity is included (20 attendees -> Media Lab 310, capacity 20)", () => {
  assert.ok(ids(filterRooms(ROOMS, { attendees: 20 })).includes("R-310"));
});

test("F1 boundary: insufficient capacity is excluded (21 attendees -> Media Lab 310 gone)", () => {
  const result = ids(filterRooms(ROOMS, { attendees: 21 }));
  assert.ok(!result.includes("R-310"));
  assert.deepEqual(result, ["R-204"]);
});

test("F2: room must contain ALL selected equipment", () => {
  assert.deepEqual(ids(filterRooms(ROOMS, { equipment: ["projector", "video-conference"] })), ["R-310", "R-520"]);
});

test("F2: a room with only some of the required equipment is excluded", () => {
  const result = ids(filterRooms(ROOMS, { equipment: ["whiteboard", "computers"] }));
  assert.deepEqual(result, []);
});

test("F1 + F2 combined, and filtering does not mutate the catalog", () => {
  const before = ids(ROOMS);
  assert.deepEqual(ids(filterRooms(ROOMS, { attendees: 15, equipment: ["projector", "whiteboard"] })), ["R-204", "R-520"]);
  assert.deepEqual(ids(ROOMS), before);
});

test("F3: a blocked room that matches the filters is still not available", () => {
  const matches = filterRooms(ROOMS, { attendees: 6, equipment: ["whiteboard"] });
  const blocked = matches.find(r => r.blocked);
  assert.ok(blocked, "fixture should contain a matching blocked room");
  assert.equal(checkAvailability(blocked, { date: "2026-11-09", start: "15:00", end: "16:00" }, NOW).available, false);
});

test("F4: no matching rooms returns an empty list (used for the empty state)", () => {
  assert.deepEqual(filterRooms(ROOMS, { attendees: 100 }), []);
});

test("F5 / per-room data: the same slot gives different results for different rooms", () => {
  const slot = { date: "2026-11-09", start: "10:30", end: "11:30" };
  const hall = ROOMS.find(r => r.id === "R-204");
  const board = ROOMS.find(r => r.id === "R-520");
  assert.equal(checkAvailability(hall, slot, NOW).status, "conflict");
  assert.equal(checkAvailability(board, slot, NOW).status, "available");
});
