/* =====================================================================
 * js/render-facilitator.js
 *
 * Renders the facilitator control screen — a GAME MASTER console. Every
 * view follows the same fixed teaching hierarchy, top to bottom, on one
 * vertically-scrolling page (no nested independently-scrolling panels):
 *
 *   1. RIGHT NOW                 (one-sentence summary of this moment)
 *   2. STUDENTS CURRENTLY SEE    (exact text mirror of the student screen)
 *   3. SAY / READ                (natural spoken wording)
 *   4. ASK FIRST                 (1-3 questions asked BEFORE the decision)
 *   5. STUDENTS DO                (what students physically do)
 *   6. DO NOW                    (exact physical facilitator instructions)
 *   7. LIVE CONTROLS             (only appear after the facilitator already
 *                                 knows what's happening — i.e. after 1-6)
 *   8. DISCUSSION GUIDE
 *   9. IF STUDENTS ARE STUCK / SUGGESTED STUDENT ANSWERS / WHAT TO LISTEN
 *      FOR / MISCONCEPTION TO CORRECT / SELF-CARE LINK / DEPTH / DON'T SAY
 *  10. WHAT THIS CHANGES
 *  11. NEXT UP
 * ===================================================================== */

function optionScript(choices) { return (choices || []).map((c, i) => `${c.short || c.label || `Option ${i + 1}`}: ${c.label || ""}${c.role ? ` — ${c.role}` : ""}${c.meta ? ` (${c.meta})` : ""}`).join(" "); }

/**
 * Exact plain-text mirror of the CURRENT student screen content, derived
 * from the SAME renderBody() used by the projector — so this text can
 * never drift from what students actually see.
 */
function exactStudentCopy() {
  try {
    let text = renderBody(getGameState(), getRunState(), uiState());
    text = text
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|div|h1|h2|h3|figure|figcaption|li)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    const lines = text.split(/\n+/).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean);
    return lines.map(escapeHtml).join("<br>") || "Student preview is shown at right.";
  } catch (_e) { return "Student preview is shown at right."; }
}

// ── Per-view facilitator guidance (purpose / rescue prompts / depth / don't-say) ──
function guidanceForView(v) {
  const base = { purpose: "Keep the class focused on trade-offs rather than finding a single correct answer.", ifNeeded: [], depth: [], dontSay: "" };
  if (v === "opening_brainstorm") return { ...base, purpose: "Surface the class’s existing idea of self-care before teaching anything.", ifNeeded: ["If the room is quiet, offer neutral starters: sleep, food, breaks, boundaries, asking for help, getting organised.", "Accept imperfect answers. You are collecting ideas, not correcting them yet."], depth: ["Keep this fictional and general. Nobody needs to disclose personal experiences.", "Do not define self-care fully here — the ending works better if students can compare their first idea with the day they built."] };
  if (v === "opening_jordan" || v === "opening_energy") return { ...base, purpose: "Establish the rules of the simulation and protect against the Energy Bar becoming a right/wrong score.", ifNeeded: ["If students ask what the best day is, say: ‘There isn’t one. Watch what each choice protects and what it leaves behind.’"], depth: ["Energy means immediate usable capacity only.", "A responsible choice can cost energy. An easy choice can move pressure into later."], dontSay: "Higher energy means Jordan made better choices." };
  if (v.startsWith("r1")) return { ...base, purpose: "Make the morning feel like a real prioritising problem, not a breakfast quiz.", ifNeeded: ["If voting stalls, ask: ‘What does this plan protect first?’ and ‘What is it willing to leave out?’", "For a split class, use the top-two runoff rather than deciding for them."], depth: ["Every Round 1 branch still covers breakfast in some form.", "The automatic −12 belongs to poor sleep and rushing, not to the class’s choice."], dontSay: "Basics First is the healthy/correct answer." };
  if (v.startsWith("r2")) return { ...base, purpose: "Practise deliberate attention management without labelling particular apps as good or bad.", ifNeeded: ["Remind students every item must be placed.", "If several items are NOW, ask which ONE Jordan can actually check properly in five minutes."], depth: ["The +2 is for committing to an attention plan, regardless of which item was checked.", "Muted content cannot return later; LATER content may return."], dontSay: "The friend DM or school app is automatically the right NOW choice." };
  if (v.startsWith("r3")) return { ...base, purpose: "Show that different information sources answer different questions.", ifNeeded: ["Ask: ‘What can this source actually tell Jordan?’", "If they choose Peer or Deadline, do the quick second check rather than treating the first choice as wrong."], depth: ["Task Sheet and Teacher establish the workload directly.", "Peer and Deadline are useful but incomplete, so the second check completes the information picture."], dontSay: "Task Sheet is always the right first check." };
  if (v.startsWith("r4")) return { ...base, purpose: "Practise a boundary that can hold care for another person and Jordan’s own needs at the same time.", ifNeeded: ["If students argue that a good friend must go immediately, ask what Jordan also needs at lunch.", "If they dislike the provided wording, accept a class-generated line and map it to the same underlying branch."], depth: ["The friend is not the problem. The pressure comes from two legitimate needs colliding.", "Checking urgency leaves the friend pending only because the friend says it can wait."], dontSay: "Ten Minutes First is the right way to be a good friend." };
  if (v.startsWith("r5")) return { ...base, purpose: "Turn a work decision into a real resource-allocation problem using the actual 15/30/60-minute gap.", ifNeeded: ["Keep pointing to remaining minutes. Students may choose more than one action.", "Leaving time open is a valid decision; do not force them to fill the gap."], depth: ["Extra money genuinely matters, so do not steer toward NO.", "Assessment costs energy even though it can reduce later pressure. A reset can restore energy without completing responsibilities."], dontSay: "NO — 4:30 is the healthy choice here." };
  if (v.startsWith("r6")) return { ...base, purpose: "Make students build an evening that physically fits on a real clock.", ifNeeded: ["Use the disabled buttons as the arithmetic — you should not calculate times aloud.", "Ask ‘What still fits?’ rather than ‘What should Jordan do?’ when the schedule becomes tight."], depth: ["Travel and basketball are fixed blocks once the basketball decision is made.", "Home Is Loud blocks focused assessment only; it does not erase every possible reset or basic need."], dontSay: "Skipping basketball earns energy. It only creates time." };
  if (v.startsWith("r7")) return { ...base, purpose: "Bring back only unresolved items and make tonight-versus-tomorrow consequences visible.", ifNeeded: ["Read the current clock, free-before-bed and Tomorrow Load before making another decision.", "If nothing remains, do not invent a task — use NOTHING URGENT IS LEFT."], depth: ["Available time before 10:30 is used first. Bedtime only moves when a task exceeds that free time.", "Planning support does not delete assessment minutes; it changes how tomorrow is approached."], dontSay: "Deferring something is automatically avoidance or a bad choice." };
  if (v.startsWith("r8")) return { ...base, purpose: "End with a small decision under uncertainty where there is no perfectly informed answer.", ifNeeded: ["Do not add information before the vote.", "If students ask whether the friend is unsafe, remind them this fictional message contains no explicit danger."], depth: ["The four options differ in time, boundary and immediate energy — none is labelled correct.", "In a real safety concern, normal school procedures override the game mechanic."], dontSay: "Leave Until Morning is what a good friend would choose." };
  if (v === "final_receipt") return { ...base, purpose: "Land the activity on patterns and trade-offs, not on the final Energy number.", ifNeeded: ["If students focus only on Energy Left, redirect: ‘What did this day protect, and what did it push into tomorrow?’", "For the one-change question, always ask what new consequence that change would create."], depth: ["Return to the opening self-care answers and ask what the class would add or change now.", "A lower-Energy day can still contain deliberate, values-based choices.", "A higher-Energy day may also carry more Tomorrow Load or leave more things unresolved — always read the whole receipt."], dontSay: "This was a good/bad day because the battery ended high/low." };
  return base;
}

