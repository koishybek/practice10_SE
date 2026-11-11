# Smart Campus Room Availability Checker — Assignment #04

Software Engineering, Assignment #04: AI-assisted software evolution, refactoring and quality improvement.

## Contents

| Path | What it is |
|---|---|
| `initial/` | Baseline: reconstructed single-room checker (Assignment #03 / Practice #06 equivalent), one file `app.js` |
| `final/` | Final version: room catalog, capacity/equipment filters, refactored into modules |
| `final/tests/` | 25 automated tests (AC1–AC5 regression, F1–F5, 3 UI/integration checks, 4 input-validation checks added in Practice #10) |
| `docs/practice10/` | Practice #10: risk review, risk register, agent-readiness audit, AGENTS.md proposal, evidence |
| `docs/REPORT.md` | Tasks 1–5: codebase analysis, plan, refactoring diagrams, test evidence, quality comparison |
| `docs/AI_USE.md` | Task 6 reflection and AI-use record (tool, date, prompts, outputs, problems, verification) |
| `docs/test-results-*.txt` | Actual output of the test commands |
| `docs/screenshot-*.png` | Browser screenshots: conflict, room switch → available, empty state, mobile |

## Requirements

Node.js 18+ (tested on Node.js v22.23.4, npm 10.9.9). No database, login, payments or live APIs. All data is fictional.

## Run the tests

```bash
# baseline
cd initial
npm test

# final
cd ../final
npm install        # installs jsdom (dev dependency for the UI tests)
npm test
```

## Run the app

The final version uses ES modules, so open it through a local web server (opening the file directly with `file://` is blocked by browsers for modules):

```bash
cd final
python3 -m http.server 8080
# open http://localhost:8080
```

`npm start` does the same with `http-server` if Python is not installed. The baseline can be opened directly: `initial/index.html`.

## Fixed data

Current time is fixed at **Monday 9 November 2026, 09:00**. Rooms (see `final/src/data/rooms.js`):

| ID | Name | Capacity | Equipment | Blocked | Bookings on 2026-11-09 |
|---|---|---|---|---|---|
| R-101 | Seminar Room 101 | 12 | whiteboard | no | 10:00–11:00 |
| R-204 | Lecture Hall 204 | 60 | projector, whiteboard | no | 10:00–11:00, 13:00–14:30 |
| R-310 | Media Lab 310 | 20 | projector, video-conference, computers | no | 12:00–13:00 |
| R-415 | Quiet Study 415 | 6 | whiteboard | **yes** | — |
| R-520 | Board Room 520 | 16 | projector, whiteboard, video-conference | no | — |

## Try it (manual demo script)

1. Attendees 15, equipment Projector → 3 of 5 rooms match.
2. Pick Lecture Hall 204, 10:30–11:30, press Check → busy (overlaps the SE lecture).
3. Switch to Board Room 520 → result refreshes to available (F5).
4. Attendees 100 → empty state (F4).
5. 15:00–17:01 → "Bookings are limited to 120 minutes" (AC2).
