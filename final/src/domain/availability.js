// Booking / availability rules (AC3, AC4, F3). Pure functions, never mutate input.
import { toMinutes, validateSlot } from "./time.js";

/** Half-open intervals [a, b): touching intervals do NOT overlap. */
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export function conflictsFor(room, date, startMin, endMin) {
  return room.bookings.filter(b =>
    b.date === date && overlaps(startMin, endMin, toMinutes(b.date, b.start), toMinutes(b.date, b.end))
  );
}

/**
 * Checks one specific room. Uses ONLY that room's bookings.
 * @returns {{available: boolean, status: string, message: string, conflicts: object[]}}
 */
export function checkAvailability(room, request, now) {
  if (!room) return { available: false, status: "no-room", message: "Choose a room first.", conflicts: [] };
  const slot = validateSlot(request, now);
  if (!slot.ok) return { available: false, status: "invalid", message: slot.message, conflicts: [] };
  if (room.blocked) {
    return { available: false, status: "blocked", message: `${room.name} is blocked and cannot be booked.`, conflicts: [] };
  }
  const conflicts = conflictsFor(room, request.date, slot.start, slot.end);
  if (conflicts.length > 0) {
    const c = conflicts[0];
    return {
      available: false, status: "conflict", conflicts,
      message: `${room.name} is busy: overlaps with “${c.title}” (${c.start}–${c.end}).`
    };
  }
  return {
    available: true, status: "available", conflicts: [],
    message: `${room.name} is available on ${request.date}, ${request.start}–${request.end}.`
  };
}