function discussionPromptsForView(v, gs) {
  if (v === "home") return [];
  if (v === "opening_brainstorm") return ["What counts as self-care in ordinary life, not just treats or relaxation?", "Can self-care include doing something difficult now because it helps later?"];
  if (v === "opening_jordan") return ["Which parts of Jordan’s day are fixed, and which parts may still be flexible?", "Which priorities matter for different reasons — responsibility, money, people, enjoyment?"];
  if (v === "opening_energy") return ["Why might a useful decision still lower Energy?", "Why could a high-Energy choice still leave a problem for later?"];
  if (v === "r1_story" || v === "r1_vote") return ["What is Jordan trying to protect in a rushed morning?", "Which plan leaves the most buffer if one more thing goes wrong?", "Which plan asks Jordan to let something wait?"];
  if (v.startsWith("r1_discuss") || v === "r1_result") return ["What did this plan protect immediately?", "What became tighter, later or less certain?", "Would the same plan still feel reasonable if another small problem happened?"];
  if (v === "r1_life") return ["Jordan did not choose this event — what can Jordan still control now?", "Does the original morning plan still work, or does it need adapting?"];
  if (v === "r2_story" || v === "r2_sort") return ["Which item truly needs attention in the next five minutes?", "What is the difference between LATER and MUTE?", "If several things feel urgent, which ONE can Jordan actually check properly?"];
  if (v === "r2_result") return ["Which things can still come back later on this path?", "What information did Jordan gain — or deliberately leave unknown?", "How can deciding not to check something be an active choice rather than ignoring everything?"];
  if (v === "r3_story" || v === "r3_investigate" || v === "r3_followup") return ["What question can this source answer: WHEN, WHAT, or HOW MUCH?", "What information is still missing after the first check?", "Why can two useful sources give different kinds of information?"];
  if (v === "r3_result") return ["What exactly does Jordan now know?", "What still has not been solved even though the uncertainty is lower?", "How does reliable information change the rest of the day?"];
  if (v === "r4_story" || v === "r4_choice" || v === "r4_dialogue") return ["What does the friend need, and what does Jordan need?", "Which approach sets a boundary without dismissing the friend?", "What wording would sound believable from a Year 10 student?"];
  if (v === "r4_result") return ["Which need was protected first?", "What is now resolved, and what — if anything — is still pending?", "How will this lunch choice change the after-school options?"];
  if (v === "r5_story" || v === "r5_choice") return ["What does each work response buy Jordan — money, time, or a balance of both?", "Which earlier choices make the pre-work gap more valuable on this path?", "Would your answer change if Jordan is hungry, has a friend pending, or still has 60 minutes of assessment work?"];
  if (v === "r5_gap") return ["What can fit, not just what would be nice to do?", "Which action reduces later pressure, and which restores capacity now?", "Is leaving some time open a deliberate choice here?"];
  if (v === "r5_work_result") return ["What did the work decision protect?", "What did the pre-work gap manage to deal with — and what remains?", "Did an earlier lunch decision change how work felt or what was possible before it?"];
  if (v === "r5_life2") return ["Which fixed part of tonight has changed?", "What must be rebuilt because of this event?", "What remains possible even though the original plan changed?"];
  if (v === "r6_story" || v === "r6_basketball") return ["What does keeping basketball protect for Jordan?", "What time is released if Jordan skips — and what is lost?", "If work ran late, which basketball options are physically possible now?"];
  if (v === "r6_timeline") return ["What genuinely fits in the remaining windows?", "Which useful action is being left unresolved because something else took the time?", "Is the class protecting capacity, responsibility, connection, enjoyment, or tomorrow — and what is the cost?"];
  if (v === "r6_result") return ["Looking at tonight’s layout, what actually got covered?", "What’s still sitting there at 10:00 PM?", "Which earlier choice had the biggest effect on how tonight came together?"];
  if (v === "r7_reality") return ["What really needs a decision tonight, and what can deliberately move to tomorrow?", "How much free time exists before bed before bedtime actually shifts?", "What does Tomorrow Load show that the Energy Bar does not?"];
  if (v === "r7_life3") return ["Why was this event possible on this particular path?", "What earlier decision made this event eligible — or prevented another event from appearing?"];
  if (v === "r8_story" || v === "r8_choice") return ["What can Jordan know from this message, and what is still uncertain?", "How much time, attention or boundary is Jordan willing to give it tonight?", "Which option protects connection most? Which protects the remaining night most?"];
  if (v === "r8_result") return ["What did that final choice actually give Jordan — time, energy, or connection?", "What did it use up in return?", "Would you have chosen the same way on a much lower- or much higher-Energy day?"];
  if (v === "final_receipt") return ["Look past the final number — what actually held up today, even on a lower-Energy path?", "On a higher-Energy path, what quietly moved into Tomorrow Load instead?", "Which single change would alter the day most, and what new consequence would that create?", "How is your definition of self-care different from the opening?"];
  return ["What just happened, in Jordan’s own terms?", "What did it use up, and what does it leave for later?"];
}

/** Maps a viewDescriptor to the ROUND content object that owns its teaching-support data (stuckPrompts, suggestedAnswers, listenFor, misconception, selfCareLink). */
function roundForView(v) {
  if (v.startsWith("r1")) return ROUND1;
  if (v.startsWith("r2")) return ROUND2;
  if (v.startsWith("r3")) return ROUND3;
  if (v.startsWith("r4")) return ROUND4;
  if (v.startsWith("r5")) return ROUND5;
  if (v.startsWith("r6")) return ROUND6;
  if (v.startsWith("r7")) return ROUND7;
  if (v.startsWith("r8")) return ROUND8;
  return null;
}

/** Strips a trailing ":suffix" from a dynamic viewDescriptor, e.g. "r1_discuss:2" → "r1_discuss". */
function normalizeView(v) {
  const i = v.indexOf(":");
  return i === -1 ? v : v.slice(0, i);
}

/** Looks up the moment object (if any) that owns view v on round content object roundData, trying the exact view first, then the normalised one. */
function momentFor(roundData, v) {
  if (!roundData || !roundData.moments) return null;
  const nv = normalizeView(v);
  return roundData.moments[v] || roundData.moments[nv] || null;
}

/**
 * resolveGuidance() — the single moment-aware resolver for all eight
 * facilitator teaching-support fields. For each field independently:
 *   1. Exact viewDescriptor's moment override
 *   2. Normalised (":suffix"-stripped) viewDescriptor's moment override
 *   3. Round-level value (today's ROUND.field, or guidanceForView()'s
 *      per-round purpose/ifNeeded/depth/dontSay)
 *   4. Generic/base default (guidanceForView()'s built-in base object)
 * A moment overriding only one field still inherits every other field
 * from the round — resolution happens field-by-field, never object-by-
 * object, so nothing is silently dropped.
 */
function resolveGuidance(v) {
  const roundData = roundForView(v);
  const moment = momentFor(roundData, v);
  const roundLevel = guidanceForView(v); // {purpose, ifNeeded, depth, dontSay} — round/base fallback tiers 3-4
  return {
    purpose: moment && moment.purpose !== undefined ? moment.purpose : roundLevel.purpose,
    ifNeeded: moment && moment.ifNeeded !== undefined ? moment.ifNeeded : roundLevel.ifNeeded,
    depth: moment && moment.depth !== undefined ? moment.depth : roundLevel.depth,
    dontSay: moment && moment.dontSay !== undefined ? moment.dontSay : roundLevel.dontSay,
    stuckPrompts: (moment && moment.stuckPrompts !== undefined) ? moment.stuckPrompts : (roundData && roundData.stuckPrompts) || [],
    suggestedAnswers: (moment && moment.suggestedAnswers !== undefined) ? moment.suggestedAnswers : (roundData && roundData.suggestedAnswers) || [],
    listenFor: (moment && moment.listenFor !== undefined) ? moment.listenFor : (roundData && roundData.listenFor) || [],
    misconception: (moment && moment.misconception !== undefined) ? moment.misconception : (roundData && roundData.misconception) || null,
    selfCareLink: (moment && moment.selfCareLink !== undefined) ? moment.selfCareLink : (roundData && roundData.selfCareLink) || ""
  };
}

/** RIGHT NOW — one short sentence naming exactly what is happening on screen at this moment. */
function rightNowForView(v) {
  const map = {
    home: "Waiting to begin. Students should only see the title card.",
    opening_brainstorm: "Students are brainstorming what self-care means, before anything is taught.",
    opening_jordan: "Students are meeting Jordan and hearing the competing priorities already in the day.",
    opening_energy: "You are explaining what the Energy Bar does and does not mean, before Round 1 starts.",
    r1_story: "Students are hearing the 7:10 AM morning situation, before the vote opens.",
    r1_vote: "Students are voting on Jordan’s morning plan under a 15-second clock.",
    r1_result: "Students are seeing the immediate Energy consequence of the morning plan they chose.",
    r1_life: "Something Jordan did not choose is about to change the locked-in morning plan.",
    r2_story: "Students are hearing about the four things competing for Jordan’s attention at 8:45 AM.",
    r2_sort: "Students are sorting every attention demand into NOW, LATER or MUTE.",
    r2_result: "Students are seeing what their attention plan revealed and what it locked away.",
    r3_story: "Students are hearing the 10:25 AM deadline surprise.",
    r3_investigate: "Students are choosing which information source Jordan checks first.",
    r3_followup: "The first source was useful but incomplete — students are choosing the direct follow-up check.",
    r3_result: "Students are seeing exactly what Jordan now knows about the assessment.",
    r4_story: "Students are hearing about two legitimate lunchtime needs colliding at once.",
    r4_choice: "Students are choosing Jordan’s approach to lunch and the friend at the same time.",
    r4_dialogue: "The approach is locked. Students are now writing Jordan’s exact words before any consequence is revealed.",
    r4_result: "Students are seeing what Jordan’s exact wording actually resolved.",
    r5_story: "Students are hearing the manager’s message asking Jordan to start early.",
    r5_choice: "Students are deciding how much of the afternoon Jordan is willing to trade for extra paid minutes.",
    r5_gap: "Students are spending Jordan’s real, limited pre-work minutes on competing actions.",
    r5_work_result: "Students are seeing how the work shift itself, plus anything left unresolved, plays out.",
    r5_life2: "Something Jordan did not choose is about to reshape tonight’s schedule.",
    r6_story: "Students are seeing what a real evening now has to carry, before deciding basketball.",
    r6_basketball: "Students are deciding whether basketball stays in tonight’s plan.",
    r6_timeline: "Students are building the evening on a real clock — not everything is guaranteed to fit.",
    r6_result: "Students are looking at the evening the class actually managed to build.",
    r7_reality: "Students are deciding, item by item, what genuinely still needs attention tonight versus tomorrow.",
    r7_life3: "One last possible interruption is being checked before the final phone decision closes.",
    r8_story: "Students are seeing the final late-night message, with no extra information.",
    r8_choice: "Students are voting on Jordan’s very last decision of the day under a 10-second clock.",
    r8_result: "Students are seeing the final minutes and Energy change of the whole day.",
    final_receipt: "Students are looking at the full day they built, not just the final Energy number."
  };
  if (map[v]) return map[v];
  if (v.startsWith("r1_discuss:")) return "The class has locked a morning plan. You are discussing the trade-off before revealing the Energy result.";
  return "Guide the class through the current screen using the script below.";
}

