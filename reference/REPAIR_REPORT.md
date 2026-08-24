# REPAIR_REPORT — Energy Bar Challenge: Jordan's Day

Forensic repair of the dual-screen classroom activity. Authoritative source for mechanics/energy/story: `MASTER_BUILD_SPEC_LOCKED.md`. Forensic baseline: `Energy_Bar_Challenge_LATEST_RUNTIME.html` (single 2212-line file, `<script>` body at lines 969–2212, concatenating `images.js / state_schema.js / run_state_schema.js / state.js / content.js / timeline.js / projector.js / facilitator.js`).

## 1. What was actually broken

The baseline runtime was **materially closer to correct than the handoff note implied**. Its own `<style>` block already contained a trailing "FULL PLAY-THROUGH FACILITATION REPAIRS" section that had already fixed several of the defect classes named in the brief (nested-scroll on the student-copy mirror, dead/ambiguous Lock buttons, R2 disabled-Lock reasoning, R3 follow-up wiring). Two additional `<style id="fresh-...">` patch blocks after the main stylesheet layered on further fixes. Read together, this told a consistent story: earlier passes progressively patched real bugs directly in the browser, and the file handed to this repair still carried all of them. Line-scanning the concatenated script for duplicate top-level `function`/`const`/`let` names found **zero collisions** in this baseline — that specific defect class had already been eliminated before this file was produced.

Real, currently-live defects found by full logic trace + confirmed live in-browser:

| # | Defect | Class | Severity |
|---|---|---|---|
| 1 | Round 5 pre-work-gap "Assessment" action set `assessmentRemaining -= 20` but never set `assessmentWorkedTonight = true`. Any run where assessment work happened *only* during the Round 5 gap (never in Round 6 or Round 7) made Life Happens 3's "Task quicker than expected" event **permanently unreachable**, even though the class had genuinely done assessment work that evening. | Unreachable Life-Happens branch | **P0** |
| 2 | Facilitator screen hierarchy rendered `STUDENTS DO` **after** `LIVE CONTROLS` and the `DISCUSSION GUIDE`, not immediately after `DO NOW`. This is exactly the "facilitator information-order problem" defect class named in the brief: a facilitator reading top-to-bottom hit the clickable controls before being told what students are physically doing. | Facilitator info-order | **P1** |
| 3 | `styles.css` loaded Inter/Montserrat from `fonts.googleapis.com` at parse time. A classroom cannot be assumed to have working internet, and the standalone build's own stated goal is zero external dependencies (already true for images) — a network font request is the same class of fragility. | Robustness / offline guarantee | **P1** |
| 4 | Stylesheet carried three generations of the same override (`.fac-mirror-copy` `max-height`/`overflow` set, then media-query variants, then a final `!important` block that neutralised all of them) — functionally correct in cascade order but a maintenance trap: editing the "wrong" one silently does nothing. | Maintainability | P2 |
| 5 | `_validate()`'s allowed-value list for `groupChatStatus`/`videosStatus` included a `"now"` enum value that no code path ever assigns (`normalize()` only ever produces `done`/`later`/`muted`) — dead defensive code that implied a state the engine cannot actually reach. | Dead code / schema clarity | P2 |
| 6 | Duplicated reset entry points (`window._fac.reset` and a separate `window._fac_reset`) doing the same thing. | Maintainability | P2 |

Everything else audited (round sequencing, Energy timing, Round 3 first-check/follow-up wiring, Round 2 Lock gating, vote Lock button existence, Life-Happens 1/2 fixed-once-per-run assignment via persistent `RunState`, Round 5 gap overfill prevention, Round 6 real-clock window engine incl. SKIP release/no-ghost-blocks, Round 7 bedtime maths, Round 8 vote flow, reconnect protocol) matched the Master Spec and worked correctly once reconstructed — see §4 for what was verified live rather than by inspection only.

## 2. What was fixed

- **Defect 1** — `source/js/engine.js`, the `r5Gap:` action branch now sets `d.assessmentWorkedTonight = true` on `id === "assessment"`, mirroring what Round 6's `applyEveningAction` and Round 7's `assess_finish`/`assess_20` already did correctly. Verified live: a run doing assessment only in the Round 5 gap now makes "Task quicker than expected" reachable.
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

