// UI controller: wires the DOM to the data, filtering and availability modules.
import { ROOMS, NOW, EQUIPMENT } from "../data/rooms.js";
import { filterRooms } from "../domain/filter.js";
import { checkAvailability } from "../domain/availability.js";
import { validateSlot } from "../domain/time.js";
import { roomOptionsHtml, emptyStateHtml, scheduleHtml, label } from "./render.js";

export function mountApp(doc, { rooms = ROOMS, now = NOW } = {}) {
  const $ = id => doc.getElementById(id);
  const form = $("form");
  const field = name => form.elements.namedItem(name);
  const state = { selectedId: null, checked: false };

  $("equipment").innerHTML = EQUIPMENT.map(e =>
    `<label class="chip"><input type="checkbox" name="equipment" value="${e}"> ${label(e)}</label>`).join("");
  field("date").value = now.date;

  const request = () => ({ date: field("date").value, start: field("start").value, end: field("end").value });
  const criteria = () => ({
    attendees: Number(field("attendees").value) || 0,
    equipment: [...form.querySelectorAll('input[name="equipment"]:checked')].map(i => i.value)
  });

  function render() {
    const visible = filterRooms(rooms, criteria());
    if (!visible.some(r => r.id === state.selectedId)) state.selectedId = null;
    const room = rooms.find(r => r.id === state.selectedId) || null;

    $("rooms").innerHTML = visible.length ? roomOptionsHtml(visible, state.selectedId) : emptyStateHtml();
    $("match-count").textContent = `${visible.length} of ${rooms.length} rooms match`;

    const slot = validateSlot(request(), now);
    $("hint").textContent = slot.ok || slot.code === "incomplete" ? "" : slot.message;

    $("schedule-title").textContent = room ? `Bookings in ${room.name}` : "Bookings";
    $("schedule").innerHTML = room ? scheduleHtml(room, request(), now) : "<li>Select a room to see its bookings.</li>";

    const out = $("result");
    if (!state.checked) { out.textContent = ""; out.className = "result"; return; }
    const result = checkAvailability(room, request(), now);
    out.textContent = result.message;
    out.className = `result is-${result.status}`;
    out.dataset.status = result.status;
  }

  // One handler for both events: read the room choice BEFORE re-rendering,
  // otherwise the clicked radio is replaced and its later "change" event is lost.
  const onEdit = e => {
    if (e.target.name === "room") state.selectedId = e.target.value;
    render();
  };
  form.addEventListener("input", onEdit);
  form.addEventListener("change", onEdit);
  form.addEventListener("submit", e => { e.preventDefault(); state.checked = true; render(); });

  render();
  return { state, render };
}

if (typeof window !== "undefined" && !window.__TEST__) {
  mountApp(document);
}
