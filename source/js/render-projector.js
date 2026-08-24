/* =====================================================================
 * js/render-projector.js
 *
 * Renders the student/projector screen. The SAME renderProjectorContent()
 * function is used for the actual popup projector window AND for the
 * facilitator's own live preview pane, so the two can never drift apart
 * (Master Spec: "Facilitator preview and actual projector must use the
 * same render function").
 * ===================================================================== */

function renderProjectorContent(gs, rs, ui = {}) { return renderShell(gs, rs || {}, ui || {}); }

function renderShell(gs, rs, ui = {}) {
  const energy = gs.energy ?? 100;
  const dots = [1, 2, 3, 4, 5, 6, 7, 8].map(i => `<span class="proj-dot ${i < (gs.currentRound || 0) ? "done" : ""} ${i === (gs.currentRound || 0) ? "current" : ""}"></span>`).join("");
  return `<div class="proj-topbar"><span class="proj-brand">Jordan’s Day</span><div class="proj-dots">${dots}</div><span class="proj-round-label">${gs.currentRound ? `Round ${gs.currentRound}` : "Opening"}</span></div><div class="proj-energy-row"><span class="proj-energy-label">Energy</span><div class="proj-energy-track"><div class="proj-energy-fill" style="width:${energy}%"></div></div><span class="proj-energy-num">${energy}</span></div><div class="proj-stage">${renderBody(gs, rs, ui)}</div>`;
}

function bodyStory(round, gs, rs) {
  const story = typeof round.getStory === "function" ? round.getStory(rs, gs) : round.story;
  return `<div class="proj-clockrow"><span class="proj-time">${round.time}</span><span class="proj-part">${round.part}</span></div><h2 class="proj-title">${round.title}</h2><div class="proj-story-layout"><div class="proj-story-copy"><div class="proj-story">${story.map(x => `<p>${x}</p>`).join("")}</div>${round.autoEnergy ? `<div class="proj-auto-note">${round.autoEnergy > 0 ? "+" : ""}${round.autoEnergy} energy from what is happening before the choice.</div>` : ""}</div>${sceneVisual(round.round)}</div>`;
}

/** The dynamic "WHAT IS FOLLOWING JORDAN HOME?" list — built from real state, never invented. */
function followingHomeChips(gs) {
  const chips = [];
  if (gs.assessmentRemaining > 0) chips.push(`${gs.assessmentRemaining} MIN OF ASSESSMENT`);
  if (gs.dinnerStatus === "needed") chips.push("DINNER NOT YET COVERED");
  if (gs.friendStatus === "pending") chips.push("FRIEND CONVERSATION PENDING");
  if (gs.basketballStatus === "undecided") chips.push("BASKETBALL NOT YET DECIDED");
  if (gs.tomorrowBasics !== "done") chips.push("TOMORROW BASICS NOT PACKED");
  return chips;
}

function bodyStoryR6(gs, rs) {
  const story = typeof ROUND6.getStory === "function" ? ROUND6.getStory(rs, gs) : ROUND6.story;
  const chips = followingHomeChips(gs);
  return `<div class="proj-clockrow"><span class="proj-time">${ROUND6.time}</span><span class="proj-part">${ROUND6.part}</span></div><h2 class="proj-title">${ROUND6.title}</h2><div class="proj-story-layout"><div class="proj-story-copy"><div class="proj-story">${story.map(x => `<p>${x}</p>`).join("")}</div><div class="proj-following"><strong>${ROUND6.followingHomeHeading}</strong><div class="proj-following-chips">${chips.length ? chips.map(c => `<span>${c}</span>`).join("") : `<span class="clear">NOTHING URGENT YET</span>`}</div></div></div>${sceneVisual(6)}</div>`;
}

