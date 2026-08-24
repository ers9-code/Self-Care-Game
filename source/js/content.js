/* =====================================================================
 * js/content.js
 *
 * Authoritative classroom content for Energy Bar Challenge — Jordan's Day.
 * Story text, choice copy, Energy values, source/follow-up tables.
 * Mirrors MASTER_BUILD_SPEC_LOCKED.md exactly for wording, sequence and
 * Energy values. Framing never labels a choice "correct", "healthy",
 * "best" or "winning" — every result explains a trade-off instead.
 *
 * Each ROUNDn object also owns the small per-choice state-mutation
 * recipes that are tightly coupled to its own copy (buildStateMutation/
 * stateMutations), so the effect of a line of dialogue can never drift
 * out of sync with the line itself. Cross-round engine logic (timeline,
 * gap-spending availability, round transitions) lives in engine.js.
 *
 * PRESENTATION LAYER (added on top of the locked mechanics, this pass):
 * every round also carries facilitator-only teaching-support content —
 * stuckPrompts / suggestedAnswers / listenFor / misconception /
 * selfCareLink — consumed by render-facilitator.js's GAME MASTER
 * console hierarchy. None of this changes what a choice does; it is
 * read by the facilitator, never shown on the student projector.
 * ===================================================================== */

const SUGGESTED_ANSWERS_CLOSE = "All of these can be reasonable. The point is to notice what each one protects and what it pushes later.";

const OPENING = {
  brainstorm: {
    heading: "What is self-care?",
    prompt: "Before we start, when you hear the words self-care, what do you think it actually means?",
    sub: "Quick ideas only. No personal examples are needed — we’ll come back to this at the end."
  },
  meetJordan: {
    heading: "Meet Jordan",
    body: [
      "Jordan is in Year 10.",
      "There is a school assessment in progress. Jordan thinks there is still time.",
      "Jordan works from 4:30–6:00 today, and extra hours would be useful.",
      "Basketball is tonight — something Jordan actually wants to do."
    ],
    note: "Your job: get Jordan through one ordinary day. Not perfectly. Deliberately."
  },
  energyBar: {
    heading: "Jordan starts at 100 energy",
    body: [
      "The Energy Bar shows the immediate effect of what is happening. It is not a wellbeing score and it is not grading decisions right or wrong.",
      "A useful decision can still take energy. Something easier right now can create another problem later.",
      "Sometimes Jordan gets a choice. Sometimes life just happens. There can be more than one reasonable answer."
    ],
    note: "You’re controlling Jordan today. Nobody needs to tell us anything personal."
  }
};

const ROUND1 = {
  round: 1, time: "7:10 AM", part: "Morning", title: "ALREADY BEHIND",
  story: [
    "Jordan planned to be asleep by 10:30, but messaging and videos pushed it past midnight.",
    "The alarm went at 6:45. Jordan snoozed twice.",
    "It is now 7:10. Jordan has not eaten and has about 35 minutes to leave."
  ],
  autoEnergy: -12, autoWhy: "Less sleep and rushing have already reduced Jordan’s usable capacity.",
  preTalk: ["What matters most in the next 35 minutes?", "What can reasonably be left out today?"],
  question: "What matters most in the next 35 minutes?", voteTimerSeconds: 15,
  voteAnticipation: "YOU’RE ABOUT TO SEE FOUR PLANS. 15 SECONDS. WHEN TIME STOPS, HOLD UP 1, 2, 3 OR 4 FINGERS.",
  choices: [
    { id: "1", short: "TEN MORE MINUTES", label: "Sleep 10 more minutes, get dressed, grab food to take.", impact: 1,
      why: "A little more rest while still covering the basics.",
      tradeoff: "Protects a little extra rest and still covers food. The trade-off is a tighter departure window and less room if anything else goes wrong." },
    { id: "2", short: "BASICS FIRST", label: "Eat something quick, get dressed, leave non-essential things.", impact: 2,
      why: "Jordan simplifies the morning and protects two basics: food and getting out the door.",
      tradeoff: "Protects food and getting out the door with less rushing. The trade-off is that non-essential things, including messages or a shower, may need to wait." },
    { id: "3", short: "SHOWER + TAKE FOOD", label: "Quick shower, get dressed, take food for later.", impact: 1,
      why: "Jordan chooses feeling awake and clean while still taking food.",
      tradeoff: "Protects feeling ready for the day and still covers food. The trade-off is that the food is delayed and there is still very little spare time." },
    { id: "4", short: "TRY TO FIT IT ALL", label: "Shower, food, packing and messages.", impact: -1,
      why: "Each task is reasonable, but fitting everything into a rushed morning creates more pressure.",
      tradeoff: "Protects doing everything Jordan wants to do. The trade-off is almost no buffer, more rushing and more pressure if one task takes longer than expected." }
  ],
  stateMutations: Object.fromEntries(["1", "2", "3", "4"].map(id => [id, (d) => {
    const c = ROUND1.choices.find(x => x.id === id);
    d.energy = clampEnergy(d.energy + c.impact);
    d.breakfastHistory = "covered";
    d.currentHunger = false;
  }])),
  lifeEvents: [
    { id: "r1_lift", title: "Offered a lift", text: "Jordan was planning to catch the bus. Someone at home is heading that way and offers Jordan a lift instead.", impact: 3, why: "One practical demand disappears." },
    { id: "r1_laptop", title: "Forgot the laptop", text: "At the door, Jordan realises the school laptop is still in the bedroom.", impact: -3, why: "A small mistake adds another task and more rushing." },
    { id: "r1_snack", title: "Found a snack", text: "Jordan finds an easy snack to throw in the bag for later.", impact: 1, why: "A small future problem is removed." }
  ],
  stuckPrompts: [
    { when: "IF THEY IMMEDIATELY SAY “BASICS FIRST”", lines: ["What is Basics First protecting?", "What does it leave less room for if something else goes wrong this morning?"] },
    { when: "IF THE CLASS CANNOT DECIDE", lines: ["Imagine Jordan genuinely only has time for ONE thing before leaving. Which plan gets closest to that?"] },
    { when: "IF THEY TRY TO DO EVERYTHING (“TRY TO FIT IT ALL”)", lines: ["Check the clock — 35 minutes total. Can showering, eating, packing and messages all actually fit?"] },
    { when: "IF NOBODY WANTS TO LEAVE ANYTHING OUT", lines: ["Is doing everything the same as doing everything well this morning?"] }
  ],
  suggestedAnswers: [
    "“Basics First, because food and getting out the door matter most right now.”",
    "“Ten More Minutes, because Jordan is genuinely exhausted and sleep matters too.”",
    "“Shower and Take Food, because feeling ready for the day matters.”",
    "“Try to Fit It All, because Jordan shouldn’t have to give anything up.”"
  ],
  listenFor: [
    "Urgent vs important — is a task time-critical, or does it just feel urgent?",
    "Capacity — poor sleep already lowered what Jordan has to work with before any choice is made.",
    "Trade-offs, not right answers — every plan protects something and leaves something else thinner.",
    "Realistic planning — 35 minutes is a hard limit, not a suggestion."
  ],
  misconception: { claim: "The highest Energy choice is obviously best.", response: "Maybe — but check what it leaves behind. Energy tells us Jordan’s immediate capacity. It doesn’t tell us whether tomorrow is now overloaded, or whether something else got squeezed out." },
  selfCareLink: "Self-care can include basics and realistic expectations when capacity is already low."
};

