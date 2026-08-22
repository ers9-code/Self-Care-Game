# RESET.EXE Content Specification — UX Rebuild

This document records the authoritative content implemented in the browser app. It preserves the approved Jordan storyline and is not a redesign brief.

## UX Rebuild Notes

The classroom display now uses one dominant investigation workspace rather than a permanent phone/evidence/board dashboard. The phone is prominent during the recovery briefing, then evidence takes over the screen. The Investigation Board appears only when the facilitator deliberately opens it.

The facilitator view is organised as a run sheet with: what to say, what to listen for, hints, student-screen preview, case board, case flow, and grouped display controls.

The saved-state schema is now `stateVersion: 2` so old test progress from the earlier layout does not leak into the rebuilt classroom version.


## Scene Order

1. Recovery opening
2. File 01 - Device Activity
3. File 02 - Morning Recovery
4. File 02 - RESET.EXE Review
5. File 03 - Calendar / School Portal
6. File 03 - Information Check
7. File 04 - Photo Recovery
8. File 04 - Lunch Recommendation
9. Deleted Data locked folder
10. File 05 - Afternoon Gap
11. File 06 - Message Archive
12. File 07 - Hidden Urgent Task
13. File 08 - Final Night
14. New Data - Final Curveball
15. System Override
16. Case Findings - Root Cause Analysis
17. Final Reveal - Day Reconstructed
18. Final Reboot - RESET.EXE v2.0

## Jordan Timeline

- 1:51 AM: Phone finally locked.
- 6:45 AM: First alarm. RESET.EXE detects fatigue and recommends more rest.
- 7:19 AM: Phone unlocked after several snoozes.
- 7:44 AM: Usual bus departs.
- 7:46 AM: Breakfast reminder dismissed.
- 8:47 AM: School Wi-Fi connected.
- 10:34 AM: RESET.EXE detects deadline pressure and recommends using breaks to complete work.
- 12:39 PM, 12:54 PM, 1:08 PM: Photos show English work open and lunch/drink still present.
- 12:32-1:10 PM: School portal active.
- 12:34-1:08 PM: English document active.
- 3:44 PM: RESET.EXE detects overload and recommends an enjoyable break.
- 3:48-5:14 PM: TikTok remains active across the afternoon gap.
- 5:16 PM: Work message opened.
- 5:17 PM: RESET.EXE detects 14 unresolved notifications and recommends responding.
- 9:47 PM: Multiple tasks remain visible.
- 10:41 PM: RESET.EXE fails.
- 10:47 PM: Phone appears in recovery mode.

## Scene Content

### Recovery Opening / Device Recovery

Student-facing content:

- Dark corrupted phone.
- Time: 10:47 PM.
- Battery: 3%.
- Notifications:
  - RESET.EXE - SYSTEM FAILURE DETECTED
  - Messages - 14 unread
  - School Portal - English Draft Check Tomorrow
  - Work - Shift Updated
- Recovery text:
  - User activity record incomplete.
  - RESET.EXE stopped responding at 10:41 PM.
  - Last stable system check: 7:04 AM.
  - Recover the phone record.
  - Determine what caused the failure.
- Button: BEGIN RECOVERY.

Facilitator script:

> You've got a corrupted phone. Something went wrong across one ordinary day. Your job is to work out what happened. Everything you need is somewhere in the phone.

Board starts with:

- Confirmed: RESET.EXE failed at 10:41 PM.
- Possible: Phone use may have contributed.
- Unresolved: What happened during the day? Why did RESET.EXE fail? Was there one major cause?

### File 01 - Device Activity

Evidence:

| Time | Activity |
| --- | --- |
| 12:58 AM | TikTok active |
| 1:17 AM | TikTok active |
| 1:36 AM | TikTok active |
| 1:51 AM | Screen locked |
| 6:45 AM | Alarm |
| 6:54 AM | Alarm snoozed |
| 7:03 AM | Alarm snoozed |
| 7:12 AM | Alarm snoozed |
| 7:19 AM | Screen unlocked |
| 7:31 AM | Maps opened |

Prompt: What is the most useful conclusion from this data?

Choices:

- A. Jordan likes TikTok.
- B. Jordan probably had limited sleep.
- C. Jordan does not like mornings.
- D. The phone battery was probably low.