function sceneVisual(round) {
  const src = ROUND_VISUALS?.[round];
  const labels = { 1: "Jordan rushing through the morning", 2: "Jordan managing phone notifications", 3: "Jordan checking assessment information", 4: "Jordan balancing lunch and a friend conversation", 5: "Jordan deciding how to use time before work", 6: "Jordan balancing basketball and the evening", 7: "Jordan reviewing what is still left tonight", 8: "Jordan seeing a late-night message" };
  if (src) return `<figure class="proj-scene proj-scene-photo"><img src="${src}" alt="${labels[round] || "Jordan during the day"}"><figcaption>${labels[round] || "Jordan’s day"}</figcaption></figure>`;
  return `<div class="proj-scene proj-scene-fallback"><div class="proj-scene-label">Jordan’s day</div></div>`;
}

function choicesBlock(round, list = round.choices) {
  return `<div class="proj-clockrow"><span class="proj-time">${round.time}</span><span class="proj-part">${round.part}</span></div><div class="proj-question">${round.question}</div><div class="proj-choices">${list.map((c, i) => `<div class="proj-choice"><div class="proj-choice-letter">${/^\d+$/.test(String(c.id)) ? c.id : i + 1}</div><div class="proj-choice-text"><strong>${c.short || c.label}</strong>${c.short ? `<br><span>${c.label}</span>` : ""}${c.role ? `<div class="proj-choice-role">${c.role}</div>` : ""}${c.meta ? `<div class="proj-choice-meta">${c.meta}</div>` : ""}</div></div>`).join("")}</div>`;
}

function lastDecisionFor(round, gs) {
  const log = [...(gs.decisionLog || [])].reverse().find(x => x.round === round.round && x.choiceId);
  const list = round.choices || round.investigation?.sources || [];
  const c = list.find(x => x.id === log?.choiceId);
  return c || null;
}

function resultBlock(round, gs) {
  const c = lastDecisionFor(round, gs);
  const impact = c?.impact;
  return `<div class="proj-result"><div class="proj-ownership">YOUR CLASS CHOSE</div><div class="proj-result-choice">${c?.short || c?.label || "Decision locked"}</div><div class="proj-result-why">${c?.why || "The consequence is now part of Jordan’s day."}${c?.tradeoff ? `<div class="proj-tradeoff"><strong>WHAT THIS CHANGES</strong><br>${c.tradeoff}</div>` : ""}</div><div class="proj-energy-line"><span>ENERGY</span><strong class="${impact > 0 ? "gain" : impact < 0 ? "take" : "neutral"}">${impact == null ? "—" : `${impact > 0 ? "+" : ""}${impact}`}</strong></div></div>`;
}

function lifeBlock(slot, events, gs, rs) {
  const e = events.find(x => x.id === rs?.[slot]);
  if (!e) return `<div class="proj-life"><span class="proj-life-tag">Life Happens</span><div class="proj-life-title">No extra event on this path</div></div>`;
  const applied = gs.lifeEffectsApplied?.[slot];
  const anticipation = !applied ? `<div class="proj-anticipation proj-anticipation-dark">Something Jordan didn’t plan for is about to happen.</div>` : "";
  return `<div class="proj-life">${anticipation}<span class="proj-life-tag">Life Happens</span><div class="proj-life-title">${e.title}</div><div class="proj-life-text">${e.text}</div><div class="proj-life-impact ${e.impact > 0 ? "gain" : e.impact < 0 ? "take" : "neutral"}">${applied ? `${e.impact > 0 ? "+" : ""}${e.impact}` : "?"}</div></div>`;
}