const ROUND2 = {
  round: 2, time: "8:45 AM", part: "Arrival", title: "FIVE MINUTES BEFORE CLASS",
  story: [
    "Jordan arrives with five minutes before class.",
    "The phone has a close-friend DM with the preview hidden, a school-app timetable update, 27 Year 10 group-chat messages and three videos marked ‘WATCH THIS’."
  ],
  autoEnergy: -4, autoWhy: "Several things compete for attention at once.",
  preTalk: ["What deserves attention now, what can wait, and what is not worth carrying today?"],
  question: "WHAT NEEDS YOUR ATTENTION NOW?",
  multipleNowPrompt: "YOU ONLY HAVE TIME TO PROPERLY CHECK ONE. WHICH ONE?",
  sortingItems: [
    { id: "item_dm", label: "Close friend DM — preview hidden", canNow: true, canLater: true, canMute: false },
    { id: "item_school", label: "School app — timetable update", canNow: true, canLater: true, canMute: false },
    { id: "item_groupchat", label: "Year 10 group chat — 27 messages", canNow: true, canLater: true, canMute: true },
    { id: "item_videos", label: "3 videos — WATCH THIS", canNow: true, canLater: true, canMute: true }
  ],
  friendDMReveal: "Can I talk to you at lunch? It’s about Sam.",
  attentionManagementGain: 2,
  attentionManagementWhy: "The +2 comes from committing to a deliberate attention plan — not from choosing the ‘right’ app.",
  buildStateMutation(assignments, checkedNowItem) {
    return d => {
      d.energy = clampEnergy(d.energy + 2);
      d.friendKnownBeforeLunch = checkedNowItem === "item_dm";
      d.friendDMStatus = d.friendKnownBeforeLunch ? "checked" : "deferred";
      const normalize = (item) => {
        const zone = assignments[item];
        if (!zone) return null;
        if (zone === "mute") return "muted";
        if (zone === "now") return checkedNowItem === item ? "done" : "later";
        return zone;
      };
      d.groupChatStatus = normalize("item_groupchat");
      d.videosStatus = normalize("item_videos");
      d.friendStatus = null;
    };
  },
  stuckPrompts: [
    { when: "IF EVERYTHING GETS PUT INTO NOW", lines: ["Jordan only has five minutes. What actually happens if all four get checked properly right now?", "If everything is urgent, is anything actually urgent?"] },
    { when: "IF THEY CANNOT AGREE ON THE ONE ITEM TO CHECK", lines: ["Which one, left unchecked, would bother Jordan the most for the rest of the morning?"] },
    { when: "IF THEY WANT TO MUTE THE FRIEND DM", lines: ["The friend DM cannot be muted — only NOW or LATER. Why might the game not allow that option here?"] },
    { when: "IF THEY TREAT MUTE AS “DELETING” SOMETHING IMPORTANT", lines: ["What is the actual difference between muting the group chat and muting a person?"] }
  ],
  suggestedAnswers: [
    "“Check the friend DM now — a person is waiting.”",
    "“Check the school app now — it might change Jordan’s whole day.”",
    "“Mute the videos — they can’t possibly matter more than class.”",
    "“Later the group chat — 27 messages, but nothing sounds urgent.”"
  ],
  listenFor: [
    "Urgent vs important — a full inbox is not the same as an urgent inbox.",
    "Attention as a limited resource, not an infinite one.",
    "The difference between LATER (can still return) and MUTE (gone for good).",
    "Deliberate postponing vs avoidance — choosing not to check something can be an active decision."
  ],
  misconception: { claim: "Checking everything is the responsible thing to do.", response: "Checking everything properly in five minutes isn’t actually possible. The +2 here rewards making a deliberate plan, not clearing every notification." },
  selfCareLink: "Self-care can include deciding what deserves attention now and what does not."
};