Accepted answer: B.

Hints:

1. Look at the gap between the last phone activity and the first alarm.
2. Jordan's phone locked at 1:51 AM and the first alarm was at 6:45 AM.
3. Focus on sleep opportunity rather than what app Jordan used.

Reveal:

> Jordan's phone was active until 1:51 AM and the first alarm began at 6:45 AM. That means Jordan had roughly five hours of sleep opportunity before the morning even began.

Recovered data:

> FACT RECOVERED: Jordan had approximately five hours of sleep opportunity.
>
> 6:45 AM
> FATIGUE DETECTED
> Recommendation: Stay in bed longer. Rest supports wellbeing.
>
> FLAG FOR REVIEW

Board update:

- Confirmed: Jordan had limited sleep. Jordan snoozed several alarms.
- Unresolved: Did extra rest help? What happened next?

### File 02 - Morning Trace

Evidence:

- 7:19 AM - phone unlocked
- 7:31 AM - Maps opened
- 7:44 AM - usual bus departs
- 7:46 AM - Breakfast reminder dismissed
- 7:53 AM - message sent: "running late"
- 8:11 AM - later bus route opened
- 8:47 AM - school Wi-Fi connected

Prompt: Select the TWO events most likely connected to the extra time in bed.

Choices:

- Missed usual bus
- Skipped breakfast
- Later school arrival
- Phone battery fell
- Friend sent a message

Accepted answer: Missed usual bus + skipped breakfast.

Hints:

1. Look at what happened after the snoozed alarms.
2. Compare the phone unlock time, the usual bus time, and the breakfast reminder.
3. The two strongest consequences are transport and breakfast.

Reveal:

> The later school arrival matters, but the two clearest immediate consequences are that Jordan missed the usual bus and appears to have skipped breakfast.

Board update:

- Confirmed: Jordan missed the usual bus. Jordan appears to have skipped breakfast.
- Unresolved: Was staying in bed the right advice?

### File 02 - Audit 01 · Morning Advice

Evidence:

> ORIGINAL RECOMMENDATION
>
> Tired -> stay in bed longer.

Prompt: Was RESET.EXE's morning advice right as written?

Choices:

- ACCEPT
- MODIFY
- REJECT

Accepted answer: MODIFY.

Hints:

1. The advice was responding to real fatigue.
2. Check what happened after the extra time in bed.
3. The problem is not rest itself. The problem is that the advice ignored what came next.

Reveal:

> Rest matters. But RESET.EXE did not consider what Jordan needed to do next.

Recovered rule:

> FAILED RULE 01
> "If tired, prioritise more rest."

Board update:

- Confirmed: RESET.EXE gave advice that was partly reasonable but missing context.
- Possible: RESET.EXE may be treating each problem separately.

### File 03 - Deadline Mismatch

Evidence:

Calendar:

- ENGLISH DUE TOMORROW - 9:00 AM
- Work - 6:30 PM
- Maths upload - 11:59 PM

School Portal:

- English
- Draft check: tomorrow
- Final submission: Monday
- Bring current progress to class.

Prompt: Something does not match. Find it.

Accepted connection: Calendar: ENGLISH DUE TOMORROW + School Portal: Final submission Monday.

Hints:

1. Compare Jordan's calendar with the school portal.
2. Look for two statements about the same English assessment.
3. "Draft check tomorrow" is not the same as "final submission tomorrow."

Reveal:

> MISINTERPRETATION DETECTED. The calendar entry was Jordan's own interpretation. The school portal says the draft check is tomorrow, but the final submission is Monday.

Recovered RESET.EXE:

> 10:34 AM
> DEADLINE PRESSURE DETECTED
> Recommendation: Use available breaks to complete outstanding work.

Board update:

- Confirmed: Jordan misunderstood the English deadline. Final English submission was Monday.
- Possible: Jordan may have sacrificed something unnecessary to complete it.
- Unresolved: What happened at lunch?

### File 03 - Audit 02 · Deadline Advice

Prompt: Did RESET.EXE have enough information to make a good recommendation?

Choices:

- YES
- NO
- NOT SURE

Accepted answer: NO.

Hints:

1. RESET.EXE detected pressure, but what created the pressure?
2. The portal contained information that changed the urgency.
3. A good recommendation needed to check whether the deadline belief was accurate.

