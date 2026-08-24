# Energy Bar Challenge — Jordan's Day
## Locked implementation rules for final QA

This file is authoritative for final QA. Do not replace the mechanics with generic multiple-choice rounds and do not optimise for highest final energy.

## Core premise
Jordan starts at 100 energy. Energy represents immediate usable capacity, not wellbeing, morality, correctness or a score. Useful choices may cost energy. Easier choices now may create pressure later. Some events happen without a choice. No personal disclosure is required.

## Opening
Ask: “Before we start, when you hear the words self-care, what do you think it actually means?” Take 3–5 responses. Jordan is Year 10, has an assessment in progress, works 4:30–6:00, extra hours are useful, and basketball is tonight. Goal: get Jordan through one ordinary day — not perfectly, deliberately.

## Round 1 — Morning
7:10 AM. Poor sleep/rushing automatically −12.
15-second vote and optional top-two runoff.
- TEN MORE MINUTES +1
- BASICS FIRST +2
- SHOWER + TAKE FOOD +1
- TRY TO FIT IT ALL −1
All four cover breakfast.
Life 1 is fixed once selected: lift +3, forgot laptop −3, snack +1.

## Round 2 — Arrival
8:45 AM. Attention pressure −4.
Sort friend DM, school timetable update, group chat and videos into NOW/LATER/MUTE. If multiple NOW, only one is properly checked. Committing any deliberate attention plan gives +2 regardless of app choice. Muted items cannot return. Friend DM checked reveals: “Can I talk to you at lunch? It’s about Sam.”

## Round 3 — School
10:25 AM. Deadline surprise −8. First information source: Task Sheet / Teacher / Deadline / Peer. Task Sheet or Teacher establishes about 60 minutes and gives +2. Deadline or Peer is useful but incomplete, requires a quick Task Sheet/Teacher follow-up, and gives +1 total.

## Round 4 — Lunch
12:45 PM. Competing legitimate needs −4.
- Eat + listen: lunch covered, friend resolved, +1.
- Ten minutes first: lunch covered, friend resolved, +2.
- Check urgency: lunch covered, friend pending, +1.
- Go now: friend resolved, lunch missed, −1.
Then choose/build Jordan's exact response wording. If friend pending, Talk to Friend 10m returns later. If lunch missed, Get Food 10m returns later.

## Round 5 — Work
3:12 PM. Choose work response:
- YES 3:45: +45 paid minutes, 15 usable gap minutes, work energy −8.
- COMPROMISE 4:00: +30 paid minutes, 30 usable gap minutes, work energy −7.
- NO 4:30: +0 paid minutes, 60 usable gap minutes, work energy −6.
Then spend the real gap on multiple actions:
- Assessment 20m, −2, repeat if it fits.
- Friend 10m, −1, only if pending.
- Get food 10m, +3, only if hungry/missed lunch.
- Proper reset 15m, +2, once.
- Get organised 10m, −1, once; this does not automatically complete Tomorrow Basics.
- Leave time open is valid.
Cannot overfill. If Jordan starts work still hungry after missed lunch, visible −3.

## Life Happens 2
Exactly one fixed event:
- Shift runs late: work ends 6:30, home 6:50, +30 paid minutes, −3, normal 7:00 basketball start becomes impossible.
- Training moved: 7:20–8:50, energy 0.
- Home is loud: focused home assessment blocked until 7:15, energy 0; reasonable reset/basic-need actions can still happen.

## Round 6 — Real evening timeline
This is the central clock puzzle, not a three-choice card.
Standard: home 6:20; 6:20–6:45 flexible; 6:45–7:00 prep/travel fixed; basketball 7:00–8:30; travel home to 8:40; then flexible planning until 10:00 PM. The 10:00–10:30 period is held back as the final Reality Check / get-ready-for-bed buffer so the Round 6 clock puzzle can force genuine trade-offs instead of always fitting everything.
Training moved: flexible to 7:05; prep/travel 7:05–7:20; training 7:20–8:50; home about 9:00.
Shift late: home 6:50; normal attendance impossible; choose Join Late or Skip. If joining late, prep/travel 6:50–7:20.
Basketball attend/join late +1; skip 0. Skipping creates real time but no automatic energy reward.
Timeline actions if relevant:
- Dinner 20m +3.
- Assessment 20m −2, repeat.
- Proper reset 15m +2 once.
- Friend 10m −1 if pending.
- Tomorrow basics 10m −1.
- Leave time open.
Engine must reserve fixed travel, block collisions and disable actions that do not fit.

## Round 7 — Reality Check
Only unresolved items return: Assessment, Tomorrow Basics, parked phone content. If none remain show “NOTHING URGENT IS LEFT.”
Round 6 advances the simulated clock to 10:00 PM when the evening plan is locked, including deliberately open time. Round 7 then shows current clock, target bed, the final 30-minute free-before-bed buffer and Tomorrow Load. Use remaining free time before 10:30 first; only excess work pushes bedtime later. Example: at 10:00 a 20m task ends 10:20 and bedtime remains 10:30.
Assessment: finish tonight; when >20 remains, optionally do 20 tonight; or move remaining work to tomorrow. Each 20m tonight costs −2. Support planning is optional, 0 energy and does not erase work.
Tomorrow Basics: Pack + charge 10m −1 and done; Essentials only 5m −1 and +5 Tomorrow Load; Morning 0m and +10 Tomorrow Load.
Parked phone: Check 5m −1; or leave to tomorrow at 0 energy. Muted content never returns.

## Life Happens 3
Optional and eligibility-driven only:
- Extra class time tomorrow: only if assessmentTomorrow >0, +1, gives up to 20m known school window without deleting the work.
- Task quicker than expected: only if assessment work was completed/scheduled tonight, recovers 10m and +2.
- Group chat lights up: only if group chat remains active/later, −2. Muted or deliberately moved to tomorrow makes it impossible.
If none eligible, skip the event.

## Round 8 — Bed
Message is “YOU AWAKE?? I never got to tell you what happened with Sam.” if friend pending, otherwise “YOU AWAKE?? Quick question.” No extra information first. 10-second vote:
- Reply “What’s up?” +3m, 0 energy.
- Check if it can wait +2m, +1.
- Call +12m, −2.
- Leave until morning +0m, +1.
No answer labelled correct.

## Final
Title: THE DAY YOU BUILT, not a score screen. Dynamically show bedtime, energy left at bedtime, assessment/Tomorrow Load/support, extra paid work, basketball, people/basic needs. Ask: “What did your day protect?”, “Would you run this day again?”, “What ONE decision would you change first?” Close with: “SELF-CARE ISN’T KEEPING THE BATTERY AT 100.”

## Projector / facilitator
Student screen must be zero-scroll, fullscreen-friendly at 1366×768, 1280×720 and 1920×1080. No fake phone/iPad frame. Phone content appears as notifications/messages only. Facilitator preview and actual projector must use the same render function. Live vote counts, timer and NOW/LATER/MUTE placements should sync to the real projector. Timed vote screens must show READY before starting, the live countdown while running, and an explicit TIME STOPPED state when the timer reaches zero before the facilitator locks the vote. Facilitator must retain an exact student-screen text mirror with no nested scrolling, SAY, ASK, DO NOW, STUDENTS DO, IF NEEDED, DEPTH/NUANCE, DON'T SAY where relevant, WHAT THIS CHANGES and one clear next action. The visual student preview is view-only and secondary to the script/controls.