function comingNextForView(v) {
  const map = {
    opening_brainstorm: "Next: meet Jordan and identify the competing priorities already in the day.",
    opening_jordan: "Next: explain exactly what the Energy Bar means — and what it does NOT mean.",
    opening_energy: "Next: Round 1 begins with an automatic Energy drop from poor sleep and rushing, before the class makes any choice.",
    r1_vote: "After the timer stops: lock the class choice, discuss the trade-off BEFORE revealing Energy.",
    r1_result: "PLAN LOCKED. THEN LIFE HAPPENS… Next: an event changes the morning without Jordan choosing it.",
    r1_life: "Next: arrival at school and a NOW / LATER / MUTE attention sort.",
    r2_sort: "After every item is placed: if more than one is NOW, select the one item Jordan actually checks.",
    r2_result: "Next: a deadline surprise creates uncertainty; the class investigates what information Jordan actually needs.",
    r3_investigate: "If the first source gives incomplete information, one direct follow-up check will complete the picture.",
    r3_result: "Next: lunch creates two legitimate needs at the same time — food/break and a friend conversation.",
    r4_choice: "After choosing the approach: the class must build Jordan’s exact words before seeing the result.",
    r4_result: "Next: the manager asks Jordan to start work early; the answer changes the real amount of pre-work time.",
    r5_choice: "After YES / COMPROMISE / NO: spend the resulting 15 / 30 / 60 minutes on multiple actions.",
    r5_gap: "When the gap is locked: the work shift itself applies its Energy cost, plus a visible hunger penalty if Jordan still has not eaten.",
    r5_work_result: "Next: Life Happens 2 may change the evening schedule after work.",
    r5_life2: "Next: decide basketball first, then rebuild the evening around the actual clock.",
    r6_basketball: "The basketball decision changes the available time windows immediately; then the class places flexible actions on the real clock.",
    r6_timeline: "After locking the evening at 10:00 PM: only genuinely unresolved items return in the Reality Check.",
    r6_result: "Next: Reality Check uses the current clock, free-before-bed time and Tomorrow Load.",
    r7_reality: "After assessment and tomorrow-basics decisions are settled: check the late Life Happens event BEFORE closing any parked-phone decision. Then return to the Reality Check for the phone if it is still active/later.",
    r7_life3: "Next: Jordan goes to bed and gets one final message with only 10 seconds to decide.",
    r8_story: "Next: a 10-second vote. Do not add information that is not on the student screen.",
    r8_choice: "After TIME STOPPED: lock the class choice and show the final immediate consequence.",
    r8_result: "Next: THE DAY YOU BUILT receipt — interpret the whole pattern, not just the Energy number."
  };
  return map[v] || "";
}

/**
 * shell() — assembles one facilitator view in the fixed teaching hierarchy.
 * STUDENTS DO deliberately renders BEFORE the live controls: the facilitator
 * must know what students are physically doing before the buttons that run
 * the mechanic appear in front of them.
 */
function shell({ round, phase, say = "", ask = null, doNow = "", studentsDo = "", controls = "", extra = "", ifNeeded = [], depth = [], dontSay = "", changes = "", nextUp = "", next = null }) {
  const gs = getGameState(), v = gs.viewDescriptor || "home", g = resolveGuidance(v);
  const mergedIf = [...(g.ifNeeded || []), ...(ifNeeded || [])], mergedDepth = [...(g.depth || []), ...(depth || [])];
  const discussion = discussionPromptsForView(v, gs);
  const upcoming = nextUp || comingNextForView(v);
  const details = (label, arr) => arr?.length ? `<details class="fac-collapse"><summary>${label}</summary><div class="fac-collapse-body"><ul>${arr.map(x => `<li>${x}</li>`).join("")}</ul></div></details>` : "";
  const cursor = getCursor(), historyList = getHistory();
  const canBack = cursor > 0, canForward = cursor < historyList.length - 1;
  const askCard = (ask !== null && String(ask).trim() !== "") ? `<div class="fac-card fac-ask"><div class="fac-card-label">ASK FIRST — BEFORE THE DECISION</div><p>${ask}</p></div>` : "";

  // Deepened stuck-prompt rescue lines, patterned "IF THEY SAY X: prompt / prompt".
  const stuckItems = g.stuckPrompts?.length
    ? g.stuckPrompts.map(sp => `<li><strong>${sp.when}:</strong> ${sp.lines.map(l => `“${l}”`).join(" / ")}</li>`)
    : mergedIf.map(x => `<li>${x}</li>`);
  const stuckCard = stuckItems.length ? `<details class="fac-collapse fac-stuck"><summary>IF STUDENTS ARE STUCK — RESCUE PROMPTS</summary><div class="fac-collapse-body"><ul>${stuckItems.join("")}</ul></div></details>` : "";

  // Suggested student answers — always framed as possibilities, never an answer key.
  const suggestedCard = g.suggestedAnswers?.length
    ? `<details class="fac-collapse fac-suggested"><summary>SUGGESTED STUDENT ANSWERS</summary><div class="fac-collapse-body"><p>Students might say:</p><ul>${g.suggestedAnswers.map(a => `<li>${a}</li>`).join("")}</ul><p class="fac-suggested-close">${SUGGESTED_ANSWERS_CLOSE}</p></div></details>`
    : "";

  const listenCard = g.listenFor?.length
    ? `<details class="fac-collapse fac-listen"><summary>WHAT TO LISTEN FOR</summary><div class="fac-collapse-body"><ul>${g.listenFor.map(x => `<li>${x}</li>`).join("")}</ul></div></details>`
    : "";

  const misconceptionCard = g.misconception
    ? `<details class="fac-collapse fac-misconception"><summary>MISCONCEPTION TO CORRECT</summary><div class="fac-collapse-body"><p><strong>IF STUDENTS SAY:</strong> “${g.misconception.claim}”</p><p><strong>RESPONSE:</strong> ${g.misconception.response}</p></div></details>`
    : "";

  const selfCareCard = g.selfCareLink
    ? `<details class="fac-collapse fac-selfcare"><summary>SELF-CARE LINK</summary><div class="fac-collapse-body"><p>${g.selfCareLink}</p></div></details>`
    : "";

  const depthCard = details("DEPTH / NUANCE — WHY THIS WORKS", mergedDepth);

  return `<div class="fac-card fac-section-head"><div class="fac-card-label">RIGHT NOW · ${round} · ${phase}</div><p class="fac-right-now">${rightNowForView(v)}</p><p class="fac-purpose">${g.purpose}</p></div>
 <div class="fac-card fac-student-mirror"><div class="fac-card-label">STUDENTS CURRENTLY SEE — MAIN SCREEN COPY</div><div class="fac-mirror-note">Round, time and Energy are already shown in the facilitator status bar above.</div><div class="fac-mirror-copy">${exactStudentCopy()}</div></div>
 <div class="fac-card fac-say"><div class="fac-card-label">SAY / READ</div><p>${say || "Use the exact student-screen copy above."}</p></div>
 ${askCard}
 <div class="fac-card fac-studentdo"><div class="fac-card-label">STUDENTS DO</div><p>${studentsDo}</p></div>
 <div class="fac-card fac-donow"><div class="fac-card-label">DO NOW</div><p>${doNow}</p>${extra}</div>
 ${controls ? `<div class="fac-card fac-live-controls"><div class="fac-card-label">LIVE CONTROLS — USE THESE NOW</div>${controls}</div>` : ""}
 ${discussion.length ? `<div class="fac-card fac-discussion"><div class="fac-card-label">DISCUSSION GUIDE — PICK 1–3</div><ul>${discussion.map(q => `<li>${q}</li>`).join("")}</ul></div>` : ""}
 ${stuckCard}${suggestedCard}${listenCard}${misconceptionCard}${selfCareCard}${depthCard}${(dontSay || g.dontSay) ? `<div class="fac-card fac-dont"><div class="fac-card-label">DON’T SAY / DON’T TEACH</div><p>${dontSay || g.dontSay}</p></div>` : ""}
 <div class="fac-card fac-changes"><div class="fac-card-label">WHAT THIS CHANGES</div><p>${changes}</p></div>
 ${upcoming ? `<div class="fac-card fac-next-up"><div class="fac-card-label">NEXT UP — BEFORE YOU MOVE ON</div><p>${upcoming}</p></div>` : ""}
 <div class="fac-nav"><button class="btn" data-fac-action="_back" ${canBack ? "" : "disabled"}>← Back</button><button class="btn" data-fac-action="_forward" ${canForward ? "" : "disabled"}>Forward →</button>${next ? `<button class="btn primary" data-fac-action="${next.action}">${next.label}</button>` : ""}</div>`;
}