Reveal:

> RESET.EXE reacted to the pressure. It did not check whether the pressure was based on accurate information.

Board update:

- Confirmed: RESET.EXE treated the assessment as urgent without checking the source.

### File 04 - Lunch Photo Recovery

Evidence:

- Photo 1 - 12:39 PM: laptop open, English document visible, lunch beside it, unopened drink.
- Photo 2 - 12:54 PM: laptop still open, lunch untouched.
- Photo 3 - 1:08 PM: English still open, lunch still there.

Optional supporting evidence:

- School portal active 12:32-1:10 PM.
- English document active 12:34-1:08 PM.

Prompt: What does the photo sequence suggest?

Choices:

- A. Jordan disliked the lunch.
- B. Jordan spent most of lunch working.
- C. Jordan forgot their lunch.
- D. Jordan was waiting for someone.

Accepted answer: B.

Hints:

1. Look for what changes between the three photos.
2. Compare the photo times with what is still on the desk.
3. The lunch remains there while the English document stays open.

Reveal:

> Across 12:39 PM, 12:54 PM, and 1:08 PM, the English work stays open while lunch and the drink remain untouched. The supporting activity log shows school portal and English document activity through most of lunch.

Recovered log:

> 12:28 PM
> STRESS LEVEL ELEVATED
> Recommendation: Use lunch period to reduce outstanding workload.
>
> System confidence: 98% -> 79%

Board update:

- Confirmed: Jordan worked through most of lunch. Jordan's lunch appears to have remained untouched.
- Possible: RESET.EXE may be ignoring basic needs.
- Confidence: 79%.

### File 04 - Audit 03 · Lunch Advice

Evidence:

- 12:28 PM - STRESS LEVEL ELEVATED.
- Recommendation: Use lunch period to reduce outstanding workload.
- Context: Breakfast likely skipped. English final not due until Monday.

Prompt: Was this recommendation:

- HELPFUL
- UNHELPFUL
- HELPFUL IN THEORY, WRONG IN THIS SITUATION

Accepted answer: HELPFUL IN THEORY, WRONG IN THIS SITUATION.

Hints:

1. The advice could make sense if the deadline were real and basic needs were covered.
2. Jordan had already missed breakfast.
3. Completing work can reduce pressure, but not every break should become more work.

Reveal:

> Completing work can reduce pressure. But Jordan had already missed breakfast and the deadline was not what Jordan thought it was.

Board update:

- Confirmed: A strategy can be useful in theory but unhelpful in a specific situation.

### Deleted Data Lock

Evidence:

- FIRST ALARM - 6:45
- USUAL BUS - 7:44
- LUNCH PHOTO - 12:39
- SYSTEM FAILURE - 10:41

Prompt: Use the last digit of each time.

Accepted code: 5491.

Hints:

1. Find the four times named in the clue.
2. First alarm 6:45, usual bus 7:44, lunch photo 12:39, system failure 10:41.
3. Use the last digit of each time: 5, 4, 9, 1.

Reveal:

> DELETED DATA RESTORED. The code uses the last digit of each recovered time: 6:45, 7:44, 12:39, 10:41 -> 5491.

Board update:

- Confirmed: Deleted data folder restored.

### File 05 - The Missing Hour

Evidence:

- 3:41 PM - School Wi-Fi disconnected.
- DATA LOST.
- 5:16 PM - Work message opened.

Recovered app history:

| Time | Activity |
| --- | --- |
| 3:48 | TikTok opened |
| 4:06 | TikTok active |
| 4:31 | TikTok active |
| 4:52 | TikTok active |
| 5:03 | TikTok active |
| 5:14 | TikTok closed |

RESET.EXE:

> 3:44 PM
> OVERLOAD DETECTED
> Recommendation: Take a break and do something enjoyable.

Prompt: What went wrong?

Choices:

- A. TikTok is not self-care.
- B. Jordan should have started homework immediately.
- C. The break continued long after it was meant to help.
- D. RESET.EXE should never recommend entertainment.

Accepted answer: C.

Hints:

1. Look at when the break started and when the app closed.
2. The recommendation itself is not automatically the problem.
3. A helpful break can stop helping if nobody checks whether it is still doing its job.

Reveal:

> The original strategy was not necessarily the problem. RESET.EXE never checked whether it was still helping.

Recovered setting:

> HIDDEN SETTING RECOVERED
> REVIEW STRATEGY AFTER: OFF
>
> System confidence: 79% -> 61%

Board update:

- Confirmed: Jordan's afternoon break continued for more than an hour. RESET.EXE had strategy review turned off.
- Possible: RESET.EXE is missing a way to check whether advice is still helping.
- Confidence: 61%.

### File 06 - Message Queue

Evidence:

Friend:

- you coming online tonight?
- ??
- are you ignoring me
- okay then

Teacher:

- Just confirming tomorrow is the draft check. Final submission is Monday.

Manager:

- Any chance you can start at 6 instead of 6:30?
- Thanks, appreciate it.

Home:

- Food is in the fridge.

Random:

- streaks

Group chat:

- anyone know what room tomorrow

RESET.EXE:

> 5:17 PM
> 14 UNRESOLVED NOTIFICATIONS
> Recommendation: Respond to outstanding communication to reduce mental load.

Prompt: Jordan has time to deal with TWO messages before work. Which deserve attention first?

Accepted flexible outcomes:

- Teacher + Friend.
- Teacher + Home.
- Friend + Home is treated as reasonable but missing deadline clarity.

Consequences:

- Teacher: Jordan now knows English is not due tonight.
- Friend: "Not ignoring you. I'm wrecked and heading to work. I'll talk tomorrow." Friendship pressure reduces without starting a long conversation.
- Home: Jordan remembers food is available.
- Manager: earlier start has already been confirmed, so this may not need more attention now.
- Random / Group chat: notification cleared, but immediate pressure is mostly unchanged.

Hints:

1. Some messages reduce actual pressure; some only clear a notification.
2. Look for messages that change tonight's information or reduce pressure without starting a long task.
3. Teacher clarifies the deadline. Home affects food. Friend may need a short boundary.

Reveal:

> Prioritising communication is not about answering everything. Teacher clarifies that English is not due tonight. Friend can get a short boundary reply. Home reminds Jordan food is available. Random and group chat messages may be real, but they do not change immediate pressure.

Board update:

- Confirmed: Teacher confirmed the English task is a draft check, not final submission. Some communication can reduce pressure without becoming a long conversation.
- Possible: Jordan may need boundaries as well as task decisions.

### File 07 - Priority Failure

Evidence:

> Maths Upload - due 11:59 PM
> Short response task.
> Estimated completion time: 8 minutes.
> Submission closes at midnight.

RESET.EXE priority wall:

- English - HIGH PRIORITY
- Friend messages - HIGH PRIORITY
- Maths - HIGH PRIORITY
- Uniform - HIGH PRIORITY
- Shower - HIGH PRIORITY
- Phone charging - HIGH PRIORITY

Prompt: If everything is high priority, is anything actually prioritised?

Sorting buckets:

- URGENT TONIGHT
- IMPORTANT BUT CAN WAIT
- LOW PRIORITY

Cards:

- Maths upload
- Basic preparation for sleep/school
- English draft improvement
- Full friendship conversation
- Random messages
- Non-essential phone tasks

Accepted arrangement:

- Urgent tonight: Maths upload; Basic preparation for sleep/school.
- Important but can wait: English draft improvement; Full friendship conversation may fit here.
- Low priority: Random messages; Non-essential phone tasks; Full friendship conversation may also be defensibly lower than tonight's urgent items.

Hints:

1. Look for deadlines, estimated time, and what affects tomorrow.
2. The maths task closes at midnight and takes about eight minutes.
3. If everything is high priority, the useful move is to separate urgent, important-later, and low-impact tasks.

Reveal:

> Maths is genuinely urgent because it closes at midnight and takes about eight minutes. English improvement and a full friendship conversation matter, but can wait. Random messages and non-essential phone tasks should not compete with sleep.

Board update:

- Confirmed: The maths upload is genuinely urgent tonight. RESET.EXE marked too many different things as high priority.
- Unresolved: What should Jordan actually do tonight?

### File 08 - 9:47 PM · Three Moves

Evidence:

- Time: 9:47 PM.
- Visible unresolved items: Maths upload, English draft, 11 messages, Shower, Uniform, Charge laptop, Food, Friend issue, School tomorrow.