const ROUND3 = {
  round: 3, time: "10:25 AM", part: "School", title: "THE DUE DATE SHOCK",
  story: ["The teacher says: ‘Just a reminder — your assessment is due tomorrow at 3 PM.’", "Jordan thought it was due Friday."],
  autoEnergy: -8, autoWhy: "The surprise creates uncertainty and time pressure.",
  preTalk: ["What information would actually help Jordan decide what to do next?"], question: "WHAT DOES JORDAN NEED TO KNOW FIRST?",
  investigation: {
    sources: [
      { id: "sheet", label: "TASK SHEET", role: "Requirements + criteria", impact: 2, direct: true,
        tellsJordan: "Exactly what is required and how much is genuinely left: one analysis section, a reference check and a final proofread — about 60 minutes.",
        why: "The task sheet shows Jordan still needs one analysis section, a reference check and a final proofread. Together that is about 60 minutes of work — no second source is needed.",
        tradeoff: "This answers WHAT is required and HOW MUCH is left. The assessment is not solved; Jordan now has reliable information to plan the remaining hour." },
      { id: "teacher", label: "TEACHER", role: "Clarify what remains", impact: 2, direct: true,
        tellsJordan: "A direct, current check on progress: one analysis section, a reference check and a final proofread still needed — about 60 minutes in total.",
        why: "The teacher checks Jordan’s progress and confirms one analysis section, a reference check and a final proofread are still needed — about 60 minutes in total.",
        tradeoff: "This gives Jordan a direct answer about WHAT remains and HOW MUCH work is left. Jordan still has to decide where that hour fits into the rest of the day." },
      { id: "deadline", label: "DEADLINE / CALENDAR", role: "Timing + due point", impact: 1, direct: false,
        tellsJordan: "WHEN it is due: tomorrow at 3 PM.",
        stillUnknown: "Exactly WHAT is left to do and HOW LONG it will take.",
        why: "The deadline/calendar confirms WHEN it is due: tomorrow at 3 PM. It does not tell Jordan exactly WHAT is left or HOW LONG it will take, so a quick Task Sheet or Teacher check is still needed.",
        tradeoff: "Useful information, but it answers only the timing question. Jordan needs one more source before the workload is clear." },
      { id: "peer", label: "PEER", role: "Context + what they noticed", impact: 1, direct: false,
        tellsJordan: "General context — what a classmate noticed or thinks is required.",
        stillUnknown: "Jordan’s own exact remaining work and how long it will actually take.",
        why: "A peer can give useful context about what they noticed or what they think is required, but cannot confirm Jordan’s exact remaining work. Jordan still needs the Task Sheet or Teacher.",
        tradeoff: "Useful context, but not enough to plan Jordan’s exact workload. A second check turns an estimate into reliable information." }
    ]
  },
  buildStateMutation(id) { return d => { const s = ROUND3.investigation.sources.find(x => x.id === id); d.energy = clampEnergy(d.energy + s.impact); if (s.direct) d.assessmentRemaining = 60; }; },
  followupMutation() { return d => { d.assessmentRemaining = 60; }; },
  stuckPrompts: [
    { when: "IF THEY GO STRAIGHT TO TASK SHEET OR TEACHER", lines: ["Good — what does that source tell Jordan that the others couldn’t?"] },
    { when: "IF THEY CHOOSE DEADLINE OR PEER AND THINK THEY’RE DONE", lines: ["What does Jordan now know? What does Jordan still NOT know?", "Is that enough information to actually plan tonight?"] },
    { when: "IF THEY TREAT PEER AS UNRELIABLE OR “WRONG”", lines: ["Is a peer’s information wrong, or just incomplete? What’s the difference?"] },
    { when: "IF THEY WANT TO CHECK EVERY SOURCE AT ONCE", lines: ["What’s the fastest path to a clear answer? Does Jordan need all four, or just enough?"] }
  ],
  suggestedAnswers: [
    "“Task Sheet, because it tells you exactly what’s required.”",
    "“Teacher, because they can answer questions the sheet can’t.”",
    "“Deadline, because Jordan needs to know how much time there actually is.”",
    "“Peer, because someone in class probably already knows what’s going on.”"
  ],
  listenFor: [
    "The difference between WHEN, WHAT and HOW MUCH — three different questions, not one.",
    "Getting accurate information before reacting, rather than guessing under pressure.",
    "One source can be useful without being complete.",
    "Reducing uncertainty is progress, even before any work is actually done."
  ],
  misconception: { claim: "Checking with a peer was a bad or unreliable choice.", response: "A peer isn’t wrong — they’re incomplete. Their information is real and useful; it just can’t confirm Jordan’s own exact workload the way the Task Sheet or Teacher can." },
  selfCareLink: "Self-care can include getting accurate information before reacting."
};

