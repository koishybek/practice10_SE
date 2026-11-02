// Presentation helpers: turn domain results into HTML strings. No business rules here.
import { conflictsFor } from "../domain/availability.js";
import { validateSlot } from "../domain/time.js";

const escape = s => String(s).replace(/[&<>"']/g, ch =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export const label = item => item.replace("-", " ");

export function roomOptionsHtml(rooms, selectedId) {
  return rooms.map(r => {
    const sel = r.id === selectedId;
    return `<label class="room${sel ? " is-selected" : ""}${r.blocked ? " is-blocked" : ""}">
      <input type="radio" name="room" value="${escape(r.id)}"${sel ? " checked" : ""}>
      <span class="room-name">${escape(r.name)}</span>
      <span class="room-meta">${r.capacity} seats${r.blocked ? ", blocked" : ""}</span>
      <span class="room-eq">${r.equipment.map(e => escape(label(e))).join(", ") || "No equipment"}</span>
    </label>`;
  }).join("");
}

export function emptyStateHtml() {
  return `<p class="empty" data-testid="empty-state">No rooms match these requirements. Lower the number of attendees or clear some equipment.</p>`;
}

/** Lists the selected room's bookings for the day and marks conflicts using the shared rule. */
export function scheduleHtml(room, request, now) {
  if (!room) return "";
  const day = room.bookings.filter(b => b.date === request.date);
  if (day.length === 0) return `<li>No bookings on this day.</li>`;
  const slot = validateSlot(request, now);
  const conflicts = new Set(slot.ok ? conflictsFor(room, request.date, slot.start, slot.end) : []);
  return day.map(b =>
    `<li${conflicts.has(b) ? ' class="conflict"' : ""}>${b.start}–${b.end} ${escape(b.title)}</li>`).join("");
}