RESET.EXE:

> INCOMPLETE TASKS DETECTED
> Recommendation: Complete all outstanding items before sleep to reduce tomorrow's stress.
> System confidence: 61%.

Prompt: YOU HAVE THREE MOVES.

Choices:

- Finish entire English draft
- Complete 8-minute maths upload
- Have something to eat
- Start full friendship conversation
- Send brief boundary message
- Shower/get ready
- Keep scrolling until less stressed
- Prepare everything perfectly for tomorrow
- Sleep

Accepted provisional plans before the curveball:

- Maths upload + Sleep + Have something to eat.
- Maths upload + Sleep + Shower/get ready.
- Maths upload + Sleep + Send brief boundary message.
- Maths upload + Sleep + Finish entire English draft.

The English version is accepted only as a reasonable provisional choice based on the evidence available before NEW DATA is recovered. It is not the strongest final answer.

Rejected patterns:

- Missing maths upload.
- Missing sleep.
- Start full friendship conversation.
- Keep scrolling until less stressed.
- Prepare everything perfectly for tomorrow.

Hints:

1. Look for the item with a real deadline tonight.
2. Jordan cannot complete every unfinished item before sleep.
3. A provisional plan should handle the urgent eight-minute task, include sleep, and choose one move that looks useful with the current evidence.

Reveal:

> PROVISIONAL PLAN LOCKED. The plan must handle the urgent maths upload and protect sleep. New recovered data may still change which third move makes the most sense.

Board update:

- Confirmed: Jordan needs to prioritise rather than finish everything. The class has locked a provisional three-move plan.

### New Data - English Draft

Student-facing content:

> NEW DATA RECOVERED
> English draft is already 80% complete.
> Draft check is tomorrow.
> Final submission is Monday.

Options:

- KEEP PLAN
- CHANGE ONE MOVE

Reassessment logic:

- If the provisional plan contains Finish entire English draft, KEEP PLAN gives feedback: "The new evidence changes English's urgency. Before locking the plan, consider whether that move could do more somewhere else."
- If the provisional plan contains Finish entire English draft, CHANGE ONE MOVE is the stronger investigation path.
- In that path, English can be replaced with Have something to eat, Shower/get ready, or Send brief boundary message.
- If the provisional plan did not contain English, KEEP PLAN is valid because the new data confirms the existing priorities still make sense.
- CHANGE ONE MOVE remains available for reconsideration, but it changes only the third move. Maths upload and Sleep stay locked, and the final locked plan must include exactly one of Have something to eat, Shower/get ready, or Send brief boundary message.

Hints:

1. The new data changes the English urgency.
2. Draft check tomorrow means current progress is enough to bring.
3. If the plan spends a move on finishing all English, that move can probably be used better.

Reveal:

> English draft is already 80% complete. Draft check is tomorrow. Final submission is Monday. The final locked plan should keep maths, keep sleep, and use one realistic reset such as food, shower/basic prep, or a brief boundary message.

Board update:

- Confirmed: English draft is already 80% complete. Some tasks can remain unfinished tonight. The final plan protects the urgent maths upload and sleep.

### System Override

Student-facing warning:

> 4 TASKS WILL REMAIN INCOMPLETE.
> RESET.EXE recommends cancelling the plan and completing all outstanding items.

Buttons:

- CANCEL PLAN
- OVERRIDE SYSTEM
- CONFIRM CHOICE

Confirmation:

> Are you sure some tasks can remain unfinished?

Accepted path: OVERRIDE SYSTEM, then YES.

Hints:

1. RESET.EXE is counting unfinished items, not judging priority.
2. The class already identified that some tasks can wait.
3. The point is not to abandon everything. It is to stop the system from demanding everything tonight.

Reveal:

> OLD DECISION MODEL DISABLED. Confidence falls from 61% to 18% to 4% because the old model cannot handle prioritised unfinished tasks.

Board update:

- Confirmed: The class overrode RESET.EXE's "finish everything" model.
- Confidence: 4%.

### Case Findings - What Broke the Model?

Evidence cards:

- Limited sleep
- Misread English deadline
- Missed breakfast
- Worked through lunch
- Long afternoon break
- Earlier work shift
- Too many messages
- Phone battery 3%
- Maths task due
- RESET.EXE treated problems separately

