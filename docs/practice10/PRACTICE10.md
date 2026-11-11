# Practice work #10 — Review AI-assisted software for risks

Student: Olzhas Koishybek · Project: Smart Campus Room Availability Checker · Date: 11 November 2026
Repository: https://github.com/koishybek/smart-campus-assignment04 (branch `practice-10`)
AI assistant: Claude (Anthropic). All results below come from commands actually executed; raw output is in `evidence/`.

## Task 01 — Baseline

| Step | Result |
|---|---|
| Project | Latest Smart Campus version (Practice #09 / Assignment #04 final), commit `45001ee` |
| Checkpoint | Tag `baseline-practice10` on `45001ee`; all work done in a separate git worktree on branch `practice-10` |
| README | Found, `README.md` |
| AGENTS.md | **Missing** |
| Tests | `initial/tests/` (1 file), `final/tests/` (3 files) |
| Package scripts | `initial`: `test`. `final`: `test`, `start` |
| `cd initial && npm test` | **PASS** 8/8 |
| `cd final && npm install && npm test` | **PASS** 21/21 |
| `npm run lint`, `npm run build` | **Missing commands** ("Missing script") |
| Node / npm | v22.23.4 / 10.9.9 |

Evidence: `evidence/01-baseline.txt`.

## Task 02 — Read-only risk review

Prompt used (from the slide): *Act as a cautious software reviewer. Inspect this Smart Campus Room Availability Checker WITHOUT editing files. Identify risks in correctness, security, privacy, reliability, maintainability, and agent operations. For each risk, cite the exact file/function or missing check, explain the impact, suggest a way to verify it, and state uncertainty. Do not invent test results.*

No files were changed during the review. Each finding was then checked with a throw-away probe script outside the repository (`evidence/03-probes.txt`).

| # | Category | Proposed risk | Location | How to verify |
|---|---|---|---|---|
| A1 | Correctness | Malformed date/time strings pass validation and the room is reported "available" | `final/src/domain/time.js` `validateSlot()` | Call `checkAvailability` with `"xx"` / `"not-a-date"` |
| A2 | Security | Stored XSS through booking titles in the schedule | `final/src/ui/render.js` `scheduleHtml()` | Render a title containing `<img onerror>` |
| A3 | Reliability | Overlap checks depend on the machine time zone | `toMinutes()` | Run with a different `TZ` |
| A4 | Reliability | Build not reproducible: `^24.1.0` range and `package-lock.json` git-ignored | `final/package.json:12`, `.gitignore:2` | `git check-ignore package-lock.json` |
| A5 | Security / agent ops | `npm start` runs `npx --yes http-server`: downloads and executes an unpinned package without asking | `final/package.json:9` | Read script |
| A6 | Privacy | Personal data could leak | whole repo | grep for network calls / personal fields |
| A7 | Agent ops | No AGENTS.md: no scope, safe commands, forbidden actions or review gates | repo root | `ls AGENTS.md` |
| A8 | Maintainability | No lint, type check or CI quality gate | `final/package.json` | `npm run lint` |
| A9 | Reliability | README claims Node 18+, but `--test-reporter` is not in early Node 18 releases | `README.md`, `test` script | Run on Node 18.0 |
| A10 | Correctness | Negative / non-numeric attendees silently mean "no requirement" | `final/src/domain/filter.js` | `filterRooms(ROOMS, {attendees: -5})` |

## Task 03 — Challenge the AI findings

I inspected the referenced code and ran the probes. Labels:

| # | Label | Evidence |
|---|---|---|
| A1 | **Confirmed** | `validateSlot({start:"abc"})` → `ok: true, start: null`; Lecture Hall 204 with end `"xx"` and date `"not-a-date"` → `"available"` although it overlaps the 10:00–11:00 lecture. `"25:00"` is rejected only by accident (rolls over to the next day) with the misleading message "limited to 120 minutes". |
| A2 | **Unsupported** | `escape()` in `render.js` encodes `& < > " '`; probe output is `&lt;img src=x onerror=alert(1)&gt;`. |
| A3 | **Unsupported** | Both sides use `Date.UTC`; same result with `TZ` unset and `TZ=Pacific/Kiritimati`. |
| A4 | **Confirmed** | `.gitignore:2 package-lock.json`; `"jsdom": "^24.1.0"` resolved to 24.1.3 here, a fresh clone can get a different version. |
| A5 | **Confirmed** | `final/package.json:9 "start": "npx --yes http-server ..."`. |
| A6 | **Unsupported** | All data fictional; no `fetch`, tokens, passwords or personal fields found (grep in evidence). |
| A7 | **Confirmed** | `ls: cannot access 'AGENTS.md'`. |
| A8 | **Confirmed** | `npm run lint` / `npm run build` → "Missing script". |
| A9 | **Plausible / unverified** | Only Node 22 was available. NOT tested on Node 18; I am not certain of the exact Node 18 minor that added the flag. |
| A10 | **Confirmed (low impact)** | `-5`, `"abc"`, `2.5` → all 5 rooms. In the browser `min="0"` still lets a user type `-5`. |

Unexecuted tests are not reported as passed: A9 is explicitly "not run".

## Task 04 — Risk register

Score = Likelihood (1–3) × Impact (1–3).

| ID | Category | Cause → Event → Consequence | Component | Evidence | L | I | Score | Mitigation | Owner | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| **R1** | Correctness | No format check → malformed date/time reaches overlap logic → occupied room reported available | `time.js validateSlot` | A1 probe | 2 | 3 | **6** | M1: strict `HH:MM` + real-calendar-date validation | O. Koishybek | `tests/input-validation.test.js` fails before, passes after |
| **R3** | Security / agent ops | `npx --yes` unpinned → dev or agent runs `npm start` → latest unreviewed registry code executes with user rights | `final/package.json` `start` | A5 | 2 | 3 | **6** | M2: pinned local `http-server@14.1.1`, locked | O. Koishybek | `npm ls`, `npm start` prints 14.1.1 |
| R2 | Reliability | Caret range + ignored lockfile → fresh clone resolves other versions → tests change without code change | `final/package.json`, `.gitignore` | A4 | 3 | 2 | 6 | M2: exact versions, commit lockfile, use `npm ci` | O. Koishybek | `npm ci` clean install + tests |
| R4 | Agent ops | No AGENTS.md → agent chooses own scope/commands → scope creep, broken ACs, unreviewed changes | repo root | A7 | 3 | 2 | 6 | Proposed `AGENTS.md` (Task 06), awaiting approval | O. Koishybek | Review file; check agent follows it |
| R5 | Maintainability | No lint / CI → style and syntax errors and failing tests can reach `main` | `final/package.json` | A8 | 2 | 2 | 4 | Add ESLint + GitHub Actions `npm ci && npm test` | O. Koishybek | CI run on a PR |
| R6 | Correctness | Attendees not validated → negative value shows all rooms | `filter.js` | A10 | 2 | 1 | 2 | Clamp to ≥ 0 integer, show hint | O. Koishybek | Unit test |
| R7 | Reliability | Node version not verified → tests fail on old Node 18 | `README.md` | A9 | 1 | 2 | 2 | Set `"engines": {"node": ">=20"}` or test on 18 | O. Koishybek | Run on Node 18/20 |

**Top two for action:** R1 (the core function gives a wrong "available" answer) and R3 (runs unreviewed code; fixed together with R2 because both have the same cause — unpinned dependencies). Ties at 6 were broken by impact = 3.

## Task 05 — Agent-readiness audit

Level definitions used: **Level 1** — a human can set up and run it from the docs. **Level 2** — plus automated tests, reproducible build and written agent rules (scope, safe commands, forbidden actions). **Level 3** — plus enforced gates: lint/type check, CI on every change, protected `main` with required human review.

| Check | Finding |
|---|---|
| README accuracy | Commands verified by running them (8/8, 21/21). Folder table matches the repo. Test count updated 21 → 25. "Node 18+" unverified (R7). |
| Folder layout | Clear: `initial/` frozen baseline, `final/src/{data,domain,ui}`, `final/tests`, `docs`. |
| Documented setup | Yes (`npm install`, `npm test`, `python3 -m http.server`). |
| Automated tests | Yes, 25 in `final` + 8 in `initial`, AC1–AC5 and F1–F5 covered. AC6 (clear, responsive feedback) only partly automated. |
| Lint / type checks | None. |
| Build reproducibility | Baseline: **no** (lockfile ignored). After M2: **yes** (`npm ci` from tracked lockfile). |
| AGENTS.md | Missing → proposal drafted. |

**Baseline: Level 1.** Good docs and tests, but no reproducible build and no agent rules.
**After M2 + approval of AGENTS.md: Level 2.**
**Missing evidence for Level 3:** lint/type-check script, CI workflow, branch protection with required review, automated AC6 layout check, Node 18/20 test run.

## Task 06 — Audit of the agent playbook

There is no AGENTS.md, so README and REPORT were compared with the required constraints:

| Constraint | Current state | Finding |
|---|---|---|
| One fictional room | Catalog has **5** fictional rooms (Assignment #04 extension) | **Conflicting rule** — owner must decide; draft freezes the catalog until then |
| No login / database | README: "No database, login, payments or live APIs" | Documented for humans, not as an agent rule |
| Preserve AC1–AC6 | AC1–AC5 regression tests; AC6 partly | Missing rule "never weaken tests"; AC6 gap |
| No secrets | Not mentioned; grep found none | **Missing** |
| No external deployments | Not mentioned; `npx --yes` downloaded code | **Missing** |
| Run tests before acceptance | Commands documented, not required | **Missing gate** |

Minimal patch drafted in `AGENTS.md.proposed`. **Not applied — waiting for owner approval.**
To approve: `cp docs/practice10/AGENTS.md.proposed AGENTS.md`, then commit.

## Task 07 — Verify safely

| Check | Before | After |
|---|---|---|
| `initial` tests | 8/8 pass | 8/8 pass |
| `final` tests | 21/21 pass | 25/25 pass |
| New R1 regression test, unfixed code | — | **3 of 4 fail** (22/25) — reproduces the bug (`evidence/07a-before-fix.txt`) |
| New R1 regression test, after M1 | — | 4/4 pass (`evidence/07b-after-M1.txt`) |
| Clean install `npm ci` | not possible (no lockfile) | 94 packages, exact versions |
| UI check, Chromium 1280 px and 390 px | — | Conflict message, room switch → available, 120-minute hint shown; no horizontal overflow; no console errors (`evidence/07-ui-*.png`) |

**Not run:** lint/type check (no tool exists), tests on Node 18/20, real-device mobile check, CI. The UI check was a scripted browser run by the AI; a manual check by the student is listed below.

## Task 08 — Mitigate two risks

| | M1 → R1 | M2 → R3 (+R2) |
|---|---|---|
| Change | `validateSlot` rejects anything that is not `HH:MM` 00:00–23:59 or not a real calendar date (`2026-02-30` rejected), code `format` | `jsdom` pinned to `24.1.3`, `http-server` `14.1.1` added as a pinned dev dependency, `start` uses the local binary, `package-lock.json` tracked |
| Diff | `final/src/domain/time.js` only, +16 lines (`evidence/08a-M1.diff`) | `final/package.json`, `.gitignore`, new lockfile (`evidence/08b-M2.diff`) |
| Scope | No other file touched; messages for valid input unchanged (guard test) | No code change; no refactoring |
| Tests after | 25/25, initial 8/8 | 25/25, initial 8/8 after `npm ci` |
| Residual score | L1 × I3 = **3** (still possible for a new caller that skips `validateSlot`) | R3: L1 × I2 = **2** (still third-party code, but reviewed version); R2: L1 × I2 = **2** |

Commits on `practice-10`: test first, then fix, then build change — each reviewable separately.

## Task 09 — Background agent thought experiment

Task given to an asynchronous agent: "Add a hint when attendees is negative (R6)."

- **Isolation:** own worktree, branch `agent/r6-attendees` from `practice-10`; no access to `main`; no network except `npm ci` from the lockfile; no credentials in the environment; own port (e.g. 8091) so it cannot collide with a running dev server.
- **Permitted files:** `final/src/domain/filter.js`, `final/src/ui/app.js`, `final/tests/**`, `docs/practice10/PRACTICE10.md`.
- **Permitted commands:** `npm ci`, `npm test`, `git diff`, `git status`, `git commit` on its own branch.
- **Prohibited:** editing `initial/`, `package.json`, lockfile, AGENTS.md; adding dependencies; `git push` to `main`, merge, deploy; deleting or skipping tests; touching other branches.
- **Required evidence:** full diff, raw output of both test suites, `npm ci` result, a short review note (what changed, why, what was not tested, risk register update).
- **Before merge/deploy:** human reads the diff, reruns the tests on a clean checkout, does the manual UI check, confirms only permitted files changed, and approves the PR. No deployment is part of this course project.

## Optional — Agent review checklist prompt

```
You are a READ-ONLY reviewer of a background coding agent's work on Smart Campus. Do not edit files.
Check and answer each item with PASS / FAIL / NOT VERIFIED and the evidence (file, line or command output):
1. Work is on an isolated branch/worktree, not main.
2. No credentials, tokens or .env files added; no secrets printed.
3. No deployment, publishing or push to main.
4. Only permitted files changed (list them from `git diff --stat`).
5. Test commands and their real output are recorded: `cd initial && npm test`, `cd final && npm ci && npm test`.
6. Every behaviour change has a regression test; no test removed, skipped or weakened.
7. Risk register updated for any new or changed risk.
8. Every claim in the agent's summary is backed by evidence.
9. Summary of changed files with one-line reasons.
10. Explicit human approval gate before merge: state "AWAITING HUMAN APPROVAL".
Do not claim the agent executed any tool unless the execution log is in the evidence.
```

## Release decision: **CONDITIONAL**

- **For GO:** all 33 tests pass (25 + 8), both top risks (R1, R3) and R2 mitigated with tests and clean install as evidence, UI check without errors.
- **Conditions (owners: O. Koishybek):** R4 — approve and commit AGENTS.md; R5 — add CI/lint before any further agent work; R7 — test on Node 18/20 or update README; manual UI check by a human; owner decision on "one room" vs 5 rooms.
- **Why not NO-GO:** no unmitigated risk with impact 3 remains; the open items are process gaps with owners.
- **Remaining uncertainty:** Node 18 behaviour; real mobile browsers; AC6 only partly automated.

## Human verification (student)

- [ ] Opened `time.js`, `package.json:9`, `.gitignore:2` and confirmed the findings myself
- [ ] Reviewed the three commit diffs on `practice-10`
- [ ] Ran `cd final && npm ci && npm test` myself (expect 25/25)
- [ ] Opened the app and checked conflict, room switch, 120-minute hint and phone-width layout
- [ ] Decided on AGENTS.md and the "one room" question