function renderController(gs) {
  const v = gs.viewDescriptor;
  if (v === "home") return shell({ round: "Setup", phase: "Ready", say: "Do not read anything to the class yet. Open the Student Screen first. Students should only see the Energy Bar Challenge title and ‘Waiting for the facilitator to begin…’.", ask: "", doNow: "1. Click Open Student Screen. 2. Move that window to the projector/second display. 3. Confirm students only see the waiting title card. 4. When everyone is ready, click Begin Activity.", studentsDo: "Wait on the title screen. They do not answer a question yet.", changes: "Nothing in Jordan’s day has started yet.", next: { label: "Begin Activity →", action: "openingBrainstorm" } });
  if (v === "opening_brainstorm") return shell({ round: "Opening", phase: "Self-care", say: "Before we start — when you hear the words self-care, what actually comes to mind? Quick ideas only. Nobody needs to give a personal example. We’ll come back to this at the end.", ask: "What words or actions come to mind when you hear ‘self-care’?", doNow: "Take 3–5 spoken answers. You do NOT need to type or ‘capture’ them in the program. If useful, jot 2–3 key words on the whiteboard so you can return to them at the end. Do not correct or define self-care yet.", studentsDo: "Call out quick general ideas. No personal disclosure is required.", changes: "Gives the class a starting definition to compare with the day they build.", next: { label: "Meet Jordan →", action: "openingJordan" } });
  if (v === "opening_jordan") return shell({ round: "Opening", phase: "Meet Jordan", say: "Meet Jordan. Year 10. There’s a school assessment due soon — Jordan thinks there’s more time than there actually is. Work today is 4:30 to 6, and extra hours would genuinely help. Basketball’s on tonight — something Jordan actually wants. Your job today: get Jordan through one ordinary day. Not perfectly. Deliberately.", ask: "What’s already competing for Jordan’s time before the day’s even started?", doNow: "Read the facts aloud from this script — don’t just point students at the projector. Take 2–3 quick observations, then continue.", studentsDo: "Notice that school, paid work, something Jordan values, and ordinary responsibilities all have to fit into the same day.", changes: "Sets up genuine competing priorities before any decisions are made.", next: { label: "Explain Energy →", action: "openingEnergy" } });
  if (v === "opening_energy") return shell({ round: "Opening", phase: "Energy", say: "Jordan starts at 100 energy. This bar shows the immediate effect of what’s happening — it isn’t a wellbeing score, and it isn’t grading anyone’s decisions right or wrong. A useful decision can still cost energy. An easy one right now can create a bigger problem later. Sometimes Jordan gets a choice. Sometimes life just happens. You’re controlling Jordan today — nobody needs to tell us anything personal.", ask: "Can a useful or responsible choice still cost energy? Why might that happen?", doNow: "Make sure students understand that Energy is information, not the goal. Get one quick response, then start Round 1.", studentsDo: "Use the Energy Bar to notice immediate capacity while also watching time, responsibilities, people and what gets pushed later.", dontSay: "Highest energy wins.", changes: "Locks the rules for interpreting every later result.", next: { label: "Start Round 1 →", action: "startR1" } });

  if (v === "r1_story") return roundStory(ROUND1, gs, { label: "Show the 4 Plans →", action: "r1Vote" }, "Before you click: tell the class what’s coming. Say — ‘You’re about to see four plans. I’ll read them all first. Then you get 15 seconds. When time stops, keep your choice in your head and hold up 1, 2, 3 or 4 fingers. There isn’t a secret correct answer.’");
  if (v === "r1_vote") return renderR1Vote();
  if (v.startsWith("r1_discuss:")) { const id = v.split(":")[1], c = ROUND1.choices.find(x => x.id === id); return shell({ round: "Round 1", phase: "Discuss before reveal", say: `The class locked in ${c.short}: ${c.label} We’re not looking at Energy yet.`, ask: "What does this plan protect for Jordan first? What does it squeeze, delay or leave less room for?", doNow: "Take one answer for the benefit and one for the trade-off. If students only say ‘good’ or ‘bad’, redirect them to what the plan protects and what it leaves thinner. Don’t reveal the points yet.", studentsDo: "Name the likely benefit and trade-off before seeing the immediate Energy effect.", changes: "Choice is locked; result is still hidden.", next: { label: "Reveal Result →", action: "r1Reveal" } }); }
  if (v === "r1_result") return simpleResult(ROUND1, 1, { label: "Life Happens →", action: "r1Life" });
  if (v === "r1_life") return renderLife("life1", ROUND1.lifeEvents, { label: "Start Round 2 →", action: "startR2" });

  if (v === "r2_story") return roundStory(ROUND2, gs, { label: "Open NOW / LATER / MUTE →", action: "r2Sort" }, "Next, the class sorts every attention demand into NOW, LATER or MUTE. If more than one lands on NOW, they choose the single item Jordan actually checks.");
  if (v === "r2_sort") return renderR2Sort();
  if (v === "r2_result") {
    const friendLine = gs.friendKnownBeforeLunch ? `Jordan checked the friend DM and now knows: “${ROUND2.friendDMReveal}”` : `Jordan left the friend DM for later — still no idea what it says.`;
    const groupLine = gs.groupChatStatus === "muted" ? "The group chat got muted — it can’t come back." : gs.groupChatStatus === "later" ? "The group chat was parked for later — it can still come back." : `Group chat: ${gs.groupChatStatus || "not set"}.`;
    const videoLine = gs.videosStatus === "muted" ? "The videos got muted — gone for good." : gs.videosStatus === "later" ? "The videos were parked for later — still recoverable." : `Videos: ${gs.videosStatus || "not set"}.`;
    return shell({ round: "Round 2", phase: "Result", say: `Your attention plan. ${ROUND2.attentionManagementWhy} ${friendLine} ${groupLine} ${videoLine}`, ask: "What did Jordan choose to know now? What got deliberately parked? What can’t interrupt the day anymore?", doNow: "Read the three consequences in order: friend information, group chat, videos. Make the difference between LATER and MUTE explicit before moving on.", studentsDo: "Notice that the sort changed what information Jordan has now, and what can still come back later.", changes: `Friend known before lunch: ${gs.friendKnownBeforeLunch ? "yes" : "no"}. Group chat: ${gs.groupChatStatus}. Videos: ${gs.videosStatus}. Energy: ${ROUND2.attentionManagementGain > 0 ? "+" : ""}${ROUND2.attentionManagementGain} for having a deliberate plan.`, next: { label: "Start Round 3 →", action: "startR3" } });
  }

  if (v === "r3_story") return roundStory(ROUND3, gs, { label: "Investigate →", action: "r3Investigate" }, "This isn’t a ‘best answer’ vote — it’s an information investigation. The class chooses which source Jordan checks first.");
  if (v === "r3_investigate") return renderR3();
  if (v === "r3_followup") {
    const log = [...(gs.decisionLog || [])].reverse().find(x => x.round === 3), first = ROUND3.investigation.sources.find(x => x.id === log?.choiceId);
    const explanation = first?.id === "deadline" ? "The calendar answered WHEN it’s due — tomorrow at 3 — but not WHAT is left or HOW LONG it’ll take." : "The peer gave Jordan useful context, but can’t confirm Jordan’s exact remaining work or how long it’ll take.";
    return shell({ round: "Round 3", phase: "Second check", say: `${explanation} One quick direct check finishes the picture.`, ask: "Which direct source should Jordan use now — the Task Sheet or the Teacher? What will it add?", doNow: "Choose Task Sheet or Teacher. This isn’t correcting a ‘wrong’ first choice — it’s completing the missing information.", studentsDo: "Add the missing workload information to what Jordan already learned.", controls: `<button class="btn" data-fac-action="r3Follow:sheet">TASK SHEET — what is required</button> <button class="btn" data-fac-action="r3Follow:teacher">TEACHER — clarify what remains</button>`, changes: "The follow-up confirms about 60 minutes of assessment work remains. The +1 was already awarded for the useful-but-incomplete first check." });
  }
  if (v === "r3_result") return renderR3Result(gs);

  if (v === "r4_story") return roundStory(ROUND4, gs, { label: "Choose Approach →", action: "r4Choice" }, "Next the class chooses an approach, then builds Jordan’s exact wording. Don’t skip the wording step.");
  if (v === "r4_choice") return choiceButtons("Round 4", "Approach", ROUND4.question, ROUND4.choices, "r4Lock");
  if (v === "r4_dialogue") return renderR4Dialogue(gs);
  if (v === "r4_result") return renderR4Result(gs);

  if (v === "r5_story") return roundStory(ROUND5, gs, { label: "Vote on Work →", action: "r5Choice" }, "Next the class chooses YES / COMPROMISE / NO. Then they spend the resulting 15 / 30 / 60-minute gap on whatever they think matters.");
  if (v === "r5_choice") return choiceButtons("Round 5", "Work decision", ROUND5.question, ROUND5.choices, "r5Lock");
  if (v === "r5_gap") return renderR5Gap(gs);
  if (v === "r5_work_result") return renderR5WorkResult(gs);
  if (v === "r5_life2") return renderLife("life2", ROUND5.lifeEvents, { label: "Build the Evening →", action: "startR6" });

  if (v === "r6_story") return roundStory(ROUND6, gs, { label: "Basketball Decision →", action: "r6Basketball" }, "Decide basketball first — it changes the actual clock. Then the class builds the evening around it; travel and fixed commitments reserve themselves automatically.");
  if (v === "r6_basketball") return renderBasketball(gs);
  if (v === "r6_timeline") return renderTimeline(gs);
  if (v === "r6_result") return shell({ round: "Round 6", phase: "Evening built", say: "This is the evening the class actually managed to build, from the real time available.", ask: "What did tonight’s plan protect? What’s still unresolved going into bed?", doNow: "Review the timeline and remaining assessment/friend/basic-needs state.", studentsDo: "Read the built timeline.", changes: `Current time: ${formatTime(gs.currentTime)}.`, next: { label: "Reality Check →", action: "startR7" } });

  if (v === "r7_reality") return renderReality(gs);
  if (v === "r7_life3") return renderLife3(gs);

  if (v === "r8_story") return roundStory(ROUND8, gs, { label: "Start 10-sec Vote →", action: "r8Choice" }, "Tell students before clicking: ‘This is it. You get 10 seconds and no extra information. Vote on what Jordan does with the message.’ On the next screen, press Start when everyone’s looking.");
  if (v === "r8_choice") return renderR8Vote();
  if (v === "r8_result") return simpleResult(ROUND8, 8, { label: "THE DAY YOU BUILT →", action: "final" });

  if (v === "final_receipt") return renderFinal(gs);
  return `<div class="fac-card">Unknown view: ${v}</div>`;
}