const ROUND4 = {
  round: 4, time: "12:45 PM", part: "Lunch", title: "LUNCH GETS COMPLICATED",
  getStory: (_rs, gs) => [
    "Jordan is hungry and wants a break.",
    gs.friendKnownBeforeLunch
      ? "Because the class already checked the friend DM this morning, Jordan already knows what this is about. The friend comes over: ‘Hey. Can we talk?’"
      : "The friend DM was left for later this morning, so Jordan still doesn’t know what this is about. The friend comes over: ‘I messaged you earlier. Can we talk? It’s about Sam.’",
    "Jordan cares about the friend. Jordan also needs lunch and a pause."
  ],
  autoEnergy: -4, autoWhy: "Two legitimate needs are competing at the same time.",
  preTalk: ["How could Jordan be there for the friend and still look after what Jordan needs at lunch?"], question: "What approach should Jordan take?",
  dialoguePrompt: "OKAY — WHAT WOULD JORDAN ACTUALLY SAY?",
  choices: [
    { id: "eat_listen", short: "EAT + LISTEN", label: "Eat while listening.", impact: 1, lunch: "covered", hunger: false, friend: "resolved",
      why: "Jordan combines the conversation with lunch, so both immediate needs are covered.",
      tradeoff: "Protects both lunch and the friend conversation at the same time. The trade-off is that Jordan does not get much separate downtime or space while eating.",
      scripts: ["Come sit with me while I eat. Tell me what happened.", "I want to hear it — I’m going to eat while we talk."] },
    { id: "ten_first", short: "TEN MINUTES FIRST", label: "Eat for ten minutes first, then talk.", impact: 2, lunch: "covered", hunger: false, friend: "resolved",
      why: "Jordan sets a short, clear boundary, eats first, then follows through with the friend.",
      tradeoff: "Protects Jordan’s immediate basic need and sets a clear short boundary, while still following through with the friend. The trade-off is that the friend waits ten minutes.",
      scripts: ["Give me ten minutes to eat first, then I’ll come find you.", "I do want to talk. Can I eat first and find you in ten?"] },
    { id: "urgency", short: "CHECK URGENCY", label: "Check whether it needs to happen now.", impact: 1, lunch: "covered", hunger: false, friend: "pending",
      why: "Jordan checks whether the friend is okay. The friend says it can wait, so Jordan eats and the fuller conversation stays pending.",
      tradeoff: "Protects lunch and checks whether the friend needs immediate support. The trade-off is that the full conversation moves later, so it remains something Jordan still needs to follow up.",
      scripts: ["Are you okay? If you are, can we talk after school?", "Is this urgent, or can we talk later when I’ve got more space?"] },
    { id: "go_now", short: "GO NOW", label: "Go with the friend straight away.", impact: -1, lunch: "missed", hunger: true, friend: "resolved",
      why: "Jordan gives the friend immediate attention, so the conversation is handled, but lunch is missed and hunger carries into the afternoon.",
      tradeoff: "Protects the friend’s need for immediate conversation. The trade-off is that Jordan misses lunch and carries hunger into the afternoon.",
      scripts: ["Okay. Come on — tell me what happened.", "Yep, let’s go. What happened?"] }
  ],
  buildStateMutation(id) { return d => { const c = ROUND4.choices.find(x => x.id === id); d.energy = clampEnergy(d.energy + c.impact); d.lunchHistory = c.lunch; d.currentHunger = c.hunger; d.friendStatus = c.friend; }; },
  stuckPrompts: [
    { when: "IF THEY SAY A GOOD FRIEND MUST DROP EVERYTHING", lines: ["What does Jordan also need right now? Does going immediately make that need disappear?"] },
    { when: "IF THEY THINK “CHECK URGENCY” IS BRUSHING THE FRIEND OFF", lines: ["Jordan still checks in and still follows up later. What’s the actual difference between that and ignoring the friend?"] },
    { when: "IF THEY CANNOT AGREE ON WORDING", lines: ["Forget the ‘nicest’ words for a second — does this line actually match the approach the class chose?"] },
    { when: "IF THEY PICK “GO NOW” WITHOUT NOTICING THE COST", lines: ["What happens to lunch? What does missing it mean for the rest of Jordan’s afternoon?"] }
  ],
  suggestedAnswers: [
    "“Eat and listen — Jordan can do both at once.”",
    "“Ten minutes first, because Jordan needs food before a real conversation.”",
    "“Check urgency, because if it’s not urgent, lunch matters too.”",
    "“Go now, because the friend said Jordan would talk to them.”"
  ],
  listenFor: [
    "Boundaries that hold two needs at once, rather than needing to pick only one.",
    "The difference between postponing something and dismissing it.",
    "Values — what does the class think a good friend actually owes someone here?",
    "Immediate need (food) vs relationship need (being there) — both are real."
  ],
  misconception: { claim: "A caring person always drops their own needs for someone else.", response: "Being there for a friend and looking after your own needs aren’t automatically opposites. A short, clear boundary — like ‘give me ten minutes’ — can protect both at once." },
  selfCareLink: "Supporting another person and meeting your own needs are not always opposites. Boundaries and communication matter."
};