function renderBody(gs, rs, ui = {}) {
  const v = gs.viewDescriptor;
  if (v === "home") return `<div class="proj-opening"><h2>Energy Bar Challenge</h2><p>Jordan’s Day</p><p class="note">Waiting for the facilitator to begin…</p></div>`;
  if (v === "opening_brainstorm") return `<div class="proj-brainstorm"><h2>${OPENING.brainstorm.heading}</h2><p>${OPENING.brainstorm.prompt}</p><p class="sub">${OPENING.brainstorm.sub}</p></div>`;
  if (v === "opening_jordan") return `<div class="proj-story-layout"><div class="proj-opening" style="text-align:left;align-items:flex-start;padding:24px 18px"><h2>${OPENING.meetJordan.heading}</h2>${OPENING.meetJordan.body.map(x => `<p>${x}</p>`).join("")}<div class="note">${OPENING.meetJordan.note}</div></div>${sceneVisual(6)}</div>`;
  if (v === "opening_energy") return `<div class="proj-opening" style="text-align:left;align-items:flex-start"><h2>${OPENING.energyBar.heading}</h2>${OPENING.energyBar.body.map(x => `<p>${x}</p>`).join("")}<div class="note">${OPENING.energyBar.note}</div></div>`;

  if (v === "r1_story") return bodyStory(ROUND1, gs, rs);
  if (v === "r1_vote") return renderLiveVote(ROUND1, ui);
  if (v.startsWith("r1_discuss:")) { const c = ROUND1.choices.find(x => x.id === v.split(":")[1]); return `<div class="proj-question">THE CLASS LOCKED</div><div class="projector-focus"><h2>${c.short}</h2><p>${c.label}</p><p>Before the result: what’s this plan giving Jordan, and what’s it leaving thinner?</p></div>`; }
  if (v === "r1_result") return resultBlock(ROUND1, gs);
  if (v === "r1_life") return lifeBlock("life1", ROUND1.lifeEvents, gs, rs);

  if (v === "r2_story") return bodyStory(ROUND2, gs, rs);
  if (v === "r2_sort") return renderLiveSort(ui);
  if (v === "r2_result") {
    const muted = [gs.groupChatStatus === "muted" ? "group chat" : null, gs.videosStatus === "muted" ? "videos" : null].filter(Boolean);
    return `<div class="proj-result"><div class="proj-ownership">YOUR ATTENTION PLAN</div><div class="proj-result-choice">NOW / LATER / MUTE</div><div class="proj-result-why">${gs.friendKnownBeforeLunch ? `Jordan checked the friend DM: “${ROUND2.friendDMReveal}”` : "The friend DM was left for later — Jordan doesn’t know what it says yet."}<br>Group chat: ${gs.groupChatStatus}. Videos: ${gs.videosStatus}.${muted.length ? `<div class="proj-tradeoff"><strong>GONE FOR GOOD</strong><br>The ${muted.join(" and ")} ${muted.length > 1 ? "were" : "was"} muted, so ${muted.length > 1 ? "they cannot" : "it cannot"} come back later today.</div>` : ""}</div><div class="proj-energy-line"><span>ENERGY</span><strong class="gain">+2</strong></div></div>`;
  }

  if (v === "r3_story") return bodyStory(ROUND3, gs, rs);
  if (v === "r3_investigate") return renderR3Investigate();
  if (v === "r3_followup") {
    const first = lastDecisionFor(ROUND3, gs);
    const gap = first?.id === "deadline" ? "The calendar confirmed WHEN it is due, but not WHAT is left or HOW LONG it will take." : "The peer gave useful context, but cannot confirm Jordan’s exact remaining work.";
    return `<div class="proj-clockrow"><span class="proj-time">10:25 AM</span><span class="proj-part">Second check</span></div><div class="proj-question">${gap}</div><div class="projector-chiprow"><span>ONE QUICK CHECK WILL COMPLETE THE PICTURE</span></div><div class="proj-choices"><div class="proj-choice"><div class="proj-choice-letter">1</div><div class="proj-choice-text"><strong>TASK SHEET</strong><br><span>What is required?</span></div></div><div class="proj-choice"><div class="proj-choice-letter">2</div><div class="proj-choice-text"><strong>TEACHER</strong><br><span>What exactly remains?</span></div></div></div>`;
  }
  if (v === "r3_result") return renderProjectorR3Result(gs);

  if (v === "r4_story") return bodyStory(ROUND4, gs, rs);
  if (v === "r4_choice") return choicesBlock(ROUND4);
  if (v === "r4_dialogue") {
    const c = lastDecisionFor(ROUND4, gs);
    return `<div class="proj-clockrow"><span class="proj-time">12:45 PM</span><span class="proj-part">Build the response</span></div><div class="proj-question">${ROUND4.dialoguePrompt}</div><div class="dialogue-options">${c.scripts.map(s => `<div class="dialogue-bubble">“${s}”</div>`).join("")}</div><div class="projector-chiprow"><span>Or build class wording that keeps the same approach</span></div>`;
  }
  if (v === "r4_result") return renderProjectorR4Result(gs);

  if (v === "r5_story") return bodyStory(ROUND5, gs, rs);
  if (v === "r5_choice") return choicesBlock(ROUND5);
  if (v === "r5_gap") return renderGap(gs);
  if (v === "r5_work_result") return renderWorkResult(gs);
  if (v === "r5_life2") return lifeBlock("life2", ROUND5.lifeEvents, gs, rs);

  if (v === "r6_story") return bodyStoryR6(gs, rs);
  if (v === "r6_basketball") return renderBasket(gs);
  if (v === "r6_timeline") return renderProjectorTimeline(gs);
  if (v === "r6_result") return renderProjectorTimeline(gs, true);

  if (v === "r7_reality") return renderProjectorReality(gs, rs);
  if (v === "r7_life3") return lifeBlock("life3", ROUND7.lifeEvents, gs, rs);

  if (v === "r8_story") return bodyStory(ROUND8, gs, rs);
  if (v === "r8_choice") return renderLiveVote(ROUND8, ui);
  if (v === "r8_result") return resultBlock(ROUND8, gs);

  if (v === "final_receipt") return renderReceipt(gs, rs);

  return `<div class="proj-opening"><h2>Jordan’s Day</h2><p>Waiting for the next decision…</p></div>`;
}

