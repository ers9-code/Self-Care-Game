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
 * ===================================================================== */

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
  round: 1, time: "7:10 AM", part: "Morning", title: "The day starts behind",
  story: [
    "Jordan planned to be asleep by 10:30, but messaging and videos pushed it past midnight.",
    "The alarm went at 6:45. Jordan snoozed twice.",
    "It is now 7:10. Jordan has not eaten and has about 35 minutes to leave."
  ],
  autoEnergy: -12, autoWhy: "Less sleep and rushing have already reduced Jordan’s usable capacity.",
  preTalk: ["What matters most in the next 35 minutes?", "What can reasonably be left out today?"],
  question: "What matters most in the next 35 minutes?", voteTimerSeconds: 15,
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
  ]
};

const ROUND2 = {
  round: 2, time: "8:45 AM", part: "Arrival", title: "Five minutes before class",
  story: [
    "Jordan arrives with five minutes before class.",
    "The phone has a close-friend DM with the preview hidden, a school-app timetable update, 27 Year 10 group-chat messages and three videos marked ‘WATCH THIS’."
  ],
  autoEnergy: -4, autoWhy: "Several things compete for attention at once.",
  preTalk: ["What deserves attention now, what can wait, and what is not worth carrying today?"],
  question: "Sort every item into NOW, LATER or MUTE.",
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
  }
};

const ROUND3 = {
  round: 3, time: "10:25 AM", part: "School", title: "The deadline surprise",
  story: ["The teacher says: ‘Just a reminder — your assessment is due tomorrow at 3 PM.’", "Jordan thought it was due Friday."],
  autoEnergy: -8, autoWhy: "The surprise creates uncertainty and time pressure.",
  preTalk: ["What information would actually help Jordan decide what to do next?"], question: "Where should Jordan check first?",
  investigation: {
    sources: [
      { id: "sheet", label: "TASK SHEET", role: "Requirements + criteria", impact: 2, direct: true,
        why: "The task sheet shows Jordan still needs one analysis section, a reference check and a final proofread. Together that is about 60 minutes of work — no second source is needed.",
        tradeoff: "This answers WHAT is required and HOW MUCH is left. The assessment is not solved; Jordan now has reliable information to plan the remaining hour." },
      { id: "teacher", label: "TEACHER", role: "Clarify what remains", impact: 2, direct: true,
        why: "The teacher checks Jordan’s progress and confirms one analysis section, a reference check and a final proofread are still needed — about 60 minutes in total.",
        tradeoff: "This gives Jordan a direct answer about WHAT remains and HOW MUCH work is left. Jordan still has to decide where that hour fits into the rest of the day." },
      { id: "deadline", label: "DEADLINE / CALENDAR", role: "Timing + due point", impact: 1, direct: false,
        why: "The deadline/calendar confirms WHEN it is due: tomorrow at 3 PM. It does not tell Jordan exactly WHAT is left or HOW LONG it will take, so a quick Task Sheet or Teacher check is still needed.",
        tradeoff: "Useful information, but it answers only the timing question. Jordan needs one more source before the workload is clear." },
      { id: "peer", label: "PEER", role: "Context + what they noticed", impact: 1, direct: false,
        why: "A peer can give useful context about what they noticed or what they think is required, but cannot confirm Jordan’s exact remaining work. Jordan still needs the Task Sheet or Teacher.",
        tradeoff: "Useful context, but not enough to plan Jordan’s exact workload. A second check turns an estimate into reliable information." }
    ]
  },
  buildStateMutation(id) { return d => { const s = ROUND3.investigation.sources.find(x => x.id === id); d.energy = clampEnergy(d.energy + s.impact); if (s.direct) d.assessmentRemaining = 60; }; },
  followupMutation() { return d => { d.assessmentRemaining = 60; }; }
};

const ROUND4 = {
  round: 4, time: "12:45 PM", part: "Lunch", title: "Two legitimate needs at once",
  getStory: (_rs, gs) => [
    "Jordan is hungry and wants a break.",
    gs.friendKnownBeforeLunch ? "The friend comes over: ‘Hey. Can we talk?’" : "The friend comes over: ‘I messaged you earlier. Can we talk? It’s about Sam.’",
    "Jordan cares about the friend. Jordan also needs lunch and a pause."
  ],
  autoEnergy: -4, autoWhy: "Two legitimate needs are competing at the same time.",
  preTalk: ["How could Jordan be there for the friend and still look after what Jordan needs at lunch?"], question: "What approach should Jordan take?",
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
  buildStateMutation(id) { return d => { const c = ROUND4.choices.find(x => x.id === id); d.energy = clampEnergy(d.energy + c.impact); d.lunchHistory = c.lunch; d.currentHunger = c.hunger; d.friendStatus = c.friend; }; }
};

