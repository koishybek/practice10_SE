// Fictional room catalog. All data is deeply frozen (AC5: booking data is immutable).

export const NOW = Object.freeze({ date: "2026-11-09", time: "09:00" });

export const EQUIPMENT = Object.freeze(["projector", "whiteboard", "video-conference", "computers"]);

const catalog = [
  {
    id: "R-101", name: "Seminar Room 101", capacity: 12, blocked: false,
    equipment: ["whiteboard"],
    bookings: [
      { date: "2026-11-09", start: "10:00", end: "11:00", title: "Algorithms tutorial" }
    ]
  },
  {
    id: "R-204", name: "Lecture Hall 204", capacity: 60, blocked: false,
    equipment: ["projector", "whiteboard"],
    bookings: [
      { date: "2026-11-09", start: "10:00", end: "11:00", title: "Software Engineering lecture" },
      { date: "2026-11-09", start: "13:00", end: "14:30", title: "Student club meeting" }
    ]
  },
  {
    id: "R-310", name: "Media Lab 310", capacity: 20, blocked: false,
    equipment: ["projector", "video-conference", "computers"],
    bookings: [
      { date: "2026-11-09", start: "12:00", end: "13:00", title: "Design review" }
    ]
  },
  {
    id: "R-415", name: "Quiet Study 415", capacity: 6, blocked: true,
    equipment: ["whiteboard"],
    bookings: []
  },
  {
    id: "R-520", name: "Board Room 520", capacity: 16, blocked: false,
    equipment: ["projector", "whiteboard", "video-conference"],
    bookings: []
  }
];

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const ROOMS = deepFreeze(catalog);
