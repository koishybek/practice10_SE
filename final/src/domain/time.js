// Time parsing and request validation (AC1, AC2). Single source of truth.

export const MAX_DURATION_MINUTES = 120;

export function toMinutes(date, time) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60000;
}

/**
 * Validates a requested slot.
 * @returns {{ok: true, start: number, end: number} | {ok: false, code: string, message: string}}
 */
export function validateSlot({ date, start, end }, now) {
  if (!date || !start || !end) {
    return { ok: false, code: "incomplete", message: "Choose a date, a start time and an end time." };
  }
  const s = toMinutes(date, start);
  const e = toMinutes(date, end);
  if (e <= s) return { ok: false, code: "order", message: "End time must be after start time." };
  if (s < toMinutes(now.date, now.time)) {
    return { ok: false, code: "past", message: "Start time cannot be in the past." };
  }
  if (e - s > MAX_DURATION_MINUTES) {
    return { ok: false, code: "too-long", message: `Bookings are limited to ${MAX_DURATION_MINUTES} minutes.` };
  }
  return { ok: true, start: s, end: e };
}