function renderR3Investigate() {
  const sources = ROUND3.investigation.sources;
  return `<div class="proj-clockrow"><span class="proj-time">${ROUND3.time}</span><span class="proj-part">${ROUND3.part}</span></div><div class="proj-question">${ROUND3.question}</div><div class="proj-choices proj-investigate">${sources.map((s, i) => `<div class="proj-choice"><div class="proj-choice-letter">${i + 1}</div><div class="proj-choice-text"><strong>${s.label}</strong><br><span>${s.role}</span><div class="proj-tells"><strong>WHAT THIS TELLS JORDAN</strong><br>${s.tellsJordan}</div>${s.stillUnknown ? `<div class="proj-unknown"><strong>WHAT IS STILL UNKNOWN</strong><br>${s.stillUnknown}</div>` : ""}</div></div>`).join("")}</div>`;
}

function renderProjectorR3Result(gs) {
  const log = [...(gs.decisionLog || [])].reverse().find(x => x.round === 3);
  const c = ROUND3.investigation.sources.find(x => x.id === log?.choiceId);
  const follow = log?.summary || "";
  if (c?.direct) return `<div class="proj-result"><div class="proj-ownership">YOUR CLASS CHOSE</div><div class="proj-result-choice">${c.label}</div><div class="proj-result-why">${c.why}<div class="proj-tradeoff"><strong>WHAT JORDAN NOW KNOWS</strong><br>About 60 minutes of assessment work remains. The information is clearer; the work still has to be planned.</div></div><div class="proj-energy-line"><span>ENERGY</span><strong class="gain">+2</strong></div></div>`;
  const first = c?.id === "deadline" ? "The calendar confirmed the due time: tomorrow at 3 PM." : "The peer gave useful context about the task.";
  const second = follow.includes("teacher") ? "The Teacher then clarified exactly what remains." : "The Task Sheet then showed exactly what is required.";
  return `<div class="proj-result"><div class="proj-ownership">YOUR CLASS CHOSE</div><div class="proj-result-choice">TWO USEFUL CHECKS</div><div class="proj-result-why">${first}<br>${second}<div class="proj-tradeoff"><strong>NOW THE PICTURE IS COMPLETE</strong><br>About 60 minutes of assessment work remains.</div></div><div class="proj-energy-line"><span>ENERGY</span><strong class="gain">+1</strong></div></div>`;
}