const ROUND5 = {
  round: 5, time: "3:12 PM", part: "After school", title: "THE MESSAGE",
  story: ["Jordan’s rostered shift is 4:30–6:00.", "The manager messages: ‘Can you start at 3:45?’ Extra money would be useful.", "The decision changes how much usable time Jordan has before work."],
  autoEnergy: 0, preTalk: ["What does Jordan gain and give up with each work response?"], question: "HOW MUCH OF YOUR AFTERNOON ARE YOU WILLING TO TRADE?",
  choices: [
    { id: "yes", short: "YES — 3:45", label: "Yes — start at 3:45.", meta: "Keep about 15 min · +45 paid min", workStart: 945, gapMinutes: 15, extraPaidMinutes: 45, workImpact: -8,
      why: "Jordan gains 45 extra paid minutes, but the longer shift uses more energy and leaves only 15 usable minutes before work.",
      tradeoff: "Protects extra income. The trade-off is the smallest gap for food, assessment, a friend, a reset or simply having time open before work." },
    { id: "compromise", short: "COMPROMISE — 4:00", label: "Compromise — offer 4:00.", meta: "Keep about 30 min · +30 paid min", workStart: 960, gapMinutes: 30, extraPaidMinutes: 30, workImpact: -7,
      why: "Jordan keeps 30 usable minutes before work and still earns 30 extra paid minutes.",
      tradeoff: "Splits the difference between money and time. The trade-off is that 30 minutes still cannot cover every possible need if several things are unresolved." },
    { id: "no", short: "NO — 4:30", label: "No — keep the rostered 4:30 start.", meta: "Keep about 60 min · +0 paid min", workStart: 990, gapMinutes: 60, extraPaidMinutes: 0, workImpact: -6,
      why: "Jordan keeps the full 60-minute gap before the rostered shift and works the shortest shift of the three options.",
      tradeoff: "Protects the most usable time before work and uses slightly less energy at work. The trade-off is giving up the extra paid minutes." }
  ],
  gapActions: [
    { id: "assessment", label: "Assessment — 20 min", duration: 20, impact: -2, repeat: true, description: "Complete one focused 20-minute block of the actual assessment. It reduces work left later, but focused work uses Energy." },
    { id: "friend", label: "Talk to friend — 10 min", duration: 10, impact: -1, description: "Use ten minutes to have the pending friend conversation. It resolves that unfinished people-task, but it still takes attention and Energy." },
    { id: "food", label: "Get food — 10 min", duration: 10, impact: 3, description: "Only appears when lunch was missed and Jordan is still hungry. It removes the active hunger problem before work." },
    { id: "reset", label: "Proper reset — 15 min", duration: 15, impact: 2, description: "Take a deliberate low-demand break before the next commitment. It restores some capacity, but it does not complete another responsibility." },
    { id: "organise", label: "Get organised — 10 min", duration: 10, impact: -1, description: "Gather the assessment materials and set up what Jordan will need later. This reduces friction in the story, but has no hidden Energy bonus and does NOT count as completing tomorrow basics." }
  ],
  lifeEvents: [
    { id: "shift_late", title: "Shift runs late", text: "Work runs until 6:30. Jordan gets home around 6:50.", impact: -3, why: "Jordan earns another 30 paid minutes, but the normal 7:00 basketball start is now impossible. The evening has to be rebuilt." },
    { id: "training_moved", title: "Training moved", text: "Basketball is moved to 7:20–8:50.", impact: 0, why: "Jordan gets a larger window before basketball but returns home later. The amount of time is redistributed rather than simply gained." },
    { id: "home_loud", title: "Home is loud", text: "Home is loud and busy until 7:15. Focused assessment work is blocked during that period.", impact: 0, why: "The early home window cannot be used for focused study, although lower-focus actions can still fit. The plan must adapt rather than stop." }
  ],
  stuckPrompts: [
    { when: "IF THEY IMMEDIATELY SAY “ASSESSMENT”", lines: ["What are you protecting by doing it now?", "What are you giving up to do it?"] },
    { when: "IF THEY CANNOT DECIDE WHAT TO SPEND THE GAP ON", lines: ["Imagine Jordan can do only ONE thing before work. Which would make tonight easier?"] },
    { when: "IF THEY TRY TO DO EVERYTHING", lines: ["Check the clock. Can all of that actually fit in the minutes Jordan kept?"] },
    { when: "IF NOBODY WANTS TO LEAVE TIME OPEN", lines: ["Is unused time always wasted time?"] }
  ],
  suggestedAnswers: [
    "“Do the assessment because it’s due tomorrow.”",
    "“Eat because Jordan missed lunch.”",
    "“Talk to the friend because Jordan said they would.”",
    "“Use the reset because Jordan has been going all day.”",
    "“Leave some time empty because tonight is already packed.”"
  ],
  listenFor: [
    "Finite time — the gap is real minutes, not an ideal wish list.",
    "Deliberately leaving time open is a choice too, not a wasted opportunity by default.",
    "Money vs time as a genuine, values-based trade-off, not an obvious answer.",
    "What this gap protects for later, versus what it spends now."
  ],
  misconception: { claim: "Working less is automatically better self-care.", response: "Extra money genuinely matters to Jordan too. NO isn’t automatically the ‘healthy’ answer — it’s one trade-off among three real ones, each buying something different." },
  selfCareLink: "Self-care is not automatically ‘take a break’ or ‘do the homework.’ It can mean deliberately deciding what matters now, what can wait and what consequence comes with that."
};

