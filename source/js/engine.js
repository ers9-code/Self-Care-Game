/* =====================================================================
 * js/engine.js
 *
 * Round-transition logic, eligibility checks (Life Happens 3), the
 * evening real-clock engine (windows/placement/availability), bedtime
 * maths, Tomorrow Load calculation, and the transient (non-committed)
 * UI state for the two timed votes, the Round 2 attention sort and the
 * Round 4 wording step.
 *
 * Nothing in this file touches the DOM or calls a render function —
 * main.js is responsible for re-rendering after performAction() runs.
 * ===================================================================== */

// ── Evening real-clock engine (Round 6) ─────────────────────────────────
const TARGET_BEDTIME = 22 * 60 + 30;      // 10:30 PM
const EVENING_PLANNING_END = 22 * 60;     // 10:00 PM — Round 7 keeps the last 30 minutes

function initialiseEvening(d) {
  if (d.targetBedtime == null) d.targetBedtime = TARGET_BEDTIME;
  if (d.homeTime == null) d.homeTime = 18 * 60 + 20;
  if (d.trainingStart == null) d.trainingStart = 19 * 60;
  if (d.trainingEnd == null) d.trainingEnd = 20 * 60 + 30;
  if (d.dinnerStatus === "not_yet") d.dinnerStatus = "needed";
  if (!Array.isArray(d.eveningActions)) d.eveningActions = [];
}

/** Applies the ONE fixed Life Happens 2 event to the evening schedule. Idempotent guard lives in performAction. */
function applyLife2(d, eventId) {
  initialiseEvening(d);
  if (eventId === "shift_late") {
    d.energy = clampEnergy(d.energy - 3);
    d.workEnd = 18 * 60 + 30;
    d.extraPaidMinutes += 30;
    d.homeTime = 18 * 60 + 50;
  } else if (eventId === "training_moved") {
    d.trainingStart = 19 * 60 + 20;
    d.trainingEnd = 20 * 60 + 50;
  } else if (eventId === "home_loud") {
    d.homeBusyUntil = 19 * 60 + 15;
  }
}

function basketballChoices(gs) {
  return gs.homeTime === 18 * 60 + 50
    ? [{ id: "late", label: "JOIN LATE — arrive around 7:20" }, { id: "skip", label: "SKIP BASKETBALL" }]
    : [{ id: "attend", label: "ATTEND BASKETBALL" }, { id: "skip", label: "SKIP BASKETBALL" }];
}

function commitBasketball(d, status) {
  initialiseEvening(d);
  d.basketballStatus = status;
  if (status === "attend" || status === "late") d.energy = clampEnergy(d.energy + 1);
}

/**
 * The open planning windows for tonight, given the basketball decision.
 * SKIP genuinely releases the basketball+travel block into one open window —
 * no ghost blocks are ever left behind because this is recomputed fresh
 * from gs.basketballStatus every time, never patched incrementally.
 */
function flexibleWindows(gs) {
  const home = gs.homeTime ?? (18 * 60 + 20), end = ROUND6.planningEnd ?? EVENING_PLANNING_END;
  if (gs.basketballStatus === "skip") return [{ start: home, end, label: "Evening open time — basketball/travel released" }];
  if (gs.basketballStatus === "late") return [{ start: 20 * 60 + 40, end, label: "After basketball" }];
  if (gs.trainingStart === 19 * 60 + 20) return [{ start: home, end: 19 * 60 + 5, label: "Before basketball" }, { start: 21 * 60, end, label: "After basketball" }];
  return [{ start: home, end: 18 * 60 + 45, label: "Before basketball" }, { start: 20 * 60 + 40, end, label: "After basketball" }];
}