function renderProjectorR4Result(gs) {
  const log = [...(gs.decisionLog || [])].reverse().find(x => x.round === 4 && x.choiceId);
  const c = ROUND4.choices.find(x => x.id === log?.choiceId);
  const said = log?.summary || "Wording chosen by the class";
  const impact = c?.impact ?? 0;
  return `<div class="proj-result"><div class="proj-ownership">THAT’S WHAT YOUR CLASS SAID</div><div class="proj-result-choice">${c?.short || "LUNCH DECISION"}</div><div class="proj-result-why"><div class="proj-tradeoff"><strong>JORDAN SAID</strong><br>“${escapeHtml(said)}”</div>${c?.why || ""}<div class="proj-tradeoff"><strong>WHAT THIS CHANGES</strong><br>${c?.tradeoff || ""}</div></div><div class="proj-energy-line"><span>ENERGY</span><strong class="${impact > 0 ? "gain" : impact < 0 ? "take" : "neutral"}">${impact > 0 ? "+" : ""}${impact}</strong></div></div>`;
}

function renderLiveVote(round, ui) {
  const list = ui.runoffIds ? round.choices.filter(c => ui.runoffIds.includes(c.id)) : round.choices;
  const running = ui.timerStarted && !ui.timerExpired && ui.timerLeft > 0;
  const notStarted = !ui.timerStarted && !ui.timerExpired;
  const timerPanel = ui.timerExpired ? `<div class="projector-countdown stopped">TIME STOPPED · HOLD YOUR VOTE</div>` : running ? `<div class="projector-countdown">${ui.timerLeft}</div>` : `<div class="projector-countdown ready">READY · ${round.voteTimerSeconds} SECONDS</div>`;
  const anticipation = notStarted && round.voteAnticipation ? `<div class="proj-anticipation">${round.voteAnticipation}</div>` : "";
  return `<div class="proj-clockrow"><span class="proj-time">${round.time}</span><span class="proj-part">Live vote</span></div><div class="proj-question">${round.question}</div>${anticipation}${timerPanel}<div class="proj-choices">${list.map((c, i) => { const count = ui.votes?.[c.id] || 0; return `<div class="proj-choice"><div class="proj-choice-letter">${/^\d+$/.test(String(c.id)) ? c.id : i + 1}</div><div class="proj-choice-text"><strong>${c.short || c.label}</strong>${c.short ? `<br><span>${c.label}</span>` : ""}</div><div class="vote-count">${count} ${count === 1 ? "vote" : "votes"}</div></div>`; }).join("")}</div>`;
}

function renderLiveSort(ui) {
  const asg = ui.sortAssignments || {}, zones = { now: [], later: [], mute: [] }, un = [];
  for (const item of ROUND2.sortingItems) { const z = asg[item.id]; if (z && zones[z]) zones[z].push(item); else un.push(item); }
  const zone = (id, label) => `<div class="proj-sort-zone ${id}"><div class="proj-sort-zone-label">${label}</div>${zones[id].map(i => `<div class="proj-sort-item ${ui.checkedNowItem === i.id ? "checked-now" : ""}">${i.label}${ui.checkedNowItem === i.id ? " · CHECKING" : ""}</div>`).join("")}</div>`;
  const multipleNow = zones.now.length > 1 && !ui.checkedNowItem ? `<div class="proj-anticipation">${ROUND2.multipleNowPrompt}</div>` : "";
  return `<div class="proj-clockrow"><span class="proj-time">${ROUND2.time}</span><span class="proj-part">Attention sort</span></div><div class="proj-question">${ROUND2.question}</div>${multipleNow}<div class="proj-sort-board">${zone("now", "NOW")}${zone("later", "LATER")}${zone("mute", "MUTE")}</div>${un.length ? `<div class="projector-chiprow">Unsorted: ${un.map(i => `<span>${i.label}</span>`).join("")}</div>` : ""}`;
}