function roundStory(round, gs, next, nextUp = "") {
  const story = typeof round.getStory === "function" ? round.getStory(getRunState(), gs) : round.story;
  const autoWhyText = (round.autoWhy || "of what has happened").replace(/\.\s*$/, "");
  const auto = round.autoEnergy ? ` The Energy Bar has already changed by ${round.autoEnergy > 0 ? "+" : ""}${round.autoEnergy} because ${autoWhyText}.` : "";
  const beat = round.title ? `${round.time} — ${round.title}. ` : "";
  return shell({ round: `Round ${round.round}`, phase: `Story · ${round.time}`, say: `${beat}${story.join(" ")}${auto}`, ask: (round.preTalk || []).join(" ") || "What do you notice?", doNow: "Read the story aloud from this facilitator script so you do not have to rely on the projector. Then ask the discussion prompt and take 2–3 quick observations before opening the mechanic.", studentsDo: "Listen/read, discuss what matters in this moment, then see the decision mechanic.", changes: round.autoEnergy ? `${round.autoEnergy > 0 ? "+" : ""}${round.autoEnergy} automatic energy has already been applied because this event has happened.` : "No automatic energy change in this story.", nextUp, next });
}

function choiceButtons(round, phase, question, choices, prefix) {
  const controls = `<div class="fac-choice-list">${choices.map(c => `<button class="btn" data-fac-action="${prefix}:${c.id}"><strong>${c.short || c.id}</strong> — ${c.label}${c.role ? ` · ${c.role}` : ""}${c.meta ? ` · ${c.meta}` : ""}</button>`).join("")}</div>`;
  let ask = "What does each option protect, discover or leave for later?";
  let doNow = "Read every option aloud from the script. Give students a few seconds to compare them, then use the LIVE CONTROLS to select the class decision. Don’t reveal hidden Energy effects before the choice is locked.";
  let studentsDo = "Compare the options and choose deliberately. They’re not hunting for a single correct answer.";
  let changes = "The locked choice updates Jordan’s state and determines what carries forward.";
  let say = `${question} Here are the options: ${optionScript(choices)}`;
  if (round === "Round 3") {
    ask = "What question could each source actually answer — WHEN it’s due, WHAT is required, or HOW MUCH work is left? What might still be missing after one check?";
    doNow = "Read all four sources and what each is for. Use the LIVE CONTROLS to choose the FIRST source Jordan checks. If it’s useful but incomplete, the program automatically gives one direct follow-up check — don’t treat the first choice as wrong.";
    studentsDo = "Choose the first information source, then notice whether it’s complete enough to actually plan around.";
    changes = "Task Sheet/Teacher can establish the workload directly. Deadline/Peer contribute useful partial information and trigger one follow-up check.";
    say = `${question} ${choices.map(s => `${s.label} — ${s.tellsJordan}${s.stillUnknown ? ` Still unknown: ${s.stillUnknown}` : ""}`).join(" ")}`;
  } else if (round === "Round 4") {
    ask = "Which need does each approach protect first? Which one leaves something waiting, or gives Jordan less separate break time?";
    doNow = "Read all four approaches. Use the LIVE CONTROLS to choose the class approach. Don’t discuss points yet — the next step is building Jordan’s exact words, and the result only reveals once that wording is locked.";
    studentsDo = "Choose an approach first. Then turn it into believable words Jordan could actually say.";
    changes = "This locks the approach only. The exact wording comes next; Energy and the lunch/friend consequence reveal after that step.";
  } else if (round === "Round 5") {
    say = `Here’s the trade. Jordan can get more money, but the money is buying Jordan’s time. Look at the three options before you vote. ${optionScript(choices)}`;
    ask = "What would make the extra 45 minutes actually worth it? What are we probably giving up if we pick 3:45?";
    doNow = "Read YES, COMPROMISE and NO with the paid-time and usable-gap numbers. Use the LIVE CONTROLS to lock the work response. The next screen turns that answer into a real 15 / 30 / 60-minute gap the class has to spend.";
    studentsDo = "Choose the work response knowing it changes both extra pay and how much usable time is left before work.";
    changes = "The work response sets paid minutes and the size of the pre-work gap. The shift’s Energy cost is applied later, once the class has used the gap.";
  }
  return shell({ round, phase, say, ask, doNow, studentsDo, controls, changes, next: null });
}

function simpleResult(round, r, next) {
  const gs = getGameState(), log = [...(gs.decisionLog || [])].reverse().find(x => x.round === r), list = round.choices || round.investigation?.sources || [], c = list.find(x => x.id === log?.choiceId);
  const impact = c?.impact, trade = c?.tradeoff || "Ask the class to name what this protected and what it left for later.";
  const decisionLine = c?.short || c?.label ? `The class chose ${c.short || c.label}.` : "The class’s decision is now locked in.";
  return shell({ round: `Round ${r}`, phase: "Result", say: `${decisionLine} ${c?.why || "The consequence is now part of Jordan’s day."} ${trade}${impact != null ? ` Energy: ${impact > 0 ? "+" : ""}${impact}.` : ""}`, ask: r === 3 ? "What question did this source answer for Jordan? Is there anything Jordan still doesn’t know?" : "What did this choice protect? What did it cost, squeeze or move later? Would another option have protected something different?", doNow: "Walk through the result in this order: what the class chose, what actually happened, what that solved or changed — and only then the Energy number. Take one quick student response before moving on.", studentsDo: "Explain the consequence and trade-off rather than label the choice correct or incorrect.", dontSay: "That was the best/worst choice.", changes: `Energy now ${gs.energy}. The next round uses the state this decision created.`, next });
}

function renderR1Vote() {
  const list = runoffIds ? ROUND1.choices.filter(c => runoffIds.includes(c.id)) : ROUND1.choices;
  const total = list.reduce((n, c) => n + (votes[c.id] || 0), 0), sorted = [...list].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
  const clear = total > 0 && sorted[0] && ((votes[sorted[0].id] || 0) > total / 2);
  const running = timerStarted && !timerExpired && timerLeft > 0;
  const timerLabel = timerExpired ? "TIME STOPPED" : running ? `${timerLeft} SECONDS` : `READY — ${ROUND1.voteTimerSeconds} SECONDS`;
  const winnerId = sorted[0]?.id;
  const counterRows = `<div class="fac-votes fac-votes-counting">${list.map(c => `<div><strong>${c.short}</strong><span>${votes[c.id] || 0}</span><button class="btn sm" onclick="window._fac.vote('${c.id}',1)">+</button><button class="btn sm" onclick="window._fac.vote('${c.id}',-1)">−</button></div>`).join("")}</div>`;
  const lockPanel = timerExpired
    ? `<div class="fac-lock-ready"><strong>TIME STOPPED — NOW LOCK THE CLASS CHOICE</strong><p>Count the raised fingers above, then press the matching button. These buttons are active now.</p><div class="fac-lock-grid">${list.map(c => `<button class="btn ${c.id === winnerId && total > 0 ? "primary" : ""}" data-fac-action="r1Lock:${c.id}">LOCK IN ${c.id} · ${c.short}</button>`).join("")}</div>${total > 0 && !clear && !runoffIds && sorted.length >= 2 ? `<button class="btn fac-runoff-btn" onclick="window._fac.runoff()">Run a top-two runoff instead →</button>` : ""}</div>`
    : `<div class="fac-lock-gate"><strong>LOCK-IN IS NOT AVAILABLE YET</strong><span>${running ? "Let the countdown reach zero. When TIME STOPPED appears, the Lock In buttons will appear here." : "Read all four plans, then press Start. The class gets the full 15 seconds before you lock anything."}</span></div>`;
  const controls = `<div class="fac-timer ${timerExpired ? "stopped" : running ? "running" : "ready"}"><strong>${timerLabel}</strong><button class="btn sm" ${running ? "disabled" : ""} onclick="window._fac.startTimer(15)">${running ? "Voting…" : timerExpired ? "Run 15s again" : "Start 15s vote"}</button></div>${counterRows}${lockPanel}`;
  return shell({ round: "Round 1", phase: runoffIds ? "Top-two runoff" : "15-second vote", say: `${ROUND1.question} Read the plans exactly before starting the clock: ${optionScript(list)}`, ask: "Which plan should the class use for Jordan — and what is that plan choosing to protect?", doNow: "Use the LIVE CONTROLS directly below this guide. Read every visible plan first. Press Start 15s. Say: ‘Choose your option. When you’ve chosen, hold up that many fingers and keep them up while I count.’ Let the clock reach TIME STOPPED. Count with +/−, then use the large LOCK IN button for the class choice. If the class is genuinely split, run the top-two runoff.", studentsDo: "Listen to all options first. Decide during the 15 seconds. When TIME STOPPED appears, hold up the chosen number until votes are counted.", controls, changes: "No Energy is previewed before the choice is locked. Lock-in controls only appear after TIME STOPPED, so there are no dead Lock buttons to confuse the facilitator." });
}