function actionsInWindow(actions, w) {
  return (actions || [])
    .filter(a => a.start >= w.start && a.end <= w.end)
    .slice()
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

function earliestPlacementInWindow(gs, w, duration, kind) {
  let cursor = w.start;
  if (kind === "assessment" && gs.homeBusyUntil) cursor = Math.max(cursor, gs.homeBusyUntil);
  for (const a of actionsInWindow(gs.eveningActions || [], w)) {
    if (cursor + duration <= a.start) return { start: cursor, end: cursor + duration, window: w.label };
    cursor = Math.max(cursor, a.end);
  }
  return cursor + duration <= w.end ? { start: cursor, end: cursor + duration, window: w.label } : null;
}

function largestFreeSlot(gs, w, kind) {
  let cursor = w.start, biggest = 0;
  if (kind === "assessment" && gs.homeBusyUntil) cursor = Math.max(cursor, gs.homeBusyUntil);
  for (const a of actionsInWindow(gs.eveningActions || [], w)) {
    if (a.start > cursor) biggest = Math.max(biggest, a.start - cursor);
    cursor = Math.max(cursor, a.end);
  }
  if (w.end > cursor) biggest = Math.max(biggest, w.end - cursor);
  return biggest;
}

function findPlacement(gs, duration, kind) {
  for (const w of flexibleWindows(gs)) {
    const p = earliestPlacementInWindow(gs, w, duration, kind);
    if (p) return p;
  }
  return null;
}

/** Availability + human-readable reason for every Round 6 evening action. */
function actionAvailability(gs, action) {
  if (action.id === "dinner" && gs.dinnerStatus !== "needed") return { ok: false, reason: "Dinner is already covered on this path." };
  if (action.id === "assessment" && gs.assessmentRemaining < 20) return { ok: false, reason: "No full 20-minute assessment block remains." };
  if (action.id === "reset" && gs.eveningResetUsed) return { ok: false, reason: "Jordan has already used the evening reset." };
  if (action.id === "friend" && gs.friendStatus !== "pending") return { ok: false, reason: "The friend conversation is already handled." };
  if (action.id === "basics" && gs.tomorrowBasics === "done") return { ok: false, reason: "Tomorrow basics are already done." };
  const p = findPlacement(gs, action.duration, action.id);
  if (p) return { ok: true, placement: p, reason: `Fits in ${p.window}.` };
  if (action.id === "assessment" && gs.homeBusyUntil) {
    const biggestAfterNoise = Math.max(0, ...flexibleWindows(gs).map(w => largestFreeSlot(gs, w, "assessment")));
    if (biggestAfterNoise < action.duration) return { ok: false, reason: `Focused study is blocked until ${formatTime(gs.homeBusyUntil)} and no ${action.duration}-minute block still fits after that.` };
  }
  const remaining = flexibleWindows(gs).map(w => largestFreeSlot(gs, w, action.id)).filter(Boolean);
  const biggest = remaining.length ? Math.max(...remaining) : 0;
  return { ok: false, reason: biggest ? `Does not fit: the largest remaining open slot is ${biggest} minutes; this needs ${action.duration}.` : `No open planning time remains before 10:00 PM.` };
}

function applyEveningAction(d, actionId) {
  initialiseEvening(d);
  const action = ROUND6.actions.find(a => a.id === actionId);
  if (!action) return false;
  const avail = actionAvailability(d, action);
  if (!avail.ok) return false;
  const p = avail.placement;
  d.energy = clampEnergy(d.energy + action.impact);
  if (actionId === "dinner") d.dinnerStatus = "covered";
  if (actionId === "assessment") { d.assessmentRemaining = Math.max(0, d.assessmentRemaining - 20); d.assessmentWorkedTonight = true; }
  if (actionId === "reset") d.eveningResetUsed = true;
  if (actionId === "friend") d.friendStatus = "resolved";
  if (actionId === "basics") d.tomorrowBasics = "done";
  d.eveningActions.push({ id: actionId, label: action.label, start: p.start, end: p.end, window: p.window });
  return true;
}

function finishEveningPlan(d) {
  initialiseEvening(d);
  // Round 6 simulates the evening through 10:00 PM; any deliberately open time passes as open time.
  d.currentTime = ROUND6.planningEnd ?? EVENING_PLANNING_END;
}

function spendClockTime(d, minutes) {
  if (d.targetBedtime == null) d.targetBedtime = TARGET_BEDTIME;
  if (d.currentTime == null) d.currentTime = d.homeTime ?? 20 * 60 + 40;
  d.currentTime += minutes;
  if (d.currentTime > d.targetBedtime) d.targetBedtime = d.currentTime; // only excess work pushes bedtime later
}

function recalcTomorrowLoad(d) {
  const basics = d.tomorrowBasics === "partial" ? 5 : d.tomorrowBasics === "undone" ? 10 : 0;
  d.tomorrowLoad = (d.assessmentTomorrow || 0) + basics;
}

// ── Round 5 pre-work gap availability ───────────────────────────────────
function round5GapAvailability(gs, action) {
  if (gs.workGapRemaining < action.duration) return { ok: false, reason: `Needs ${action.duration} minutes; only ${gs.workGapRemaining} remain.` };
  if (action.id === "assessment" && gs.assessmentRemaining < 20) return { ok: false, reason: "No full 20-minute assessment block remains." };
  if (action.id === "friend" && gs.friendStatus !== "pending") return { ok: false, reason: "The friend conversation is already handled on this path." };
  if (action.id === "food" && !gs.currentHunger) {
    if (gs.lunchHistory === "covered") return { ok: false, reason: "Jordan ate lunch, so there is no current food need." };
    if (gs.lunchHistory === "late_food_obtained") return { ok: false, reason: "Jordan has already got food after school." };
    return { ok: false, reason: "Jordan is not currently hungry on this path." };
  }
  if (action.id === "reset" && gs.workResetUsed) return { ok: false, reason: "Jordan has already used the pre-work reset in this gap." };
  if (action.id === "organise" && gs.organisedUsed) return { ok: false, reason: "Jordan has already used the organise action." };
  return { ok: true, reason: `Fits: ${action.duration} minutes.` };
}

// ── Transient UI state (votes / timer / sort / wording) ─────────────────
// This is UI-only interaction state — it is never part of the reversible
// GameState/history, and a facilitator Reset always clears it explicitly.
let votes = {};
let runoffIds = null;
let timerHandle = null;
let timerLeft = 0;
let timerStarted = false;
let timerExpired = false;
let sortAssignments = {};
let checkedNowItem = null;

function resetTransientUi() {
  clearInterval(timerHandle);
  timerHandle = null;
  timerLeft = 0;
  timerStarted = false;
  timerExpired = false;
  votes = {};
  runoffIds = null;
  sortAssignments = {};
  checkedNowItem = null;
}

function resetVoteCounters(ids) {
  votes = Object.fromEntries(ids.map(id => [id, 0]));
  runoffIds = null;
  clearInterval(timerHandle);
  timerHandle = null;
  timerLeft = 0;
  timerStarted = false;
  timerExpired = false;
}

function castVoteDelta(id, delta) {
  votes[id] = Math.max(0, (votes[id] || 0) + delta);
}

/** Starts the live countdown. onTick fires every second (including on expiry) so the caller can re-render. */
function startVoteTimer(seconds, onTick) {
  clearInterval(timerHandle);
  timerStarted = true;
  timerExpired = false;
  timerLeft = seconds;
  timerHandle = setInterval(() => {
    timerLeft = Math.max(0, timerLeft - 1);
    if (timerLeft === 0) { clearInterval(timerHandle); timerHandle = null; timerExpired = true; }
    if (typeof onTick === "function") onTick();
  }, 1000);
}

function stopVoteTimerIfRunning() {
  if (timerStarted && !timerExpired) {
    clearInterval(timerHandle);
    timerHandle = null;
    timerLeft = 0;
    timerStarted = false;
    timerExpired = false;
  }
}

function runTopTwoRunoff() {
  const ids = Object.keys(votes).sort((a, b) => votes[b] - votes[a]).slice(0, 2);
  runoffIds = ids;
  votes = Object.fromEntries(ids.map(id => [id, 0]));
  clearInterval(timerHandle);
  timerHandle = null;
  timerLeft = 0;
  timerStarted = false;
  timerExpired = false;
}

function setSortAssignment(id, zone) {
  sortAssignments[id] = zone;
  if (checkedNowItem === id && zone !== "now") checkedNowItem = null;
}

function setCheckedNowItem(id) { checkedNowItem = id; }

// ── Round transitions ────────────────────────────────────────────────────
/**
 * performAction — the single state-machine transition table for the whole
 * activity. Every facilitator control ultimately calls this with an action
 * id. It is the ONLY place that decides what a click does to GameState.
 * Callers (main.js) are responsible for re-rendering afterwards.
 */
function performAction(act) {
  if (act === "_back" || act === "_forward") {
    stopVoteTimerIfRunning();
    if (act === "_back") back(); else forward();
    return;
  }
  if (act === "_undo") { undo(); return; }

  if (act === "openingBrainstorm") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "opening_brainstorm"; d.currentPhase = "story"; } });
  else if (act === "openingJordan") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "opening_jordan"; } });
  else if (act === "openingEnergy") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "opening_energy"; } });

  else if (act === "startR1") commitAction({ actionId: act, mutate: d => { d.currentRound = 1; d.currentTime = 430; d.energy = clampEnergy(d.energy + ROUND1.autoEnergy); d.viewDescriptor = "r1_story"; d.currentPhase = "story"; } });
  else if (act === "r1Vote") { commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r1_vote"; d.currentPhase = "choice"; } }); resetVoteCounters(["1", "2", "3", "4"]); }
  else if (act.startsWith("r1Lock:")) {
    if (!timerExpired) return;
    clearInterval(timerHandle); timerHandle = null;
    const id = act.split(":")[1], c = ROUND1.choices.find(x => x.id === id);
    if (!c) return;
    commitAction({ actionId: act, mutate: d => { ROUND1.stateMutations[id](d); d.decisionLog.push({ round: 1, choiceId: id, label: c.short }); d.viewDescriptor = `r1_discuss:${id}`; d.currentPhase = "discussion"; } });
  }
  else if (act === "r1Reveal") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r1_result"; d.currentPhase = "result"; } });
  else if (act === "r1Life") { getOrAssignLifeEvent("life1", () => ROUND1.lifeEvents[Math.floor(Math.random() * ROUND1.lifeEvents.length)].id); commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r1_life"; d.currentPhase = "life_happens"; } }); }

  else if (act === "startR2") commitAction({ actionId: act, mutate: d => { d.currentRound = 2; d.currentTime = 525; d.energy = clampEnergy(d.energy + ROUND2.autoEnergy); d.viewDescriptor = "r2_story"; d.currentPhase = "story"; } });
  else if (act === "r2Sort") { commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r2_sort"; d.currentPhase = "choice"; } }); sortAssignments = {}; checkedNowItem = null; }
  else if (act === "r2Lock") {
    const now = Object.entries(sortAssignments).filter(([, z]) => z === "now").map(([id]) => id);
    const allAssigned = ROUND2.sortingItems.every(i => sortAssignments[i.id]);
    if (!allAssigned || (now.length > 1 && !checkedNowItem)) return;
    const checked = now.length === 1 ? now[0] : checkedNowItem;
    commitAction({ actionId: act, mutate: d => { ROUND2.buildStateMutation(sortAssignments, checked)(d); d.decisionLog.push({ round: 2, label: "Attention plan", summary: JSON.stringify(sortAssignments) }); d.viewDescriptor = "r2_result"; d.currentPhase = "result"; } });
  }

  else if (act === "startR3") commitAction({ actionId: act, mutate: d => { d.currentRound = 3; d.currentTime = 625; d.energy = clampEnergy(d.energy + ROUND3.autoEnergy); d.viewDescriptor = "r3_story"; d.currentPhase = "story"; } });
  else if (act === "r3Investigate") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r3_investigate"; d.currentPhase = "choice"; } });
  else if (act.startsWith("r3Lock:")) {
    const id = act.split(":")[1], src = ROUND3.investigation.sources.find(x => x.id === id);
    if (!src) return;
    commitAction({ actionId: act, mutate: d => { ROUND3.buildStateMutation(id)(d); d.decisionLog.push({ round: 3, choiceId: id }); d.viewDescriptor = src.direct ? "r3_result" : "r3_followup"; d.currentPhase = src.direct ? "result" : "choice"; } });
  }
  else if (act.startsWith("r3Follow:")) {
    const id = act.split(":")[1];
    commitAction({ actionId: act, mutate: d => { ROUND3.followupMutation()(d); const log = [...d.decisionLog].reverse().find(x => x.round === 3); if (log) log.summary = `Followed up with ${id}`; d.viewDescriptor = "r3_result"; d.currentPhase = "result"; } });
  }

  else if (act === "startR4") commitAction({ actionId: act, mutate: d => { d.currentRound = 4; d.currentTime = 765; d.energy = clampEnergy(d.energy + ROUND4.autoEnergy); d.viewDescriptor = "r4_story"; d.currentPhase = "story"; } });
  else if (act === "r4Choice") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r4_choice"; d.currentPhase = "choice"; } });
  else if (act.startsWith("r4Lock:")) {
    const id = act.split(":")[1];
    if (!ROUND4.choices.some(x => x.id === id)) return;
    commitAction({ actionId: act, mutate: d => { d.decisionLog.push({ round: 4, choiceId: id }); d.viewDescriptor = "r4_dialogue"; d.currentPhase = "choice"; } });
  }
  else if (act.startsWith("r4Script:")) {
    const val = act.split(":")[1];
    commitAction({ actionId: act, mutate: d => { const log = [...d.decisionLog].reverse().find(x => x.round === 4 && x.choiceId); if (!log) return; const c = ROUND4.choices.find(x => x.id === log.choiceId); if (!c) return; ROUND4.buildStateMutation(c.id)(d); log.summary = c.scripts[Number(val)] || c.scripts[0]; d.viewDescriptor = "r4_result"; d.currentPhase = "result"; } });
  }
  else if (act === "r4ScriptClass") {
    const typed = (document.getElementById("r4-class-wording")?.value || "").trim();
    if (!typed) return;
    commitAction({ actionId: act, mutate: d => { const log = [...d.decisionLog].reverse().find(x => x.round === 4 && x.choiceId); if (!log) return; const c = ROUND4.choices.find(x => x.id === log.choiceId); if (!c) return; ROUND4.buildStateMutation(c.id)(d); log.summary = typed; d.viewDescriptor = "r4_result"; d.currentPhase = "result"; } });
  }

  else if (act === "startR5") commitAction({ actionId: act, mutate: d => { d.currentRound = 5; d.currentTime = 912; d.viewDescriptor = "r5_story"; d.currentPhase = "story"; } });
  else if (act === "r5Choice") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r5_choice"; d.currentPhase = "choice"; } });
  else if (act.startsWith("r5Lock:")) {
    const id = act.split(":")[1], c = ROUND5.choices.find(x => x.id === id);
    if (!c) return;
    commitAction({ actionId: act, mutate: d => { d.workChoice = id; d.workStart = c.workStart; d.workEnd = 1080; d.extraPaidMinutes = c.extraPaidMinutes; d.workGapTotal = c.gapMinutes; d.workGapRemaining = c.gapMinutes; d.workGapActions = []; d.decisionLog.push({ round: 5, choiceId: id, label: c.short }); d.viewDescriptor = "r5_gap"; d.currentPhase = "choice"; } });
  }
  else if (act.startsWith("r5Gap:")) {
    const id = act.split(":")[1], a = ROUND5.gapActions.find(x => x.id === id);
    if (!a) return;
    commitAction({
      actionId: act, mutate: d => {
        if (d.workGapRemaining < a.duration) return;
        if (id === "assessment" && d.assessmentRemaining < 20) return;
        if (id === "friend" && d.friendStatus !== "pending") return;
        if (id === "food" && !d.currentHunger) return;
        if (id === "reset" && d.workResetUsed) return;
        if (id === "organise" && d.organisedUsed) return;
        d.workGapRemaining -= a.duration;
        d.energy = clampEnergy(d.energy + a.impact);
        if (id === "assessment") d.assessmentRemaining -= 20;
        if (id === "friend") d.friendStatus = "resolved";
        if (id === "food") { d.currentHunger = false; d.lunchHistory = "late_food_obtained"; }
        if (id === "reset") d.workResetUsed = true;
        if (id === "organise") d.organisedUsed = true;
        d.workGapActions.push({ id, label: a.label, duration: a.duration });
      }
    });
  }
  else if (act === "r5FinishGap") commitAction({ actionId: act, mutate: d => { const c = ROUND5.choices.find(x => x.id === d.workChoice); if (!d.workEnergyApplied) { d.energy = clampEnergy(d.energy + c.workImpact + (d.currentHunger ? -3 : 0)); d.workEnergyApplied = true; } d.currentTime = d.workEnd; d.viewDescriptor = "r5_work_result"; d.currentPhase = "result"; } });
  else if (act === "r5Life2") { getOrAssignLifeEvent("life2", () => ROUND5.lifeEvents[Math.floor(Math.random() * ROUND5.lifeEvents.length)].id); commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r5_life2"; d.currentPhase = "life_happens"; } }); }

  else if (act.startsWith("apply:")) {
    const slot = act.split(":")[1], rsNow = getRunState();
    if (slot === "life1") { const e = ROUND1.lifeEvents.find(x => x.id === rsNow.life1); commitAction({ actionId: act, mutate: d => { if (d.lifeEffectsApplied.life1) return; d.energy = clampEnergy(d.energy + e.impact); d.lifeEffectsApplied.life1 = true; } }); }
    if (slot === "life2") { const e = ROUND5.lifeEvents.find(x => x.id === rsNow.life2); commitAction({ actionId: act, mutate: d => { if (d.lifeEffectsApplied.life2) return; applyLife2(d, e.id); d.lifeEffectsApplied.life2 = true; } }); }
    if (slot === "life3") { const e = ROUND7.lifeEvents.find(x => x.id === rsNow.life3); commitAction({ actionId: act, mutate: d => { if (d.lifeEffectsApplied.life3) return; d.energy = clampEnergy(d.energy + e.impact); if (e.id === "extra_class_time") d.tomorrowClassWindow = 20; if (e.id === "task_quicker") { d.currentTime = Math.max(0, (d.currentTime || 0) - 10); d.targetBedtime = Math.max(TARGET_BEDTIME, d.currentTime); } d.lifeEffectsApplied.life3 = true; } }); }
  }

  else if (act === "startR6") commitAction({ actionId: act, mutate: d => { initialiseEvening(d); d.currentRound = 6; d.currentTime = d.homeTime; d.viewDescriptor = "r6_story"; d.currentPhase = "story"; } });
  else if (act === "r6Basketball") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r6_basketball"; d.currentPhase = "choice"; } });
  else if (act.startsWith("basket:")) {
    const status = act.split(":")[1];
    if (!basketballChoices(getGameState()).some(c => c.id === status)) return;
    commitAction({ actionId: act, mutate: d => { commitBasketball(d, status); d.decisionLog.push({ round: 6, choiceId: status, label: "Basketball" }); d.viewDescriptor = "r6_timeline"; d.currentPhase = "choice"; } });
  }
  else if (act.startsWith("evening:")) { const id = act.split(":")[1]; commitAction({ actionId: act, mutate: d => { applyEveningAction(d, id); } }); }
  else if (act === "finishEvening") commitAction({ actionId: act, mutate: d => { finishEveningPlan(d); d.viewDescriptor = "r6_result"; d.currentPhase = "result"; } });

  else if (act === "startR7") commitAction({ actionId: act, mutate: d => { d.currentRound = 7; d.tomorrowBasicsDecision = d.tomorrowBasics === "done" ? "done" : null; recalcTomorrowLoad(d); d.viewDescriptor = "r7_reality"; d.currentPhase = "choice"; } });
  else if (act.startsWith("r7:")) {
    const id = act.split(":")[1];
    commitAction({
      actionId: act, mutate: d => {
        if (id === "assess_finish") { const mins = d.assessmentRemaining; d.energy = clampEnergy(d.energy - 2 * Math.ceil(mins / 20)); spendClockTime(d, mins); d.assessmentRemaining = 0; d.assessmentWorkedTonight = true; }
        if (id === "assess_20" && d.assessmentRemaining >= 20) { d.energy = clampEnergy(d.energy - 2); spendClockTime(d, 20); d.assessmentRemaining -= 20; d.assessmentWorkedTonight = true; }
        if (id === "assess_tomorrow") { d.assessmentTomorrow += d.assessmentRemaining; d.assessmentRemaining = 0; }
        if (id === "support") d.supportPlan = "planned";
        if (id === "basics_done") { d.energy = clampEnergy(d.energy - 1); spendClockTime(d, 10); d.tomorrowBasics = "done"; d.tomorrowBasicsDecision = "done"; }
        if (id === "basics_partial") { d.energy = clampEnergy(d.energy - 1); spendClockTime(d, 5); d.tomorrowBasics = "partial"; d.tomorrowBasicsDecision = "partial"; }
        if (id === "basics_morning") { d.tomorrowBasics = "undone"; d.tomorrowBasicsDecision = "morning"; }
        if (id === "phone_check") { d.energy = clampEnergy(d.energy - 1); spendClockTime(d, 5); if (d.groupChatStatus === "later") d.groupChatStatus = "done"; if (d.videosStatus === "later") d.videosStatus = "done"; }
        if (id === "phone_tomorrow") { if (d.groupChatStatus === "later") d.groupChatStatus = "tomorrow"; if (d.videosStatus === "later") d.videosStatus = "tomorrow"; }
        recalcTomorrowLoad(d);
      }
    });
  }
  else if (act === "life3") {
    const current = getGameState(), eligible = ROUND7.lifeEvents.filter(e => e.eligible(current));
    getOrAssignLifeEvent("life3", () => eligible.length ? eligible[Math.floor(Math.random() * eligible.length)].id : "skipped");
    commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r7_life3"; d.currentPhase = "life_happens"; } });
  }
  else if (act === "returnR7") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r7_reality"; d.currentPhase = "choice"; } });

  else if (act === "startR8") commitAction({ actionId: act, mutate: d => { d.currentRound = 8; d.currentTime = Math.max(d.currentTime || 0, d.targetBedtime || 1350); d.targetBedtime = d.currentTime; d.viewDescriptor = "r8_story"; d.currentPhase = "story"; } });
  else if (act === "r8Choice") { commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "r8_choice"; d.currentPhase = "choice"; } }); resetVoteCounters(ROUND8.choices.map(c => c.id)); }
  else if (act.startsWith("r8Lock:")) {
    if (!timerExpired) return;
    clearInterval(timerHandle); timerHandle = null;
    const id = act.split(":")[1], c = ROUND8.choices.find(x => x.id === id);
    if (!c) return;
    commitAction({ actionId: act, mutate: d => { d.energy = clampEnergy(d.energy + c.impact); d.currentTime = (d.currentTime || d.targetBedtime || 1350) + c.duration; d.targetBedtime = d.currentTime; d.decisionLog.push({ round: 8, choiceId: id, label: c.short }); d.viewDescriptor = "r8_result"; d.currentPhase = "result"; } });
  }

  else if (act === "final") commitAction({ actionId: act, mutate: d => { d.viewDescriptor = "final_receipt"; d.currentPhase = "result"; } });
}