const ROUND6 = {
  round: 6, time: "6:20 PM", part: "Home / Basketball", title: "BUILD THE EVENING",
  autoEnergy: 0,
  getStory: (_rs, gs) => {
    if (gs.homeTime === 1130) return ["Work ran late. Jordan gets home at 6:50 and cannot make a normal 7:00 basketball start.", "The evening now has a genuine timing collision.", "After the basketball decision, the class will build the evening only up to 10:00 PM. The final 30 minutes stays aside for a Reality Check and getting ready for bed."];
    if (gs.trainingStart === 1160) return ["Jordan gets home around 6:20.", "Training has moved to 7:20–8:50, creating a bigger window before training and a later return home.", "After the basketball decision, the class will build the evening only up to 10:00 PM. The final 30 minutes stays aside for a Reality Check and getting ready for bed."];
    return ["Jordan gets home around 6:20.", "Basketball is 7:00–8:30, with getting-ready and travel time fixed around it.", "After the basketball decision, the class will build the evening only up to 10:00 PM. The final 30 minutes stays aside for a Reality Check and getting ready for bed."];
  },
  preTalk: ["What is worth protecting tonight when the clock may not have room for everything?"],
  followingHomeHeading: "WHAT IS FOLLOWING JORDAN HOME?",
  notEverythingFits: "NOT EVERYTHING FITS.",
  basketballAttendImpact: 1,
  planningEnd: 22 * 60,             // 10:00 PM — the last 30 min is kept as the Round 7 pre-bed buffer
  targetBedtime: 22 * 60 + 30,
  actions: [
    { id: "dinner", label: "Dinner", duration: 20, impact: 3, description: "Use 20 minutes to cover dinner. This meets the current food need and restores some immediate capacity." },
    { id: "assessment", label: "Assessment", duration: 20, impact: -2, repeat: true, description: "Complete one 20-minute assessment block. Each block reduces the work still hanging over tomorrow, but costs immediate Energy." },
    { id: "reset", label: "Proper reset", duration: 15, impact: 2, description: "Protect 15 minutes of genuine lower-demand recovery. It can restore capacity, but it does not make responsibilities disappear." },
    { id: "friend", label: "Talk to friend", duration: 10, impact: -1, description: "Finish the pending friend conversation if it is still unresolved. It protects the relationship but uses time and attention." },
    { id: "basics", label: "Tomorrow basics", duration: 10, impact: -1, description: "Pack and charge what Jordan needs for tomorrow. It costs a small amount of Energy tonight but removes that task from Tomorrow Load." }
  ],
  stuckPrompts: [
    { when: "IF THEY TRY TO SCHEDULE EVERYTHING", lines: ["Stop there. You have 15 minutes and both of those need 20. Which one goes?"] },
    { when: "IF THEY WANT TO SKIP BASKETBALL WITHOUT DISCUSSING IT", lines: ["What does keeping basketball protect for Jordan? What does skipping it actually create — more time, or more Energy?"] },
    { when: "IF THEY LEAVE A WINDOW COMPLETELY EMPTY", lines: ["Is that deliberate, or did the class just run out of ideas? Either can be fine — which is it?"] },
    { when: "IF THEY FORGET SOMETHING IS STILL PENDING", lines: ["Look at the WHAT IS FOLLOWING JORDAN HOME list again. What’s still on it?"] }
  ],
  suggestedAnswers: [
    "“Dinner first, because Jordan needs to actually eat.”",
    "“Assessment first, because it’s due tomorrow and won’t go away.”",
    "“The reset, because Jordan has been going non-stop since 7:10 AM.”",
    "“Attend basketball — Jordan actually wants to be there tonight.”",
    "“Skip basketball, because the schedule genuinely doesn’t have room.”"
  ],
  listenFor: [
    "Realistic planning — a plan that physically fits the clock, not just a wish list.",
    "Commitment vs flexibility — which fixed things stay fixed, and what can still move?",
    "Not everything fitting is a real outcome, not a failure state.",
    "What the class is protecting: capacity, responsibility, connection, enjoyment, or tomorrow."
  ],
  misconception: { claim: "Jordan should just skip basketball.", response: "That creates time, but basketball is also something Jordan values. Self-care doesn’t automatically mean cancelling everything enjoyable — it means weighing it honestly against everything else competing for the same clock." },
  selfCareLink: "A realistic plan matters more than an ideal plan. Sometimes self-care means accepting that everything cannot fit."
};