function renderR2Sort() {
  const now = Object.entries(sortAssignments).filter(([, z]) => z === "now").map(([id]) => id);
  const allAssigned = ROUND2.sortingItems.every(i => sortAssignments[i.id]);
  const needsChecked = now.length > 1 && !checkedNowItem;
  const canLock = allAssigned && !needsChecked;
  const reason = !allAssigned ? `Place all ${ROUND2.sortingItems.length} items before locking.` : needsChecked ? "More than one item is NOW. Choose the ONE item Jordan actually checks." : "Ready — the attention plan can be locked.";
  const controls = `${ROUND2.sortingItems.map(i => `<div class="fac-sort-row"><strong>${i.label}</strong>${["now", "later", "mute"].filter(z => z !== "mute" || i.canMute).map(z => `<button class="btn sm ${sortAssignments[i.id] === z ? "primary" : ""}" onclick="window._fac.sort('${i.id}','${z}')">${z.toUpperCase()}</button>`).join("")}</div>`).join("")}${now.length > 1 ? `<div class="fac-card fac-check-one"><strong>More than one item is NOW — properly check ONE:</strong>${now.map(id => `<button class="btn sm ${checkedNowItem === id ? "primary" : ""}" onclick="window._fac.checkNow('${id}')">${ROUND2.sortingItems.find(i => i.id === id).label}</button>`).join(" ")}</div>` : ""}<div class="fac-readiness ${canLock ? "ready" : "blocked"}"><strong>${canLock ? "READY TO LOCK" : "NOT READY TO LOCK"}</strong><span>${reason}</span></div><button class="btn primary" data-fac-action="r2Lock" ${canLock ? "" : "disabled"}>Lock attention plan →</button>`;
  return shell({ round: "Round 2", phase: "NOW / LATER / MUTE", say: `Five minutes. Four things asking for attention: ${ROUND2.sortingItems.map(i => i.label).join("; ")}. If more than one lands on NOW, Jordan can only properly check one of them.`, ask: "What actually deserves attention now, what can wait, and what isn’t worth carrying today? If several are NOW, which ONE gets properly checked?", doNow: "Use the LIVE CONTROLS directly below this guide. Place every item. If multiple land on NOW, choose the single item Jordan actually checks. The Lock button stays visible and tells you exactly what’s missing until the plan is valid.", studentsDo: "Build one deliberate attention plan together, then commit it.", controls, changes: "A committed plan gives +2 regardless of which app was chosen. Muted items cannot return later." });
}

function renderR3() { return choiceButtons("Round 3", "Information investigation", ROUND3.question, ROUND3.investigation.sources, "r3Lock"); }

function renderR3Result(gs) {
  const log = [...(gs.decisionLog || [])].reverse().find(x => x.round === 3), c = ROUND3.investigation.sources.find(x => x.id === log?.choiceId), follow = log?.summary || "";
  if (c?.direct) return shell({ round: "Round 3", phase: "Result", say: `The class checked the ${c.label}. ${c.why} ${c.tradeoff} Energy: +2.`, ask: "What question did this source answer for Jordan? How does knowing there’s about 60 minutes left change the next decisions?", doNow: "Spell out what was actually gained: what remains, and roughly how long it’ll take. Then take one response about how reliable information changes planning.", studentsDo: "Notice that the source didn’t solve the assessment — it made the workload clear enough to plan around.", dontSay: "This was the only correct source.", changes: `Assessment remaining: ${gs.assessmentRemaining} minutes. Energy now ${gs.energy}.`, next: { label: "Start Round 4 →", action: "startR4" } });
  const first = c?.id === "deadline" ? "The class checked the calendar first — it confirmed WHEN it’s due, tomorrow at 3." : "The class checked a peer first — useful context about the task.";
  const second = follow.includes("teacher") ? "The Teacher then clarified exactly what remains." : "The Task Sheet then showed exactly what is required.";
  return shell({ round: "Round 3", phase: "Result", say: `${first} Useful, but not enough to plan around. ${second} Together, the two checks confirm about 60 minutes of assessment work remains. Energy for the whole two-step check: +1.`, ask: "What did the first source tell Jordan, and what did the second one add? Why isn’t that the same as calling the first choice ‘wrong’?", doNow: "Walk through the two-step chain explicitly: FIRST source = useful partial information. SECOND source = the exact workload. Then say that Jordan now has enough information to plan — even though the work itself is still there.", studentsDo: "Explain how different sources answer different questions and combine into a clearer picture.", dontSay: "Peer/Deadline was a bad choice.", changes: `Assessment remaining: ${gs.assessmentRemaining} minutes. Energy now ${gs.energy}.`, next: { label: "Start Round 4 →", action: "startR4" } });
}

function renderR4Dialogue(gs) {
  const log = [...(gs.decisionLog || [])].reverse().find(x => x.round === 4 && x.choiceId), c = ROUND4.choices.find(x => x.id === log?.choiceId);
  const controls = `<div class="fac-choice-list">${c.scripts.map((script, i) => `<button class="btn" data-fac-action="r4Script:${i}">“${script}”</button>`).join("")}<div class="fac-class-wording"><label for="r4-class-wording"><strong>OR USE THE CLASS’S OWN WORDING</strong></label><input id="r4-class-wording" type="text" maxlength="180" placeholder="Type the class wording here so it appears in the result"><button class="btn" data-fac-action="r4ScriptClass">Use this class wording</button></div></div>`;
  return shell({ round: "Round 4", phase: "Build Jordan’s exact response", say: `The approach is locked, but the result hasn’t been revealed yet. People don’t speak in strategy labels — what would Jordan actually say? Read the two suggested lines: ${c.scripts.map(x => `“${x}”`).join(" OR ")}. The class can also build its own wording, as long as it keeps the same approach.`, ask: "Which wording sounds believable for Jordan, and still does what the class chose?", doNow: "Use the LIVE CONTROLS. Read both suggested lines. Choose one, or type the class’s wording into the box and press Use this class wording. The selected line appears on the result screen. Only then does the lunch/friend consequence and Energy change apply.", studentsDo: "Choose or build Jordan’s actual sentence, not just the idea behind it.", controls, changes: "The approach is already fixed. This step records the exact words and then reveals the consequence." });
}

function renderR4Result(gs) {
  const log = [...(gs.decisionLog || [])].reverse().find(x => x.round === 4 && x.choiceId), c = ROUND4.choices.find(x => x.id === log?.choiceId), said = log?.summary || "Wording chosen by the class";
  return shell({ round: "Round 4", phase: "Result", say: `That’s what your class said. Jordan said: “${escapeHtml(said)}” ${c?.why || ""} ${c?.tradeoff || ""} Energy: ${c?.impact > 0 ? "+" : ""}${c?.impact || 0}.`, ask: "Did the wording actually match the approach the class chose? What did this protect, and what’s now resolved or still pending?", doNow: "Read the exact line the class selected, then explain the consequence in order: lunch, friend status, then the Energy change last. Take one quick response about the trade-off.", studentsDo: "Connect the words Jordan used to the practical consequence. Notice whether food or the friend conversation is still in play.", dontSay: "That was the nicest/best answer.", changes: `Lunch: ${gs.lunchHistory}. Friend: ${gs.friendStatus}. Hunger now: ${gs.currentHunger ? "yes" : "no"}. Energy now ${gs.energy}.`, next: { label: "Start Round 5 →", action: "startR5" } });
}