function gapShortReason(action, gs) {
  if (gs.workGapRemaining < action.duration && gs.workGapRemaining > 0) return `ONLY ${gs.workGapRemaining} MIN REMAIN`;
  if (gs.workGapRemaining === 0) return "NO TIME LEFT";
  if (action.id === "assessment" && gs.assessmentRemaining < 20) return "ALREADY DONE";
  if (action.id === "friend" && gs.friendStatus !== "pending") return "ALREADY HANDLED";
  if (action.id === "food" && !gs.currentHunger) return "NOT NEEDED";
  if (action.id === "reset" && gs.workResetUsed) return "ALREADY USED";
  if (action.id === "organise" && gs.organisedUsed) return "ALREADY USED";
  return `NEEDS ${action.duration} MIN`;
}

function renderGap(gs) {
  const items = ROUND5.gapActions.map(a => ({ ...a, ...round5GapAvailability(gs, a) }));
  return `<div class="proj-clockrow"><span class="proj-time">After school</span><span class="proj-part">Use the gap</span></div><div class="proj-ownership">YOUR CLASS KEPT ${gs.workGapTotal} MINUTES. SPEND IT.</div><div class="proj-question">${gs.workGapRemaining} MIN LEFT</div><div class="gap-meter"><div class="gap-meter-fill" style="width:${gs.workGapTotal ? ((gs.workGapTotal - gs.workGapRemaining) / gs.workGapTotal) * 100 : 0}%"></div><span>${gs.workGapTotal - gs.workGapRemaining} min used</span></div><div class="projector-actiongrid gap-actions">${items.map(a => `<div class="${a.ok ? "" : "disabled"}"><strong>${a.label}</strong><span>${a.ok ? `${a.impact > 0 ? "+" : ""}${a.impact} · fits now` : gapShortReason(a, gs)}</span></div>`).join("")}</div><div class="projector-log">${(gs.workGapActions || []).map(a => `${a.label} · ${a.duration}m`).join("  |  ") || "Nothing selected yet. Leaving time open is allowed."}</div>`;
}

function renderWorkResult(gs) {
  const work = ROUND5.choices.find(c => c.id === gs.workChoice);
  const hungerPenalty = gs.currentHunger ? -3 : 0;
  const total = (work?.workImpact || 0) + hungerPenalty;
  const hunger = gs.currentHunger ? `<div class="proj-tradeoff"><strong>EARLIER CHOICE CARRIES FORWARD</strong><br>Jordan started work still hungry. That adds −3 because the missed food need was still active.</div>` : `<div class="proj-tradeoff"><strong>WHAT CARRIED INTO WORK</strong><br>Jordan did not start the shift with an unresolved hunger penalty.</div>`;
  const used = gs.workGapActions || [];
  const spendList = used.length
    ? `<div class="proj-spend-list"><strong>YOUR ${gs.workGapTotal || 0} MINUTES</strong>${used.map(a => `<span class="spend-check">✓ ${a.label}</span>`).join("")}${gs.workGapRemaining > 0 ? `<span class="spend-cross">✕ ${gs.workGapRemaining} MIN — DIDN’T FIT / LEFT OPEN</span>` : ""}</div>`
    : `<div class="proj-spend-list"><strong>YOUR ${gs.workGapTotal || 0} MINUTES</strong><span class="spend-cross">✕ LEFT OPEN — NOTHING SPENT</span></div>`;
  return `<div class="proj-result"><div class="proj-ownership">YOUR CLASS CHOSE</div><div class="proj-result-choice">WORK SHIFT COMPLETE · ${work?.short || "WORK"}</div>${spendList}<div class="proj-result-why">${work?.why || "The work choice now plays out."} Extra paid work: ${gs.extraPaidMinutes || 0} min.${hunger}<div class="proj-tradeoff"><strong>STILL IN PLAY</strong><br>Assessment ${gs.assessmentRemaining} min · Friend ${gs.friendStatus || "not pending"}.</div></div><div class="proj-energy-line"><span>ENERGY</span><strong class="${total < 0 ? "take" : "neutral"}">${total > 0 ? "+" : ""}${total}</strong></div></div>`;
}