const ROUND7 = {
  round: 7, time: "10:00 PM", part: "Evening", title: "REALITY CHECK",
  autoEnergy: 0,
  intro: "Only unresolved items return. Jordan uses available time before the target bedtime first; bedtime only moves later if that time is exhausted.",
  stopHeading: "STOP. LOOK AT WHAT YOUR DAY CREATED.",
  askBeforeChoices: ["Looking at the clock, what is ACTUALLY urgent?", "What can realistically wait until tomorrow?"],
  lifeEvents: [
    { id: "extra_class_time", title: "Extra class time tomorrow", text: "The teacher confirms up to 20 minutes of class time tomorrow can be used on the assessment.", impact: 1,
      why: "Jordan now knows there is a real 20-minute school window tomorrow. It makes the deferred work easier to place, but it does not erase the work.",
      eligible: gs => gs.assessmentTomorrow > 0 },
    { id: "task_quicker", title: "Task quicker than expected", text: "One section takes about ten minutes less than expected.", impact: 2,
      why: "Ten minutes of the evening is unexpectedly recovered.",
      eligible: gs => gs.assessmentWorkedTonight === true },
    { id: "group_chat_lights", title: "Group chat lights up", text: "The group chat suddenly starts buzzing again.", impact: -2,
      why: "An attention demand Jordan left active returns. Muted or deliberately parked-until-tomorrow content cannot create this event.",
      eligible: gs => gs.groupChatStatus === "later" }
  ],
  stuckPrompts: [
    { when: "IF THEY WANT TO INVENT EXTRA WORK", lines: ["Check the list again — is that actually still unresolved, or already dealt with?"] },
    { when: "IF THEY WANT TO FINISH EVERYTHING TONIGHT NO MATTER THE COST", lines: ["Could Jordan physically do that? What happens to bedtime if we keep adding minutes?"] },
    { when: "IF THEY TREAT MOVING WORK TO TOMORROW AS FAILURE", lines: ["Is this a deliberate, realistic decision, or is it avoidance? What’s the actual difference?"] },
    { when: "IF THE CLASS IS UNSURE WHAT’S LEFT", lines: ["Read the three numbers again: current time, free time before bed, Tomorrow Load. What does that actually tell you?"] }
  ],
  suggestedAnswers: [
    "“Finish the assessment tonight — it’s due tomorrow at 3.”",
    "“Do 20 minutes now and move the rest to tomorrow — that’s realistic.”",
    "“Move it all to tomorrow and plan support, because tonight is already full.”",
    "“Check the group chat now — 5 minutes is nothing.”",
    "“Leave the group chat until tomorrow — it’s late and it can wait.”"
  ],
  listenFor: [
    "Tonight vs tomorrow as a genuine trade-off, not a test to pass.",
    "Tomorrow Load as a real, visible consequence — not a hidden penalty.",
    "Deliberate postponing vs avoidance — was this decided on purpose, with a plan?",
    "Bedtime as a limit, not an afterthought."
  ],
  misconception: { claim: "Just finish everything tonight.", response: "Could Jordan physically do that? And what happens to sleep if we keep adding things? Sometimes the realistic, self-caring choice is to plan tomorrow properly instead of forcing tonight to hold everything." },
  selfCareLink: "Moving something to tomorrow is not automatically avoidance. It depends on whether the decision is deliberate, realistic and whether tomorrow can carry it."
};

