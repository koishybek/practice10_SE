# AI Evidence Appendix and Reflection

**AI assistant used:** Claude (Anthropic), model Claude Opus 5.5, via claude.ai.
**Date:** 7 November 2026.

> Before submitting: re-read this file and change anything that does not match what you personally did. Every statement under "Human verification" must be true for you — run the commands yourself.

## Task #06 — AI reflection (269 words)

I gave Claude a short repository map of the baseline (one app.js file with checkAvailability, liveHint and scheduleHtml), the six original acceptance criteria, the new requirements F1–F5 and the constraints: plain JavaScript, fictional data, no database, and small incremental changes instead of a rewrite. I asked for maintainability risks and a plan before any code.

The most useful suggestions were the risk list, especially the duplicated validation and overlap rules, and the idea of passing the room into checkAvailability so it can never read another room's bookings. Two suggestions were wrong or weak. The first draft auto-selected another room when the chosen one was filtered out, which could show "available" for a room the user never picked, so I rejected it. The first UI test also passed while the real page was broken: it fired a synthetic change event, but a real click fires input first and the re-render swallowed the selection.

I personally ran both test suites, opened the page in a browser and repeated the demo script, read every diff, and checked the boundary values (120/121 minutes, touching intervals, capacity 20/21) against the requirements rather than against the AI's explanation. I also injected three deliberate faults to confirm the tests fail when the rules break.

Tests shaped the work: boundary tests came before the filter code, the existing AC tests made the refactoring safe, and the browser bug only became fixable once a realistic test reproduced it (19/21, then 21/21).

Next, I would add a real-browser test to the test command, keep focus stable when the room list re-renders, and support bookings across more than one day.

## AI-use record

| # | Prompt summary | Output used | Problems found | Changes made | Verification |
|---|---|---|---|---|---|
| 1 | Assignment brief + request to reconstruct the Assignment #03 baseline as a minimal single-room app | `initial/app.js`, `initial/index.html`, 8 baseline tests | Running `node --test tests/` failed: Node 22 treats the folder as a module path | Added `package.json` with `npm test` → `node --test` (default file discovery) | `npm test` → 8/8 |
| 2 | Repository map + AC1–AC6 + F1–F5 + constraints (see REPORT §1); ask for risks and a plan, no code | Risk list R1–R5 and 6-step plan | None blocking; risks re-checked by reading the referenced lines | Plan kept, order confirmed (validation first, UI last) | Line numbers checked against `initial/app.js` with `grep -n` |
| 3 | Implement data, time, availability, filter modules step by step | `final/src/data`, `final/src/domain` | — | — | 18 domain tests pass |
| 4 | Implement UI controller, rendering and jsdom UI tests | `src/ui/app.js`, `src/ui/render.js`, `tests/ui.test.js` | (a) `form.date` named access is `undefined` in jsdom → 3 UI tests crashed. (b) Proposal to auto-select the first remaining room when the selection is filtered out | (a) switched to `form.elements.namedItem()`. (b) rejected; selection is cleared instead | 21/21 |
| 5 | Real-browser check with Playwright: filter, select room, check, switch room, empty state, mobile | Screenshots in `docs/` | Clicking a room did not select it: the `input` event re-rendered the list and the later `change` event came from a detached radio. The UI test missed it because it only fired a synthetic `change` | Test changed to `radio.click()` → reproduced the bug (19/21). Handler fixed to read the room choice on both `input` and `change` before re-rendering | 21/21; Playwright run shows correct results, no console errors |
| 6 | Mutation check: inject 3 faults (capacity `>=`→`>`, overlap `<`→`<=`, allow 121 min) | Table in REPORT §4 | — | Code restored after each run | Each fault made at least one test fail |
| 7 | Draft README, report and this appendix | `README.md`, `docs/REPORT.md`, `docs/AI_USE.md` | Metrics must not be invented | Every number taken from command output (`npm test`, `grep`, `wc -l`) | Re-ran commands, compared to `docs/test-results-*.txt` |

## Human verification (complete before submitting)

- [ ] `cd initial && npm test` → 8 passed
- [ ] `cd final && npm install && npm test` → 21 passed
- [ ] Opened `final/` via `python3 -m http.server 8080` and followed the demo script in README
- [ ] Checked 120 vs 121 minutes, 11:00–12:00 vs 10:30–11:30 in Lecture Hall 204, 20 vs 21 attendees by hand
- [ ] Read all files in `final/src` and understood each function
