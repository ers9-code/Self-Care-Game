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
 * PRESENTATION LAYER: every round carries round-level facilitator
 * teaching-support content (stuckPrompts / suggestedAnswers / listenFor /
 * misconception / selfCareLink) as a fallback, plus a `moments` object
 * keyed by viewDescriptor (exact match, or normalised by stripping a
 * trailing ":suffix") holding only the fields that specific screen needs
 * to override. render-facilitator.js's resolveGuidance() resolves each
 * of the eight teaching-support fields independently — moment, then
 * round, then generic default — so a moment overriding one field still
 * inherits the rest from its round. None of this changes what a choice
 * does; it is read by the facilitator, never shown on the student
 * projector.
 * ===================================================================== */

const SUGGESTED_ANSWERS_CLOSE = "All reasonable. Notice what each one is choosing to protect — and what it's choosing to leave for later.";

const OPENING = {
  brainstorm: {
    heading: "What is self-care?",
    prompt: "Before we start — when you hear the words self-care, what actually comes to mind?",
    sub: "Quick ideas only. No personal examples needed — we’ll come back to this at the end."
  },
  meetJordan: {
    heading: "Meet Jordan",
    body: [
      "Jordan is in Year 10.",
      "There’s a school assessment due soon. Jordan thinks there’s more time than there is.",
      "Jordan works 4:30–6:00 today, and extra hours would genuinely help.",
      "Basketball is tonight — something Jordan actually wants."
    ],
    note: "Your job: get Jordan through one ordinary day. Not perfectly. Deliberately."
  },
  energyBar: {
    heading: "Jordan starts at 100 energy",
    body: [
      "The Energy Bar shows the immediate effect of what’s happening. It isn’t a wellbeing score, and it isn’t grading anyone’s decisions right or wrong.",
      "A useful decision can still cost energy. An easy one right now can create a bigger problem later.",
      "Sometimes Jordan gets a choice. Sometimes life just happens. More than one answer can be reasonable."
    ],
    note: "You’re controlling Jordan today. Nobody needs to tell us anything personal."
  }
};

const ROUND1 = {
  round: 1, time: "7:10 AM", part: "Morning", title: "ALREADY BEHIND",
  story: [
    "Jordan meant to be asleep by 10:30. Messages and videos pushed that past midnight.",
    "The alarm went at 6:45. Jordan snoozed it twice.",
    "It’s 7:10 now. No breakfast yet — about 35 minutes before Jordan has to leave."
  ],
  autoEnergy: -12, autoWhy: "A short night and a late start have already cost Jordan capacity, before anyone’s chosen anything.",
  preTalk: ["What matters enough to make the cut this morning?", "What would you be willing to leave out?"],
  question: "What matters enough to make the cut this morning?", voteTimerSeconds: 15,
  voteAnticipation: "Four plans. I’ll read them all first. Then you get 15 seconds — when time stops, hold up 1, 2, 3 or 4 fingers for your choice.",
  choices: [
    { id: "1", short: "TEN MORE MINUTES", label: "Sleep 10 more minutes, get dressed, grab food to take.", impact: 1,
      why: "A little more rest, and food still makes it out the door.",
      tradeoff: "The window to actually leave gets tighter — almost no room left if anything slows Jordan down." },
    { id: "2", short: "BASICS FIRST", label: "Eat something quick, get dressed, leave non-essential things.", impact: 2,
      why: "Jordan simplifies the morning down to what actually matters: food, and getting out the door.",
      tradeoff: "Everything else — messages, a shower, anything extra — waits until later." },
    { id: "3", short: "SHOWER + TAKE FOOD", label: "Quick shower, get dressed, take food for later.", impact: 1,
      why: "Jordan chooses feeling awake and put-together, and still grabs food for later.",
      tradeoff: "Breakfast gets delayed, and the morning still has almost no spare time in it." },
    { id: "4", short: "TRY TO FIT IT ALL", label: "Shower, food, packing and messages.", impact: -1,
      why: "Every one of these is reasonable on its own.",
      tradeoff: "All four in 35 minutes isn’t really a plan — it’s a bet that nothing else goes wrong." }
  ],
  stateMutations: Object.fromEntries(["1", "2", "3", "4"].map(id => [id, (d) => {
    const c = ROUND1.choices.find(x => x.id === id);
    d.energy = clampEnergy(d.energy + c.impact);
    d.breakfastHistory = "covered";
    d.currentHunger = false;
  }])),
  lifeEvents: [
    { id: "r1_lift", title: "Offered a lift", text: "Jordan was going to catch the bus. Someone at home is driving that way and offers a lift instead.", impact: 3, why: "One whole problem just disappears." },
    { id: "r1_laptop", title: "Forgot the laptop", text: "At the door, Jordan realises the school laptop is still on the bed.", impact: -3, why: "One small mistake, one more delay, on top of a morning that was already rushed." },
    { id: "r1_snack", title: "Found a snack", text: "Digging through the bag, Jordan finds a snack that’ll do for later.", impact: 1, why: "A problem that hadn’t even happened yet just got smaller." }
  ],
  stuckPrompts: [
    { when: "IF THEY IMMEDIATELY SAY “BASICS FIRST”", lines: ["What’s that plan protecting?", "What does it leave no room for if something else goes wrong this morning?"] },
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
    "Urgent vs important — is a task actually time-critical, or does it just feel urgent?",
    "Capacity — a short night already lowered what Jordan has to work with, before any choice was made.",
    "Every plan protects something and leaves something else thinner — nobody has to hunt for the ‘right’ one.",
    "Realistic planning — 35 minutes is a hard limit, not a suggestion."
  ],
  misconception: { claim: "The plan with the highest number is obviously the best one.", response: "Check what it leaves behind first. Energy is Jordan’s immediate capacity — it doesn’t say whether tomorrow just got harder, or what quietly got dropped." },
  selfCareLink: "Self-care can include basics and realistic expectations — adjusting the plan honestly instead of pretending capacity hasn’t changed.",
  moments: {
    r1_story: {
      selfCareLink: "Sometimes self-care just means being honest about a lower starting capacity, and planning around that instead of pretending the night didn’t happen.",
      stuckPrompts: [{ when: "IF THE ROOM IS QUIET AT FIRST", lines: ["Just think about the next 35 minutes — what’s Jordan realistically not going to get to?"] }]
    },
    r1_vote: {
      misconception: { claim: "The plan with the highest number is obviously the best one.", response: "Check what it leaves behind first. Energy tells us Jordan’s immediate capacity — it doesn’t say whether tomorrow just got harder, or what got quietly dropped." }
    },
    r1_discuss: {
      purpose: "Get the class naming the trade-off out loud before the number tells them what to think.",
      stuckPrompts: [{ when: "IF STUDENTS ONLY SAY “GOOD” OR “BAD”", lines: ["Forget good or bad for a second — what did this plan protect, and what did it leave thinner?"] }]
    },
    r1_result: {
      listenFor: ["Whether students connect the Energy number back to what the plan actually did — not to whether it was ‘the right answer’."],
      selfCareLink: "A number going up doesn’t mean the day is sorted. It means this decision covered what it covered — the rest of the day is still coming."
    },
    r1_life: {
      stuckPrompts: [{ when: "IF STUDENTS SAY THE PLAN IS NOW RUINED", lines: ["Is it ruined, or does it just need adjusting? What’s actually still true?"] }],
      selfCareLink: "Self-care isn’t making one perfect plan and being done with it. It’s also what happens when that plan meets something Jordan didn’t choose."
    }
  }
};