const ROUND8 = {
  round: 8, time: "Bed", part: "Final decision", title: "ONE LAST DECISION", autoEnergy: 0, voteTimerSeconds: 10,
  getStory: (_rs, gs) => ["Jordan is in bed. One last message appears:", gs.friendStatus === "pending" ? "YOU AWAKE?? I never got to tell you what happened with Sam." : "YOU AWAKE?? Quick question.", "There is no more information yet."],
  question: "What should Jordan do?",
  voteAnticipation: "YOU’RE NOT GETTING ANY MORE INFORMATION. YOU HAVE 10 SECONDS.",
  choices: [
    { id: "reply", short: "REPLY", label: "Reply: ‘What’s up?’", impact: 0, duration: 3, why: "Jordan opens the conversation without knowing how long it will become.", tradeoff: "Keeps the connection open tonight, but gives the message immediate attention and may create a longer conversation." },
    { id: "can_wait", short: "CHECK IF IT CAN WAIT", label: "‘I’m wrecked. Are you okay, or can we talk tomorrow?’", impact: 1, duration: 2, why: "Jordan checks whether there is an immediate need while also setting a clear limit for tonight.", tradeoff: "Protects sleep and still checks urgency, but the fuller conversation may move to tomorrow." },
    { id: "call", short: "CALL", label: "Call the friend.", impact: -2, duration: 12, why: "Jordan gives the message immediate time and attention by calling.", tradeoff: "Creates the most space for the friend tonight, but uses more time and energy at the end of the day." },
    { id: "morning", short: "LEAVE UNTIL MORNING", label: "Leave the message until morning.", impact: 1, duration: 0, why: "Jordan decides not to open a new conversation tonight.", tradeoff: "Protects the remaining night completely, but leaves the unanswered message until morning." }
  ],
  stuckPrompts: [
    { when: "IF THEY ASSUME THE MESSAGE IS AN EMERGENCY", lines: ["What are you assuming? What does the message actually say?"] },
    { when: "IF THEY ASSUME IT’S NOTHING IMPORTANT", lines: ["What are you assuming this time? Could you be just as wrong the other way?"] },
    { when: "IF THE CLASS IS SPLIT", lines: ["What is each option protecting — the friendship, the boundary, or the sleep?"] },
    { when: "IF STUDENTS ASK WHAT REALLY HAPPENED WITH SAM", lines: ["That’s deliberately left unknown — the decision has to be made without it, the same way real late-night messages often arrive without full context."] }
  ],
  suggestedAnswers: [
    "“Reply, because leaving a friend on read at night feels wrong.”",
    "“Check if it can wait, because Jordan is exhausted and still cares.”",
    "“Call, because a call sorts it out properly instead of a long text back-and-forth.”",
    "“Leave it until morning, because Jordan has been going since 7:10 AM.”"
  ],
  listenFor: [
    "Decision-making under genuine uncertainty — there isn’t enough information to be sure.",
    "Boundaries and responsiveness can coexist in the same choice.",
    "What each option protects: sleep, the relationship, or both partially.",
    "No answer here is being taught as correct — notice if students start hunting for one."
  ],
  misconception: { claim: "Leaving the message is automatically the self-care answer.", response: "Protecting sleep is one legitimate value here — but so is responding to a friend. There isn’t one ‘self-care’ answer; there are different things being protected by each option." },
  selfCareLink: "Boundaries, responsiveness and uncertainty can all exist at the same time. There may not be one perfect answer."
};

const FINAL = {
  title: "THE DAY YOU BUILT",
  getReceipt: (_rs, gs) => {
    const bedtime = formatTime(gs.targetBedtime ?? 1350);
    const assessment = gs.assessmentTomorrow > 0 ? `${gs.assessmentTomorrow} min tomorrow${gs.supportPlan === "planned" ? " · support planned" : ""}` : "No assessment work carried to tomorrow";
    const basketball = { attend: "Attended", late: "Joined late", skip: "Skipped", undecided: "Not decided" }[gs.basketballStatus] || gs.basketballStatus;
    const friend = { resolved: "Conversation handled", pending: "Still pending" }[gs.friendStatus] || "No outstanding conversation";
    const lunch = { covered: "Lunch covered", missed: "Lunch missed", late_food_obtained: "Food obtained later", not_yet: "Not reached" }[gs.lunchHistory] || gs.lunchHistory;
    return [
      { label: "BEDTIME", value: bedtime },
      { label: "ENERGY LEFT AT BEDTIME", value: `${gs.energy} / 100` },
      { label: "ASSESSMENT / TOMORROW LOAD", value: `${assessment} · Tomorrow Load ${gs.tomorrowLoad || 0} min` },
      { label: "EXTRA PAID WORK", value: `${gs.extraPaidMinutes || 0} min` },
      { label: "BASKETBALL", value: basketball },
      { label: "PEOPLE", value: friend },
      { label: "BASICS", value: `Breakfast covered · ${lunch} · Dinner ${gs.dinnerStatus === "covered" ? "covered" : "not covered"}` }
    ];
  },
  /** Short narrative recap lines, built from the same real state as the receipt, not a raw field dump. */
  getStorySummary: (_rs, gs) => {
    const lines = [];
    lines.push(gs.extraPaidMinutes > 0 ? `The class chose to trade time for money — Jordan picked up ${gs.extraPaidMinutes} extra paid minutes at work.` : "The class chose to protect time over extra pay — Jordan kept the rostered shift.");
    if (gs.friendStatus === "resolved") lines.push("The friend conversation got handled somewhere across the day.");
    else if (gs.friendStatus === "pending") lines.push("The friend conversation never fully closed — it was still pending at the end of the day.");
    if (gs.basketballStatus === "attend" || gs.basketballStatus === "late") lines.push(gs.basketballStatus === "late" ? "Basketball still happened tonight, just later than planned." : "Basketball stayed part of Jordan’s evening.");
    else if (gs.basketballStatus === "skip") lines.push("Basketball was skipped, which opened up time the class used elsewhere.");
    if (gs.assessmentTomorrow > 0) lines.push(`${gs.assessmentTomorrow} minutes of assessment work is still following Jordan into tomorrow.`);
    else lines.push("The assessment got fully dealt with today.");
    return lines;
  },
  debrief: ["Would you run this day again?", "What ONE decision would you change first?", "What consequence would that change create?"],
  closing: "SELF-CARE ISN’T KEEPING THE BATTERY AT 100.",
  closingScript: "A high Energy number can mean Jordan protected capacity — but it can also mean more got left for tomorrow. A lower Energy number can mean Jordan deliberately spent capacity on responsibilities, relationships or things Jordan values. The point was never to maximise the number. Self-care is noticing needs, responsibilities, limits, support and values — then changing the plan when the day changes."
};