function renderBasket(gs) {
  const opts = gs.homeTime === 1130 ? ["JOIN LATE — arrive around 7:20", "SKIP BASKETBALL"] : ["ATTEND BASKETBALL", "SKIP BASKETBALL"];
  return `<div class="proj-clockrow"><span class="proj-time">${formatTime(gs.homeTime)}</span><span class="proj-part">Basketball</span></div><div class="proj-question">DOES BASKETBALL STAY IN THE EVENING?</div><div class="proj-choices">${opts.map((x, i) => `<div class="proj-choice"><div class="proj-choice-letter">${i + 1}</div><div class="proj-choice-text">${x}</div></div>`).join("")}</div>`;
}

function fixedEveningBlocks(gs) {
  if (gs.basketballStatus === "skip") return [{ label: "BASKETBALL + TRAVEL", time: "REMOVED — time released" }];
  if (gs.basketballStatus === "late") return [{ label: "GET READY + TRAVEL", time: "6:50–7:20" }, { label: "BASKETBALL", time: "7:20–8:30" }, { label: "TRAVEL HOME", time: "8:30–8:40" }];
  if (gs.trainingStart === 19 * 60 + 20) return [{ label: "GET READY + TRAVEL", time: "7:05–7:20" }, { label: "BASKETBALL", time: "7:20–8:50" }, { label: "TRAVEL HOME", time: "8:50–9:00" }];
  return [{ label: "GET READY + TRAVEL", time: "6:45–7:00" }, { label: "BASKETBALL", time: "7:00–8:30" }, { label: "TRAVEL HOME", time: "8:30–8:40" }];
}

function renderProjectorTimeline(gs, done = false) {
  const windows = flexibleWindows(gs), fixed = fixedEveningBlocks(gs);
  const reflow = gs.basketballStatus === "skip" ? `<div class="timeline-reflow"><strong>BASKETBALL REMOVED / TIME RELEASED</strong> The evening has been rebuilt as one open block.</div>` : `<div class="timeline-reflow"><strong>THE EVENING REBUILDS.</strong> Travel and basketball are now fixed into the clock around the rest of the plan.</div>`;
  return `<div class="proj-clockrow"><span class="proj-time">Evening</span><span class="proj-part">Real clock</span></div><div class="proj-question">${done ? "THE EVENING YOU BUILT" : "Build the evening — make the limited time fit"}</div>${reflow}<div class="fixed-evening-strip">${fixed.map(b => `<div><span>${b.label}</span><strong>${b.time}</strong></div>`).join("")}</div><div class="timeline-boundary"><strong>PLAN UNTIL 10:00 PM</strong><span>10:00–10:30 stays as the final Reality Check / get-ready-for-bed buffer</span></div>${done ? "" : `<div class="timeline-tension">${ROUND6.notEverythingFits}</div>`}<div class="timeline-windows">${windows.map(w => `<div class="timeline-window"><strong>${formatTime(w.start)}–${formatTime(w.end)}</strong><span>${w.label}</span>${(gs.eveningActions || []).filter(a => a.start >= w.start && a.end <= w.end).slice().sort((a, b) => a.start - b.start || a.end - b.end).map(a => `<div class="timeline-action">${formatTime(a.start)} ${a.label}</div>`).join("") || `<div class="timeline-open">OPEN TIME</div>`}</div>`).join("")}</div>${done ? "" : `<div class="timeline-palette">${ROUND6.actions.map(a => { const av = actionAvailability(gs, a); return `<span class="${av.ok ? "" : "disabled"}"><strong>${a.label} · ${a.duration}m · ${a.impact > 0 ? "+" : ""}${a.impact}</strong><small>${av.ok ? "available" : av.reason}</small></span>`; }).join("")}</div>`}<div class="projector-chiprow">Assessment left ${gs.assessmentRemaining}m · Friend ${gs.friendStatus || "not pending"} · Dinner ${gs.dinnerStatus} · Tomorrow basics ${gs.tomorrowBasics}</div>`;
}