const ROUND2 = {
  round: 2, time: "8:45 AM", part: "Arrival", title: "FIVE MINUTES BEFORE CLASS",
  story: [
    "Jordan gets to school with five minutes before class.",
    "The phone won’t stop: a close friend’s DM with the preview hidden, a school-app timetable update, 27 messages in the Year 10 group chat, three videos marked ‘WATCH THIS’.",
    "Everything wants attention. There isn’t time to properly check it all."
  ],
  autoEnergy: -4, autoWhy: "Four things are competing for the same five minutes.",
  preTalk: ["What actually deserves Jordan’s attention right now?"],
  question: "WHAT ACTUALLY DESERVES ATTENTION NOW?",
  multipleNowPrompt: "YOU ONLY HAVE TIME TO PROPERLY CHECK ONE. WHICH ONE?",
  sortingItems: [
    { id: "item_dm", label: "Close friend DM — preview hidden", canNow: true, canLater: true, canMute: false },
    { id: "item_school", label: "School app — timetable update", canNow: true, canLater: true, canMute: false },
    { id: "item_groupchat", label: "Year 10 group chat — 27 messages", canNow: true, canLater: true, canMute: true },
    { id: "item_videos", label: "3 videos — WATCH THIS", canNow: true, canLater: true, canMute: true }
  ],
  friendDMReveal: "Can I talk to you at lunch? It’s about Sam.",
  attentionManagementGain: 2,
  attentionManagementWhy: "The +2 is for actually having a deliberate plan — not for picking a particular app.",
  buildStateMutation(assignments, checkedNowItem) {
    return d => {
      d.energy = clampEnergy(d.energy + ROUND2.attentionManagementGain);
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
    { when: "IF EVERYTHING GETS PUT INTO NOW", lines: ["Jordan has five minutes. What actually happens if all four get properly checked right now?", "If everything is urgent, is anything actually urgent?"] },
    { when: "IF THEY CANNOT AGREE ON THE ONE ITEM TO CHECK", lines: ["Which one, left unchecked, would bother Jordan the most for the rest of the morning?"] },
    { when: "IF THEY WANT TO MUTE THE FRIEND DM", lines: ["The friend DM can’t be muted — only NOW or LATER. Why might that not be an option here?"] },
    { when: "IF THEY TREAT MUTE AS “DELETING” SOMETHING IMPORTANT", lines: ["What’s the actual difference between muting the group chat and muting a person?"] }
  ],
  suggestedAnswers: [
    "“Check the friend DM now — a person is waiting.”",
    "“Check the school app now — it might change Jordan’s whole day.”",
    "“Mute the videos — they can’t possibly matter more than class.”",
    "“Later the group chat — 27 messages, but nothing sounds urgent.”"
  ],
  listenFor: [
    "Urgent vs important — a full inbox isn’t the same as an urgent one.",
    "Attention as a limited resource, the same as time or energy.",
    "The difference between LATER (can still come back) and MUTE (gone for good).",
    "Deciding not to check something can be an active choice, not just avoidance."
  ],
  misconception: { claim: "Checking everything is the responsible thing to do.", response: "Checking everything properly in five minutes just isn’t possible. The +2 here is for making a deliberate plan — not for clearing every notification." },
  selfCareLink: "Self-care can include deciding what deserves attention now, and what genuinely doesn’t.",
  moments: {
    r2_story: {
      selfCareLink: "Attention is a limited resource too — self-care can include deciding what gets access to it.",
      stuckPrompts: [{ when: "IF THE CLASS TRIES TO SOLVE FOR “WHICH APP IS BEST”", lines: ["It’s not about which one is good or bad — what deserves five real minutes of Jordan’s attention, right now?"] }]
    },
    r2_sort: {
      purpose: "Practise deliberate attention management without ranking apps as good or bad — everything just has to be placed somewhere.",
      stuckPrompts: [
        { when: "IF THEY WANT TO CHECK EVERYTHING “JUST QUICKLY”", lines: ["Five minutes, four things — what does ‘quickly’ actually get you on any one of them?"] },
        { when: "IF THEY SAY MULTIPLE THINGS ARE NOW", lines: ["You’ve said more than one thing matters. Jordan only has time to properly check one — which one?"] }
      ]
    },
    r2_result: {
      listenFor: ["What can still come back later on this path, and what’s gone for good.", "Whether students notice the +2 rewarded the plan itself, not which app got picked."],
      selfCareLink: "Deciding what can wait is still a decision — not the same as ignoring it."
    }
  }
};

const ROUND3 = {
  round: 3, time: "10:25 AM", part: "School", title: "THE DUE DATE SHOCK",
  story: ["The teacher says: ‘Just a reminder — your assessment is due tomorrow at 3.’", "Jordan was sure it was Friday.", "The real problem isn’t the assessment yet. It’s that Jordan doesn’t actually know what’s left."],
  autoEnergy: -8, autoWhy: "The surprise itself creates uncertainty and pressure, before Jordan knows anything real.",
  preTalk: ["What does Jordan need to know before reacting?"], question: "WHAT DOES JORDAN NEED TO KNOW FIRST?",
  investigation: {
    sources: [
      { id: "sheet", label: "TASK SHEET", role: "Requirements + criteria", impact: 2, direct: true,
        tellsJordan: "Exactly what’s required, and how much is genuinely left: one analysis section, a reference check, a final proofread — about 60 minutes.",
        why: "The task sheet spells out what’s still needed: one analysis section, a reference check, a final proofread — about 60 minutes of work in total. No second source needed.",
        tradeoff: "That answers WHAT is required and HOW MUCH is left. The assessment isn’t done — but Jordan now has something real to plan the hour around." },
      { id: "teacher", label: "TEACHER", role: "Clarify what remains", impact: 2, direct: true,
        tellsJordan: "A direct, current check on progress: one analysis section, a reference check and a final proofread still needed — about 60 minutes.",
        why: "The teacher checks Jordan’s progress directly and confirms the same thing: one analysis section, a reference check, a final proofread — about 60 minutes.",
        tradeoff: "That’s a direct answer on WHAT remains and HOW MUCH work is left. Jordan still has to decide where that hour actually fits into the rest of the day." },
      { id: "deadline", label: "DEADLINE / CALENDAR", role: "Timing + due point", impact: 1, direct: false,
        tellsJordan: "WHEN it’s due: tomorrow at 3 PM.",
        stillUnknown: "Exactly WHAT is left to do, and HOW LONG it will take.",
        why: "The calendar confirms WHEN it’s due — tomorrow at 3 PM — but not WHAT is left or HOW LONG it’ll take, so a quick Task Sheet or Teacher check is still needed.",
        tradeoff: "Useful — but it only answers the timing question. One more source before the workload is actually clear." },
      { id: "peer", label: "PEER", role: "Context + what they noticed", impact: 1, direct: false,
        tellsJordan: "General context — what a classmate noticed, or thinks is required.",
        stillUnknown: "Jordan’s own exact remaining work, and how long it’ll actually take.",
        why: "A peer can give useful context — what they noticed, what they think is required — but can’t confirm Jordan’s own exact remaining work.",
        tradeoff: "Useful, but not enough to plan a workload around. A second check turns a guess into something reliable." }
    ]
  },
  buildStateMutation(id) { return d => { const s = ROUND3.investigation.sources.find(x => x.id === id); d.energy = clampEnergy(d.energy + s.impact); if (s.direct) d.assessmentRemaining = 60; }; },
  followupMutation() { return d => { d.assessmentRemaining = 60; }; },
  stuckPrompts: [
    { when: "IF THEY GO STRAIGHT TO TASK SHEET OR TEACHER", lines: ["Good — what does that source tell Jordan the others couldn’t?"] },
    { when: "IF THEY CHOOSE DEADLINE OR PEER AND THINK THEY’RE DONE", lines: ["What does Jordan actually know now? What’s still missing?", "Is that enough to plan tonight around?"] },
    { when: "IF THEY TREAT PEER AS UNRELIABLE OR “WRONG”", lines: ["Is a peer’s information wrong, or just incomplete? What’s the difference?"] },
    { when: "IF THEY WANT TO CHECK EVERY SOURCE AT ONCE", lines: ["What’s the fastest path to a clear answer — does Jordan need all four, or just enough?"] }
  ],
  suggestedAnswers: [
    "“Task Sheet, because it tells you exactly what’s required.”",
    "“Teacher, because they can answer questions the sheet can’t.”",
    "“Deadline, because Jordan needs to know how much time there actually is.”",
    "“Peer, because someone in class probably already knows what’s going on.”"
  ],
  listenFor: [
    "WHEN, WHAT and HOW MUCH are three different questions, not one.",
    "Getting accurate information before reacting, instead of guessing under pressure.",
    "A source can be useful without being complete.",
    "Reducing uncertainty is real progress, even before any work actually gets done."
  ],
  misconception: { claim: "Checking with a peer was a bad or unreliable choice.", response: "A peer isn’t wrong — they’re incomplete. What they know is real and useful; it just can’t confirm Jordan’s own exact workload the way the Task Sheet or Teacher can." },
  selfCareLink: "Getting accurate information can be self-care in itself. Uncertainty uses capacity too.",
  moments: {
    r3_story: {
      selfCareLink: "Uncertainty has a cost of its own, even before Jordan does anything about it. Reducing it is progress.",
      stuckPrompts: [{ when: "IF STUDENTS WANT TO JUMP STRAIGHT TO ‘HOW’S JORDAN GOING TO GET IT DONE’", lines: ["Slow down — Jordan doesn’t even know what’s actually left yet. What would tell them that first?"] }]
    },
    r3_investigate: {
      purpose: "Show that different sources answer different questions — not that some sources are wrong.",
      stuckPrompts: [{ when: "IF THEY WANT TO CHECK EVERY SOURCE AT ONCE", lines: ["What’s the fastest path to a clear answer — does Jordan need all four, or just enough?"] }]
    },
    r3_followup: {
      purpose: "Complete the picture with a direct check — this isn’t correcting a wrong first answer.",
      stuckPrompts: [{ when: "IF THEY THINK THE FIRST CHECK WAS A MISTAKE", lines: ["The first source wasn’t wrong — it just wasn’t enough on its own. What’s still missing?"] }]
    },
    r3_result: {
      listenFor: ["Whether students can say what Jordan now knows, separately from whether the work is actually done."],
      selfCareLink: "Reducing uncertainty doesn’t finish the assessment — but it gives Jordan something real to plan the rest of the day around."
    }
  }
};

const ROUND4 = {
  round: 4, time: "12:45 PM", part: "Lunch", title: "LUNCH GETS COMPLICATED",
  getStory: (_rs, gs) => [
    "Jordan is hungry. Jordan wants a break. And now the friend from this morning wants to talk.",
    gs.friendKnownBeforeLunch
      ? "The class already checked that DM this morning, so Jordan knows what this is about. The friend comes over: ‘Hey. Can we talk?’"
      : "That DM got left for later this morning, so Jordan still has no idea what this is about. The friend comes over: ‘I messaged you earlier. Can we talk? It’s about Sam.’",
    "Two real needs. One lunch break."
  ],
  autoEnergy: -4, autoWhy: "Two things Jordan actually cares about just landed at the same time.",
  preTalk: ["Can Jordan be there for the friend without completely ignoring what Jordan needs?"], question: "HOW DOES JORDAN HANDLE BOTH?",
  dialoguePrompt: "OKAY — WHAT WOULD JORDAN ACTUALLY SAY?",
  choices: [
    { id: "eat_listen", short: "EAT + LISTEN", label: "Eat while listening.", impact: 1, lunch: "covered", hunger: false, friend: "resolved",
      why: "Jordan combines the conversation with lunch, so both needs get covered in the same ten minutes.",
      tradeoff: "There’s not much separate downtime in this — eating and listening happen in the same breath.",
      scripts: ["Come sit with me while I eat. Tell me what happened.", "I want to hear it — I’m going to eat while we talk."] },
    { id: "ten_first", short: "TEN MINUTES FIRST", label: "Eat for ten minutes first, then talk.", impact: 2, lunch: "covered", hunger: false, friend: "resolved",
      why: "Jordan sets a short, clear boundary, eats first, then actually follows through with the friend.",
      tradeoff: "The friend waits ten minutes for it.",
      scripts: ["Give me ten minutes to eat first, then I’ll come find you.", "I do want to talk. Can I eat first and find you in ten?"] },
    { id: "urgency", short: "CHECK URGENCY", label: "Check whether it needs to happen now.", impact: 1, lunch: "covered", hunger: false, friend: "pending",
      why: "Jordan checks in first. The friend says it can wait, so Jordan eats — and the real conversation stays open.",
      tradeoff: "The full conversation moves later, which means it’s still something Jordan has to come back to.",
      scripts: ["Are you okay? If you are, can we talk after school?", "Is this urgent, or can we talk later when I’ve got more space?"] },
    { id: "go_now", short: "GO NOW", label: "Go with the friend straight away.", impact: -1, lunch: "missed", hunger: true, friend: "resolved",
      why: "Jordan gives the friend Jordan’s full attention right away — the conversation gets handled.",
      tradeoff: "Lunch gets missed, and that hunger doesn’t just disappear — it carries into the afternoon.",
      scripts: ["Okay. Come on — tell me what happened.", "Yep, let’s go. What happened?"] }
  ],
  buildStateMutation(id) { return d => { const c = ROUND4.choices.find(x => x.id === id); d.energy = clampEnergy(d.energy + c.impact); d.lunchHistory = c.lunch; d.currentHunger = c.hunger; d.friendStatus = c.friend; }; },
  stuckPrompts: [
    { when: "IF THEY SAY A GOOD FRIEND MUST DROP EVERYTHING", lines: ["What does Jordan also need right now? Does going immediately make that need disappear?"] },
    { when: "IF THEY THINK “CHECK URGENCY” IS BRUSHING THE FRIEND OFF", lines: ["Jordan still checks in, and still follows up later. What’s actually different between that and ignoring the friend?"] },
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
    "A boundary that holds two needs at once, rather than forcing a pick between them.",
    "The difference between postponing something and dismissing it.",
    "What the class thinks a good friend actually owes someone here.",
    "Food (immediate) and the relationship (ongoing) are both real needs — neither cancels the other out."
  ],
  misconception: { claim: "A caring person always drops their own needs for someone else.", response: "Being there for a friend and looking after yourself aren’t automatically opposites. A short, clear line — ‘give me ten minutes’ — can hold both at once." },
  selfCareLink: "Boundaries don’t have to mean rejecting someone. The right wording can take a friend seriously and still protect what Jordan needs.",
  moments: {
    r4_story: {
      selfCareLink: "This isn’t really friend versus self-care — Jordan cares about the friend and is hungry. Both are true.",
      stuckPrompts: [{ when: "IF STUDENTS SAY “JUST GO” WITHOUT DISCUSSING IT", lines: ["What does Jordan also need right now, ten minutes into lunch?"] }]
    },
    r4_choice: {
      purpose: "This isn’t friend versus self-care — Jordan cares about the friend and needs lunch. Find an approach that can hold both.",
      stuckPrompts: [{ when: "IF “A GOOD FRIEND SHOULD JUST GO” COMES UP", lines: ["Maybe. But does being a good friend mean Jordan’s own needs just disappear?"] }]
    },
    r4_dialogue: {
      purpose: "Turn the chosen approach into words a real Year 10 student would actually say.",
      stuckPrompts: [{ when: "IF THE WORDING SOUNDS TOO FORMAL OR SCRIPTED", lines: ["People don’t talk in strategy labels — what would Jordan actually say out loud?"] }]
    },
    r4_result: {
      listenFor: ["Whether the wording the class chose actually matches the approach it came from."],
      selfCareLink: "The exact words mattered here as much as the decision — communication can protect a friendship and a need at the same time."
    }
  }
};

const ROUND5 = {
  round: 5, time: "3:12 PM", part: "After school", title: "THE MESSAGE",
  story: ["School’s done. Jordan’s rostered to start work at 4:30.", "Then the manager texts: ‘Any chance you can start at 3:45?’", "The extra money would help. But saying yes means giving up most of the only free time Jordan has before work."],
  autoEnergy: 0, preTalk: ["What are you willing to give up for the extra money?"], question: "HOW MUCH OF THE AFTERNOON ARE YOU WILLING TO TRADE?",
  choices: [
    { id: "yes", short: "YES — 3:45", label: "Yes — start at 3:45.", meta: "Keep about 15 min · +45 paid min", workStart: 945, gapMinutes: 15, extraPaidMinutes: 45, workImpact: -8,
      why: "45 extra paid minutes — but the longer shift costs more energy, and only 15 minutes are left before it starts.",
      tradeoff: "The smallest possible gap for food, assessment, a friend, a reset, or just having time to breathe before work." },
    { id: "compromise", short: "COMPROMISE — 4:00", label: "Compromise — offer 4:00.", meta: "Keep about 30 min · +30 paid min", workStart: 960, gapMinutes: 30, extraPaidMinutes: 30, workImpact: -7,
      why: "30 usable minutes before work, and 30 extra paid minutes on the shift — a genuine split.",
      tradeoff: "30 minutes still can’t cover everything if more than one thing is unresolved." },
    { id: "no", short: "NO — 4:30", label: "No — keep the rostered 4:30 start.", meta: "Keep about 60 min · +0 paid min", workStart: 990, gapMinutes: 60, extraPaidMinutes: 0, workImpact: -6,
      why: "The full 60-minute gap before work, and the shortest, least draining shift of the three.",
      tradeoff: "No extra pay — the trade for keeping the most usable time before work starts." }
  ],
  gapActions: [
    { id: "assessment", label: "Assessment — 20 min", duration: 20, impact: -2, repeat: true, description: "One focused 20-minute block of the actual assessment. Reduces what’s left later — but focused work still costs energy now." },
    { id: "friend", label: "Talk to friend — 10 min", duration: 10, impact: -1, description: "Ten minutes for the pending friend conversation. Resolves it — but still takes attention and energy." },
    { id: "food", label: "Get food — 10 min", duration: 10, impact: 3, description: "Only shows up if lunch was missed and Jordan’s still hungry. Clears the active hunger problem before the shift starts." },
    { id: "reset", label: "Proper reset — 15 min", duration: 15, impact: 2, description: "A genuine low-demand break before the next thing starts. Restores some capacity — doesn’t complete anything else." },
    { id: "organise", label: "Get organised — 10 min", duration: 10, impact: -1, description: "Sort out what Jordan will need later. Smooths things out story-wise, but no hidden Energy bonus — and it does NOT count as tomorrow basics." }
  ],
  lifeEvents: [
    { id: "shift_late", title: "Shift runs late", text: "Work runs until 6:30. Jordan gets home around 6:50.", impact: -3, why: "Another 30 paid minutes — but the normal 7:00 basketball start is gone. The evening has to be rebuilt around it." },
    { id: "training_moved", title: "Training moved", text: "Basketball’s been moved to 7:20–8:50.", impact: 0, why: "A bigger window before basketball, but a later return home. The time gets redistributed, not gained." },
    { id: "home_loud", title: "Home is loud", text: "Home’s loud and busy until 7:15. Focused assessment work is off the table until then.", impact: 0, why: "That early window can’t be used for focused study — though lower-focus things still fit. The plan adapts; it doesn’t stop." }
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
    "Finite time — the gap is real minutes, not a wish list.",
    "Leaving time open on purpose is a choice too, not automatically a wasted one.",
    "Money vs time as a genuine, values-based trade — not an obvious answer either way.",
    "What this gap protects for later, versus what it spends right now."
  ],
  misconception: { claim: "Working less is always better self-care.", response: "Not necessarily — the money genuinely matters too. NO isn’t automatically the ‘healthy’ answer here; it’s one trade among three real ones, each buying something different." },
  selfCareLink: "Self-care includes understanding what you’re actually spending — time, energy, money, attention — and choosing the trade deliberately.",
  moments: {
    r5_story: {
      purpose: "Turn a work text into a real resource decision — money against the only free block Jordan has before the shift.",
      stuckPrompts: [{ when: "IF STUDENTS TREAT THIS AS AN OBVIOUS ‘SAY NO’", lines: ["Would that answer change if the extra money genuinely mattered to Jordan right now?"] }]
    },
    r5_choice: {
      suggestedAnswers: [
        "“Start at 3:45 because the extra money matters.”",
        "“Keep 4:30 because Jordan already has too much following them.”",
        "“Compromise, because it keeps some time without giving up all the extra work.”",
        "“It depends on whether Jordan’s hungry or still has the friend to deal with.”"
      ],
      stuckPrompts: [{ when: "IF THE CLASS TREATS “NO” AS THE OBVIOUSLY RIGHT CHOICE", lines: ["What would make the extra 45 minutes actually worth it?", "Is keeping the full hour automatically the better call?"] }],
      misconception: { claim: "Working less is always better self-care.", response: "Not necessarily. Money matters too — the point is noticing what Jordan is choosing to trade, not assuming less work always wins." }
    },
    r5_gap: {
      purpose: "Live with the work decision — spend a real, limited number of minutes, not an ideal wish list.",
      listenFor: ["Whether the class notices which needs are already handled and don’t need this time at all."],
      selfCareLink: "This isn’t ‘pick the relaxing thing’ — it’s realistic resource management. Jordan can’t give every need everything it wants right now."
    },
    r5_work_result: {
      purpose: "Show that the work result isn’t isolated — it’s built from the lunch and gap decisions that came before it.",
      stuckPrompts: [{ when: "IF STUDENTS TREAT THE SHIFT RESULT AS A FRESH START", lines: ["What did Jordan carry into this shift from earlier choices — hunger, unfinished assessment, a pending friend?"] }],
      selfCareLink: "Choices build on each other. Self-care isn’t one isolated good decision — it’s noticing when an earlier one changes what’s needed later."
    },
    r5_life2: {
      stuckPrompts: [{ when: "IF THE EVENT FEELS LIKE IT “RUINS” THE EVENING", lines: ["Focused work might be blocked, but is everything blocked — or just one kind of thing?"] }],
      selfCareLink: "A changed environment usually means changing the plan, not abandoning it."
    }
  }
};

const ROUND6 = {
  round: 6, time: "6:20 PM", part: "Home / Basketball", title: "HOME — AND THE DAY ISN’T DONE",
  autoEnergy: 0,
  getStory: (_rs, gs) => {
    if (gs.homeTime === 1130) return ["Work ran late. Jordan gets home at 6:50 — too late for a normal 7:00 basketball start.", "The evening now has a genuine collision in it.", "The class builds the evening up to 10:00 PM. The last 30 minutes stays aside for the Reality Check and getting ready for bed."];
    if (gs.trainingStart === 1160) return ["Jordan’s home around 6:20.", "Training’s moved to 7:20–8:50 — a bigger window before it, but a later night.", "The class builds the evening up to 10:00 PM. The last 30 minutes stays aside for the Reality Check and getting ready for bed."];
    return ["Jordan’s finally home.", "Basketball is 7:00–8:30, with getting-ready and travel fixed around it.", "The class builds the evening up to 10:00 PM. The last 30 minutes stays aside for the Reality Check and getting ready for bed."];
  },
  preTalk: ["Something isn’t fitting tonight. What goes?"],
  followingHomeHeading: "WHAT IS FOLLOWING JORDAN HOME?",
  notEverythingFits: "THERE ISN’T ROOM FOR EVERYTHING.",
  basketballAttendImpact: 1,
  planningEnd: 22 * 60,             // 10:00 PM — the last 30 min is kept as the Round 7 pre-bed buffer
  targetBedtime: 22 * 60 + 30,
  actions: [
    { id: "dinner", label: "Dinner", duration: 20, impact: 3, description: "20 minutes to actually eat. Covers the food need and restores some immediate capacity." },
    { id: "assessment", label: "Assessment", duration: 20, impact: -2, repeat: true, description: "One 20-minute assessment block. Each one chips away at tomorrow’s load — but costs energy right now." },
    { id: "reset", label: "Proper reset", duration: 15, impact: 2, description: "15 genuine, low-demand minutes. Restores some capacity — doesn’t make anything else disappear." },
    { id: "friend", label: "Talk to friend", duration: 10, impact: -1, description: "Finish the pending conversation, if it’s still open. Protects the relationship — costs time and attention." },
    { id: "basics", label: "Tomorrow basics", duration: 10, impact: -1, description: "Pack and charge what tomorrow needs. Small cost tonight — but it comes off Tomorrow Load." }
  ],
  stuckPrompts: [
    { when: "IF THEY TRY TO SCHEDULE EVERYTHING", lines: ["Stop there. You’ve got 15 minutes and both of those need 20. Which one goes?"] },
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
    "A plan that physically fits the clock, not a wish list.",
    "Which fixed things genuinely stay fixed, and what can still move.",
    "Not everything fitting is a real outcome here, not a failure.",
    "What the class is protecting — capacity, responsibility, connection, enjoyment, or tomorrow."
  ],
  misconception: { claim: "Jordan should just skip basketball.", response: "That creates time. It doesn’t magically create Energy — and basketball is also something Jordan values. Self-care isn’t automatically cancelling everything enjoyable." },
  selfCareLink: "A plan that physically fits matters more than an ideal one. Sometimes self-care is accepting the limit and deciding on purpose what won’t fit.",
  moments: {
    r6_story: {
      purpose: "Before anything gets scheduled, make the class actually look at what the day has already handed Jordan — some of it chosen, some of it just happening.",
      stuckPrompts: [{ when: "IF STUDENTS TREAT THE EVENING AS A FRESH START", lines: ["None of this appeared out of nowhere — what on that list came from an earlier decision?"] }]
    },
    r6_basketball: {
      purpose: "Decide basketball first, because it changes the actual clock before anything else gets placed.",
      listenFor: ["What keeping basketball protects for Jordan, versus what skipping it actually creates."],
      misconception: { claim: "Just skip basketball.", response: "That gives Jordan more time — it doesn’t give Jordan more Energy. Basketball is also something Jordan values. Self-care isn’t automatically cancelling everything enjoyable." },
      selfCareLink: "A realistic plan holds responsibilities AND the things that actually matter to Jordan."
    },
    r6_timeline: {
      purpose: "Build what actually fits on the real clock — not what would be ideal.",
      stuckPrompts: [
        { when: "IF STUDENTS DESCRIBE WHAT JORDAN SHOULD DO IN AN IDEAL WORLD", lines: ["Don’t tell me what Jordan should do — tell me what actually fits."] },
        { when: "IF SOMETHING DOESN’T FIT A WINDOW", lines: ["There’s the collision. That needs 20, you’ve got 15 — what moves?"] }
      ],
      selfCareLink: "An ideal plan that can’t physically happen isn’t a useful plan. Sometimes self-care is accepting the limit and deciding, on purpose, what won’t fit."
    },
    r6_result: {
      listenFor: ["Which earlier decision — the morning, the work choice, the gap — had the biggest effect on how tonight actually laid out."]
    }
  }
};

const ROUND7 = {
  round: 7, time: "10:00 PM", part: "Evening", title: "REALITY CHECK",
  autoEnergy: 0,
  intro: "Only what’s genuinely unresolved comes back. Jordan uses the time before target bedtime first; bedtime only moves later if that time runs out.",
  stopHeading: "STOP. LOOK AT WHAT YOUR DAY CREATED.",
  askBeforeChoices: ["What ACTUALLY needs a decision tonight?", "What can realistically go to tomorrow?"],
  lifeEvents: [
    { id: "extra_class_time", title: "Extra class time tomorrow", text: "The teacher confirms up to 20 minutes of class time tomorrow can go toward the assessment.", impact: 1,
      why: "A real 20-minute window tomorrow. It makes the deferred work easier to place — it doesn’t erase it.",
      eligible: gs => gs.assessmentTomorrow > 0 },
    { id: "task_quicker", title: "Task quicker than expected", text: "One section takes about ten minutes less than expected.", impact: 2,
      why: "Ten unexpected minutes just came back into the evening.",
      eligible: gs => gs.assessmentWorkedTonight === true },
    { id: "group_chat_lights", title: "Group chat lights up", text: "The group chat suddenly starts buzzing again.", impact: -2,
      why: "Something Jordan left active is back. Muted or already-parked-for-tomorrow content can’t trigger this.",
      eligible: gs => gs.groupChatStatus === "later" }
  ],
  stuckPrompts: [
    { when: "IF THEY WANT TO INVENT EXTRA WORK", lines: ["Check the list again — is that actually still unresolved, or already dealt with?"] },
    { when: "IF THEY WANT TO FINISH EVERYTHING TONIGHT NO MATTER THE COST", lines: ["Okay — put the minutes on the clock. What happens to bedtime?"] },
    { when: "IF THEY TREAT MOVING WORK TO TOMORROW AS FAILURE", lines: ["Is this deliberate postponing, or avoidance? What’s the actual difference?"] },
    { when: "IF THE CLASS IS UNSURE WHAT’S LEFT", lines: ["Read the three numbers again: current time, free before bed, Tomorrow Load. What does that actually tell you?"] }
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
    "Whether a deferral was decided on purpose, with a plan, or just avoided.",
    "Bedtime treated as a real limit, not an afterthought."
  ],
  misconception: { claim: "Just finish everything tonight.", response: "There’s a real limit here — bedtime. Every extra minute of work is a minute straight off sleep. Sometimes planning tomorrow properly is the more realistic choice than forcing tonight to hold everything." },
  selfCareLink: "Moving something to tomorrow isn’t automatically avoidance. It depends on whether the decision is deliberate and whether tomorrow can realistically carry it.",
  moments: {
    r7_reality: {
      purpose: "Only look at what’s genuinely still unfinished — this isn’t adding new jobs to the day.",
      stuckPrompts: [{ when: "IF STUDENTS START WORRYING ABOUT THINGS ALREADY HANDLED", lines: ["Read the clock before deciding anything — is that actually still open, or already sorted?"] }]
    },
    r7_life3: {
      purpose: "Not every run gets a late complication — this only fires if it’s still genuinely possible.",
      stuckPrompts: [{ when: "IF STUDENTS ASK WHY NOTHING HAPPENED", lines: ["What would have had to still be unresolved for this to trigger at all?"] }]
    }
  }
};

const ROUND8 = {
  round: 8, time: "Bed", part: "Final decision", title: "ONE LAST DECISION", autoEnergy: 0, voteTimerSeconds: 10,
  getStory: (_rs, gs) => ["Jordan’s in bed. One last message lands:", gs.friendStatus === "pending" ? "YOU AWAKE?? I never got to tell you what happened with Sam." : "YOU AWAKE?? Quick question.", "No more information is coming."],
  question: "YOU DON’T KNOW WHAT THIS MESSAGE IS ABOUT. HOW MUCH DO YOU GIVE IT TONIGHT?",
  voteAnticipation: "No more information is coming. You’ve got 10 seconds.",
  choices: [
    { id: "reply", short: "REPLY", label: "Reply: ‘What’s up?’", impact: 0, duration: 3, why: "Jordan opens the door without knowing how far it’s about to swing.", tradeoff: "Keeps the connection open tonight, but hands the rest of the night over to whatever comes back." },
    { id: "can_wait", short: "CHECK IF IT CAN WAIT", label: "‘I’m wrecked. Are you okay, or can we talk tomorrow?’", impact: 1, duration: 2, why: "Jordan checks for anything urgent while setting a clear limit for tonight.", tradeoff: "Sleep’s protected and urgency gets checked, but the fuller conversation may still land tomorrow." },
    { id: "call", short: "CALL", label: "Call the friend.", impact: -2, duration: 12, why: "Jordan gives it real time and attention, right now, by calling.", tradeoff: "The most space for the friend tonight — at the cost of time and energy at the very end of the day." },
    { id: "morning", short: "LEAVE UNTIL MORNING", label: "Leave the message until morning.", impact: 1, duration: 0, why: "Jordan decides tonight isn’t the moment to open this.", tradeoff: "Protects what’s left of the night completely — but the message sits unanswered until morning." }
  ],
  stuckPrompts: [
    { when: "IF THEY ASSUME THE MESSAGE IS AN EMERGENCY", lines: ["What are you assuming? What does the message actually say?"] },
    { when: "IF THEY ASSUME IT’S NOTHING IMPORTANT", lines: ["What are you assuming this time? Could you be just as wrong the other way?"] },
    { when: "IF THE CLASS IS SPLIT", lines: ["What is each option protecting — the friendship, the boundary, or the sleep?"] },
    { when: "IF STUDENTS ASK WHAT REALLY HAPPENED WITH SAM", lines: ["That’s deliberately left unknown — Jordan has to decide without it, the way real late-night messages often arrive with no context at all."] }
  ],
  suggestedAnswers: [
    "“Reply, because leaving a friend on read at night feels wrong.”",
    "“Check if it can wait, because Jordan is exhausted and still cares.”",
    "“Call, because a call sorts it out properly instead of a long text back-and-forth.”",
    "“Leave it until morning, because Jordan has been going since 7:10 AM.”"
  ],
  listenFor: [
    "Deciding under genuine uncertainty — there isn’t enough information to be sure.",
    "Boundaries and responsiveness sitting in the same choice, not opposite ones.",
    "What each option is actually protecting: sleep, the relationship, or a bit of both.",
    "Nobody hunting for the one correct answer — there isn’t one being taught here."
  ],
  misconception: { claim: "Leaving the message is the self-care answer.", response: "Protecting sleep is one legitimate value here — but so is responding to a friend. There isn’t a single ‘self-care’ option; each one is protecting something different." },
  selfCareLink: "Boundaries, relationships and uncertainty can all exist at the same time. There may not be one perfect response.",
  moments: {
    r8_story: {
      stuckPrompts: [{ when: "IF STUDENTS WANT MORE CONTEXT BEFORE DECIDING ANYTHING", lines: ["That’s the point — Jordan doesn’t have it either."] }]
    },
    r8_choice: {
      purpose: "Decide with genuinely incomplete information — no extra clue is coming before the vote.",
      stuckPrompts: [{ when: "IF STUDENTS DEMAND MORE INFORMATION BEFORE VOTING", lines: ["What are you assuming?", "What are you actually trying to protect?"] }]
    },
    r8_result: {
      listenFor: ["Whether students can name what the choice protected without being told it was right or wrong."],
      selfCareLink: "The last decision of the day still isn’t a test — it’s one more moment of deciding what to protect with limited information."
    }
  }
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
    lines.push(gs.extraPaidMinutes > 0 ? `The class traded part of the afternoon for money — Jordan picked up ${gs.extraPaidMinutes} extra paid minutes at work.` : "The class kept the afternoon over the extra pay — Jordan worked the rostered shift.");
    if (gs.friendStatus === "resolved") lines.push("The friend conversation got handled somewhere across the day.");
    else if (gs.friendStatus === "pending") lines.push("The friend conversation never fully closed — still pending at the end of the day.");
    if (gs.basketballStatus === "attend" || gs.basketballStatus === "late") lines.push(gs.basketballStatus === "late" ? "Basketball still happened tonight, just later than planned." : "Basketball stayed.");
    else if (gs.basketballStatus === "skip") lines.push("Basketball got skipped — that opened up time the class spent elsewhere.");
    if (gs.assessmentTomorrow > 0) lines.push(`${gs.assessmentTomorrow} minutes of assessment is following Jordan into tomorrow.`);
    else lines.push("The assessment got fully dealt with today.");
    return lines;
  },
  debrief: ["Would you run this day again?", "If you could change ONE decision, which one?", "What consequence would that new decision create?"],
  closing: "SELF-CARE ISN’T KEEPING THE BATTERY AT 100.",
  closingScript: "A high Energy number can mean Jordan protected capacity — but it can also mean more got left for tomorrow. A lower number can mean Jordan spent capacity on work, school, people, or something Jordan actually cared about. The number only ever tells part of the story."
};