function renderR5Gap(gs) {
  const work = ROUND5.choices.find(c => c.id === gs.workChoice);
  const items = ROUND5.gapActions.map(a => ({ ...a, ...round5GapAvailability(gs, a) }));
  const unavailable = items.filter(a => !a.ok), selected = (gs.workGapActions || []);
  const controls = `<div class="fac-choice-list">${items.map(a => `<div class="fac-action-row ${a.ok ? "available" : "unavailable"}"><button class="btn" ${a.ok ? `data-fac-action="r5Gap:${a.id}"` : "disabled"}>${a.label} · ${a.impact > 0 ? "+" : ""}${a.impact}</button><small><strong>${a.description || ""}</strong><br>${a.ok ? `Available — uses ${a.duration} of ${gs.workGapRemaining} remaining minutes.` : `Why unavailable: ${a.reason}`}</small></div>`).join("")}</div><div class="fac-mini-log"><strong>Chosen so far</strong><br>${selected.map(a => `${a.label} (${a.duration}m)`).join(" · ") || "Nothing yet"}</div><button class="btn" data-fac-action="_undo" ${selected.length ? "" : "disabled"}>Undo last gap action</button> <button class="btn primary" data-fac-action="r5FinishGap">Lock gap with ${gs.workGapRemaining} min left open →</button>`;
  return shell({ round: "Round 5", phase: "Use the gap", say: `We’ve made the work decision. Now we live with it. We kept ${gs.workGapTotal} minutes. You do not have to fill every second — but whatever we leave can follow Jordan into tonight. ${gs.workGapRemaining} minutes remain right now.`, ask: "What feels worth using these minutes for? What would make tonight easier? What can we deliberately leave?", doNow: "Use the LIVE CONTROLS directly below this guide. Add one action at a time. Read the duration before selecting it, then announce the new remaining time. Disabled actions are intentional — read the reason shown underneath. The Undo button only activates after a gap action has actually been added. The class may stop and deliberately leave time open.", studentsDo: "Spend a real limited block of time. Some actions are unavailable because a need was already handled earlier; others because there’s simply not enough time left.", controls, ifNeeded: unavailable.length ? ["If students ask why something is greyed out, read the reason directly. Availability comes from earlier choices and the remaining clock — not a hidden ‘good/bad’ rule."] : [], changes: `This path currently has ${gs.assessmentRemaining} assessment minutes left; friend ${gs.friendStatus || "not pending"}; food need ${gs.currentHunger ? "yes" : "no"}. Work itself applies ${work?.workImpact || 0} Energy when the gap is locked.` });
}

function renderR5WorkResult(gs) {
  const work = ROUND5.choices.find(c => c.id === gs.workChoice);
  const hungerPenalty = gs.currentHunger ? -3 : 0;
  const total = (work?.workImpact || 0) + hungerPenalty;
  const hungerLine = gs.currentHunger ? " Jordan also started the shift still hungry — that missed-lunch need followed straight in, adding −3." : " Jordan started the shift without a carried-over hunger penalty.";
  return shell({ round: "Round 5", phase: "Work shift result", say: `The class chose ${work?.short || "the work response"}. ${work?.why || "The work choice now plays out."}${hungerLine} Look at how much of this came from earlier choices. Shift Energy: ${work?.workImpact || 0}. Total shift-related change: ${total}.`, ask: "What did the extra paid time actually cost us? What did the gap manage to save? What’s still following Jordan home?", doNow: "Read the result in order: what the class chose, what carried in from lunch and the gap, then the shift’s own Energy cost last. Take one response about what’s still unresolved after work.", studentsDo: "Connect the work result back to the earlier day instead of treating it as an isolated score.", changes: `Energy now ${gs.energy}. Extra paid work: ${gs.extraPaidMinutes || 0} min. Pre-work gap left open: ${gs.workGapRemaining || 0} min. Assessment left: ${gs.assessmentRemaining} min. Friend: ${gs.friendStatus || "not pending"}. Food need: ${gs.currentHunger ? "still hungry" : "not currently hungry"}.`, next: { label: "Life Happens after work →", action: "r5Life2" } });
}

function renderLife(slot, events, next) {
  const gs = getGameState(), rs = getRunState(), id = rs[slot], e = events.find(x => x.id === id), applied = gs.lifeEffectsApplied?.[slot];
  const controls = !applied && e ? `<button class="btn primary" data-fac-action="apply:${slot}">Reveal / apply this consequence →</button>` : "";
  const say = !applied
    ? `We made a reasonable plan with the information Jordan had. Now something changes that Jordan didn’t choose.${e ? ` ${e.title}. ${e.text}` : ""}`
    : (e ? `${e.title}. ${e.text}` : "Life happens.");
  const ask = applied ? "What changed? Does the original plan still work?" : "So — does our plan still work? What changed? What can Jordan still control?";
  return shell({ round: slot === "life1" ? "Round 1" : slot === "life2" ? "Round 5" : "Round 7", phase: "Life Happens", say, ask, doNow: applied ? "The event is already applied. Briefly name the changed state before continuing." : "Read the event exactly as shown. Take one quick response about what changes, then use the LIVE CONTROL directly below this guide to apply it once. Don’t reveal a hidden Energy number before the student screen does.", studentsDo: "Adapt the plan to an event Jordan didn’t choose.", controls, changes: e?.why || "The day changes.", next: applied ? next : null });
}

function renderBasketball(gs) {
  const choices = basketballChoices(gs), collision = gs.homeTime === 18 * 60 + 50;
  const controls = `<div class="fac-primary-decision">${choices.map((c, i) => `<button type="button" class="btn ${i === 0 ? "primary" : ""}" data-fac-action="basket:${c.id}">${c.label}</button>`).join("")}</div>`;
  return shell({ round: "Round 6", phase: "Basketball decision", say: `${collision ? "Work ran late, so Jordan can’t physically make the normal 7:00 start." : "Jordan’s home, and basketball is still something Jordan actually wants tonight."} The available choices are: ${choices.map(c => c.label).join(" or ")}. This gets decided before the rest of the evening, because it changes the actual clock.`, ask: "Does keeping basketball protect for Jordan? What does skipping it actually create — more time, or more Energy?", doNow: "Use the LIVE CONTROLS directly below this guide. These are the real facilitator buttons. Once you choose, the evening windows immediately recalculate. If SKIP is selected, basketball plus travel disappear and that time becomes usable evening time.", studentsDo: "Choose whether basketball stays in Jordan’s evening. The next screen rebuilds the clock around that decision.", controls, changes: "ATTEND / JOIN LATE adds +1 immediate Energy because it’s something Jordan wants. SKIP adds 0 Energy but releases the basketball and travel time. The timeline rebuilds after the click." });
}

function renderTimeline(gs) {
  const avs = ROUND6.actions.map(a => ({ ...a, ...actionAvailability(gs, a) }));
  const choiceLabel = { attend: "ATTEND BASKETBALL", late: "JOIN LATE", skip: "SKIP BASKETBALL" }[gs.basketballStatus] || "basketball not decided";
  const reflow = gs.basketballStatus === "skip" ? "Basketball and travel have been removed. The evening’s been recalculated as one open block from home until 10:00 PM." : `The ${choiceLabel} decision is now fixed into the clock. Travel and basketball time can’t be used for anything else.`;
  const placed = (gs.eveningActions || []).slice().sort((a, b) => a.start - b.start || a.end - b.end);
  const controls = `<div class="fac-choice-list">${avs.map(a => `<div class="fac-action-row ${a.ok ? "available" : "unavailable"}"><button class="btn" ${a.ok ? `data-fac-action="evening:${a.id}"` : "disabled"}>${a.label} · ${a.duration}m · ${a.impact > 0 ? "+" : ""}${a.impact}</button><small><strong>${a.description || ""}</strong><br>${a.ok ? a.reason : `Why unavailable: ${a.reason}`}</small></div>`).join("")}</div><div class="fac-mini-log"><strong>Placed on the clock</strong><br>${placed.map(a => `${formatTime(a.start)}–${formatTime(a.end)} ${a.label}`).join("<br>") || "No flexible actions placed yet"}</div><button class="btn" data-fac-action="_undo" ${placed.length ? "" : "disabled"}>Undo last evening action</button> <button class="btn primary" data-fac-action="finishEvening">Lock evening and move to 10:00 PM →</button>`;
  return shell({ round: "Round 6", phase: "Real-clock evening", say: `Now we build it. The class chose ${choiceLabel}. ${reflow} Don’t tell me what Jordan should do in an ideal world — tell me what actually fits. Planning stops at 10:00 PM; the last 30 minutes stays back for the Reality Check and getting ready for bed.`, ask: "What earns a place in the time before 10:00? As the windows shrink, what is the class willing to leave unresolved?", doNow: "Use the LIVE CONTROLS directly below this guide. Add one action at a time. After each click, read back where it landed on the real clock — ‘okay, that block is gone, what remains?’ Read the reason on unavailable actions out loud (‘there’s the collision — that needs 20, you’ve got 15 — what moves?’). Assessment can repeat while a 20-minute slot still fits. Undo only activates once an evening action exists.", studentsDo: "Build a real schedule. Fixed commitments stay fixed; flexible actions have to physically fit. Not everything is guaranteed to fit if earlier choices left more for tonight.", controls, changes: `Basketball: ${choiceLabel}. Planning window ends 10:00 PM. Assessment left ${gs.assessmentRemaining}m · friend ${gs.friendStatus || "not pending"} · dinner ${gs.dinnerStatus} · tomorrow basics ${gs.tomorrowBasics}.` });
}