function renderProjectorReality(gs, rs = {}) {
  const parked = [gs.groupChatStatus, gs.videosStatus].some(x => x === "later");
  const basicsPending = gs.tomorrowBasics !== "done" && gs.tomorrowBasicsDecision == null;
  const coreReady = gs.assessmentRemaining === 0 && !basicsPending;
  const lifeChecked = rs.life3 != null;
  const cards = [];
  if (gs.assessmentRemaining > 0) { const opts = gs.assessmentRemaining > 20 ? ["Finish tonight", "Do 20 tonight", "Move to tomorrow"] : ["Finish tonight", "Move to tomorrow"]; cards.push({ title: `Assessment · ${gs.assessmentRemaining} min`, opts }); }
  else if (gs.assessmentTomorrow > 0) { cards.push({ title: `Assessment tomorrow · ${gs.assessmentTomorrow} min`, opts: [gs.supportPlan === "planned" ? "Support planned" : "Plan support"] }); }
  if (basicsPending) cards.push({ title: "Tomorrow basics", opts: ["Pack + charge · 10m", "Essentials only · 5m", "Morning"] });
  if (coreReady && !lifeChecked) cards.push({ title: "One last interruption check", opts: ["See what life throws at Jordan before closing the final phone decision"] });
  else if (lifeChecked && parked) cards.push({ title: "Parked phone stuff", opts: ["Check · 5m", "Leave to tomorrow"] });
  const done = coreReady && lifeChecked && !parked;
  return `<div class="proj-clockrow"><span class="proj-time">${formatTime(gs.currentTime)}</span><span class="proj-part">Reality Check</span></div><div class="proj-question proj-stop">${ROUND7.stopHeading}</div><div class="reality-projector"><div><span>Target bed</span><strong>${formatTime(gs.targetBedtime || 1350)}</strong></div><div><span>Free before bed</span><strong>${Math.max(0, (gs.targetBedtime || 1350) - (gs.currentTime || 0))} min</strong></div><div><span>Tomorrow Load</span><strong>${gs.tomorrowLoad || 0} min</strong></div></div>${cards.length ? `<div class="reality-cards">${cards.map(c => `<div class="reality-card"><strong>${c.title}</strong><div>${c.opts.map(o => `<span>${o}</span>`).join("")}</div></div>`).join("")}</div>` : done ? `<div class="projector-focus"><h2>NOTHING URGENT IS LEFT.</h2><p>The class has already dealt with what genuinely needed a decision tonight.</p></div>` : ""}`;
}

function renderReceipt(gs, rs) {
  const summary = typeof FINAL.getStorySummary === "function" ? FINAL.getStorySummary(rs, gs) : [];
  return `<div class="receipt-projector"><h2>${FINAL.title}</h2>${summary.length ? `<div class="receipt-summary">${summary.map(s => `<p>${s}</p>`).join("")}</div>` : ""}<div class="receipt-grid">${FINAL.getReceipt(rs, gs).map(x => `<div><span>${x.label}</span><strong>${x.value}</strong></div>`).join("")}</div><div class="receipt-questions">${FINAL.debrief.map(q => `<p>${q}</p>`).join("")}</div><h3>${FINAL.closing}</h3><p class="receipt-closing-copy">${FINAL.closingScript}</p></div>`;
}