const ROUND5 = {
  round: 5, time: "3:12 PM", part: "After school", title: "The manager asks for more",
  story: ["Jordan’s rostered shift is 4:30–6:00.", "The manager asks whether Jordan can start at 3:45. Extra money would be useful.", "The decision changes how much usable time Jordan has before work."],
  autoEnergy: 0, preTalk: ["What does Jordan gain and give up with each work response?"], question: "What should Jordan say?",
  choices: [
    { id: "yes", short: "YES — 3:45", label: "Yes — start at 3:45.", meta: "15 usable min · +45 paid min", workStart: 945, gapMinutes: 15, extraPaidMinutes: 45, workImpact: -8,
      why: "Jordan gains 45 extra paid minutes, but the longer shift uses more energy and leaves only 15 usable minutes before work.",
      tradeoff: "Protects extra income. The trade-off is the smallest gap for food, assessment, a friend, a reset or simply having time open before work." },
    { id: "compromise", short: "COMPROMISE — 4:00", label: "Compromise — offer 4:00.", meta: "30 usable min · +30 paid min", workStart: 960, gapMinutes: 30, extraPaidMinutes: 30, workImpact: -7,
      why: "Jordan keeps 30 usable minutes before work and still earns 30 extra paid minutes.",
      tradeoff: "Splits the difference between money and time. The trade-off is that 30 minutes still cannot cover every possible need if several things are unresolved." },
    { id: "no", short: "NO — 4:30", label: "No — keep the rostered 4:30 start.", meta: "60 usable min · +0 paid min", workStart: 990, gapMinutes: 60, extraPaidMinutes: 0, workImpact: -6,
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
  ]
};

const ROUND6 = {
  round: 6, time: "Evening", part: "Home / Basketball", title: "Build the evening",
  autoEnergy: 0,
  getStory: (_rs, gs) => {
    if (gs.homeTime === 1130) return ["Work ran late. Jordan gets home at 6:50 and cannot make a normal 7:00 basketball start.", "The evening now has a genuine timing collision.", "After the basketball decision, the class will build the evening only up to 10:00 PM. The final 30 minutes stays aside for a Reality Check and getting ready for bed."];
    if (gs.trainingStart === 1160) return ["Jordan gets home around 6:20.", "Training has moved to 7:20–8:50, creating a bigger window before training and a later return home.", "After the basketball decision, the class will build the evening only up to 10:00 PM. The final 30 minutes stays aside for a Reality Check and getting ready for bed."];
    return ["Jordan gets home around 6:20.", "Basketball is 7:00–8:30, with getting-ready and travel time fixed around it.", "After the basketball decision, the class will build the evening only up to 10:00 PM. The final 30 minutes stays aside for a Reality Check and getting ready for bed."];
  },
  preTalk: ["What is worth protecting tonight when the clock may not have room for everything?"],
  basketballAttendImpact: 1,
  planningEnd: 22 * 60,             // 10:00 PM — the last 30 min is kept as the Round 7 pre-bed buffer
  targetBedtime: 22 * 60 + 30,
  actions: [
    { id: "dinner", label: "Dinner", duration: 20, impact: 3, description: "Use 20 minutes to cover dinner. This meets the current food need and restores some immediate capacity." },
    { id: "assessment", label: "Assessment", duration: 20, impact: -2, repeat: true, description: "Complete one 20-minute assessment block. Each block reduces the work still hanging over tomorrow, but costs immediate Energy." },
    { id: "reset", label: "Proper reset", duration: 15, impact: 2, description: "Protect 15 minutes of genuine lower-demand recovery. It can restore capacity, but it does not make responsibilities disappear." },
    { id: "friend", label: "Talk to friend", duration: 10, impact: -1, description: "Finish the pending friend conversation if it is still unresolved. It protects the relationship but uses time and attention." },
    { id: "basics", label: "Tomorrow basics", duration: 10, impact: -1, description: "Pack and charge what Jordan needs for tomorrow. It costs a small amount of Energy tonight but removes that task from Tomorrow Load." }
  ]
};

const ROUND7 = {
  round: 7, time: "Reality Check", part: "Evening", title: "What is actually still in play?",
  autoEnergy: 0,
  intro: "Only unresolved items return. Jordan uses available time before the target bedtime first; bedtime only moves later if that time is exhausted.",
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
  ]
};

const ROUND8 = {
  round: 8, time: "Bed", part: "Final decision", title: "YOU AWAKE??", autoEnergy: 0, voteTimerSeconds: 10,
  getStory: (_rs, gs) => ["Jordan is in bed. One last message appears:", gs.friendStatus === "pending" ? "YOU AWAKE?? I never got to tell you what happened with Sam." : "YOU AWAKE?? Quick question.", "There is no more information yet."],
  question: "What should Jordan do?",
  choices: [
    { id: "reply", short: "REPLY", label: "Reply: ‘What’s up?’", impact: 0, duration: 3, why: "Jordan opens the conversation without knowing how long it will become.", tradeoff: "Keeps the connection open tonight, but gives the message immediate attention and may create a longer conversation." },
    { id: "can_wait", short: "CHECK IF IT CAN WAIT", label: "‘I’m wrecked. Are you okay, or can we talk tomorrow?’", impact: 1, duration: 2, why: "Jordan checks whether there is an immediate need while also setting a clear limit for tonight.", tradeoff: "Protects sleep and still checks urgency, but the fuller conversation may move to tomorrow." },
    { id: "call", short: "CALL", label: "Call the friend.", impact: -2, duration: 12, why: "Jordan gives the message immediate time and attention by calling.", tradeoff: "Creates the most space for the friend tonight, but uses more time and energy at the end of the day." },
    { id: "morning", short: "LEAVE UNTIL MORNING", label: "Leave the message until morning.", impact: 1, duration: 0, why: "Jordan decides not to open a new conversation tonight.", tradeoff: "Protects the remaining night completely, but leaves the unanswered message until morning." }
  ]
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
  debrief: ["What did your day protect?", "Would you run this day again?", "What ONE decision would you change first?"],
  closing: "SELF-CARE ISN’T KEEPING THE BATTERY AT 100.",
  closingScript: "Self-care is noticing needs, responsibilities, limits, support and values — then changing the plan when the day changes. A useful choice can still use energy. Sometimes things wait. No version of the day controls everything."
};