function renderReality(gs) {
  const rs = getRunState();
  const parked = [gs.groupChatStatus, gs.videosStatus].some(x => x === "later"), basicsPending = gs.tomorrowBasics !== "done" && gs.tomorrowBasicsDecision == null, coreReady = gs.assessmentRemaining === 0 && !basicsPending, lifeChecked = rs.life3 != null, ready = coreReady && lifeChecked && !parked, free = Math.max(0, (gs.targetBedtime || 1350) - (gs.currentTime || 0));
  let controls = `<div class="reality-status"><strong>${formatTime(gs.currentTime)}</strong> now · target bed ${formatTime(gs.targetBedtime || 1350)} · ${free} min free before bed · Tomorrow Load ${gs.tomorrowLoad || 0} min</div>`;
  if (gs.assessmentRemaining > 0) { const rem = gs.assessmentRemaining; controls += `<div class="reality-item"><strong>Assessment · ${rem} min left</strong><button class="btn sm" data-fac-action="r7:assess_finish">Finish tonight</button>${rem > 20 ? `<button class="btn sm" data-fac-action="r7:assess_20">Do 20 tonight</button>` : ""}<button class="btn sm" data-fac-action="r7:assess_tomorrow">Move to tomorrow</button></div>`; }
  else if (gs.assessmentTomorrow > 0) { controls += `<div class="reality-item"><strong>Assessment · ${gs.assessmentTomorrow} min tomorrow</strong>${gs.supportPlan !== "planned" ? `<button class="btn sm" data-fac-action="r7:support">Plan support</button>` : "Support planned ✓"}</div>`; }
  if (basicsPending) controls += `<div class="reality-item"><strong>Tomorrow basics</strong><button class="btn sm" data-fac-action="r7:basics_done">Pack + charge · 10m</button><button class="btn sm" data-fac-action="r7:basics_partial">Essentials only · 5m</button><button class="btn sm" data-fac-action="r7:basics_morning">Morning</button></div>`;
  if (coreReady && !lifeChecked) controls += `<div class="reality-item"><strong>Late interruption check</strong><small>Before the last parked-phone decision is closed, see whether anything still possible interrupts Jordan's plan. This is where an active group chat can genuinely return.</small><button class="btn primary" data-fac-action="life3">Check what happens →</button></div>`;
  else if (lifeChecked && parked) controls += `<div class="reality-item"><strong>Parked phone stuff</strong><button class="btn sm" data-fac-action="r7:phone_check">Check · 5m · −1</button><button class="btn sm" data-fac-action="r7:phone_tomorrow">Leave to tomorrow</button></div>`;
  if (ready) controls += `<div class="reality-empty"><strong>NOTHING URGENT IS LEFT.</strong><small>No required decisions are left tonight. Any support planning shown above is optional.</small></div><button class="btn primary" data-fac-action="startR8">Go to Bed →</button>`;
  const stageNote = coreReady && !lifeChecked ? " Core tasks are settled; check the late interruption before closing any parked phone decision." : lifeChecked && parked ? " The late interruption has been dealt with; now close the remaining parked-phone decision." : "";
  return shell({ round: "Round 7", phase: "Reality Check", say: `We’re not adding new jobs. We’re only looking at what is genuinely still unfinished. Read the clock before you decide anything: it’s ${formatTime(gs.currentTime)} now, target bed is ${formatTime(gs.targetBedtime || 1350)}, ${free} minutes free before bed, Tomorrow Load ${gs.tomorrowLoad || 0} minutes.${stageNote}`, ask: (ROUND7.askBeforeChoices || []).join(" "), doNow: "Use the LIVE CONTROLS directly below this guide. Read the three live numbers first: current time, free before bed, Tomorrow Load. Work only through cards that actually appear. After every decision, the list rebuilds from what’s still unresolved. When the late interruption check appears, run it before closing the final parked-phone decision. If nothing urgent remains, don’t invent another task.", studentsDo: "Choose tonight versus tomorrow from the real unresolved queue. A late interruption can occur before the final parked-phone decision is closed.", controls, changes: "Time before 10:30 is used first. Only excess pushes bedtime later. Life Happens 3 is evaluated only from events still possible on this exact path." });
}

function renderLife3(gs) {
  const rs = getRunState(), e = ROUND7.lifeEvents.find(x => x.id === rs.life3), parked = [gs.groupChatStatus, gs.videosStatus].some(x => x === "later"), next = parked ? { label: "Return to Reality Check →", action: "returnR7" } : { label: "Go to Bed →", action: "startR8" };
  if (!e) return shell({ round: "Round 7", phase: "Life Happens", say: "No eligible late event exists on this path — nothing else interrupts tonight.", ask: "What does it mean that not every run gets another complication?", doNow: parked ? "Return to the Reality Check and close the parked-phone decision." : "Continue to bed.", studentsDo: "Notice that the story only brings back things that are still genuinely possible.", changes: "Nothing changes.", next });
  return renderLife("life3", ROUND7.lifeEvents, next);
}

function renderR8Vote() {
  const total = ROUND8.choices.reduce((n, c) => n + (votes[c.id] || 0), 0), running = timerStarted && !timerExpired && timerLeft > 0;
  const label = timerExpired ? "TIME STOPPED" : running ? `${timerLeft} SECONDS` : `READY — ${ROUND8.voteTimerSeconds} SECONDS`;
  const winner = [...ROUND8.choices].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))[0];
  const counterRows = `<div class="fac-votes fac-votes-counting">${ROUND8.choices.map(c => `<div><strong>${c.short}</strong><span>${votes[c.id] || 0}</span><button class="btn sm" onclick="window._fac.vote('${c.id}',1)">+</button><button class="btn sm" onclick="window._fac.vote('${c.id}',-1)">−</button></div>`).join("")}</div>`;
  const lockPanel = timerExpired ? `<div class="fac-lock-ready"><strong>TIME STOPPED — NOW LOCK THE CLASS CHOICE</strong><p>Count the votes, then press the matching active button.</p><div class="fac-lock-grid">${ROUND8.choices.map(c => `<button class="btn ${c.id === winner?.id && total > 0 ? "primary" : ""}" data-fac-action="r8Lock:${c.id}">LOCK IN · ${c.short}</button>`).join("")}</div></div>` : `<div class="fac-lock-gate"><strong>LOCK-IN IS NOT AVAILABLE YET</strong><span>${running ? "Wait for TIME STOPPED. The Lock In buttons will appear automatically." : "Read all four responses, then start the 10-second vote."}</span></div>`;
  const controls = `<div class="fac-timer ${timerExpired ? "stopped" : running ? "running" : "ready"}"><strong>${label}</strong><button class="btn sm" ${running ? "disabled" : ""} onclick="window._fac.startTimer(10)">${running ? "Voting…" : timerExpired ? "Run 10s again" : "Start 10s vote"}</button></div>${counterRows}${lockPanel}`;
  return shell({ round: "Round 8", phase: "10-second class vote", say: `This is it. You don’t get to ask what the message is about. You don’t get another clue. Decide with what Jordan actually has. Read the four responses exactly: ${optionScript(ROUND8.choices)}`, ask: "What are you assuming? What are you trying to protect?", doNow: "Use the LIVE CONTROLS directly below this guide. Read all four responses first. Press Start 10s and say nothing else. Let it reach TIME STOPPED. Count votes, then use the large LOCK IN button. If students demand more information, that’s the point — Jordan doesn’t have it either.", studentsDo: "Listen to all four choices, decide during the 10 seconds, then hold the vote when time stops.", controls, changes: "The selected response changes only the final minutes and immediate Energy. No option is framed as correct." });
}

function renderFinal(gs) {
  const rows = FINAL.getReceipt(getRunState(), gs).map(x => `<div class="receipt-row"><span>${x.label}</span><strong>${x.value}</strong></div>`).join("");
  return shell({ round: "Final", phase: "The Day You Built", say: `Don’t decide whether this was a ‘good day’ yet. Look at the whole thing — Energy, Tomorrow Load, sleep, work, people, and the things Jordan values. ${FINAL.closing} ${FINAL.closingScript}`, ask: "Would you run this day again? If you could change ONE decision, which one — and what consequence would that new decision create? At the start, we asked what self-care means. Would you change your answer now?", doNow: "Read the receipt first without praising or criticising it. Compare Energy, bedtime, Tomorrow Load, paid work, basketball, people and basics together. Ask the reflection questions. For the one-change question, always follow with: ‘What consequence would that change create?’ Then return to the opening self-care answers — if students still say self-care just means resting, remind them rest can be part of it, but today also showed boundaries, information, food, planning, asking for help, priorities, responsibilities, values, and changing the plan when life changed.", studentsDo: "Read the receipt as a pattern of trade-offs, not a score. Notice that high Energy isn’t automatically a better day and low Energy isn’t automatically a worse one, then revise the class definition of self-care.", extra: rows, changes: "Return to the class’s opening definition of self-care and connect it to the full pattern, not one number." });
}