Prompt: Select the factors that best explain why the day became increasingly difficult.

Accepted flexible outcome:

- Select no more than six cards.
- RESET.EXE treated problems separately must be included.
- At least four meaningful accumulation factors must be included.
- Phone battery 3% remains a red herring and does not count toward the successful set.
- Selecting every card does not pass; students are prompted to narrow to the strongest factors.

Hints:

1. Look for factors that connected to later pressure.
2. There is no single cause, so one card will not explain the day.
3. Include both Jordan's accumulating pressures and RESET.EXE's pattern of treating them separately.

Reveal:

> No single event caused the failure. The strongest explanation is accumulation: limited sleep, missed food, mistaken urgency, a long break without review, real deadlines, messages, work pressure, and RESET.EXE treating each problem separately.

Board update:

- Confirmed: There was no single cause. The day became difficult through accumulation. RESET.EXE responded without enough context, priority checks, basic-needs checks, or strategy review.

### Final Reveal - Jordan's Day, Rebuilt

Student-facing reconstruction:

- 1:51 AM - Phone finally locked.
- 6:45 AM - Fatigue detected. RESET.EXE: More rest.
- Morning - Rush. Normal bus missed. Breakfast skipped.
- School - Deadline misunderstood. RESET.EXE: Increase productivity.
- Lunch - Basic needs pushed aside.
- After school - Overload detected. RESET.EXE: Take a break. Break continues.
- Evening - Notifications accumulate. RESET.EXE: Resolve them.
- Night - Multiple incomplete tasks. RESET.EXE: Finish everything.
- SYSTEM FAILURE - 10:41 PM - The old model could not handle the accumulated context.

Root cause text:

> No single event caused the failure.
>
> RESET.EXE kept responding to each problem separately without checking context, priority, basic needs, whether a strategy was still helping, or whether something could wait.

### Final Reboot - RESET.EXE 2.0

Student-facing content:

> INSTALLING RESET.EXE v2.0

Enabled checks:

- CONTEXT CHECK - ENABLED
- PRIORITY CHECK - ENABLED
- BASIC NEEDS CHECK - ENABLED
- STRATEGY REVIEW - ENABLED
- SUPPORT CHECK - ENABLED

Final state:

> SYSTEM STATUS: STABLE
>
> Not every problem needs fixing at once.

Facilitator optional landing:

> Which bit of advice sounded reasonable at first but actually made things worse?

If needed:

> Most of the advice wasn't ridiculous. It just didn't fit the whole situation.
>
> Self-care isn't a list of perfect things to do. It's noticing what is actually going on and choosing what helps rather than creating the next problem.

## Clue Dependencies

- Device Activity must precede Morning Recovery because limited sleep and alarms explain the extra rest.
- Morning Recovery must precede RESET.EXE Review because the review depends on missed bus and skipped breakfast.
- Calendar / Portal mismatch must precede lunch interpretation because the lunch work only makes sense once students know the English urgency was misunderstood.
- Photo Recovery must precede Lunch Recommendation because the recommendation is judged against missed breakfast and actual English deadline.
- Deleted Data uses only times already recovered before the locked folder appears.
- Afternoon Gap uses app history and the 3:44 PM RESET.EXE log; the conclusion depends on duration, not the app itself.
- Message Archive precedes Hidden Urgent Task so English clarification and food information can affect later prioritisation.
- Hidden Urgent Task precedes Final Night so students know something really is urgent.
- Final Curveball follows the three-move plan to test reassessment.
- Root Cause Analysis follows the override so students can explain the whole accumulation.

## Continuity Rules

- The lock screen does not show an exact calendar date.
- "Tomorrow" refers to the English draft check; final submission is Monday.
- Lunch evidence supports "worked through most of lunch" and "lunch appears untouched"; it does not claim Jordan definitely ate nothing all day.
- The afternoon evidence supports "the break continued long after it was meant to help"; it does not claim TikTok is inherently bad.
- The message puzzle remains flexible and consequence-based.
- The maths task remains genuinely urgent, short, and due at 11:59 PM.
- The final plan must not imply all unfinished work should be abandoned; it asks what solves tonight's actual pressure.
- RESET.EXE is context-blind and overly rigid, not malicious.
