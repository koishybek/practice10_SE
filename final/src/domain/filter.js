// Room filtering (F1, F2). Pure function, returns a new array.

/**
 * @param {object[]} rooms
 * @param {{attendees?: number, equipment?: string[]}} criteria
 */
export function filterRooms(rooms, { attendees = 0, equipment = [] } = {}) {
  const needed = Number(attendees) || 0;
  return rooms.filter(room =>
    room.capacity >= needed && equipment.every(item => room.equipment.includes(item))
  );
}