Traced multiple complete paths through `source/js/content.js`/`engine.js` against `MASTER_BUILD_SPEC_LOCKED.md`:

- **High-Energy path is possible**: BASICS FIRST (+2) → lift (+3) → deliberate attention plan (+2) → Task Sheet direct (+2) → TEN MINUTES FIRST (+2) → NO/60min gap with reset used (+2), no hunger penalty, NO/-6 shift → training_moved (0) → ATTEND (+1) → dinner+reset in the evening (+5) → light R7 load → CHECK IF IT CAN WAIT (+1) can plausibly finish well above 90, while still carrying real Tomorrow Load if assessment was deferred — high Energy is never the only number shown; the receipt always pairs it with Tomorrow Load, basketball, friend and food status.
- **Low-Energy path is possible**: TRY TO FIT IT ALL (-1) → forgot laptop (-3) → GO NOW at lunch (-1, missed lunch) → YES/3:45 (-8 shift, +45 paid, plus -3 hunger penalty since food was never obtained) → shift_late (-3) → SKIP basketball (0) → heavy assessment grinding (-2 × several) → CALL at Round 8 (-2) — a low-Energy day that completed significant real responsibilities and paid work, never framed as a worse day.
- **No Energy effect fires twice**: every mutating action is applied inside exactly one `commitAction` call gated by a state flag where repeatable-but-once actions exist (`workEnergyApplied`, `workResetUsed`, `eveningResetUsed`, `organisedUsed`, `lifeEffectsApplied.{life1,life2,life3}`); `commitAction`'s no-op detection additionally prevents a click from creating a duplicate history entry when a guard silently blocks the mutation.
- **No hidden Energy**: every Energy-changing action has an accompanying `why`/`tradeoff` string surfaced on both screens; facilitator `changes` copy always states the resulting number.
- **Language audit**: no instance of "best/healthy/correct/winning/bad" choice-framing outside of explicit "don't say this" facilitator warnings (which exist specifically to ban the phrase from the facilitator's own mouth).

## 6. Flagged assumption (Master Spec is silent, most reasonable resolution taken)

The `ORIGINAL_BRIEF`'s Round 8 QA checklist mentions "all four Lock buttons" but never describes a runoff for Round 8, and `MASTER_BUILD_SPEC_LOCKED.md` gives the runoff explicitly and only to Round 1 ("15-second vote and optional top-two runoff"). The baseline runtime already implemented Round 8 without a runoff. Kept as-is: adding one would contradict the locked spec's Round 8 section, which only ever mentions "10-second vote… lock… reveal."

The Master Spec's bedtime-math example ("at 10:00 a 20m task ends 10:20 and bedtime remains 10:30") differs from the wording used in the outer task brief ("at 9:50…"). Per instructions, the Master Spec file is authoritative; the engine's actual behavior (Round 6 always hands Round 7 a fixed 10:00 PM start via `finishEveningPlan`) matches the Master Spec's own example exactly, so no change was made.

## 7. Remaining genuine limitations

- The build gate's duplicate-declaration scanner is a deliberate column-0 line scanner, not a full JS parser — documented in `build/build.js`'s own comments as a targeted guard against the specific known defect class, not a general linter. It correctly caught an injected collision in testing.
- No automated test suite ships in `source/` beyond the QA scripts used during this repair (kept out of the repo per the "no build tooling / npm deps" constraint — they lived in the session scratchpad, not committed, since they're Playwright-dependent and this project intentionally ships with zero external tooling requirements).
- Round 8's absence of a runoff (see §6) may surprise a facilitator expecting parity with Round 1; it is intentional and spec-driven, not an oversight, but is worth a one-line mention in facilitator training if this is handed to multiple teachers.
- Visual QA covered 1280×720 / 1366×768 / 1920×1080 for the story, result, gap-spending and timeline screens (the densest layouts) plus the home screen; not literally every one of the ~35 states was screenshotted at all three sizes, though all use the same card/hierarchy system verified clean at the densest states, and the projector root was confirmed to have zero scroll/overflow at all three sizes on every screen it was checked against.
