# REPAIR_REPORT — Energy Bar Challenge: Jordan's Day

Forensic repair of the dual-screen classroom activity. Authoritative source for mechanics/energy/story: `MASTER_BUILD_SPEC_LOCKED.md`. Forensic baseline: `Energy_Bar_Challenge_LATEST_RUNTIME.html` (single 2212-line file, `<script>` body at lines 969–2212, concatenating `images.js / state_schema.js / run_state_schema.js / state.js / content.js / timeline.js / projector.js / facilitator.js`).

## 1. What was actually broken

The baseline runtime was **materially closer to correct than the handoff note implied**. Its own `<style>` block already contained a trailing "FULL PLAY-THROUGH FACILITATION REPAIRS" section that had already fixed several of the defect classes named in the brief (nested-scroll on the student-copy mirror, dead/ambiguous Lock buttons, R2 disabled-Lock reasoning, R3 follow-up wiring). Two additional `<style id="fresh-...">` patch blocks after the main stylesheet layered on further fixes. Read together, this told a consistent story: earlier passes progressively patched real bugs directly in the browser, and the file handed to this repair still carried all of them. Line-scanning the concatenated script for duplicate top-level `function`/`const`/`let` names found **zero collisions** in this baseline — that specific defect class had already been eliminated before this file was produced.

Real, currently-live defects found by full logic trace + confirmed live in-browser:

| # | Defect | Class | Severity |
|---|---|---|---|
| 1 | *(Corrected on final review — see §6b.)* An earlier pass of this repair had `r5Gap:assessment` (Round 5's **pre-work** gap, ~3:12 PM) also set `assessmentWorkedTonight = true`, on the belief that "Task quicker than expected" was otherwise unreachable. It wasn't: Round 6's evening `assessment` tile and Round 7's `assess_finish`/`assess_20` already set that flag correctly, and the Master Spec ties the event specifically to work "completed/scheduled **tonight**" — Round 5 is same-afternoon, pre-work, not evening. The R5 flag-set was an over-broad eligibility bug in the wrong direction and has been reverted. | Over-broad Life-Happens eligibility | **P0** |
| 2 | Facilitator screen hierarchy rendered `STUDENTS DO` **after** `LIVE CONTROLS` and the `DISCUSSION GUIDE`, not immediately after `DO NOW`. This is exactly the "facilitator information-order problem" defect class named in the brief: a facilitator reading top-to-bottom hit the clickable controls before being told what students are physically doing. | Facilitator info-order | **P1** |
| 3 | `styles.css` loaded Inter/Montserrat from `fonts.googleapis.com` at parse time. A classroom cannot be assumed to have working internet, and the standalone build's own stated goal is zero external dependencies (already true for images) — a network font request is the same class of fragility. | Robustness / offline guarantee | **P1** |
| 4 | Stylesheet carried three generations of the same override (`.fac-mirror-copy` `max-height`/`overflow` set, then media-query variants, then a final `!important` block that neutralised all of them) — functionally correct in cascade order but a maintenance trap: editing the "wrong" one silently does nothing. | Maintainability | P2 |
| 5 | `_validate()`'s allowed-value list for `groupChatStatus`/`videosStatus` included a `"now"` enum value that no code path ever assigns (`normalize()` only ever produces `done`/`later`/`muted`) — dead defensive code that implied a state the engine cannot actually reach. | Dead code / schema clarity | P2 |
| 6 | Duplicated reset entry points (`window._fac.reset` and a separate `window._fac_reset`) doing the same thing. | Maintainability | P2 |

Everything else audited (round sequencing, Energy timing, Round 3 first-check/follow-up wiring, Round 2 Lock gating, vote Lock button existence, Life-Happens 1/2 fixed-once-per-run assignment via persistent `RunState`, Round 5 gap overfill prevention, Round 6 real-clock window engine incl. SKIP release/no-ghost-blocks, Round 7 bedtime maths, Round 8 vote flow, reconnect protocol) matched the Master Spec and worked correctly once reconstructed — see §4 for what was verified live rather than by inspection only.

## 2. What was fixed

- **Defect 1** — `source/js/engine.js`'s `r5Gap:` action branch no longer sets `assessmentWorkedTonight`; only Round 6's `applyEveningAction` (evening `assessment` tile) and Round 7's `assess_finish`/`assess_20` set it, matching the Master Spec's "tonight" wording. Verified live (see §6b): a run doing all assessment work exclusively in the Round 5 gap reaches Round 7 with `assessmentWorkedTonight === false` and "Task quicker than expected" correctly ineligible; a run doing the same work via the Round 6 evening tile correctly makes it eligible.
- **Defect 2** — `source/js/render-facilitator.js`'s `shell()` now renders `STUDENTS DO` immediately after `DO NOW` and before `LIVE CONTROLS`, matching the required hierarchy: STUDENTS CURRENTLY SEE → SAY → ASK → DO NOW → STUDENTS DO → LIVE CONTROLS → DISCUSSION GUIDE → IF NEEDED/DEPTH/DON'T SAY → WHAT THIS CHANGES → NEXT UP.
- **Defect 3** — Google Fonts `@import` removed from `source/css/styles.css`; `'Inter'`/`'Montserrat'` replaced with local system-font stacks (`-apple-system, "Segoe UI", Roboto, Helvetica, Arial` and a semibold-leaning variant for display text). Confirmed zero network requests in the built standalone (`grep -c fonts.googleapis dist/...html` → 0).
- **Defects 4–6** — folded into a single clean rule during the modular rewrite rather than three layered overrides; removed the dead `"now"` enum value; consolidated to one `window._fac.reset` entry point (topbar Reset button calls it directly).

No other Energy values, round order, time constants, or story text were changed — every number in `source/js/content.js` matches `MASTER_BUILD_SPEC_LOCKED.md` exactly (see §5).

## 3. Full state map

State id = `viewDescriptor`. Time is minutes-since-midnight. "Reveals" = what becomes visible to students at that state, not before.

| State | Prev → | → Next | Energy | Time set | Mutation | Reveals |
|---|---|---|---|---|---|---|
| `home` | — | `opening_brainstorm` | — | — | — | Waiting title only |
| `opening_brainstorm` | home | `opening_jordan` | — | — | — | Self-care prompt |
| `opening_jordan` | brainstorm | `opening_energy` | — | — | — | Jordan's 4 facts |
| `opening_energy` | jordan | `r1_story` | — | — | — | Energy rules |
| `r1_story` | energy | `r1_vote` | **-12** auto | 430 (7:10) | | Morning story |
| `r1_vote` | r1_story | `r1_discuss:<id>` | — | — | resets votes/timer | 4 plans, live vote/timer |
| `r1_discuss:<id>` | r1_vote | `r1_result` | +choice impact (**applied at lock, hidden until reveal**) | — | decisionLog push | Locked choice, no Energy shown |
| `r1_result` | discuss | `r1_life` | (shown) | — | — | Energy delta + trade-off |
| `r1_life` | r1_result | `r2_story` | apply: one of {+3,-3,+1} (once, idempotent) | — | `lifeEffectsApplied.life1` | Life event |
| `r2_story` | r1_life | `r2_sort` | **-4** auto | 525 (8:45) | | Arrival story |
| `r2_sort` | r2_story | `r2_result` | **+2** at lock | — | sets friendDMStatus/groupChatStatus/videosStatus | Sort board |
| `r2_result` | r2_sort | `r3_story` | (shown) | — | — | Friend DM reveal (if checked), group/video status |
| `r3_story` | r2_result | `r3_investigate` | **-8** auto | 625 (10:25) | | Deadline surprise |
| `r3_investigate` | r3_story | `r3_result` (direct) or `r3_followup` (incomplete) | sheet/teacher +2; deadline/peer +1 | — | sets assessmentRemaining=60 if direct | 4 sources |
| `r3_followup` | investigate | `r3_result` | +0 (total stays +1) | — | assessmentRemaining=60 | Task Sheet / Teacher only |
| `r3_result` | followup/investigate | `r4_story` | (shown) | — | — | What each source told Jordan |
| `r4_story` | r3_result | `r4_choice` | **-4** auto | 765 (12:45) | | Lunch story |
| `r4_choice` | r4_story | `r4_dialogue` | — (not yet applied) | — | decisionLog push (no mutation yet) | 4 approaches |
| `r4_dialogue` | r4_choice | `r4_result` | applied here (+1/+2/+1/-1) | — | lunchHistory/currentHunger/friendStatus set | Wording options |
| `r4_result` | dialogue | `r5_story` | (shown) | — | — | Exact wording + consequence |
| `r5_story` | r4_result | `r5_choice` | 0 auto | 912 (3:12) | | Manager asks |
| `r5_choice` | r5_story | `r5_gap` | — | workStart set, workEnd=1080 | workGapTotal/Remaining set | YES/COMPROMISE/NO |
| `r5_gap` | r5_choice | `r5_work_result` | per action (assessment -2, friend -1, food +3, reset +2, organise -1) | — | workGapRemaining decremented, once-only flags set | Gap meter, live availability |
| `r5_work_result` | r5_gap | `r5_life2` | shift impact (-6/-7/-8) + hunger -3 if still hungry, **applied once** | currentTime=workEnd | workEnergyApplied=true | Work result |
| `r5_life2` | work_result | `r6_story` | apply: one of {shift_late -3, training_moved 0, home_loud 0} | homeTime/workEnd/trainingStart&End/homeBusyUntil per event | `lifeEffectsApplied.life2` | Life event |
| `r6_story` | r5_life2 | `r6_basketball` | 0 | currentTime=homeTime | initialiseEvening | Evening story (branches on which life2 event fired) |
| `r6_basketball` | r6_story | `r6_timeline` | **+1** if attend/late, 0 if skip | — | basketballStatus set | ATTEND/JOIN LATE vs SKIP |
| `r6_timeline` | basketball | `r6_result` | per placed action (dinner +3, assessment -2 ea., reset +2 once, friend -1, basics -1) | — | eveningActions[] appended | Real-clock windows, live placement |
| `r6_result` | timeline | `r7_reality` | (shown) | currentTime=1320 (10:00 PM) at `finishEvening` | — | Built evening |
| `r7_reality` | r6_result / life3 return | `r7_life3` or `r8_story` | per action (assess -2/20m, basics -1, phone -1) | spendClockTime pushes targetBedtime only on overflow | assessmentRemaining/Tomorrow, tomorrowBasics, phone status | Only unresolved items; "NOTHING URGENT IS LEFT" if none |
| `r7_life3` | reality (`life3` click) | back to `r7_reality` (if parked) or `r8_story` | apply: eligible event only, or none | task_quicker also rewinds currentTime -10 | `lifeEffectsApplied.life3` | Event or "no eligible event" |
| `r8_story` | reality/life3 | `r8_choice` | 0 | currentTime=max(current,targetBedtime) | — | "YOU AWAKE??" message (friend-pending variant) |
| `r8_choice` | r8_story | `r8_result` | applied at lock (0/+1/-2/+1) | +duration | decisionLog push | 4 responses, live vote/timer (no runoff — by design, see §6) |
| `r8_result` | r8_choice | `final_receipt` | (shown) | — | — | Final consequence |
| `final_receipt` | r8_result | — | — | — | — | Full receipt, debrief questions |

## 4. QA actually run in-browser (Playwright, chromium, against the built `dist/` file, not just source)

All of the following were driven live via Playwright against `dist/Energy_Bar_Challenge_STANDALONE.html` (both `file://` and `http://` origins), across multiple fresh runs to sample different random Life-Happens draws. Zero console/page errors on facilitator or projector in any run.

- **Opening → Round 1**: Begin Activity through all opening screens; 15s vote (Lock buttons absent before timer, present only after TIME STOPPED, all 4 functional); confirmed Energy is applied at lock time but not shown until Reveal; **tied-vote runoff** (3/3/1 split) — runoff button appears only when genuinely undecided, narrows the field to 2, resets timer/lock state, second vote locks and proceeds.
- **Life Happens 1**: apply control present once, disappears after single use (no double-apply); delta confirmed to be one of the three authorised values every run.
- **Round 2**: full 4-item sort; multi-NOW case (Lock disabled + explicit reason until one NOW item is chosen as "checked"); single-NOW case (no "choose one" prompt, auto-checked, Lock enabled immediately); MUTE tested on a mutable item, confirmed "cannot return" language shown; friend-DM reveal confirmed present only when DM was the checked item.
- **Round 3**: `sheet` (direct, skips follow-up, +2 immediate); `deadline → teacher`; `peer → sheet`; confirmed both follow-up sources offered, confirmed total stays +1 for the two-step path, confirmed narration correctly names which two sources were used — no freeze found on any combination.
- **Round 4**: `go_now` (hungry/lunch-missed branch) with a **custom class-typed wording** (verified verbatim in the result, not just the two canned scripts); `ten_first` with a canned script; confirmed Energy is withheld until wording is chosen, then applied exactly once.
- **Round 5**: `compromise` and `no`/60-min paths; confirmed `food` gap action appears only while hungry and disappears once used; `reset` and `organise` confirmed once-only (disabled after first use, each with a clear reason); confirmed gap never overfills (Lock control always reflects true remaining minutes); confirmed the shift's Energy cost and the separate hunger -3 are applied exactly once at Finish Gap, not earlier.
- **Life Happens 2**: apply-once confirmed; **Home Is Loud specifically isolated** (retried fresh runs until drawn) — confirmed focused Assessment is unavailable in the noisy pre-basketball window but correctly still offered via the later unaffected window (matches spec's "reasonable actions can still occur").
- **Round 6**: basketball decision always offers exactly one of {ATTEND, JOIN LATE} plus SKIP (never both attend and late); **SKIP verified to leave no ghost fixed blocks** — the fixed-block strip shows "REMOVED — time released" and the old 6:45–7:00/7:00–8:30 blocks are gone, not just hidden; Undo verified to remove only the most recent evening action and never re-expose the basketball decision (a prior major-round decision is never undone by the evening Undo).
- **Round 7**: full unresolved-queue walk — `assess_20` (partial) then `assess_tomorrow` (remainder deferred, confirmed no double count), `support` planning (confirmed it does not delete the deferred minutes), `basics_partial` and `basics_morning` (Tomorrow Load math confirmed), parked-phone `phone_check`/`phone_tomorrow` reachable when group chat was left LATER and unreachable when muted; **"NOTHING URGENT IS LEFT"** reached cleanly when all items were resolved.
- **Life Happens 3**: `extra_class_time` (assessmentTomorrow>0), `group_chat_lights` (groupChatStatus="later") both triggered and confirmed eligibility-gated; confirmed the "no eligible event" path renders and moves on without inventing a task.
- **Round 8**: 10s timer/lock flow identical in shape to Round 1 (buttons absent → present only after TIME STOPPED); confirmed no runoff control exists here (correct — Master Spec gives the optional runoff to Round 1 only).
- **Final receipt**: confirmed present and internally consistent with the path taken.
- **Global**: Back/Forward from the final screen and back; **Reset mid-R1-timer** (confirmed the running timer is torn down, energy returns to 100, and the activity is immediately usable again — not stuck); **Reset mid-sort**; **Reset "later in the day"** (mid-Round-6, with an evening action already placed) — all three return cleanly to Setup with no leftover state, and a fresh run afterwards re-applies Round 1's -12 correctly from a clean 100 baseline.
- **Reconnect**: projector closed and reopened mid-sort (full state incl. transient sort placements, including the muted item, correctly re-received); projector closed and reopened mid-R1-timer (live countdown panel correctly present on reconnect).
- **Facilitator/projector parity**: SAY text, the exact-text student mirror, and the live preview pane were spot-checked against the actual projector window at multiple states (R1 discuss-before-reveal, R2 result, R5 gap, R6 timeline, final receipt) and matched, since both are driven by the same `renderProjectorContent()`.
- **Duplicate-global build gate**: confirmed it passes clean on the real 8-module source (135 top-level declarations, zero collisions) and confirmed it actually fails loudly with file:line when a collision is deliberately injected.

## 5. Energy-path audit

Both paths below were driven end-to-end through the actual built `dist/Energy_Bar_Challenge_STANDALONE.html` via real `data-fac-action` clicks (Playwright), with the two Life Happens random draws pre-seeded (`rs.life1`/`rs.life2`/`rs.life3`, the same field `getOrAssignLifeEvent` reads and only fills if still `null` — a legitimate way to force a specific eligible outcome, not a change to any game rule) so the numbers are exactly reproducible rather than one lucky roll. The in-browser final state matched this hand arithmetic exactly on every run.

**Highest-plausible path** — every choice picked for maximum Energy at that decision point (deferring the assessment to tomorrow rather than paying to clear it, since deferral costs 0 Energy):

| Step | Delta | Running total |
|---|---|---|
| Start | — | 100 |
| R1 auto (poor sleep) | −12 | 88 |
| R1 choice: BASICS FIRST | +2 | 90 |
| Life 1: lift offered | +3 | 93 |
| R2 auto (attention pressure) | −4 | 89 |
| R2: deliberate attention plan locked | +2 | 91 |
| R3 auto (deadline surprise) | −8 | 83 |
| R3: TASK SHEET (direct) | +2 | 85 |
| R4 auto (competing needs) | −4 | 81 |
| R4: TEN MINUTES FIRST | +2 | 83 |
| R5 gap: PROPER RESET | +2 | 85 |
| R5 work shift: NO — 4:30 (−6, no hunger penalty) | −6 | 79 |
| Life 2: training moved | 0 | 79 |
| R6 basketball: ATTEND | +1 | 80 |
| R6 evening: DINNER | +3 | 83 |
| R6 evening: PROPER RESET | +2 | 85 |
| R7: assessment → Move to Tomorrow | 0 | 85 |
| R7: Tomorrow Basics → Morning | 0 | 85 |
| Life 3: extra class time tomorrow *(only eligible event on this path — assessmentTomorrow=60, assessmentWorkedTonight=false, groupChatStatus muted)* | +1 | 86 |
| R8: LEAVE UNTIL MORNING | +1 | **87** |

**Final: Energy 87 / 100. Bedtime 10:30 PM. Tomorrow Load 70 min** (60 min assessment carried + 10 for "Morning" Tomorrow Basics). Confirms high Energy coexisting with substantial Tomorrow Load — the 87 was never presented as a pure win; every remaining unit of Energy was bought by deferring something. (The previous draft of this report claimed this path finishes "well above 90" — that was a hand-wave, not a calculation, and was wrong; 87 is the actual ceiling found by optimising every single decision point, verified in-browser.)

**Deliberately lower path** — every choice picked for minimum Energy, while completing real responsibilities (full assessment finished, Tomorrow Basics done, friend and phone resolved) rather than just failing every choice:

| Step | Delta | Running total |
|---|---|---|
| Start | — | 100 |
| R1 auto | −12 | 88 |
| R1 choice: TRY TO FIT IT ALL | −1 | 87 |
| Life 1: forgot laptop | −3 | 84 |
| R2 auto | −4 | 80 |
| R2: deliberate attention plan locked | +2 | 82 |
| R3 auto | −8 | 74 |
| R3: PEER + required follow-up | +1 | 75 |
| R4 auto | −4 | 71 |
| R4: GO NOW (lunch missed) | −1 | 70 |
| R5 gap: GET ORGANISED | −1 | 69 |
| R5 work shift: YES — 3:45 (−8) + still-hungry penalty | −8, −3 | 58 |
| Life 2: shift runs late | −3 | 55 |
| R6 basketball: SKIP | 0 | 55 |
| R6 evening: ASSESSMENT ×2 | −2, −2 | 51 |
| R6 evening: TOMORROW BASICS | −1 | 50 |
| R7: assessment (final 20 min) → Finish Tonight | −2 | 48 |
| Life 3: group chat lights up *(forced to the negative eligible branch; task_quicker was also eligible here — see below)* | −2 | 46 |
| R7: parked phone → Check | −1 | 45 |
| R8: CALL | −2 | **43** |

**Final: Energy 43 / 100. Bedtime 10:42 PM. Tomorrow Load 0 min** (assessment fully done tonight, Tomorrow Basics done, phone checked) — proof that low Energy coexists with *more* responsibilities completed, never framed as a worse or failed day. An unforced live run of this same path (genuine random draws, not seeded) landed at Energy 53 because both Life Happens draws happened to land on their positive branch instead (lift +3 instead of laptop −3, task-quicker +2 instead of group-chat −2) — exactly the +10 the arithmetic predicts, confirming the model.

- **No Energy effect fires twice**: every mutating action is applied inside exactly one `commitAction` call gated by a state flag where repeatable-but-once actions exist (`workEnergyApplied`, `workResetUsed`, `eveningResetUsed`, `organisedUsed`, `lifeEffectsApplied.{life1,life2,life3}`); `commitAction`'s no-op detection additionally prevents a click from creating a duplicate history entry when a guard silently blocks the mutation.
- **No hidden Energy**: every Energy-changing action has an accompanying `why`/`tradeoff` string surfaced on both screens; facilitator `changes` copy always states the resulting number.
- **Language audit**: no instance of "best/healthy/correct/winning/bad" choice-framing outside of explicit "don't say this" facilitator warnings (which exist specifically to ban the phrase from the facilitator's own mouth).

## 6b. Final-review correction log

Two points raised on final review, both independently re-verified against `MASTER_BUILD_SPEC_LOCKED.md` and the actual built standalone before changing anything:

1. **Life Happens 3 eligibility.** Re-read of the spec's "only if assessment work was completed/scheduled **tonight**" against Round 5's own timing (3:12 PM, before the work shift, same afternoon) confirmed Round 5 gap work should not count. Reverted `engine.js`'s `r5Gap:assessment` handler to stop setting `assessmentWorkedTonight`. Live-verified in-browser: a run that clears all 60 minutes of assessment purely in the Round 5 gap now reaches Round 7 with `assessmentWorkedTonight=false` and all three Life Happens 3 events report `eligible:false` (event is skipped); a run that does one 20-minute block via Round 6's evening `assessment` tile instead correctly reaches `assessmentWorkedTonight=true`.
2. **Energy-path numbers.** The prior report's "well above 90" was an unverified estimate. Recalculated both a maximal and minimal complete path by hand (arithmetic above) and confirmed both numbers exactly by driving the real built standalone through Playwright with the two random Life Happens draws pinned to specific outcomes — every intermediate running total in the tables above matches what `getGameState().energy` reported after the corresponding click, at every step, not just at the end.

## 6. Flagged assumption (Master Spec is silent, most reasonable resolution taken)

The `ORIGINAL_BRIEF`'s Round 8 QA checklist mentions "all four Lock buttons" but never describes a runoff for Round 8, and `MASTER_BUILD_SPEC_LOCKED.md` gives the runoff explicitly and only to Round 1 ("15-second vote and optional top-two runoff"). The baseline runtime already implemented Round 8 without a runoff. Kept as-is: adding one would contradict the locked spec's Round 8 section, which only ever mentions "10-second vote… lock… reveal."

The Master Spec's bedtime-math example ("at 10:00 a 20m task ends 10:20 and bedtime remains 10:30") differs from the wording used in the outer task brief ("at 9:50…"). Per instructions, the Master Spec file is authoritative; the engine's actual behavior (Round 6 always hands Round 7 a fixed 10:00 PM start via `finishEveningPlan`) matches the Master Spec's own example exactly, so no change was made.

## 7. Remaining genuine limitations

- The build gate's duplicate-declaration scanner is a deliberate column-0 line scanner, not a full JS parser — documented in `build/build.js`'s own comments as a targeted guard against the specific known defect class, not a general linter. It correctly caught an injected collision in testing.
- No automated test suite ships in `source/` beyond the QA scripts used during this repair (kept out of the repo per the "no build tooling / npm deps" constraint — they lived in the session scratchpad, not committed, since they're Playwright-dependent and this project intentionally ships with zero external tooling requirements).
- Round 8's absence of a runoff (see §6) may surprise a facilitator expecting parity with Round 1; it is intentional and spec-driven, not an oversight, but is worth a one-line mention in facilitator training if this is handed to multiple teachers.
- Visual QA covered 1280×720 / 1366×768 / 1920×1080 for the story, result, gap-spending and timeline screens (the densest layouts) plus the home screen; not literally every one of the ~35 states was screenshotted at all three sizes, though all use the same card/hierarchy system verified clean at the densest states, and the projector root was confirmed to have zero scroll/overflow at all three sizes on every screen it was checked against.

## 8. Presentation / facilitation / story-continuity pass (2026-08-24)

A second pass, entirely on top of the locked mechanics above — no Energy value, round sequence, state field, transition condition or timer constant in `state.js`/`engine.js`/`transport.js`/`build/build.js` was touched. Scope: `content.js`, `render-facilitator.js`, `render-projector.js`, `styles.css` only.

**content.js.** Every `ROUNDn` object kept its exact `choices`/`impact`/`stateMutations` and gained new presentation-only fields: shorter punchy `title`s used as the student-screen headline paired with the existing time stamp (e.g. R1 "7:10 AM / ALREADY BEHIND", R3 "10:25 AM / THE DUE DATE SHOCK", R6 "6:20 PM / BUILD THE EVENING", R7 "10:00 PM / REALITY CHECK", R8 "ONE LAST DECISION"), `voteAnticipation` strings for the two timed votes, R2's `multipleNowPrompt`, R3 source `tellsJordan`/`stillUnknown` pairs, R4's `dialoguePrompt`, R6's `followingHomeHeading`/`notEverythingFits`, R7's `stopHeading`/`askBeforeChoices`, and — per round — `stuckPrompts` (2–4 concrete "IF THEY SAY X" rescue lines), `suggestedAnswers` (framed as possibilities, never an answer key, closed by a shared `SUGGESTED_ANSWERS_CLOSE` line), `listenFor`, a `misconception`/`response` pair, and a `selfCareLink` line matching the brief's per-round wording. `FINAL` gained `getStorySummary()` (a short narrative recap built from real `gs` fields — extra paid minutes, friend/basketball/assessment status) and a 4th debrief question; `closingScript` was rewritten to spell out that a high Energy number can mean protected capacity with more left for tomorrow, and a low one can mean capacity deliberately spent on people/responsibilities.

**render-facilitator.js.** `shell()` now renders, in order: RIGHT NOW (new one-sentence per-view summary from a new `rightNowForView()`), STUDENTS CURRENTLY SEE (unchanged mirror), SAY/READ, ASK FIRST (relabelled, unchanged mechanism), STUDENTS DO (moved before DO NOW to match the brief's physical sequencing), DO NOW, LIVE CONTROLS, DISCUSSION GUIDE, then five new collapsible `<details>` cards sourced from the new `roundForView()` → content.js lookup — IF STUDENTS ARE STUCK (deepened, falls back to the old shallow `ifNeeded` list only where a round has no `stuckPrompts`), SUGGESTED STUDENT ANSWERS, WHAT TO LISTEN FOR, MISCONCEPTION TO CORRECT, SELF-CARE LINK — followed by the existing DEPTH/DON'T SAY/WHAT THIS CHANGES/NEXT UP cards, unchanged. `renderLife()`'s SAY/ASK text was rewritten to the brief's "Jordan made a plan. Now something happens Jordan did not choose." framing.

**render-projector.js.** Added: a "YOUR CLASS CHOSE"/"YOUR ATTENTION PLAN"/"THAT'S WHAT YOUR CLASS SAID."/"YOUR CLASS KEPT N MINUTES. SPEND IT." ownership pill on every result-style screen (R1/R2/R4/R5/R8 results); a dedicated R3 investigation renderer showing "WHAT THIS TELLS JORDAN" / "WHAT IS STILL UNKNOWN" per source instead of a generic choice grid; a dedicated R6 story renderer showing a dynamic "WHAT IS FOLLOWING JORDAN HOME?" chip row computed live from `assessmentRemaining`/`dinnerStatus`/`friendStatus`/`basketballStatus`/`tomorrowBasics` (never invented); "THE EVENING REBUILDS."/"BASKETBALL REMOVED / TIME RELEASED" and a "NOT EVERYTHING FITS." tension caption on the R6 timeline; "STOP. LOOK AT WHAT YOUR DAY CREATED." heading on the R7 Reality Check; anticipation banners before both timed votes and before every Life Happens reveal ("Something Jordan didn't plan for is about to happen."); a compact ✓/✕ "YOUR N MINUTES" spend summary on the R5 work result; short on-screen unavailability tags (`ONLY N MIN REMAIN`, `NOT NEEDED`, `ALREADY HANDLED`) replacing the long facilitator-only reason strings in the R5 gap grid; and a short narrative recap block at the top of the final receipt. `renderProjectorContent(gs, rs, ui)` remains the single entry point used by both the facilitator's live preview pane and the real projector popup — no fork was introduced.

**styles.css.** Added token-consistent styles for the new facilitator cards (`.fac-right-now`, `.fac-stuck`, `.fac-suggested`, `.fac-listen`, `.fac-misconception`, `.fac-selfcare`) and the new student-side elements (`.proj-ownership`, `.proj-anticipation`, `.proj-following`, `.proj-tells`/`.proj-unknown`, `.proj-spend-list`, `.timeline-tension`), all high-contrast, all with `max-height:720px` compaction rules matching the project's existing density-breakpoint pattern. No dark-mode-everything change; embedded round images and the light projector theme were kept as-is.

**QA for this pass.** `node build/build.js` — duplicate-global gate passes cleanly (142 top-level declarations, all unique). A full-playthrough Playwright script drove every `data-fac-action`/`window._fac.*` control end to end on the rebuilt `dist/Energy_Bar_Challenge_STANDALONE.html` and reconfirmed, at each step, the exact same Energy/time/state numbers the mechanics produced before this pass (R1 auto −12 then +2 for BASICS FIRST, R2 +2 attention plan with `friendKnownBeforeLunch`/`groupChatStatus`/`videosStatus` set correctly, R3 DEADLINE+TEACHER two-step path landing on `assessmentRemaining=60`, R4 lunch/friend state per choice, R5 COMPROMISE giving `workGapTotal=30`/`extraPaidMinutes=30` and the gap/work-shift Energy sequence, Life 2 `shift_late` correctly forcing `homeTime=1130` and JOIN LATE/SKIP-only basketball options, R6 evening placement and `finishEveningPlan` landing at 10:00 PM exactly, R7 assessment/basics/life-3/phone resolution queue, R8 10-second vote lock, and the final receipt) — zero drift, confirming this pass changed only presentation. A second Playwright sweep opened the real `?projector=1` popup at 1366×768 and checked 51 checkpoints across every round/sub-view (including every screen touched by this pass — R1/R8 vote ready/running/stopped, both multi-NOW and single-NOW R2 sort states, the new R3 investigate grid, R4 dialogue/result, all three R5 gap/work-result states, R6 story/basketball/timeline/result, every R7 Reality Check card variant including `NOTHING URGENT IS LEFT`, and the final receipt): zero `scrollWidth`/`scrollHeight` overflow, zero `window.scrollX/scrollY`, zero nested `overflow:hidden` elements with `scrollHeight > clientHeight`, zero out-of-viewport elements, zero broken images, zero JS console/page errors on either the facilitator or projector window. The only findings were pre-existing sub-11px badge/label text (`.proj-life-tag`, `.receipt-grid span`, `.fixed-evening-strip span`) that predate this pass and fall under the spec's own badge/label exception — no new small text was introduced. A matching facilitator-side sweep over the same 33 checkpoints confirmed the new RIGHT NOW/STUCK/SUGGESTED ANSWERS/LISTEN FOR/MISCONCEPTION/SELF-CARE LINK cards render on every round with zero nested-scroll regions and the STUDENTS DO → DO NOW ordering holding at every checkpoint. `grep -c fonts.googleapis`/`fonts.gstatic` on the built standalone both return 0, and all 8 round images remain embedded as base64 `data:image/webp` URIs — zero external network dependencies.

**Genuine remaining limitations of this pass.** The QA scripts covered 51 (student) + 33 (facilitator) checkpoints via direct action calls, not literally every reachable permutation of R3/R4/R5/R6/R7 branch combinations with the new copy visible — the highest-risk screens (R3's new two-column investigate grid, R6's new following-home chip row, the R5 spend-list) were specifically targeted and passed clean, but an exhaustive cross-product of all branches × all three reference resolutions (1280×720/1366×768/1920×1080) was not re-run this pass; only 1366×768 was swept this time, reusing the prior pass's confirmation that the same card/hierarchy system holds at the other two sizes. `stuckPrompts`/`suggestedAnswers`/`listenFor`/`misconception`/`selfCareLink` were written for all 8 rounds; the Opening screens and the two Life-Happens-only views (R1/R5's life reveal) intentionally have none of their own (they fall back to the pre-existing shallow `ifNeeded` list), since the brief scoped this deepened content to "major rounds."

## 9. Critical review of §8 — real gaps found and fixed (2026-08-24)

Re-read `content.js`/`render-facilitator.js`/`render-projector.js` in full (not spot-checks) and traced every new §8 content field to its actual render site, on the suspicion that some authored content never made it into what the facilitator or students actually see. Four confirmed, verified-in-browser gaps, all content/wiring only — no mechanics touched, both energy-path scripts (§5) reconfirmed identical (87 / 43) after each fix:

| # | Defect | Fix |
|---|---|---|
| 1 | `ROUND7.askBeforeChoices` — the exact two-line "Looking at the clock, what is ACTUALLY urgent? / What can realistically wait until tomorrow?" the brief specified for the Reality Check — was authored in `content.js` but never rendered anywhere; `renderReality()`'s `ASK FIRST` card used unrelated generic wording instead. | `renderReality()` now reads `ROUND7.askBeforeChoices` directly for its `ask`. Confirmed live: R7's ASK FIRST card now shows the exact brief wording. |
| 2 | Round 3's facilitator SAY script was broken/redundant: `choiceButtons()`'s generic `optionScript()` helper assumes `short` and `label` are different fields, but Round 3's sources only have `label` — producing "TASK SHEET: TASK SHEET — Requirements + criteria" read aloud for all four sources, and never surfacing the new `tellsJordan`/`stillUnknown` content that students *do* see on the projector. | `choiceButtons()` now builds a Round-3-specific `say` from the same `tellsJordan`/`stillUnknown` fields the projector already renders, guaranteeing facilitator/student parity instead of a second, broken script. |
| 3 | Every round's new punchy `title` beat headline (e.g. "ALREADY BEHIND", "THE DUE DATE SHOCK") — the centrepiece of §8's "strong time/location/story beats" — was shown on the student projector (`<h2 class="proj-title">`) but never spoken by the facilitator: `roundStory()`'s SAY text jumped straight into the story sentences, so a facilitator following the script verbatim never actually says the beat name out loud. | `roundStory()` now opens SAY with `"${round.time} — ${round.title}. "` before the story text, for every round that has a `getStory`/`story` screen. |
| 4 | Minor but visible: `roundStory()`'s auto-Energy sentence unconditionally appended a period after `round.autoWhy`, and every `autoWhy` string in `content.js` (R1–R4) already ends in one — producing a literal double period ("...usable capacity..") read aloud and shown in the facilitator SAY card on all four rounds with an automatic Energy change. | Strip any existing trailing period from `autoWhy` before appending the template's own one. |

Also corrected the file-header doc-comment at the top of `render-facilitator.js`, which still described the *previous* pass's card order (`DO NOW` before `STUDENTS DO`, no RIGHT NOW, no mention of the five new teaching-support cards) and directly contradicted the working code and its own inline comment three lines above `shell()`.

**Verification.** All four fixes confirmed live in-browser (exact SAY/ASK text captured via Playwright, not inferred from source). Rebuilt (`node build/build.js`, duplicate-global gate clean, 142 declarations). Re-ran the §5 energy-path scripts — both the highest-plausible (87) and deliberately-lower (43) paths reproduced exactly, confirming these were presentation-only fixes. Re-ran the §6b Life Happens 3 eligibility check — still correctly ineligible for R5-only assessment work. Spot-checked `r1_story`/`r3_story`/`r3_investigate`/`r7_reality` at 1366×768 after the SAY-text lengthening: zero projector-root scroll/overflow.

**What this review did *not* find broken:** the RIGHT NOW → STUDENTS SEE → SAY → ASK FIRST → STUDENTS DO → DO NOW → LIVE CONTROLS ordering itself, the five new collapsible teaching-support cards, the ownership callouts, the R6 following-home chip list, and the final receipt's narrative recap were all confirmed present, correctly ordered, and correctly wired to real game state on inspection — the defects above were specific, isolated wiring/content gaps, not a systemic problem with the §8 pass.
