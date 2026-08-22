(function () {
  "use strict";

  const STATE_VERSION = 3;
  const STORAGE_KEY = "resetExe.gameState.v3";
  const CHANNEL_NAME = "reset-exe-classroom-sync";
  const STUDENT_ID_KEY = "resetExe.studentId";
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view") === "student" ? "student" : "facilitator";
  const isFacilitator = view === "facilitator";
  const app = document.getElementById("app");

  const PHOTO_TIMES = ["12:39 PM", "12:54 PM", "1:08 PM"];
  const PHOTO_ASSETS = ["assets/lunch-recovered.svg", "assets/lunch-recovered.svg", "assets/lunch-recovered.svg"];

  const ACTION_ICONS = {
    english: "doc", maths: "cap", eat: "fork", friendFull: "chat", boundary: "shield",
    shower: "drop", scroll: "loop", perfectPrep: "sparkle", sleep: "moon"
  };

  const ACTION_CATEGORY = {
    maths: "purple", eat: "amber", shower: "cyan", boundary: "green", english: "blue",
    scroll: "muted-red", sleep: "cyan", friendFull: "blue", perfectPrep: "amber"
  };

  // Local, per-tab animation ledgers — intentionally NOT part of `state`.
  // They decide whether *this* tab still needs to play a one-shot glitch for
  // an event it has already synced/rendered, so recovery/completion glitches
  // never replay on an unrelated re-render, a facilitator RE-SYNC, or a reconnect.
  const animatedPhotoSeq = {};
  const animatedCompletion = {};

  const ICON_PATHS = {
    cap: '<path d="M12 4 3 9l9 5 9-5-9-5Z"/><path d="M7 11.2V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.8"/><path d="M21 9v5.2"/>',
    doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 9.5h2M9.5 13h5M9.5 16h5"/>',
    fork: '<path d="M7 2v7a1.5 1.5 0 0 0 3 0V2M8.5 9v13"/><path d="M16 2c-1.4 0-2 2.3-2 4.5S14.6 11 16 11s2-2.3 2-4.5S17.4 2 16 2Zm0 9v11"/>',
    chat: '<path d="M4 5h16v11H9l-4 4V5Z"/><path d="M8 9h8M8 12.2h5"/>',
    shield: '<path d="M12 3 5 6v6c0 5 3.5 7.5 7 9 3.5-1.5 7-4 7-9V6l-7-3Z"/><path d="M9.3 12l1.9 1.9L15.2 10"/>',
    drop: '<path d="M12 3s6.2 7.3 6.2 11.2A6.2 6.2 0 0 1 5.8 14.2C5.8 10.3 12 3 12 3Z"/>',
    loop: '<path d="M4.5 12a7.5 7.5 0 0 1 13-5"/><path d="M17.5 3v4h-4"/><path d="M19.5 12a7.5 7.5 0 0 1-13 5"/><path d="M6.5 21v-4h4"/>',
    sparkle: '<path d="M12 3l1.7 5.7L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.3L12 3Z"/>',
    moon: '<path d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.8 6.8 0 0 0 10.2 10.2Z"/>',
    warning: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4.2"/><circle cx="12" cy="17.3" r=".9" fill="currentColor" stroke="none"/>',
    home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    person: '<circle cx="12" cy="8.3" r="3.3"/><path d="M5 20c0-4.1 3.2-6.6 7-6.6s7 2.5 7 6.6"/>',
    upload: '<path d="M12 16.5V4.5"/><path d="M6.8 9.6 12 4.4l5.2 5.2"/><path d="M4.5 20h15"/>',
    battery: '<rect x="2.5" y="8" width="16" height="8" rx="2"/><path d="M21 10.5v3"/>'
  };

  const INITIAL_BOARD = {
    confirmed: ["RESET.EXE failed at 10:41 PM."],
    possible: ["The assistant may have missed important context."],
    unresolved: [
      "What happened during the day?",
      "Why did RESET.EXE fail?",
      "Was there one major cause?"
    ]
  };

  const SCENES = [
    {
      id: "opening",
      file: "RECOVERY MODE",
      title: "Device Recovery",
      objective: "Rebuild Jordan's day and find why RESET.EXE's decision model failed.",
      type: "opening",
      script: "This phone belongs to Jordan. RESET.EXE is an on-device assistant that reacts to fatigue, stress and unfinished tasks. At 10:41 PM its decision model failed. Recover the day and work out where its advice stopped fitting the situation.",
      expected: "Start recovery. Students only need to understand that RESET.EXE gave advice during the day and later failed.",
      hints: [],
      reveal: "Recovery mode has loaded. The class can begin opening recovered phone data.",
      board: {},
      autoComplete: true
    },
    {
      id: "activity",
      file: "FILE 01",
      title: "Device Activity",
      objective: "Use the activity log to make the most useful evidence-based conclusion.",
      type: "choice",
      script: "This first one is deliberately accessible. Let students notice that the useful conclusion comes from the timing, not from judging the app.",
      expected: "Best answer: B. Jordan probably had limited sleep.",
      scanRecommended: false,
      hints: [
        "Look at the gap between the last phone activity and the first alarm.",
        "Jordan's phone locked at 1:51 AM and the first alarm was at 6:45 AM.",
        "Focus on sleep opportunity rather than what app Jordan used."
      ],
      evidence: {
        kind: "activityTable",
        rows: [
          ["12:58 AM", "TikTok active"],
          ["1:17 AM", "TikTok active"],
          ["1:36 AM", "TikTok active"],
          ["1:51 AM", "Screen locked"],
          ["6:45 AM", "Alarm"],
          ["6:54 AM", "Alarm snoozed"],
          ["7:03 AM", "Alarm snoozed"],
          ["7:12 AM", "Alarm snoozed"],
          ["7:19 AM", "Screen unlocked"],
          ["7:31 AM", "Maps opened"]
        ]
      },
      prompt: "What is the most useful conclusion from this data?",
      choices: [
        ["a", "Jordan likes TikTok."],
        ["b", "Jordan probably had limited sleep."],
        ["c", "Jordan does not like mornings."],
        ["d", "The phone battery was probably low."]
      ],
      answer: {
        kind: "single",
        correct: "b",
        feedback: {
          a: "That describes an app in the log, but it does not explain the timing of the morning.",
          c: "Possible, but the evidence supports something more specific than a personality trait.",
          d: "Battery matters later, but this log is mostly about time awake and alarms."
        }
      },
      reveal: "Jordan's phone was active until 1:51 AM and the first alarm began at 6:45 AM. That means Jordan had roughly five hours of sleep opportunity before the morning even began.",
      afterComplete: "FACT RECOVERED: Jordan had approximately five hours of sleep opportunity.\n\n6:45 AM\nFATIGUE DETECTED\nRecommendation: Stay in bed longer. Rest supports wellbeing.\n\nFLAG FOR REVIEW",
      board: {
        confirmed: ["Jordan had limited sleep.", "Jordan snoozed several alarms."],
        unresolved: ["Did extra rest help?", "What happened next?"],
        remove: {
          unresolved: ["What happened during the day?"]
        }
      }
    },
    {
      id: "morning",
      file: "FILE 02",
      title: "Morning Trace",
      objective: "Reconstruct the morning and identify two likely consequences.",
      type: "multi",
      script: "Ask the operator to open the timeline. The class is connecting cause and consequence here.",
      expected: "Best evidence: missed usual bus + skipped breakfast.",
      hints: [
        "Look at what happened after the snoozed alarms.",
        "Compare the phone unlock time, the usual bus time, and the breakfast reminder.",
        "The two strongest consequences are transport and breakfast."
      ],
      evidence: {
        kind: "timeline",
        rows: [
          ["7:19 AM", "phone unlocked"],
          ["7:31 AM", "Maps opened"],
          ["7:44 AM", "usual bus departs"],
          ["7:46 AM", "Breakfast reminder dismissed"],
          ["7:53 AM", "message sent: \"running late\""],
          ["8:11 AM", "later bus route opened"],
          ["8:47 AM", "school Wi-Fi connected"]
        ]
      },
      prompt: "Select the TWO events most likely connected to the extra time in bed.",
      max: 2,
      choices: [
        ["missedBus", "Missed usual bus"],
        ["skippedBreakfast", "Skipped breakfast"],
        ["laterArrival", "Later school arrival"],
        ["battery", "Phone battery fell"],
        ["friend", "Friend sent a message"]
      ],
      answer: {
        kind: "set",
        correct: ["missedBus", "skippedBreakfast"],
        feedback: "That may be part of the morning, but the strongest evidence points to the missed usual bus and the dismissed breakfast reminder."
      },
      reveal: "The later school arrival matters, but the two clearest immediate consequences are that Jordan missed the usual bus and appears to have skipped breakfast.",
      board: {
        confirmed: ["Jordan missed the usual bus.", "Jordan appears to have skipped breakfast."],
        unresolved: ["Was staying in bed the right advice?"],
        remove: {
          unresolved: ["Did extra rest help?", "What happened next?"]
        }
      }
    },
    {
      id: "morningReview",
      file: "FILE 02",
      title: "Audit 01 · Morning Advice",
      objective: "Decide whether the morning recommendation should be accepted, modified, or rejected.",
      type: "choice",
      script: "This is a class decision. The point is not that rest is bad; it is that context was missing.",
      expected: "Best answer: MODIFY.",
      hints: [
        "The advice was responding to real fatigue.",
        "Check what happened after the extra time in bed.",
        "The problem is not rest itself. The problem is that the advice ignored what came next."
      ],
      evidence: {
        kind: "log",
        cards: [
          ["ORIGINAL RECOMMENDATION", "Tired -> stay in bed longer."]
        ]
      },
      prompt: "Was RESET.EXE's morning advice right as written?",
      choices: [
        ["accept", "ACCEPT"],
        ["modify", "MODIFY"],
        ["reject", "REJECT"]
      ],
      answer: {
        kind: "single",
        correct: "modify",
        feedback: {
          accept: "Rest matters, but the morning timeline shows the recommendation created new pressure.",
          reject: "Rejecting rest completely goes too far. Jordan really was tired."
        }
      },
      reveal: "Rest matters. But RESET.EXE did not consider what Jordan needed to do next.",
      afterComplete: "FAILED RULE 01\n\"If tired, prioritise more rest.\"",
      board: {
        confirmed: ["RESET.EXE gave advice that was partly reasonable but missing context."],
        possible: ["RESET.EXE may be treating each problem separately."],
        remove: {
          unresolved: ["Was staying in bed the right advice?"]
        }
      }
    },
    {
      id: "calendar",
      file: "FILE 03",
      title: "Deadline Mismatch",
      objective: "Compare two sources and find the mismatch.",
      type: "connect",
      script: "Use Scan Mode here if the confident students tend to jump in. The useful observation is small: tomorrow is a draft check, not final submission.",
      expected: "Select ENGLISH DUE TOMORROW and Final submission: Monday.",
      scanRecommended: true,
      hints: [
        "Compare Jordan's calendar with the school portal.",
        "Look for two statements about the same English assessment.",
        "\"Draft check tomorrow\" is not the same as \"final submission tomorrow.\""
      ],
      evidence: {
        kind: "calendar",
        calendar: [
          ["ENGLISH DUE TOMORROW", "9:00 AM"],
          ["Work", "6:30 PM"],
          ["Maths upload", "11:59 PM"]
        ],
        portal: [
          "English",
          "Draft check: tomorrow",
          "Final submission: Monday",
          "Bring current progress to class."
        ]
      },
      prompt: "Something does not match. Find it.",
      max: 2,
      choices: [
        ["calendarEnglish", "Calendar: ENGLISH DUE TOMORROW"],
        ["portalDraft", "School Portal: Draft check tomorrow"],
        ["portalFinal", "School Portal: Final submission Monday"],
        ["work", "Calendar: Work 6:30 PM"],
        ["maths", "Calendar: Maths upload 11:59 PM"]
      ],
      answer: {
        kind: "set",
        correct: ["calendarEnglish", "portalFinal"],
        feedback: "Those items are related, but the contradiction is between Jordan's calendar wording and the portal's final submission date."
      },
      reveal: "MISINTERPRETATION DETECTED. The calendar entry was Jordan's own interpretation. The school portal says the draft check is tomorrow, but the final submission is Monday.",
      afterComplete: "10:34 AM\nDEADLINE PRESSURE DETECTED\nRecommendation: Use available breaks to complete outstanding work.",
      board: {
        confirmed: ["Jordan misunderstood the English deadline.", "Final English submission was Monday."],
        possible: ["Jordan may have sacrificed something unnecessary to complete it."],
        unresolved: ["What happened at lunch?"],
        remove: {
          unresolved: ["Why did RESET.EXE fail?"]
        }
      }
    },
    {
      id: "calendarQuestion",
      file: "FILE 03",
      title: "Audit 02 · Deadline Advice",
      objective: "Decide whether RESET.EXE had enough information.",
      type: "choice",
      script: "This locks in the idea that the system reacted to pressure without checking whether the pressure was accurate.",
      expected: "Best answer: NO.",
      hints: [
        "RESET.EXE detected pressure, but what created the pressure?",
        "The portal contained information that changed the urgency.",
        "A good recommendation needed to check whether the deadline belief was accurate."
      ],
      evidence: {
        kind: "log",
        cards: [
          ["CALENDAR", "ENGLISH DUE TOMORROW"],
          ["SCHOOL PORTAL", "Draft check tomorrow. Final submission Monday."],
          ["RESET.EXE", "Use available breaks to complete outstanding work."]
        ]
      },
      prompt: "Did RESET.EXE have enough information to make a good recommendation?",
      choices: [
        ["yes", "YES"],
        ["no", "NO"],
        ["notSure", "NOT SURE"]
      ],
      answer: {
        kind: "single",
        correct: "no",
        feedback: {
          yes: "The system knew Jordan felt pressure, but it had not checked the portal information.",
          notSure: "The recovered portal gives enough information to judge this: RESET.EXE was missing a key context check."
        }
      },
      reveal: "RESET.EXE reacted to the pressure. It did not check whether the pressure was based on accurate information.",
      board: {
        confirmed: ["RESET.EXE treated the assessment as urgent without checking the source."]
      }
    },
    {
      id: "photos",
      file: "FILE 04",
      title: "Lunch Photo Recovery",
      objective: "Use a recovered photo sequence and activity evidence.",
      type: "photoChoice",
      script: "Let the class inspect before options if possible. The photos alone suggest a pattern; the screen activity confirms it.",
      expected: "Best answer: B. Jordan spent most of lunch working.",
      scanRecommended: true,
      hints: [
        "Look for what changes between the three photos.",
        "Compare the photo times with what is still on the desk.",
        "The lunch remains there while the English document stays open."
      ],
      prompt: "What does the photo sequence suggest?",
      choices: [
        ["a", "Jordan disliked the lunch."],
        ["b", "Jordan spent most of lunch working."],
        ["c", "Jordan forgot their lunch."],
        ["d", "Jordan was waiting for someone."]
      ],
      answer: {
        kind: "single",
        correct: "b",
        feedback: {
          a: "That is possible in real life, but the sequence does not show a preference. It shows time passing while the same work remains open.",
          c: "The lunch is visible beside the laptop, so it probably was not forgotten.",
          d: "There is no evidence of waiting. The stronger evidence is the repeated English document activity."
        }
      },
      reveal: "Across 12:39 PM, 12:54 PM, and 1:08 PM, the English work stays open while lunch and the drink remain untouched. The supporting activity log shows school portal and English document activity through most of lunch.",
      afterComplete: "12:28 PM\nSTRESS LEVEL ELEVATED\nRecommendation: Use lunch period to reduce outstanding workload.\n\nSystem confidence: 98% -> 79%",
      confidence: 79,
      board: {
        confirmed: ["Jordan worked through most of lunch.", "Jordan's lunch appears to have remained untouched."],
        possible: ["RESET.EXE may be ignoring basic needs."],
        remove: {
          unresolved: ["What happened at lunch?"]
        }
      }
    },
    {
      id: "photoReview",
      file: "FILE 04",
      title: "Audit 03 · Lunch Advice",
      objective: "Evaluate the lunch recommendation with the recovered context.",
      type: "choice",
      script: "Keep the nuance: working can reduce pressure, but this was the wrong situation for that advice.",
      expected: "Best answer: HELPFUL IN THEORY, WRONG IN THIS SITUATION.",
      hints: [
        "The advice could make sense if the deadline were real and basic needs were covered.",
        "Jordan had already missed breakfast.",
        "Completing work can reduce pressure, but not every break should become more work."
      ],
      evidence: {
        kind: "log",
        cards: [
          ["12:28 PM", "STRESS LEVEL ELEVATED"],
          ["Recommendation", "Use lunch period to reduce outstanding workload."],
          ["Context", "Breakfast likely skipped. English final not due until Monday."]
        ]
      },
      prompt: "Was this recommendation:",
      choices: [
        ["helpful", "HELPFUL"],
        ["unhelpful", "UNHELPFUL"],
        ["theory", "HELPFUL IN THEORY, WRONG IN THIS SITUATION"]
      ],
      answer: {
        kind: "single",
        correct: "theory",
        feedback: {
          helpful: "It sounds productive, but it ignores the missed breakfast and the misread deadline.",
          unhelpful: "It is not always bad to use time to reduce pressure. The issue is the situation."
        }
      },
      reveal: "Completing work can reduce pressure. But Jordan had already missed breakfast and the deadline was not what Jordan thought it was.",
      board: {
        confirmed: ["A strategy can be useful in theory but unhelpful in a specific situation."]
      }
    },
    {
      id: "deletedData",
      file: "DELETED DATA",
      title: "Deleted Data Lock",
      objective: "Use recovered times to unlock deleted data.",
      type: "code",
      script: "This is the quick escape-room satisfaction puzzle. Do not let it stall; reveal or skip freely if time is tight.",
      expected: "Code: 5491.",
      hints: [
        "Find the four times named in the clue.",
        "First alarm 6:45, usual bus 7:44, lunch photo 12:39, system failure 10:41.",
        "Use the last digit of each time: 5, 4, 9, 1."
      ],
      evidence: {
        kind: "code",
        clue: ["FIRST ALARM", "USUAL BUS", "LUNCH PHOTO", "SYSTEM FAILURE"],
        recovered: [
          ["first alarm", "6:45"],
          ["usual bus", "7:44"],
          ["lunch photo", "12:39"],
          ["system failure", "10:41"]
        ]
      },
      prompt: "Use the last digit of each time.",
      answer: {
        kind: "code",
        correct: "5491",
        feedback: "ACCESS DENIED. Recheck the four times and use only the last digit from each."
      },
      reveal: "DELETED DATA RESTORED. The code uses the last digit of each recovered time: 6:45, 7:44, 12:39, 10:41 -> 5491.",
      board: {
        confirmed: ["Deleted data folder restored."]
      }
    },
    {
      id: "afternoon",
      file: "FILE 05",
      title: "The Missing Hour",
      objective: "Recover the missing period and decide what went wrong.",
      type: "afternoon",
      script: "This is the first harder interpretation. The message is not 'entertainment is bad'; it is that the strategy needed a review point.",
      expected: "Best answer: C. The break continued long after it was meant to help.",
      hints: [
        "Look at when the break started and when the app closed.",
        "The recommendation itself is not automatically the problem.",
        "A helpful break can stop helping if nobody checks whether it is still doing its job."
      ],
      prompt: "What went wrong?",
      choices: [
        ["a", "TikTok is not self-care."],
        ["b", "Jordan should have started homework immediately."],
        ["c", "The break continued long after it was meant to help."],
        ["d", "RESET.EXE should never recommend entertainment."]
      ],
      answer: {
        kind: "single",
        correct: "c",
        feedback: {
          a: "That turns one app into the problem. The timing is the stronger clue.",
          b: "Starting homework immediately might not have helped an overloaded person. The break itself was not automatically wrong.",
          d: "Entertainment can be a useful reset. The issue is whether it was reviewed."
        }
      },
      reveal: "The original strategy was not necessarily the problem. RESET.EXE never checked whether it was still helping.",
      afterComplete: "HIDDEN SETTING RECOVERED\nREVIEW STRATEGY AFTER: OFF\n\nSystem confidence: 79% -> 61%",
      confidence: 61,
      board: {
        confirmed: ["Jordan's afternoon break continued for more than an hour.", "RESET.EXE had strategy review turned off."],
        possible: ["RESET.EXE is missing a way to check whether advice is still helping."]
      }
    },
    {
      id: "messages",
      file: "FILE 06",
      title: "Message Queue",
      objective: "Prioritise noisy communication before work.",
      type: "messages",
      script: "This is intentionally flexible. Accept more than one defensible combination, but show consequences so the discussion stays evidence-based.",
      expected: "Strong accepted combinations: Teacher + Friend, Teacher + Home. Friend + Home is reasonable but misses deadline clarity.",
      scanRecommended: true,
      hints: [
        "Some messages reduce actual pressure; some only clear a notification.",
        "Look for messages that change tonight's information or reduce pressure without starting a long task.",
        "Teacher clarifies the deadline. Home affects food. Friend may need a short boundary."
      ],
      prompt: "Jordan has time to deal with TWO messages before work. Which deserve attention first?",
      max: 2,
      choices: [
        ["teacher", "Teacher"],
        ["manager", "Manager"],
        ["friend", "Friend"],
        ["home", "Home"],
        ["random", "Random"],
        ["group", "Group chat"]
      ],
      answer: {
        kind: "messages",
        accepted: [
          ["teacher", "friend"],
          ["teacher", "home"],
          ["friend", "home"]
        ],
        feedback: "That clears something, but does it change Jordan's immediate pressure before work? Try choosing two messages with stronger consequences."
      },
      reveal: "Prioritising communication is not about answering everything. Teacher clarifies that English is not due tonight. Friend can get a short boundary reply. Home reminds Jordan food is available. Random and group chat messages may be real, but they do not change immediate pressure.",
      board: {
        confirmed: ["Teacher confirmed the English task is a draft check, not final submission.", "Some communication can reduce pressure without becoming a long conversation."],
        possible: ["Jordan may need boundaries as well as task decisions."]
      }
    },
    {
      id: "urgency",
      file: "FILE 07",
      title: "Priority Failure",
      objective: "Sort what is genuinely urgent from what is merely unfinished.",
      type: "sort",
      script: "This prevents the game from teaching 'everything can wait'. Maths is genuinely urgent and short.",
      expected: "Urgent: maths upload + essential sleep/school preparation. Important but can wait: English improvement + full friendship conversation. Low: random messages + non-essential phone tasks.",
      hints: [
        "Look for deadlines, estimated time, and what affects tomorrow.",
        "The maths task closes at midnight and takes about eight minutes.",
        "If everything is high priority, the useful move is to separate urgent, important-later, and low-impact tasks."
      ],
      prompt: "If everything is high priority, is anything actually prioritised?",
      buckets: [
        ["urgent", "URGENT TONIGHT"],
        ["wait", "IMPORTANT BUT CAN WAIT"],
        ["low", "LOW PRIORITY"]
      ],
      cards: [
        ["maths", "Maths upload"],
        ["prep", "Basic preparation for sleep/school"],
        ["english", "English draft improvement"],
        ["friendFull", "Full friendship conversation"],
        ["random", "Random messages"],
        ["phone", "Non-essential phone tasks"]
      ],
      answer: {
        kind: "sort",
        required: {
          maths: "urgent",
          prep: "urgent",
          english: "wait",
          friendFull: ["wait", "low"],
          random: "low",
          phone: "low"
        },
        feedback: "Check which items have a real deadline tonight and which ones only feel unfinished."
      },
      reveal: "Maths is genuinely urgent because it closes at midnight and takes about eight minutes. English improvement and a full friendship conversation matter, but can wait. Random messages and non-essential phone tasks should not compete with sleep.",
      board: {
        confirmed: ["The maths upload is genuinely urgent tonight.", "RESET.EXE marked too many different things as high priority."],
        unresolved: ["What should Jordan actually do tonight?"]
      }
    },
    {
      id: "finalNight",
      file: "FILE 08",
      title: "9:47 PM · Three Moves",
      objective: "Choose three moves that address tonight's actual pressure.",
      type: "finalActions",
      script: "Class decision. Do not force one perfect answer. Strong plans include maths plus sleep and one basic reset or boundary.",
      expected: "Accept provisional plans that include maths upload, sleep, and one reasonable third move based on evidence available before the curveball.",
      hints: [
        "Look for the item with a real deadline tonight.",
        "Jordan cannot complete every unfinished item before sleep.",
        "A provisional plan should handle the urgent eight-minute task, include sleep, and choose one move that looks useful with the current evidence."
      ],
      prompt: "YOU HAVE THREE MOVES",
      max: 3,
      choices: [
        ["english", "Finish entire English draft"],
        ["maths", "Complete 8-minute maths upload"],
        ["eat", "Have something to eat"],
        ["friendFull", "Start full friendship conversation"],
        ["boundary", "Send brief boundary message"],
        ["shower", "Shower/get ready"],
        ["scroll", "Keep scrolling until less stressed"],
        ["perfectPrep", "Prepare everything perfectly for tomorrow"],
        ["sleep", "Sleep"]
      ],
      answer: {
        kind: "finalPlan",
        feedback: "Does this solve tonight's actual pressure? Look again for the urgent task and what Jordan needs most before tomorrow."
      },
      reveal: "PROVISIONAL PLAN LOCKED. The plan must handle the urgent maths upload and protect sleep. New recovered data may still change which third move makes the most sense.",
      board: {
        confirmed: ["Jordan needs to prioritise rather than finish everything.", "The class has locked a provisional three-move plan."]
      }
    },
    {
      id: "curveball",
      file: "NEW DATA",
      title: "New Data · English Draft",
      objective: "Reassess the plan after new evidence is recovered.",
      type: "curveball",
      script: "This rewards changing your mind when new evidence arrives.",
      expected: "If the provisional plan includes finishing English, replace that move with food, shower/basic prep, or a brief boundary. If not, keeping the plan is valid.",
      hints: [
        "The new data changes the English urgency.",
        "Draft check tomorrow means current progress is enough to bring.",
        "If the plan spends a move on finishing all English, that move can probably be used better."
      ],
      prompt: "NEW DATA RECOVERED",
      reveal: "English draft is already 80% complete. Draft check is tomorrow. Final submission is Monday. The final locked plan should keep maths, keep sleep, and use one realistic reset such as food, shower/basic prep, or a brief boundary message.",
      board: {
        confirmed: ["English draft is already 80% complete.", "Some tasks can remain unfinished tonight.", "The final plan protects the urgent maths upload and sleep."]
      }
    },
    {
      id: "override",
      file: "SYSTEM OVERRIDE",
      title: "Override RESET.EXE",
      objective: "Decide whether to allow some tasks to remain incomplete.",
      type: "override",
      script: "Let the warning feel tense, then let the class override the old model.",
      expected: "Choose OVERRIDE SYSTEM, then YES.",
      hints: [
        "RESET.EXE is counting unfinished items, not judging priority.",
        "The class already identified that some tasks can wait.",
        "The point is not to abandon everything. It is to stop the system from demanding everything tonight."
      ],
      reveal: "OLD DECISION MODEL DISABLED. Confidence falls from 61% to 18% to 4% because the old model cannot handle prioritised unfinished tasks.",
      confidence: 4,
      board: {
        confirmed: ["The class overrode RESET.EXE's 'finish everything' model."],
        remove: {
          unresolved: ["What should Jordan actually do tonight?"]
        }
      }
    },
    {
      id: "rootCause",
      file: "CASE FINDINGS",
      title: "What Broke the Model?",
      objective: "Select the factors that best explain why the day became increasingly difficult.",
      type: "rootCause",
      script: "Final evidence board. The conclusion is accumulation, not one magic cause.",
      expected: "Several factors should be selected, especially RESET.EXE treating problems separately.",
      scanRecommended: true,
      hints: [
        "Look for factors that connected to later pressure.",
        "There is no single cause, so one card will not explain the day.",
        "Include both Jordan's accumulating pressures and RESET.EXE's pattern of treating them separately."
      ],
      prompt: "Select the factors that best explain why the day became increasingly difficult.",
      max: 6,
      choices: [
        ["sleep", "Limited sleep"],
        ["deadline", "Misread English deadline"],
        ["breakfast", "Missed breakfast"],
        ["lunch", "Worked through lunch"],
        ["longBreak", "Long afternoon break"],
        ["work", "Earlier work shift"],
        ["messages", "Too many messages"],
        ["battery", "Phone battery 3%"],
        ["maths", "Maths task due"],
        ["separate", "RESET.EXE treated problems separately"]
      ],
      answer: {
        kind: "rootCause",
        feedback: "That may be evidence, but the case needs the strongest contributing factors. Look for accumulation and the system pattern."
      },
      reveal: "No single event caused the failure. The strongest explanation is accumulation: limited sleep, missed food, mistaken urgency, a long break without review, real deadlines, messages, work pressure, and RESET.EXE treating each problem separately.",
      board: {
        confirmed: ["There was no single cause.", "The day became difficult through accumulation.", "RESET.EXE responded without enough context, priority checks, basic-needs checks, or strategy review."],
        remove: {
          unresolved: ["Was there one major cause?"]
        }
      }
    },
    {
      id: "reconstruction",
      file: "FINAL REVEAL",
      title: "Jordan's Day, Rebuilt",
      objective: "Review the recovered timeline.",
      type: "reconstruction",
      script: "Read quickly. This is the mystery solution, not a lecture.",
      expected: "Move through the reconstruction, then reboot.",
      hints: [],
      reveal: "The complete day has been reconstructed.",
      board: {},
      autoComplete: true
    },
    {
      id: "reboot",
      file: "FINAL REBOOT",
      title: "RESET.EXE 2.0",
      objective: "Install the revised decision model.",
      type: "reboot",
      script: "Optional landing: Which bit of advice sounded reasonable at first but made things worse?",
      expected: "End on the reboot. No score.",
      hints: [],
      reveal: "SYSTEM STATUS: STABLE.",
      board: {},
      autoComplete: true
    }
  ];

  const FLOW_META = {
    opening: { group: "RECOVERY", step: "CASE BRIEFING", part: "", mode: "BRIEF" },
    activity: { group: "FILE 01", step: "DEVICE ACTIVITY", part: "", mode: "RECOVER" },
    morning: { group: "FILE 02", step: "MORNING TRACE", part: "1 OF 2", mode: "RECOVER" },
    morningReview: { group: "FILE 02", step: "ADVICE AUDIT", part: "2 OF 2", mode: "AUDIT" },
    calendar: { group: "FILE 03", step: "DEADLINE CHECK", part: "1 OF 2", mode: "COMPARE" },
    calendarQuestion: { group: "FILE 03", step: "ADVICE AUDIT", part: "2 OF 2", mode: "AUDIT" },
    photos: { group: "FILE 04", step: "PHOTO RECOVERY", part: "1 OF 2", mode: "RECOVER" },
    photoReview: { group: "FILE 04", step: "ADVICE AUDIT", part: "2 OF 2", mode: "AUDIT" },
    deletedData: { group: "LOCKED DATA", step: "DECRYPT", part: "", mode: "UNLOCK" },
    afternoon: { group: "FILE 05", step: "MISSING HOUR", part: "", mode: "RECOVER" },
    messages: { group: "FILE 06", step: "MESSAGE QUEUE", part: "", mode: "PRIORITISE" },
    urgency: { group: "FILE 07", step: "PRIORITY FAILURE", part: "", mode: "SORT" },
    finalNight: { group: "FILE 08", step: "THREE-MOVE PLAN", part: "1 OF 3", mode: "DECIDE" },
    curveball: { group: "FILE 08", step: "NEW DATA", part: "2 OF 3", mode: "REASSESS" },
    override: { group: "FILE 08", step: "SYSTEM OVERRIDE", part: "3 OF 3", mode: "OVERRIDE" },
    rootCause: { group: "CASE FINDINGS", step: "ROOT CAUSE", part: "", mode: "CONCLUDE" },
    reconstruction: { group: "FINAL REVEAL", step: "DAY REBUILT", part: "", mode: "RECONSTRUCT" },
    reboot: { group: "FINAL REBOOT", step: "MODEL 2.0", part: "", mode: "REBOOT" }
  };

  function flowMeta(scene) {
    return FLOW_META[scene.id] || { group: scene.file, step: scene.title, part: "", mode: "INVESTIGATE" };
  }

  function progressPercent() {
    if (SCENES.length <= 1) return 100;
    return Math.round((state.sceneIndex / (SCENES.length - 1)) * 100);
  }

  function participationPrompt(scene) {
    if (scene.scanRecommended) return "20-second silent scan → collect one observation → class decides.";
    if (scene.type === "sort") return "Operator moves cards. Class tells them where each belongs.";
    if (["messages", "finalActions", "rootCause", "curveball", "override"].includes(scene.type)) return "Class decision. Ask for reasons before locking it in.";
    if (scene.type === "code") return "Let the class solve it together. Use hints quickly if it stalls.";
    return "Ask for one observation first, then lock the class answer.";
  }

  function renderProgressTrack() {
    return `<div class="case-progress-track" aria-hidden="true"><span style="width:${progressPercent()}%"></span></div>`;
  }

  const DAY_PHASES = [
    { id: "recovery", label: "RECOVERY", scenes: ["opening"] },
    { id: "morning", label: "MORNING", scenes: ["activity", "morning", "morningReview"] },
    { id: "school", label: "SCHOOL", scenes: ["calendar", "calendarQuestion", "photos", "photoReview", "deletedData"] },
    { id: "after", label: "AFTER SCHOOL", scenes: ["afternoon", "messages", "urgency"] },
    { id: "night", label: "NIGHT", scenes: ["finalNight", "curveball", "override"] },
    { id: "close", label: "CASE CLOSE", scenes: ["rootCause", "reconstruction", "reboot"] }
  ];

  function dayPhaseIndex(scene) {
    const found = DAY_PHASES.findIndex(function (phase) { return phase.scenes.includes(scene.id); });
    return found < 0 ? 0 : found;
  }

  function renderDayTrack(scene) {
    const active = dayPhaseIndex(scene);
    return `<div class="day-track" aria-label="Recovered day progress">${DAY_PHASES.map(function (phase, index) {
      const cls = index < active ? "done" : index === active ? "active" : "";
      return `<div class="day-node ${cls}"><span class="day-dot"></span><strong>${escapeHtml(phase.label)}</strong></div>`;
    }).join("")}</div>`;
  }

  function sourceMeta(scene) {
    const map = {
      opening: ["SYS", "DEVICE RECOVERY"],
      activity: ["ACT", "DEVICE ACTIVITY"],
      morning: ["MAP", "MORNING TRACE"],
      morningReview: ["AI", "RESET.EXE AUDIT"],
      calendar: ["CAL", "CALENDAR + PORTAL"],
      calendarQuestion: ["AI", "CONTEXT AUDIT"],
      photos: ["PIC", "PHOTO RECOVERY"],
      photoReview: ["AI", "LUNCH AUDIT"],
      deletedData: ["DEL", "DELETED DATA"],
      afternoon: ["APP", "APP HISTORY"],
      messages: ["MSG", "MESSAGE ARCHIVE"],
      urgency: ["PRI", "PRIORITY QUEUE"],
      finalNight: ["END", "NIGHT DECISION"],
      curveball: ["NEW", "NEW EVIDENCE"],
      override: ["OVR", "SYSTEM OVERRIDE"],
      rootCause: ["CASE", "CASE FINDINGS"],
      reconstruction: ["TL", "DAY RECONSTRUCTION"],
      reboot: ["2.0", "MODEL REBUILD"]
    };
    const value = map[scene.id] || ["FILE", scene.file];
    return { mark: value[0], label: value[1] };
  }

  function sceneQuestionLabel(scene) {
    if (["morningReview", "calendarQuestion", "photoReview"].includes(scene.id)) return "AUDIT THE ADVICE";
    if (scene.id === "deletedData") return "UNLOCK THE FILE";
    if (scene.id === "urgency") return "REBUILD THE PRIORITY LIST";
    if (scene.id === "finalNight") return "MAKE THE CALL";
    if (scene.id === "curveball") return "REASSESS";
    if (scene.id === "override") return "SYSTEM DECISION";
    if (scene.id === "rootCause") return "CLOSE THE CASE";
    return "WHAT DOES THE EVIDENCE SAY?";
  }

  function renderBoardUpdateSummary(scene) {
    const update = scene.board || {};
    const items = [];
    (update.confirmed || []).slice(0, 2).forEach(function (item) { items.push(item); });
    (update.possible || []).slice(0, 1).forEach(function (item) { items.push("Possible: " + item); });
    if (!items.length) return "";
    return `<div class="case-update"><span>CASE FILE UPDATED</span>${items.map(function (item) { return `<p>${escapeHtml(item)}</p>`; }).join("")}</div>`;
  }


  let state = loadState();
  let studentWindow = null;
  let channel = null;
  let runtime = {
    lastStudentSeen: 0,
    everStudentSeen: false,
    storageOk: testLocalStorage(),
    channelOk: false,
    directFile: window.location.protocol === "file:",
    lastRenderKey: "",
    lastStateJson: ""
  };

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    runtime.channelOk = true;
    channel.onmessage = handleChannelMessage;
  } catch (error) {
    runtime.channelOk = false;
  }

  window.addEventListener("message", function (event) {
    handleSyncMessage(event.data, event.source);
  });

  window.addEventListener("storage", function (event) {
    if (!isFacilitator && event.key === STORAGE_KEY && event.newValue) {
      const next = parseState(event.newValue);
      if (next) {
        state = next;
        render();
      }
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (!isFacilitator && document.visibilityState === "visible") {
      requestSnapshot();
    }
  });

  document.addEventListener("fullscreenchange", function () {
    if (!isFacilitator) requestSnapshot();
  });

  window.addEventListener("resize", function () {
    document.documentElement.style.setProperty("--vh", window.innerHeight + "px");
    if (!isFacilitator) requestSnapshot();
  });

  app.addEventListener("click", handleClick);
  app.addEventListener("input", handleInput);
  app.addEventListener("dragstart", handleDragStart);
  app.addEventListener("dragover", function (event) {
    if (event.target.closest("[data-drop-bucket]")) event.preventDefault();
  });
  app.addEventListener("drop", handleDrop);

  if (!isFacilitator) {
    ensureStudentId();
    setInterval(sendStudentHeartbeat, 1500);
    sendMessage({ type: "student-hello", studentId: ensureStudentId() }, window.opener);
    requestSnapshot();
  }

  setInterval(tick, 1000);
  render();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function defaultState() {
    return {
      stateVersion: STATE_VERSION,
      sceneIndex: 0,
      completed: {},
      skipped: {},
      revealed: {},
      selections: {},
      feedback: {},
      hintCounts: {},
      board: clone(INITIAL_BOARD),
      confidence: 98,
      textScale: 0,
      showBoard: false,
      boardForced: false,
      displayCheck: false,
      scan: { active: false, duration: 20, startedAt: null },
      timer: { elapsed: 0, running: false, startedAt: null },
      selectedSortCard: null,
      progress: {},
      lastSavedAt: Date.now()
    };
  }

  function parseState(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.stateVersion !== STATE_VERSION) return null;
      return normalizeState(parsed);
    } catch (error) {
      return null;
    }
  }

  function normalizeState(input) {
    const base = defaultState();
    const merged = Object.assign(base, input || {});
    merged.completed = merged.completed || {};
    merged.skipped = merged.skipped || {};
    merged.revealed = merged.revealed || {};
    merged.selections = merged.selections || {};
    merged.feedback = merged.feedback || {};
    merged.hintCounts = merged.hintCounts || {};
    merged.progress = merged.progress || {};
    merged.board = merged.board || clone(INITIAL_BOARD);
    merged.scan = Object.assign({ active: false, duration: 20, startedAt: null }, merged.scan || {});
    merged.timer = Object.assign({ elapsed: 0, running: false, startedAt: null }, merged.timer || {});
    merged.sceneIndex = Math.max(0, Math.min(SCENES.length - 1, Number(merged.sceneIndex) || 0));
    return merged;
  }

  function loadState() {
    if (!testLocalStorage()) return defaultState();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? parseState(stored) : null;
    return parsed || defaultState();
  }

  function testLocalStorage() {
    try {
      const key = "__resetExeStorageTest";
      window.localStorage.setItem(key, "1");
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function saveState() {
    state.lastSavedAt = Date.now();
    if (runtime.storageOk) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        runtime.storageOk = false;
      }
    }
  }

  function saveRenderBroadcast() {
    if (isFacilitator) {
      saveState();
      broadcastSnapshot();
    }
    render();
  }

  function currentScene() {
    return SCENES[state.sceneIndex] || SCENES[0];
  }

  function sceneById(id) {
    return SCENES.find(function (scene) { return scene.id === id; });
  }

  function selectionFor(sceneId, fallback) {
    if (!state.selections[sceneId]) {
      state.selections[sceneId] = fallback !== undefined ? clone(fallback) : null;
    }
    return state.selections[sceneId];
  }

  function setSelection(sceneId, value) {
    state.selections[sceneId] = value;
  }

  function isSceneDone(scene) {
    return Boolean(state.completed[scene.id] || state.skipped[scene.id]);
  }

  function completeScene(scene, options) {
    const mode = options && options.skipped ? "skipped" : "completed";
    if (mode === "skipped") {
      state.skipped[scene.id] = true;
    } else {
      state.completed[scene.id] = true;
    }
    state.revealed[scene.id] = true;
    if (typeof scene.confidence === "number") state.confidence = scene.confidence;
    if (scene.id === "override") state.confidence = 4;
    recomputeBoard();
  }

  function recomputeBoard() {
    const board = clone(INITIAL_BOARD);
    SCENES.forEach(function (scene) {
      if (state.completed[scene.id] || state.skipped[scene.id]) {
        applyBoardUpdate(board, scene.board || {});
      }
    });
    state.board = board;
  }

  function applyBoardUpdate(board, update) {
    ["confirmed", "possible", "unresolved"].forEach(function (column) {
      (update[column] || []).forEach(function (item) {
        if (!board[column].includes(item)) board[column].push(item);
      });
    });
    if (update.remove) {
      Object.keys(update.remove).forEach(function (column) {
        board[column] = board[column].filter(function (item) {
          return !update.remove[column].includes(item);
        });
      });
    }
  }

  function sendMessage(message, targetWindow) {
    const payload = Object.assign({ app: "RESET.EXE", sentAt: Date.now() }, message);
    if (channel) {
      try { channel.postMessage(payload); } catch (error) { }
    }
    if (targetWindow && typeof targetWindow.postMessage === "function") {
      try { targetWindow.postMessage(payload, "*"); } catch (error) { }
    }
    if (studentWindow && typeof studentWindow.postMessage === "function") {
      try { studentWindow.postMessage(payload, "*"); } catch (error) { }
    }
  }

  function handleChannelMessage(event) {
    handleSyncMessage(event.data, null);
  }

  function handleSyncMessage(message, sourceWindow) {
    if (!message || message.app !== "RESET.EXE") return;
    if (isFacilitator) {
      if (message.type === "student-heartbeat") {
        runtime.lastStudentSeen = Date.now();
        runtime.everStudentSeen = true;
        if (sourceWindow) studentWindow = sourceWindow;
        renderConnectionOnly();
      }
      if (message.type === "student-hello" || message.type === "state-request") {
        runtime.lastStudentSeen = Date.now();
        runtime.everStudentSeen = true;
        if (sourceWindow) studentWindow = sourceWindow;
        broadcastSnapshot(sourceWindow);
        renderConnectionOnly();
      }
      if (message.type === "student-action" && message.action) {
        runtime.lastStudentSeen = Date.now();
        runtime.everStudentSeen = true;
        applyAction(message.action);
      }
    } else {
      if (message.type === "state-snapshot" && message.state) {
        const snapshot = JSON.stringify(message.state);
        if (snapshot === runtime.lastStateJson) {
          updateLiveDom();
          return;
        }
        runtime.lastStateJson = snapshot;
        const next = normalizeState(message.state);
        state = next;
        if (runtime.storageOk) {
          try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { }
        }
        render();
      }
    }
  }

  function broadcastSnapshot(targetWindow) {
    if (!isFacilitator) return;
    sendMessage({ type: "state-snapshot", state: clone(state) }, targetWindow);
  }

  function requestSnapshot() {
    sendMessage({ type: "state-request", studentId: ensureStudentId() }, window.opener);
  }

  function ensureStudentId() {
    let id = "";
    try {
      id = window.sessionStorage.getItem(STUDENT_ID_KEY);
      if (!id) {
        id = "student-" + Math.random().toString(36).slice(2);
        window.sessionStorage.setItem(STUDENT_ID_KEY, id);
      }
    } catch (error) {
      id = "student-" + Math.random().toString(36).slice(2);
    }
    return id;
  }

  function sendStudentHeartbeat() {
    if (!isFacilitator) {
      sendMessage({ type: "student-heartbeat", studentId: ensureStudentId(), sceneId: currentScene().id }, window.opener);
    }
  }

  function userAction(action) {
    if (isFacilitator) {
      applyAction(action);
    } else {
      sendMessage({ type: "student-action", studentId: ensureStudentId(), action: action }, window.opener);
    }
  }

  function applyAction(action) {
    const scene = currentScene();
    switch (action.type) {
      case "begin":
        completeScene(scene);
        state.sceneIndex = Math.min(state.sceneIndex + 1, SCENES.length - 1);
        break;
      case "next":
        if (scene.autoComplete && !isSceneDone(scene)) completeScene(scene);
        if (!scene.autoComplete && !isSceneDone(scene)) {
          state.feedback[scene.id] = { type: "warn", text: "Complete, reveal, or skip this puzzle before advancing so the evidence trail stays intact." };
          break;
        }
        state.sceneIndex = Math.min(state.sceneIndex + 1, SCENES.length - 1);
        clearTransientFeedback();
        break;
      case "back":
        state.sceneIndex = Math.max(state.sceneIndex - 1, 0);
        clearTransientFeedback();
        break;
      case "selectSingle":
        setSelection(action.sceneId, action.value);
        delete state.feedback[action.sceneId];
        break;
      case "toggleMulti":
        toggleMulti(action.sceneId, action.value, action.max);
        delete state.feedback[action.sceneId];
        break;
      case "replaceEnglishMove":
        replaceEnglishMove(action.value);
        delete state.feedback.curveball;
        break;
      case "setCode":
        setSelection(action.sceneId, String(action.value || "").replace(/\D/g, "").slice(0, 4));
        delete state.feedback[action.sceneId];
        break;
      case "toggleEvidence":
        toggleEvidence(action.sceneId, action.key);
        break;
      case "viewPhoto":
        viewPhoto(action.sceneId, Number(action.value));
        break;
      case "selectSortCard":
        state.selectedSortCard = state.selectedSortCard === action.card ? null : action.card;
        break;
      case "placeSortCard":
        placeSortCard(action.sceneId, action.card || state.selectedSortCard, action.bucket);
        state.selectedSortCard = null;
        delete state.feedback[action.sceneId];
        break;
      case "submit":
        if (scene.type === "code" && typeof action.codeValue === "string") {
          setSelection(scene.id, action.codeValue.replace(/\D/g, "").slice(0, 4));
        }
        submitScene(scene);
        break;
      case "hint":
        useHint(scene);
        break;
      case "reveal":
        state.feedback[scene.id] = { type: "good", text: "EVIDENCE RECOVERED" };
        completeScene(scene);
        break;
      case "skip":
        state.feedback[scene.id] = { type: "good", text: "Puzzle skipped by facilitator. Required evidence has been recovered so later scenes still work." };
        completeScene(scene, { skipped: true });
        state.sceneIndex = Math.min(state.sceneIndex + 1, SCENES.length - 1);
        break;
      case "resetPuzzle":
        resetCurrentPuzzle(scene);
        break;
      case "resetGame":
        if (action.confirmed) {
          state = defaultState();
          saveState();
          Object.keys(animatedPhotoSeq).forEach(function (k) { delete animatedPhotoSeq[k]; });
          Object.keys(animatedCompletion).forEach(function (k) { delete animatedCompletion[k]; });
        }
        break;
      case "toggleScan":
        state.scan.active = !state.scan.active;
        state.scan.startedAt = state.scan.active ? Date.now() : null;
        break;
      case "toggleTimer":
        toggleTimer();
        break;
      case "toggleBoard":
        state.showBoard = !state.showBoard;
        state.boardForced = state.showBoard;
        break;
      case "openBoard":
        state.showBoard = true;
        state.boardForced = true;
        break;
      case "closeBoard":
        state.showBoard = false;
        state.boardForced = false;
        break;
      case "textScale":
        state.textScale = Math.max(-1, Math.min(1, Number(action.value) || 0));
        break;
      case "displayCheck":
        state.displayCheck = Boolean(action.enabled);
        break;
      case "openStudent":
        openStudentWindow();
        break;
      case "resync":
        broadcastSnapshot();
        break;
      case "studentFullscreenPrompt":
        state.feedback[scene.id] = { type: "good", text: "Student screen: press F11, or double-click the student display to enter or exit fullscreen." };
        break;
      case "shutdown":
        shutdownServer();
        break;
      default:
        break;
    }
    saveRenderBroadcast();
  }

  function clearTransientFeedback() {
    const scene = currentScene();
    if (scene && state.feedback[scene.id] && !state.revealed[scene.id]) {
      delete state.feedback[scene.id];
    }
  }

  function toggleMulti(sceneId, value, max) {
    const current = Array.isArray(state.selections[sceneId]) ? state.selections[sceneId].slice() : [];
    const index = current.indexOf(value);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      if (max && current.length >= max) current.shift();
      current.push(value);
    }
    setSelection(sceneId, current);
  }

  function viewPhoto(sceneId, index) {
    if (!Number.isInteger(index)) return;
    state.progress = state.progress || {};
    const prev = state.progress[sceneId] || { active: -1, recovered: [], recoverySeq: 0 };
    const isNew = prev.recovered.indexOf(index) < 0;
    state.progress[sceneId] = {
      active: index,
      recovered: isNew ? prev.recovered.concat([index]) : prev.recovered.slice(),
      recoverySeq: (prev.recoverySeq || 0) + (isNew ? 1 : 0)
    };
  }

  function toggleEvidence(sceneId, key) {
    const current = state.selections[sceneId] && typeof state.selections[sceneId] === "object" && !Array.isArray(state.selections[sceneId])
      ? clone(state.selections[sceneId])
      : {};
    current[key] = !current[key];
    state.selections[sceneId] = current;
  }

  function placeSortCard(sceneId, card, bucket) {
    if (!card || !bucket) return;
    const current = state.selections[sceneId] && state.selections[sceneId].placements
      ? clone(state.selections[sceneId])
      : { placements: {} };
    current.placements[card] = bucket;
    state.selections[sceneId] = current;
  }

  function resetCurrentPuzzle(scene) {
    delete state.selections[scene.id];
    delete state.feedback[scene.id];
    delete state.completed[scene.id];
    delete state.skipped[scene.id];
    delete state.revealed[scene.id];
    delete state.hintCounts[scene.id];
    delete state.progress[scene.id];
    state.selectedSortCard = null;
    recomputeBoard();
  }

  function useHint(scene) {
    const count = state.hintCounts[scene.id] || 0;
    if (!scene.hints || !scene.hints.length) {
      state.feedback[scene.id] = { text: "No hint is needed for this screen.", type: "neutral" };
      return;
    }
    state.hintCounts[scene.id] = Math.min(count + 1, scene.hints.length);
  }

  function submitScene(scene) {
    const result = evaluateScene(scene);
    if (result.ok) {
      state.feedback[scene.id] = successFeedback(scene, result);
      if (result.selection) state.selections[scene.id] = result.selection;
      completeScene(scene);
    } else {
      state.feedback[scene.id] = { type: "warn", text: result.message || "Check the evidence and try again." };
    }
  }

  function successFeedback(scene, result) {
    if (scene.answer && scene.answer.kind === "messages") {
      return { type: "good", title: "Consequences", text: result.message || "", distinct: true };
    }
    return { type: "good", text: "EVIDENCE RECOVERED" };
  }

  function evaluateScene(scene) {
    const answer = scene.answer || {};
    const selected = state.selections[scene.id];
    if (!answer.kind) return { ok: true, message: scene.reveal };
    if (answer.kind === "single") {
      if (selected === answer.correct) return { ok: true, message: scene.reveal };
      return { ok: false, message: (answer.feedback && answer.feedback[selected]) || answer.feedback || "That explains one detail, but not the strongest evidence." };
    }
    if (answer.kind === "set") {
      const got = Array.isArray(selected) ? selected.slice().sort() : [];
      const expected = answer.correct.slice().sort();
      const ok = got.length === expected.length && got.every(function (item, index) { return item === expected[index]; });
      return ok ? { ok: true, message: scene.reveal } : { ok: false, message: answer.feedback };
    }
    if (answer.kind === "code") {
      return selected === answer.correct ? { ok: true, message: scene.reveal } : { ok: false, message: answer.feedback };
    }
    if (answer.kind === "messages") {
      const got = Array.isArray(selected) ? selected.slice().sort() : [];
      const accepted = answer.accepted.some(function (set) {
        const sorted = set.slice().sort();
        return got.length === sorted.length && got.every(function (item, index) { return item === sorted[index]; });
      });
      if (!accepted) return { ok: false, message: answer.feedback };
      return { ok: true, message: messageConsequence(got) };
    }
    if (answer.kind === "sort") {
      const placements = selected && selected.placements ? selected.placements : {};
      const cards = scene.cards.map(function (card) { return card[0]; });
      const allPlaced = cards.every(function (card) { return Boolean(placements[card]); });
      if (!allPlaced) return { ok: false, message: "Place every card into a priority column before submitting." };
      const problems = [];
      Object.keys(answer.required).forEach(function (card) {
        const required = Array.isArray(answer.required[card]) ? answer.required[card] : [answer.required[card]];
        if (!required.includes(placements[card])) problems.push(card);
      });
      return problems.length === 0 ? { ok: true, message: scene.reveal } : { ok: false, message: answer.feedback };
    }
    if (answer.kind === "finalPlan") {
      return evaluateFinalPlan(selected, { allowEnglish: true, reveal: scene.reveal });
    }
    if (answer.kind === "rootCause") {
      const got = Array.isArray(selected) ? selected : [];
      if (got.length > 6) {
        return { ok: false, message: "You've selected almost everything. Narrow the case to the strongest factors that actually increased pressure." };
      }
      const hasSystem = got.includes("separate");
      const meaningful = ["sleep", "deadline", "breakfast", "lunch", "longBreak", "maths", "messages", "work"].filter(function (item) {
        return got.includes(item);
      }).length;
      const hasAccumulation = meaningful >= 4;
      if (hasSystem && hasAccumulation) return { ok: true, message: scene.reveal };
      if (!hasSystem) return { ok: false, message: "The evidence includes Jordan's pressures, but the case also needs the RESET.EXE pattern: it treated problems separately." };
      if (!hasAccumulation) return { ok: false, message: "Choose at least four strong factors that actually increased pressure. Battery is visible, but it is not one of the strongest causes." };
      return { ok: false, message: answer.feedback };
    }
    return { ok: true, message: scene.reveal };
  }

  function messageConsequence(got) {
    const lines = [];
    if (got.includes("teacher")) lines.push("Teacher: Jordan now knows English is not due tonight.");
    if (got.includes("friend")) lines.push("Friend: \"Not ignoring you. I'm wrecked and heading to work. I'll talk tomorrow.\" Friendship pressure reduces without starting a long conversation.");
    if (got.includes("home")) lines.push("Home: Jordan remembers food is available.");
    if (!got.includes("teacher")) lines.push("Note: this is a reasonable immediate-pressure choice, but it leaves the English deadline clarity unresolved until the teacher message is checked.");
    if (got.includes("manager")) lines.push("Manager: the earlier start has already been confirmed, so this may not need more attention now.");
    if (got.includes("random") || got.includes("group")) lines.push("Random/group chat: a notification is cleared, but immediate pressure is mostly unchanged.");
    lines.push("This is a prioritisation decision, not a perfect-answer quiz.");
    return lines.join("\n\n");
  }

  function evaluateFinalPlan(selected, options) {
    const got = Array.isArray(selected) ? selected : [];
    const allowEnglish = Boolean(options && options.allowEnglish);
    const reveal = options && options.reveal ? options.reveal : "";
    if (got.length !== 3) return { ok: false, message: "Choose exactly three moves." };
    if (!got.includes("maths")) return { ok: false, message: "The plan misses the one task that is genuinely due tonight: the eight-minute maths upload." };
    if (!got.includes("sleep")) return { ok: false, message: "The plan handles tasks, but it does not protect the basic need that started the day under pressure." };
    const thirdMoves = got.filter(function (item) { return item !== "maths" && item !== "sleep"; });
    const third = thirdMoves[0];
    if (["eat", "shower", "boundary"].includes(third)) return { ok: true, message: reveal };
    if (third === "english") {
      if (allowEnglish) return { ok: true, message: reveal };
      return { ok: false, message: "After the new data, finishing the entire English draft should no longer be the final third move. Replace it with food, shower/basic prep, or a brief boundary message." };
    }
    return { ok: false, message: "Maths and sleep help. The third move should reduce immediate pressure without becoming another huge task." };
  }

  function replaceEnglishMove(value) {
    if (!["eat", "shower", "boundary"].includes(value)) return;
    state.selections.finalNight = ["maths", "sleep", value];
    if (!state.selections.curveball || typeof state.selections.curveball !== "object" || Array.isArray(state.selections.curveball)) {
      state.selections.curveball = {};
    }
    state.selections.curveball.replacement = value;
  }

  function toggleTimer() {
    const now = Date.now();
    if (state.timer.running) {
      state.timer.elapsed = getTimerElapsed();
      state.timer.running = false;
      state.timer.startedAt = null;
    } else {
      state.timer.running = true;
      state.timer.startedAt = now;
    }
  }

  function getTimerElapsed() {
    const base = Number(state.timer.elapsed) || 0;
    if (!state.timer.running || !state.timer.startedAt) return base;
    return base + Math.max(0, Math.floor((Date.now() - state.timer.startedAt) / 1000));
  }

  function getScanRemaining() {
    if (!state.scan.active || !state.scan.startedAt) return 0;
    return Math.max(0, state.scan.duration - Math.floor((Date.now() - state.scan.startedAt) / 1000));
  }

  function tick() {
    if (isFacilitator && state.scan.active && getScanRemaining() <= 0) {
      state.scan.active = false;
      saveRenderBroadcast();
      return;
    }
    updateLiveDom();
  }

  function updateLiveDom() {
    const timerText = formatTimer(getTimerElapsed());
    document.querySelectorAll("[data-live-timer]").forEach(function (node) {
      node.textContent = timerText;
    });
    const scanRemaining = getScanRemaining();
    document.querySelectorAll("[data-live-scan]").forEach(function (node) {
      node.textContent = "SILENT SCAN - " + scanRemaining + " SECONDS";
    });
    if (isFacilitator) renderConnectionOnly();
  }

  function openStudentWindow() {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "student");
    studentWindow = window.open(url.toString(), "RESET_EXE_STUDENT");
    setTimeout(function () { broadcastSnapshot(studentWindow); }, 350);
  }

  function shutdownServer() {
    if (window.location.protocol !== "http:" || window.location.hostname !== "127.0.0.1") {
      state.feedback[currentScene().id] = { type: "warn", text: "Shutdown is only available when using the localhost launcher." };
      return;
    }
    fetch("/__resetexe/health")
      .then(function (response) { return response.json(); })
      .then(function (info) { return fetch("/__resetexe/shutdown?root=" + encodeURIComponent(info.rootHash)); })
      .then(function () {
        state.feedback[currentScene().id] = { type: "good", text: "Local RESET.EXE server shutdown requested. You can close this tab after class." };
        render();
      })
      .catch(function () {
        state.feedback[currentScene().id] = { type: "warn", text: "Could not reach the local shutdown endpoint. You can use RESET-EXE-Stop.cmd." };
        render();
      });
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) {
      if (!isFacilitator && event.detail === 2) toggleFullscreen();
      return;
    }
    const type = target.getAttribute("data-action");
    const sceneId = target.getAttribute("data-scene") || currentScene().id;
    const value = target.getAttribute("data-value");
    const max = Number(target.getAttribute("data-max") || 0);
    if (type === "resetGame") {
      if (!window.confirm("Reset the full RESET.EXE game? This clears saved progress.")) return;
      userAction({ type: "resetGame", confirmed: true });
      return;
    }
    if (type === "displayCheck") {
      userAction({ type: "displayCheck", enabled: value === "on" });
      return;
    }
    if (type === "textScale") {
      userAction({ type: "textScale", value: Number(value) });
      return;
    }
    if (type === "submit") {
      const codeInput = app.querySelector(`[data-code-input][data-scene="${currentScene().id}"]`);
      if (codeInput) {
        userAction({ type: "submit", codeValue: codeInput.value });
      } else {
        userAction({ type: "submit" });
      }
      return;
    }
    if (type === "selectSingle") userAction({ type: "selectSingle", sceneId: sceneId, value: value });
    else if (type === "toggleMulti") userAction({ type: "toggleMulti", sceneId: sceneId, value: value, max: max });
    else if (type === "toggleEvidence") userAction({ type: "toggleEvidence", sceneId: sceneId, key: value });
    else if (type === "viewPhoto") userAction({ type: "viewPhoto", sceneId: sceneId, value: Number(value) });
    else if (type === "selectSortCard") userAction({ type: "selectSortCard", card: value });
    else if (type === "placeSortCard") userAction({ type: "placeSortCard", sceneId: sceneId, bucket: value });
    else if (type === "replaceEnglishMove") userAction({ type: "replaceEnglishMove", value: value });
    else userAction({ type: type });
  }

  function handleInput(event) {
    const target = event.target;
    if (target.matches("[data-code-input]")) {
      const sceneId = target.getAttribute("data-scene");
      const value = target.value.replace(/\D/g, "").slice(0, 4);
      target.value = value;
      state.selections[sceneId] = value;
      if (isFacilitator) saveState();
    }
  }

  function handleDragStart(event) {
    const card = event.target.closest("[data-drag-card]");
    if (!card) return;
    event.dataTransfer.setData("text/plain", card.getAttribute("data-drag-card"));
  }

  function handleDrop(event) {
    const bucket = event.target.closest("[data-drop-bucket]");
    if (!bucket) return;
    event.preventDefault();
    const card = event.dataTransfer.getData("text/plain");
    userAction({ type: "placeSortCard", sceneId: currentScene().id, card: card, bucket: bucket.getAttribute("data-drop-bucket") });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () { });
    } else {
      document.documentElement.requestFullscreen().catch(function () { });
    }
  }

  function renderConnectionOnly() {
    const el = document.querySelector("[data-connection-pill]");
    if (!el) return;
    const status = connectionStatus();
    el.className = "connection-pill " + status.className;
    el.textContent = status.label;
  }

  function connectionStatus() {
    if (!runtime.everStudentSeen) return { label: "○ Not connected", className: "" };
    const age = Date.now() - runtime.lastStudentSeen;
    if (age < 4200) return { label: "● Connected", className: "connected" };
    return { label: "↻ Reconnecting", className: "reconnecting" };
  }

  function render() {
    document.documentElement.classList.toggle("view-student", !isFacilitator);
    document.documentElement.classList.toggle("view-facilitator", isFacilitator);
    document.body.classList.toggle("view-student", !isFacilitator);
    document.body.classList.toggle("view-facilitator", isFacilitator);
    document.documentElement.style.setProperty("--student-scale", String(1 + (state.textScale * 0.12)));
    if (isFacilitator) renderFacilitator();
    else renderStudent();
  }

  function renderStudent() {
    if (state.displayCheck) {
      app.innerHTML = renderStudentShell(renderDisplayCheck(), { displayCheck: true });
      return;
    }
    app.innerHTML = renderStudentShell(renderScenePanel(currentScene()), {});
  }

  function renderStudentShell(sceneHtml, options) {
    const scene = currentScene();
    const meta = flowMeta(scene);
    const scan = state.scan.active ? `<div class="scan-banner" data-live-scan>SILENT SCAN · ${getScanRemaining()} SECONDS</div>` : "";
    if (options && options.displayCheck) {
      return `
        <main class="student-shell">
          <section class="student-frame display-check-frame">
            ${scan}
            <header class="student-hud">
              <div class="hud-brand"><span class="hud-signal"></span><strong>RESET.EXE</strong><small>DISPLAY CHECK</small></div>
              <div class="hud-status"><span>FIT AUTO</span><span>TEXT ${textScaleLabel().toUpperCase()}</span></div>
            </header>
            <div class="student-stage display-stage">${sceneHtml}</div>
          </section>
        </main>`;
    }
    const boardOverlay = state.boardForced ? `<div class="board-overlay"><div class="board-overlay-card">${renderBoard()}</div></div>` : "";
    const cinematic = scene.id === "photos" || scene.id === "finalNight" ? "cinematic-frame" : "";
    return `
      <main class="student-shell">
        <section class="student-frame ${cinematic}">
          ${scan}
          <header class="student-hud">
            <div class="hud-brand"><span class="hud-signal"></span><strong>RESET.EXE</strong><small>RECOVERY SESSION</small></div>
            <div class="hud-scene"><strong>${escapeHtml(meta.group)}</strong><span>${escapeHtml(meta.step)}</span></div>
            <div class="hud-status">
              <span class="hud-model"><i style="--model:${state.confidence}%"></i>MODEL ${state.confidence}%</span>
              <span data-live-timer>${formatTimer(getTimerElapsed())}</span>
            </div>
          </header>
          ${renderDayTrack(scene)}
          <div class="student-stage scene-${scene.id}">${sceneHtml}</div>
          <footer class="student-mission-bar">
            <span class="mission-label">CURRENT OBJECTIVE</span>
            <strong>${escapeHtml(scene.objective)}</strong>
            <span class="mission-method">${scene.scanRecommended ? "SCAN → DISCUSS → LOCK" : "DISCUSS → LOCK"}</span>
          </footer>
          ${boardOverlay}
        </section>
      </main>`;
  }

  function renderFacilitator() {
    const scene = currentScene();
    const meta = flowMeta(scene);
    const status = connectionStatus();
    const warning = facilitatorWarning();
    const hints = (scene.hints || []).map(function (hint, index) { return `<li><span>${index + 1}</span>${escapeHtml(hint)}</li>`; }).join("");
    app.innerHTML = `
      <main class="facilitator-shell mission-control">
        <header class="mc-header">
          <div class="mc-brand"><span>RESET.EXE</span><strong>FACILITATOR CONSOLE</strong></div>
          <div class="mc-current"><small>NOW RUNNING</small><strong>${escapeHtml(meta.group)} · ${escapeHtml(meta.step)}</strong></div>
          <div class="mc-status">
            <span class="connection-pill ${status.className}" data-connection-pill>${status.label}</span>
            <span>MODEL ${state.confidence}%</span>
            <span data-live-timer>${formatTimer(getTimerElapsed())}</span>
          </div>
        </header>
        ${renderDayTrack(scene)}
        <nav class="mc-actionbar">
          <div class="mc-nav-group">
            <button class="fac-button" data-action="back">← BACK</button>
            <button class="fac-button primary-action" data-action="next">NEXT SCENE →</button>
          </div>
          <div class="mc-nav-group">
            <button class="fac-button" data-action="toggleScan">${state.scan.active ? "STOP SCAN" : "20s SILENT SCAN"}</button>
            <button class="fac-button" data-action="hint">HINT</button>
            <button class="fac-button" data-action="reveal">REVEAL</button>
            <button class="fac-button" data-action="skip">SKIP</button>
          </div>
          <div class="mc-nav-group mc-student-actions">
            <button class="fac-button primary-action" data-action="openStudent">OPEN STUDENT DISPLAY</button>
            <button class="fac-button" data-action="resync">RE-SYNC</button>
            <button class="fac-button" data-action="openBoard">CASE BOARD</button>
          </div>
        </nav>
        ${warning ? `<section class="mc-warning">${warning}</section>` : ""}
        <section class="mc-workspace">
          <section class="mc-preview">
            <div class="mc-section-title"><span>LIVE STUDENT SCREEN</span><strong>${state.sceneIndex + 1}/${SCENES.length}</strong></div>
            <div class="fac-scene-preview">${renderScenePanel(scene)}</div>
          </section>
          <aside class="mc-runbook">
            <div class="runbook-head"><span class="mode-badge">${escapeHtml(meta.mode)}</span><h2>${escapeHtml(scene.title)}</h2><p>${escapeHtml(participationPrompt(scene))}</p></div>
            <section class="runbook-block say"><small>01 · SAY</small><p>${escapeHtml(scene.script || "")}</p></section>
            <section class="runbook-block listen"><small>02 · LISTEN FOR</small><p>${escapeHtml(scene.expected || "")}</p></section>
            <section class="runbook-block rescue"><small>03 · IF IT STALLS</small>${hints ? `<ol>${hints}</ol>` : `<p>No rescue prompt needed here.</p>`}</section>
            <section class="runbook-block state"><small>SCENE STATUS</small><div class="runbook-state"><strong>${sceneStateLabel(scene)}</strong><span>${state.hintCounts[scene.id] || 0}/${(scene.hints || []).length} hints</span></div></section>
          </aside>
        </section>
        <section class="mc-drawer">
          <details>
            <summary>Case board & scene flow</summary>
            <div class="mc-drawer-grid"><div>${renderBoardColumns()}</div><div>${renderSceneList()}</div></div>
          </details>
          <details>
            <summary>Display & advanced controls</summary>
            <div class="fac-advanced-grid">
              <button class="fac-button" data-action="displayCheck" data-value="on">DISPLAY CHECK</button>
              <button class="fac-button" data-action="displayCheck" data-value="off">EXIT CHECK</button>
              <button class="fac-button" data-action="textScale" data-value="-1">TEXT −</button>
              <button class="fac-button" data-action="textScale" data-value="0">TEXT AUTO</button>
              <button class="fac-button" data-action="textScale" data-value="1">TEXT +</button>
              <button class="fac-button" data-action="toggleTimer">${state.timer.running ? "PAUSE TIMER" : "START TIMER"}</button>
              <button class="fac-button" data-action="resetPuzzle">RESET SCENE</button>
              <button class="fac-button danger-action" data-action="resetGame">RESET FULL GAME</button>
              <button class="fac-button" data-action="shutdown">SHUTDOWN SERVER</button>
            </div>
          </details>
        </section>
      </main>`;
  }

  function facilitatorWarning() {
    const warnings = [];
    if (runtime.directFile) {
      warnings.push("Direct-file mode detected. Live classroom play is available, but refresh recovery may be limited. Use the RESET.EXE launcher for full recovery support.");
    }
    if (!runtime.storageOk) {
      warnings.push("Shared storage is not available in this browser mode. Use the launcher for reliable recovery.");
    }
    if (!runtime.channelOk) {
      warnings.push("BroadcastChannel is not available. The app will try direct window messaging, but launcher mode is recommended.");
    }
    return warnings.map(function (warning) { return `<p class="fac-warning">${escapeHtml(warning)}</p>`; }).join("");
  }

  function renderPhonePanel(scene) {
    if (scene.id === "opening") {
      return `
        <section class="phone-panel">
          <div class="phone-status"><span>No exact date recovered</span><span class="battery">Battery: 3%</span></div>
          <div class="phone-screen">
            <div>
              <div class="lock-clock glitch">10:47</div>
              <div class="scene-objective">PM</div>
            </div>
            <div class="notification-stack">
              ${notification("RESET.EXE", "SYSTEM FAILURE DETECTED")}
              ${notification("Messages", "14 unread")}
              ${notification("School Portal", "English Draft Check Tomorrow")}
              ${notification("Work", "Shift Updated")}
            </div>
          </div>
        </section>`;
    }
    return `
      <section class="phone-panel">
        <div class="phone-status"><span>${escapeHtml(scene.file)}</span><span class="battery">3%</span></div>
        <div class="phone-screen">
          <div class="log-card system">
            <h3>${escapeHtml(scene.title)}</h3>
            <p>${escapeHtml(scene.objective)}</p>
          </div>
          <div class="notification-stack">
            ${notification("RESET.EXE", state.confidence + "% confidence")}
            ${notification("Messages", scene.id === "messages" ? "14 unresolved notifications" : "recovered archive")}
            ${notification("School Portal", "English Draft Check Tomorrow")}
            ${notification("Maths", scene.id === "urgency" || scene.id === "finalNight" ? "Upload due 11:59 PM" : "notification hidden")}
          </div>
        </div>
      </section>`;
  }

  function notification(title, body) {
    return `<div class="notification"><strong>${escapeHtml(title)}</strong>${escapeHtml(body)}</div>`;
  }

  function icon(name, extraClass) {
    const paths = ICON_PATHS[name] || ICON_PATHS.sparkle;
    return `<svg class="glyph-icon ${extraClass || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  function renderScenePanel(scene) {
    if (state.displayCheck && !isFacilitator) return renderDisplayCheck();
    const completed = isSceneDone(scene);
    const meta = flowMeta(scene);
    const source = sourceMeta(scene);
    const feedback = !completed && state.feedback[scene.id] ? renderFeedback(state.feedback[scene.id]) : "";
    const hints = !completed ? renderHints(scene) : "";
    const body = !completed || scene.autoComplete ? renderSceneBody(scene)
      : scene.id === "photos" && !state.skipped[scene.id] ? renderPhotoScene(scene, { completed: true })
      : scene.id === "finalNight" && !state.skipped[scene.id] ? renderFinalActionsScene(scene, { completed: true })
      : renderCompletedScene(scene);
    return `
      <section class="scene-panel scene-panel-${scene.id} type-${scene.type}">
        ${scene.id === "opening" ? "" : `<header class="scene-header"><div class="source-identity"><span class="source-mark">${escapeHtml(source.mark)}</span><div><small>${escapeHtml(meta.group)}${meta.part ? " · " + escapeHtml(meta.part) : ""}</small><strong>${escapeHtml(source.label)}</strong></div></div><div class="scene-heading"><h2>${escapeHtml(scene.title)}</h2><p>${escapeHtml(scene.objective)}</p></div><div class="scene-mode">${escapeHtml(meta.mode)}</div></header>`}
        <div class="scene-body">${body}${hints}${feedback}</div>
      </section>`;
  }

  function renderCompletedScene(scene) {
    const skipped = state.skipped[scene.id];
    const distinct = state.feedback[scene.id] && state.feedback[scene.id].distinct ? renderFeedback(state.feedback[scene.id]) : "";
    const after = scene.afterComplete ? `<div class="recovered-system-log"><span>RECOVERED SYSTEM LOG</span>${paragraphs(scene.afterComplete)}</div>` : "";
    return `
      <div class="clue-reveal">
        <div class="clue-stamp"><span>${skipped ? "RESTORED" : "CLUE LOCKED"}</span><strong>${String(state.sceneIndex + 1).padStart(2, "0")}</strong></div>
        <div class="clue-main">
          <small>YOUR CONCLUSION</small>
          ${renderSelectionSummary(scene)}
          ${scene.reveal ? `<div class="clue-proof"><span>WHY IT MATTERS</span><p>${escapeHtml(scene.reveal)}</p></div>` : ""}
        </div>
        <aside class="clue-side">${after}${renderBoardUpdateSummary(scene)}</aside>
        ${distinct}
        <div class="clue-next"><span>Evidence added to the case file.</span><button class="primary-action" data-action="next">OPEN NEXT FILE →</button></div>
      </div>`;
  }

  function renderSelectionSummary(scene) {
    const selected = state.selections[scene.id];
    if (state.skipped[scene.id]) {
      return `<p>This puzzle was skipped. Required downstream evidence has been restored.</p>`;
    }
    if (scene.type === "sort") {
      const placements = selected && selected.placements ? selected.placements : {};
      const bucketLabels = {};
      (scene.buckets || []).forEach(function (bucket) { bucketLabels[bucket[0]] = bucket[1]; });
      const cardLabels = {};
      (scene.cards || []).forEach(function (card) { cardLabels[card[0]] = card[1]; });
      const rows = Object.keys(placements).map(function (card) {
        return `${cardLabels[card] || card}: ${bucketLabels[placements[card]] || placements[card]}`;
      });
      return `<p><strong>Recovered placement:</strong><br>${escapeHtml(rows.join("; ") || "Priority evidence restored.")}</p>`;
    }
    if (scene.type === "code") {
      return `<p><strong>Recovered code:</strong> ${escapeHtml(selected || "5491")}</p>`;
    }
    if (scene.type === "override") {
      return `<p><strong>Class decision:</strong> OVERRIDE SYSTEM. Some tasks can remain incomplete.</p>`;
    }
    if (scene.type === "curveball") {
      return `<p><strong>Reassessment:</strong> New English data recovered and considered.</p>`;
    }
    const labels = choiceLabels(scene);
    if (Array.isArray(selected)) {
      const text = selected.map(function (item) { return labels[item] || item; }).join("; ");
      return `<p><strong>Class selection:</strong> ${escapeHtml(text || "Evidence restored.")}</p>`;
    }
    if (selected && labels[selected]) {
      return `<p><strong>Class selection:</strong> ${escapeHtml(labels[selected])}</p>`;
    }
    return `<p><strong>Recovered evidence:</strong> ${escapeHtml(scene.expected || scene.objective)}</p>`;
  }

  function renderSceneBody(scene) {
    switch (scene.type) {
      case "opening": return renderOpening(scene);
      case "choice": return renderChoiceScene(scene);
      case "multi": return renderMultiScene(scene);
      case "connect": return renderConnectScene(scene);
      case "photoChoice": return renderPhotoScene(scene);
      case "code": return renderCodeScene(scene);
      case "afternoon": return renderAfternoonScene(scene);
      case "messages": return renderMessagesScene(scene);
      case "sort": return renderSortScene(scene);
      case "finalActions": return renderFinalActionsScene(scene);
      case "curveball": return renderCurveballScene(scene);
      case "override": return renderOverrideScene(scene);
      case "rootCause": return renderRootCauseScene(scene);
      case "reconstruction": return renderReconstructionScene(scene);
      case "reboot": return renderRebootScene(scene);
      default: return "";
    }
  }

  function renderOpening(scene) {
    return `
      <div class="opening-cinematic">
        <div class="opening-copy">
          <span class="opening-overline">DEVICE RECOVERY / CASE 01</span>
          <h1>Something went wrong<br><em>across one ordinary day.</em></h1>
          <p>Jordan's phone contains the trace. RESET.EXE contains the bad decisions.</p>
          <div class="opening-brief">
            <div><small>FAILURE TIME</small><strong>10:41 PM</strong></div>
            <div><small>LAST STABLE CHECK</small><strong>7:04 AM</strong></div>
            <div><small>DEVICE OWNER</small><strong>JORDAN</strong></div>
          </div>
          <div class="opening-mission"><span>MISSION</span><p>Recover the day in order. Find where advice that sounded reasonable stopped fitting the situation.</p></div>
          <button class="primary-action launch-action" data-action="begin"><span>BEGIN RECOVERY</span><b>→</b></button>
        </div>
        <div class="recovered-phone-wrap">
          <div class="glitch-fragment glitch-a"></div><div class="glitch-fragment glitch-b"></div>
          <div class="recovered-phone">
            <div class="phone-notch"></div>
            <div class="phone-topline"><span>RECOVERY MODE</span><b>3%</b></div>
            <div class="recovery-clock"><strong>10:47</strong><span>PM</span></div>
            <div class="failure-pill"><i></i><div><small>RESET.EXE</small><strong>DECISION MODEL FAILURE</strong><span>10:41 PM</span></div></div>
            <div class="lock-notifications">
              ${notification("Messages", "14 unread")}
              ${notification("School Portal", "Draft check tomorrow")}
              ${notification("Work", "Shift updated")}
            </div>
            <div class="swipe-mark"></div>
          </div>
        </div>
      </div>`;
  }

  function renderChoiceScene(scene) {
    return renderEvidence(scene) + renderChoices(scene, "single");
  }

  function renderMultiScene(scene) {
    return renderEvidence(scene) + renderChoices(scene, "multi");
  }

  function renderConnectScene(scene) {
    const calendarRows = scene.evidence.calendar.map(function (row, index) {
      return `<div class="calendar-event ${index === 0 ? "hot" : ""}"><span class="cal-time">${escapeHtml(row[1])}</span><strong>${escapeHtml(row[0])}</strong></div>`;
    }).join("");
    const portal = scene.evidence.portal.map(function (line, index) {
      return `<div class="portal-line ${index === 2 ? "hot" : ""}">${index === 0 ? `<span class="portal-subject">${escapeHtml(line)}</span>` : escapeHtml(line)}</div>`;
    }).join("");
    return `
      <div class="split-apps">
        <section class="app-window calendar-app"><header><span class="app-icon">31</span><div><small>JORDAN'S PHONE</small><strong>Calendar</strong></div></header><div class="app-content">${calendarRows}</div></section>
        <div class="compare-arrow"><span>COMPARE</span><b>↔</b></div>
        <section class="app-window portal-app"><header><span class="app-icon portal">S</span><div><small>SCHOOL</small><strong>Portal</strong></div></header><div class="app-content">${portal}</div></section>
      </div>
      ${renderChoices(scene, "multi")}`;
  }

  function photoProgress(sceneId) {
    const stored = state.progress && state.progress[sceneId];
    if (stored && Array.isArray(stored.recovered)) return stored;
    return { active: -1, recovered: [], recoverySeq: 0 };
  }

  function renderPhotoScene(scene, opts) {
    const completed = Boolean(opts && opts.completed);
    const prog = photoProgress(scene.id);
    const hasActive = prog.active >= 0 && prog.active < PHOTO_TIMES.length;
    const activeIndex = hasActive ? prog.active : -1;
    const recoveredCount = prog.recovered.length;
    const allRecovered = recoveredCount >= PHOTO_TIMES.length;

    const seq = prog.recoverySeq || 0;
    const justRecovered = hasActive && seq > (animatedPhotoSeq[scene.id] || 0);
    if (justRecovered) animatedPhotoSeq[scene.id] = seq;

    const rail = PHOTO_TIMES.map(function (time, index) {
      const isActive = index === activeIndex;
      const isRecovered = prog.recovered.indexOf(index) >= 0;
      const attrs = completed
        ? ""
        : `data-action="viewPhoto" data-scene="${scene.id}" data-value="${index}"`;
      const tag = completed ? "div" : "button";
      return `
        <${tag} class="gallery-thumb ${isActive ? "active" : ""} ${isRecovered ? "is-recovered" : "not-recovered"} ${completed ? "readonly" : ""}" ${attrs} aria-pressed="${isActive}">
          <span class="thumb-frame"><img src="${escapeHtml(PHOTO_ASSETS[index] || "assets/lunch-recovered.svg")}" alt=""></span>
          <span class="thumb-info"><strong>${escapeHtml(time)}</strong><small>${isRecovered ? "RECOVERED" : "TAP TO RECOVER"}</small></span>
        </${tag}>`;
    }).join("");

    const viewerBody = hasActive ? `
            <img src="${escapeHtml(PHOTO_ASSETS[activeIndex] || "assets/lunch-recovered.svg")}" alt="Recovered desk photo showing an open laptop, lunch and drink">
            <span class="viewer-tag">RECOVERED EVIDENCE</span>
            <span class="viewer-file">IMG_${escapeHtml(PHOTO_TIMES[activeIndex].replace(/[^0-9]/g, ""))}.JPG</span>
            <span class="viewer-time">${escapeHtml(PHOTO_TIMES[activeIndex])}</span>
            <i class="viewer-scan"></i>` : `
            <div class="corrupt-noise"></div>
            <span class="corrupt-caption">SELECT A STILL TO BEGIN RECOVERY</span>`;
    const metaBar = hasActive
      ? `<span>${escapeHtml(PHOTO_TIMES[activeIndex])}</span><span>RECOVERED STILL</span><span>4032 × 3024</span><span>SRC: CAMERA ROLL</span>`
      : `<span>NO STILL SELECTED</span><span>0/${PHOTO_TIMES.length} RECOVERED</span><span>SRC: CAMERA ROLL</span>`;

    let questionBlock;
    if (completed) {
      const justCompleted = !animatedCompletion[scene.id];
      if (justCompleted) animatedCompletion[scene.id] = true;
      const patternText = (scene.board && scene.board.confirmed && scene.board.confirmed[0]) || "Jordan worked through most of lunch.";
      questionBlock = `
      <div class="pr-question pr-locked">
        <div class="pattern-detected ${justCompleted ? "glitch-mount" : ""}"><span>PATTERN DETECTED</span><strong>${escapeHtml(patternText)}</strong></div>
        ${renderSelectionSummary(scene)}
        <span class="clue-locked-tag">CLUE LOCKED ✓</span>
        <div class="locked-footnote">${renderBoardUpdateSummary(scene)}${scene.reveal ? `<p>${escapeHtml(scene.reveal)}</p>` : ""}</div>
        <div class="locked-next"><span class="file-status-locked">FILE COMPLETE <small>AWAITING NEXT FILE…</small></span></div>
      </div>`;
    } else if (allRecovered) {
      questionBlock = `
      <div class="pr-question">
        <div class="sequence-transition"><span>PATTERN CHECK</span><h3>WHAT DOES THE SEQUENCE SUPPORT?</h3></div>
        ${renderChoices(scene, "single")}
      </div>`;
    } else {
      questionBlock = `
      <div class="pr-question">
        <div class="recovery-gate"><span>RECOVER ALL THREE STILLS TO CONTINUE</span><strong>${recoveredCount}/${PHOTO_TIMES.length} RECOVERED</strong></div>
      </div>`;
    }

    return `
      <div class="photo-recovery-layout">
        <aside class="gallery-rail">
          <div class="rail-label">GALLERY · DCIM</div>
          ${rail}
          <div class="rail-counter"><strong>${recoveredCount}/${PHOTO_TIMES.length}</strong><span>RECOVERED</span></div>
        </aside>
        <div class="viewer-main">
          <div class="viewer-frame ${hasActive ? "" : "corrupted"} ${justRecovered ? "glitch-mount glitch-sweep" : ""}">${viewerBody}</div>
          <div class="viewer-meta-bar">${metaBar}</div>
        </div>
        <div class="activity-trace">
          <div class="trace-chip"><span>SCHOOL PORTAL</span><strong>Active 12:32 – 1:10 PM</strong></div>
          <div class="trace-chip"><span>ENGLISH DOCUMENT</span><strong>Active 12:34 – 1:08 PM</strong></div>
        </div>
        ${questionBlock}
      </div>`;
  }

  function renderCodeScene(scene) {
    const code = state.selections[scene.id] || "";
    const digits = [0,1,2,3].map(function (index) { return `<span>${escapeHtml(code[index] || "·")}</span>`; }).join("");
    const recovered = scene.evidence.recovered.map(function (row, index) { return `<div class="decrypt-clue"><span>${String(index + 1).padStart(2,"0")}</span><strong>${escapeHtml(row[0])}</strong><b>${escapeHtml(row[1])}</b></div>`; }).join("");
    return `
      <div class="decrypt-layout">
        <section class="decrypt-file"><div class="folder-tab">DELETED DATA</div><div class="folder-lock"><span>LOCKED</span><strong>4-digit recovery key required</strong></div><div class="decrypt-clues">${recovered}</div><p class="decrypt-rule">Use the <strong>last digit</strong> of each recovered time, in order.</p></section>
        <section class="keypad-card"><small>RECOVERY KEY</small><div class="code-slots">${digits}</div><input class="invisible-code-input" data-code-input data-scene="${scene.id}" value="${escapeHtml(code)}" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Deleted data access code"><button class="primary-action" data-action="submit">UNLOCK FILE →</button><span>Type four digits</span></section>
      </div>`;
  }

  function renderAfternoonScene(scene) {
    const current = state.selections[scene.id] || {};
    const open = current.history;
    const rows = [
      ["3:48", "TikTok opened"],
      ["4:06", "TikTok active"],
      ["4:31", "TikTok active"],
      ["4:52", "TikTok active"],
      ["5:03", "TikTok active"],
      ["5:14", "TikTok closed"]
    ].map(function (row) { return `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`; }).join("");
    return `
      <ul class="timeline-list">
        <li class="timeline-item"><span class="timestamp">3:41 PM</span><span>School Wi-Fi disconnected</span></li>
        <li class="timeline-item"><span class="timestamp">DATA LOST</span><span>Missing activity period</span></li>
        <li class="timeline-item"><span class="timestamp">5:16 PM</span><span>Work message opened</span></li>
      </ul>
      <div class="action-row">
        <button class="subtle-action" data-action="toggleEvidence" data-scene="${scene.id}" data-value="history">${open ? "HIDE APP HISTORY" : "RECOVER APP HISTORY"}</button>
      </div>
      ${open ? `<table class="data-table"><thead><tr><th>Time</th><th>Activity</th></tr></thead><tbody>${rows}</tbody></table>` : ""}
      <div class="log-card system"><h3>3:44 PM - OVERLOAD DETECTED</h3><p>Recommendation: Take a break and do something enjoyable.</p></div>
      ${renderChoices(scene, "single")}`;
  }

  function renderMessagesScene(scene) {
    const selected = Array.isArray(state.selections[scene.id]) ? state.selections[scene.id] : [];
    const threads = [
      ["friend", "Friend", "4", ["you coming online tonight?", "??", "are you ignoring me", "okay then"]],
      ["teacher", "Teacher", "SCHOOL", ["Just confirming tomorrow is the draft check. Final submission is Monday."]],
      ["manager", "Manager", "WORK", ["Any chance you can start at 6 instead of 6:30?", "Thanks, appreciate it."]],
      ["home", "Home", "HOME", ["Food is in the fridge."]],
      ["random", "Random", "NOISE", ["streaks"]],
      ["group", "Group chat", "NOISE", ["anyone know what room tomorrow"]]
    ];
    const messages = threads.map(function (thread) {
      const active = selected.includes(thread[0]);
      return `<button class="thread-card ${active ? "selected" : ""}" data-action="toggleMulti" data-scene="${scene.id}" data-value="${thread[0]}" data-max="2" aria-pressed="${active}"><span class="thread-avatar">${escapeHtml(thread[1].slice(0,1))}</span><span class="thread-content"><strong>${escapeHtml(thread[1])}</strong><small>${escapeHtml(thread[3].join(" · "))}</small></span><span class="thread-meta">${escapeHtml(thread[2])}${active ? " ✓" : ""}</span></button>`;
    }).join("");
    return `
      <div class="messages-layout">
        <section class="messages-phone"><header><span>‹</span><strong>Messages</strong><b>14</b></header><div class="thread-list">${messages}</div></section>
        <aside class="message-mission">
          <span class="alert-time">5:17 PM</span><small>RESET.EXE ADVICE</small><h3>Respond to outstanding communication to reduce mental load.</h3><p>Jordan has time for <strong>two</strong> messages before work.</p><div class="selection-meter"><span style="width:${Math.min(selected.length,2)*50}%"></span></div><strong>${selected.length}/2 selected</strong><button class="primary-action" data-action="submit">LOCK TWO →</button>
        </aside>
      </div>`;
  }

  function renderSortScene(scene) {
    const placements = state.selections[scene.id] && state.selections[scene.id].placements ? state.selections[scene.id].placements : {};
    const unplaced = scene.cards.filter(function (card) { return !placements[card[0]]; });
    return `
      <div class="log-card warning"><h3>Maths Upload - due 11:59 PM</h3><p>Short response task. Estimated completion time: 8 minutes. Submission closes at midnight.</p></div>
      <div class="priority-summary"><strong>RESET.EXE priorities:</strong> English, Friend messages, Maths, Uniform, Shower, and Phone charging are all marked <strong>HIGH PRIORITY</strong>.</div>
      <div class="question-box">
        <h3>${escapeHtml(scene.prompt)}</h3>
        <div class="sort-layout">
          <div class="sort-source" data-drop-bucket="unplaced" data-action="placeSortCard" data-value="unplaced"><h3>Cards</h3>${renderSortCards(unplaced, scene.id)}</div>
          ${scene.buckets.map(function (bucket) {
            const cards = scene.cards.filter(function (card) { return placements[card[0]] === bucket[0]; });
            return `<div class="sort-bucket" data-drop-bucket="${bucket[0]}" data-action="placeSortCard" data-value="${bucket[0]}"><h3>${escapeHtml(bucket[1])}</h3>${renderSortCards(cards, scene.id)}</div>`;
          }).join("")}
        </div>
        <div class="action-row">
          <button class="primary-action" data-action="submit">SUBMIT PRIORITIES</button>
        </div>
      </div>`;
  }

  function renderSortCards(cards, sceneId) {
    return cards.map(function (card) {
      const selected = state.selectedSortCard === card[0] ? "selected" : "";
      return `<button class="sort-card ${selected}" draggable="true" data-drag-card="${card[0]}" data-action="selectSortCard" data-value="${card[0]}" data-scene="${sceneId}">${escapeHtml(card[1])}</button>`;
    }).join("");
  }

  function nightNotification(app, body, time, iconName, tier) {
    return `
      <div class="device-notif tier-${tier || "standard"}">
        <span class="notif-icon">${icon(iconName)}</span>
        <div class="notif-copy">
          <strong>${escapeHtml(app)}</strong>
          <span class="notif-body">${escapeHtml(body)}</span>
          <small>${escapeHtml(time)}</small>
        </div>
      </div>`;
  }

  function renderFinalActionsScene(scene, opts) {
    const completed = Boolean(opts && opts.completed);
    const selected = Array.isArray(state.selections[scene.id]) ? state.selections[scene.id] : [];
    const labels = choiceLabels(scene);
    const slotTag = completed ? "div" : "button";
    const slots = [0, 1, 2].map(function (i) {
      const id = selected[i];
      if (!id) return `<div class="fn-slot empty"><span class="slot-index">MOVE ${i + 1}</span><span class="slot-placeholder">Tap an action below to place it here</span></div>`;
      const attrs = completed ? "" : `data-action="toggleMulti" data-scene="${scene.id}" data-value="${id}" data-max="3" title="Tap to remove this move"`;
      return `<${slotTag} class="fn-slot filled glitch-mount" data-category="${escapeHtml(ACTION_CATEGORY[id] || "cyan")}" ${attrs}>
        <span class="slot-index">MOVE ${i + 1}</span>
        <span class="slot-icon">${icon(ACTION_ICONS[id] || "sparkle")}</span>
        <strong>${escapeHtml(labels[id] || id)}</strong>
        ${completed ? "" : `<span class="slot-remove">✕</span>`}
      </${slotTag}>`;
    }).join("");

    const tileTag = completed ? "div" : "button";
    const tiles = scene.choices.map(function (choice) {
      const id = choice[0];
      const isPlaced = selected.indexOf(id) >= 0;
      const attrs = completed ? "" : `data-action="toggleMulti" data-scene="${scene.id}" data-value="${id}" data-max="3" aria-pressed="${isPlaced}"`;
      return `<${tileTag} class="action-tile ${isPlaced ? "placed" : ""} ${completed ? "readonly" : ""}" data-category="${escapeHtml(ACTION_CATEGORY[id] || "cyan")}" ${attrs}>
        <span class="tile-icon">${icon(ACTION_ICONS[id] || "sparkle")}</span>
        <span class="tile-label">${escapeHtml(choice[1])}</span>
        ${isPlaced ? `<span class="tile-badge">PLACED</span>` : ""}
      </${tileTag}>`;
    }).join("");

    let warningBanner;
    if (completed) {
      const justCompleted = !animatedCompletion[scene.id];
      if (justCompleted) animatedCompletion[scene.id] = true;
      warningBanner = `
            <div class="device-warning locked ${justCompleted ? "glitch-mount" : ""}">
              <span class="warn-icon locked">✓</span>
              <div class="warn-copy"><strong>PROVISIONAL PLAN LOCKED</strong><p>Class decision recorded.</p></div>
              <div class="warn-confidence"><span>CONFIDENCE</span><b>${state.confidence}%</b></div>
            </div>`;
    } else {
      warningBanner = `
            <div class="device-warning live glitch-mount">
              <span class="warn-icon">${icon("warning")}</span>
              <div class="warn-copy"><strong>INCOMPLETE TASKS DETECTED</strong><p>Complete all outstanding items before sleep.</p></div>
              <div class="warn-confidence"><span>CONFIDENCE</span><b>${state.confidence}%</b></div>
            </div>`;
    }

    const footer = completed ? `
          <div class="plan-footer locked">
            <div class="locked-footnote">${renderBoardUpdateSummary(scene)}${scene.reveal ? `<p>${escapeHtml(scene.reveal)}</p>` : ""}</div>
            <span class="file-status-locked">FILE COMPLETE <small>AWAITING NEXT FILE…</small></span>
          </div>` : `
          <div class="plan-footer">
            <span class="capacity-flag">${icon("warning")}SYSTEM CAPACITY LIMIT · make 3 smart choices</span>
            <button class="primary-action" data-action="submit">LOCK PROVISIONAL PLAN →</button>
          </div>`;

    return `
      <div class="final-night-layout">
        <section class="phone-column">
          <div class="device-frame unstable glitch-mount">
            <div class="device-notch"></div>
            <div class="device-status"><span class="device-clock">9:47</span><span class="device-battery low">${icon("battery")}11%</span></div>
            <div class="device-feed">
              ${warningBanner}
              ${nightNotification("Maths", "Upload due 11:59 PM", "9:44 PM", "upload", "dominant")}
              ${nightNotification("Messages", "11 unread", "9:42 PM", "chat", "standard")}
              ${nightNotification("School Portal", "English draft check tomorrow", "9:37 PM", "cap", "standard")}
              ${nightNotification("Reminder", "Shower & uniform", "8:50 PM", "drop", "standard")}
              ${nightNotification("Home", "Food is in the fridge", "7:46 PM", "home", "standard")}
              ${nightNotification("Friend", "you coming online tonight?", "9:31 PM", "person", "compressed")}
              <div class="device-dock-remnant">${["chat", "cap", "home", "moon"].map(function (n) { return `<span class="dock-icon">${icon(n)}</span>`; }).join("")}</div>
            </div>
            <span class="device-crack a"></span><span class="device-crack b"></span><span class="device-crack c"></span>
          </div>
        </section>
        <section class="plan-column">
          <div class="plan-heading"><span>SYSTEM CAPACITY LIMITED</span><h2>YOU HAVE THREE MOVES.</h2></div>
          <div class="fn-slots">${slots}</div>
          <div class="action-bank">
            <div class="action-bank-head"><span>AVAILABLE ACTIONS</span><small>${selected.length}/3 placed${completed ? "" : " · tap to place, tap again to remove"}</small></div>
            <div class="action-grid">${tiles}</div>
          </div>
          ${footer}
        </section>
      </div>`;
  }

  function renderCurveballScene(scene) {
    const plan = Array.isArray(state.selections.finalNight) ? state.selections.finalNight : [];
    const labels = choiceLabels(sceneById("finalNight"));
    const containsEnglish = plan.includes("english");
    const changing = state.selections[scene.id] && state.selections[scene.id].change;
    const planText = plan.length ? plan.map(function (id) { return labels[id] || id; }).join("; ") : "No plan locked yet.";
    const done = isSceneDone(scene);
    return `
      <div class="log-card warning curveball-log">
        <h3>NEW DATA RECOVERED</h3>
        <p>English draft is already 80% complete. Draft check is tomorrow. Final submission is Monday.</p>
      </div>
      <div class="priority-summary curveball-plan"><strong>Current three-move plan:</strong> ${escapeHtml(planText)}</div>
      ${containsEnglish && !done ? `<div class="priority-summary curveball-note"><strong>Investigation note:</strong> The new evidence changes English's urgency. CHANGE ONE MOVE is the stronger investigation path before locking the final plan.</div>` : ""}
      ${done ? "" : `<div class="action-row"><button class="primary-action" data-action="submit">KEEP PLAN</button><button data-action="toggleEvidence" data-scene="${scene.id}" data-value="change">CHANGE ONE MOVE</button></div>`}
      ${changing ? renderEnglishReplacementChoices() : ""}`;
  }

  function renderEnglishReplacementChoices() {
    const labels = {
      eat: "Have something to eat",
      shower: "Shower/get ready",
      boundary: "Send brief boundary message"
    };
    const plan = Array.isArray(state.selections.finalNight) ? state.selections.finalNight : [];
    const choices = Object.keys(labels).map(function (id) {
      const selected = plan.includes(id);
      return `<button class="choice-card ${selected ? "selected" : ""}" aria-pressed="${selected}" data-action="replaceEnglishMove" data-value="${id}"><span>${escapeHtml(labels[id])}</span></button>`;
    }).join("");
    return `<div class="question-box"><h3>Choose the third move to lock after the new English data.</h3><div class="choice-list">${choices}</div><div class="action-row"><button class="primary-action" data-action="submit">LOCK UPDATED PLAN</button></div></div>`;
  }

  function renderOverrideScene(scene) {
    const current = state.selections[scene.id] || {};
    if (current.confirm) {
      return `<div class="override-screen confirm"><div class="override-icon">!</div><small>SYSTEM OVERRIDE REQUESTED</small><h3>Leave some tasks unfinished?</h3><p>The class has already separated urgent work from tasks that can wait.</p><div class="override-actions"><button class="primary-action" data-action="submit">YES · OVERRIDE →</button><button data-action="selectSingle" data-scene="${scene.id}" data-value="cancel">GO BACK</button></div></div>`;
    }
    return `<div class="override-screen"><div class="system-lockout"><span>RESET.EXE</span><b>4 TASKS WILL REMAIN INCOMPLETE</b><p>Recommended action: cancel the plan and finish all outstanding items before sleep.</p></div><div class="override-choice"><small>THE SYSTEM IS COUNTING TASKS.<br>YOU ARE JUDGING PRIORITY.</small><h3>Do you trust the old model?</h3><div class="override-actions"><button data-action="selectSingle" data-scene="${scene.id}" data-value="cancel">CANCEL PLAN</button><button class="primary-action" data-action="selectSingle" data-scene="${scene.id}" data-value="override">OVERRIDE SYSTEM</button><button class="primary-action" data-action="submit">CONFIRM CHOICE →</button></div></div></div>`;
  }

  function renderRootCauseScene(scene) {
    const selected = Array.isArray(state.selections[scene.id]) ? state.selections[scene.id] : [];
    const labels = choiceLabels(scene);
    const cards = scene.choices.map(function (choice) {
      const active = selected.includes(choice[0]);
      const red = choice[0] === "battery";
      return `<button class="cause-card ${active ? "selected" : ""} ${red ? "red-herring" : ""}" data-action="toggleMulti" data-scene="${scene.id}" data-value="${choice[0]}" data-max="6" aria-pressed="${active}"><span>${active ? "✓" : "+"}</span><strong>${escapeHtml(labels[choice[0]])}</strong></button>`;
    }).join("");
    return `<div class="cause-layout"><section class="cause-brief"><small>CASE QUESTION</small><h3>What actually made the day unravel?</h3><p>There is no single cause. Select up to six factors that genuinely increased pressure — including the system pattern.</p><div class="cause-counter"><strong>${selected.length}</strong><span>/ 6 selected</span></div><button class="primary-action" data-action="submit">CLOSE THE CASE →</button></section><section class="cause-wall">${cards}</section></div>`;
  }

  function renderReconstructionScene() {
    const items = [
      ["1:51 AM", "Limited sleep", "Phone finally locks."],
      ["6:45 AM", "Fatigue", "RESET.EXE says: stay in bed longer."],
      ["Morning", "Rush", "Usual bus missed. Breakfast appears skipped."],
      ["School", "Wrong urgency", "English final is Monday, not tomorrow."],
      ["Lunch", "Basic needs", "Jordan works through most of lunch."],
      ["After school", "No strategy review", "A reasonable break stretches past an hour."],
      ["Evening", "Noise", "Messages and work pressure stack up."],
      ["Night", "Everything = urgent", "RESET.EXE tells Jordan to finish it all."],
      ["10:41 PM", "MODEL FAILURE", "The system cannot prioritise the accumulated context."]
    ].map(function (item, index) {
      return `<div class="reconstruction-node"><span class="node-index">${String(index + 1).padStart(2, "0")}</span><span class="timestamp">${escapeHtml(item[0])}</span><strong>${escapeHtml(item[1])}</strong><p>${escapeHtml(item[2])}</p></div>`;
    }).join("");
    return `
      <div class="reconstruction-flow">${items}</div>
      <div class="root-cause-card">
        <span>ROOT CAUSE</span>
        <h3>There wasn't one.</h3>
        <p>Pressure accumulated. RESET.EXE kept solving each problem separately instead of checking the whole situation.</p>
        <div class="root-tags"><span>CONTEXT</span><span>PRIORITY</span><span>BASIC NEEDS</span><span>STRATEGY REVIEW</span></div>
      </div>`;
  }

  function renderRebootScene() {
    const checks = ["CONTEXT CHECK", "PRIORITY CHECK", "BASIC NEEDS CHECK", "STRATEGY REVIEW", "SUPPORT CHECK"]
      .map(function (item) { return `<div class="reboot-check"><span>✓</span><strong>${escapeHtml(item)}</strong><small>ENABLED</small></div>`; }).join("");
    return `
      <div class="reboot-screen">
        <span class="reboot-kicker">RESET.EXE 2.0</span>
        <h3>Decision model rebuilt.</h3>
        <div class="reboot-bar"><span></span></div>
        <div class="reboot-checks">${checks}</div>
        <div class="final-line"><span>SYSTEM STATUS · STABLE</span><strong>Not every problem needs fixing at once.</strong></div>
      </div>`;
  }

  function renderEvidence(scene) {
    if (!scene.evidence) return "";
    if (scene.id === "activity") {
      const late = scene.evidence.rows.slice(0, 4).map(function (row, index) {
        return `<div class="trace-event ${index === 3 ? "anchor" : ""}"><span>${escapeHtml(row[0])}</span><strong>${escapeHtml(row[1])}</strong></div>`;
      }).join("");
      const morning = scene.evidence.rows.slice(4).map(function (row, index) {
        return `<div class="trace-event ${index === 0 ? "anchor" : ""}"><span>${escapeHtml(row[0])}</span><strong>${escapeHtml(row[1])}</strong></div>`;
      }).join("");
      return `<div class="device-trace"><section><header><small>ACTIVITY WINDOW A</small><strong>LATE NIGHT</strong></header><div class="trace-line">${late}</div></section><div class="overnight-gap"><span>PHONE LOCKED</span><i></i><b>OVERNIGHT GAP</b><i></i><span>FIRST ALARM</span></div><section><header><small>ACTIVITY WINDOW B</small><strong>MORNING</strong></header><div class="trace-line morning">${morning}</div></section></div>`;
    }
    if (scene.id === "morning") {
      const glyphs = ["●","⌖","BUS","○","…","BUS","WIFI"];
      return `<div class="morning-route">${scene.evidence.rows.map(function (row, index) { return `<div class="route-node ${index === 2 || index === 3 ? "warning" : ""}"><span class="route-glyph">${escapeHtml(glyphs[index])}</span><div><small>${escapeHtml(row[0])}</small><strong>${escapeHtml(row[1])}</strong></div></div>`; }).join("")}</div>`;
    }
    if (scene.evidence.kind === "activityTable") {
      const rows = scene.evidence.rows.map(function (row) {
        return `<div class="activity-row"><span class="timestamp">${escapeHtml(row[0])}</span><span>${escapeHtml(row[1])}</span></div>`;
      }).join("");
      return `<div class="activity-grid">${rows}</div>`;
    }
    if (scene.evidence.kind === "timeline") {
      return `<ul class="timeline-list">${scene.evidence.rows.map(function (row) { return `<li class="timeline-item"><span class="timestamp">${escapeHtml(row[0])}</span><span>${escapeHtml(row[1])}</span></li>`; }).join("")}</ul>`;
    }
    if (scene.evidence.kind === "log") {
      return `<div class="evidence-grid">${scene.evidence.cards.map(function (card) { return `<div class="log-card system"><h3>${escapeHtml(card[0])}</h3><p>${escapeHtml(card[1])}</p></div>`; }).join("")}</div>`;
    }
    return "";
  }

  function renderChoices(scene, mode, curveballChange) {
    const selected = Array.isArray(state.selections[scene.id]) ? state.selections[scene.id] : [];
    const single = state.selections[scene.id] || "";
    const max = scene.max || 99;
    const forensic = scene.id === "photos";
    const countNote = mode === "multi" && max < 99 ? `<span class="choice-count">${selected.length}/${max} selected</span>` : "";
    const choices = scene.choices.map(function (choice, index) {
      const id = choice[0];
      const label = choice[1];
      const isSelected = mode === "single" ? single === id : selected.includes(id);
      const prefix = mode === "single" && /^[a-d]$/.test(id) ? id.toUpperCase() : String(index + 1).padStart(2, "0");
      return `<button class="choice-card ${forensic ? "forensic-card" : ""} ${isSelected ? "selected" : ""}" aria-pressed="${isSelected}" data-action="${mode === "single" ? "selectSingle" : "toggleMulti"}" data-scene="${scene.id}" data-value="${id}" data-max="${max}"><span class="choice-prefix">${escapeHtml(prefix)}</span><span class="choice-text">${escapeHtml(label)}</span><span class="choice-check">${isSelected ? "✓" : ""}</span></button>`;
    }).join("");
    const submitLabel = curveballChange ? "UPDATE PLAN" : scene.id === "finalNight" ? "LOCK PROVISIONAL PLAN" : "LOCK DECISION";
    return `<div class="decision-dock ${forensic ? "forensic-dock" : ""}"><div class="decision-title"><div><small>${escapeHtml(sceneQuestionLabel(scene))}</small><h3>${escapeHtml(scene.prompt || "Choose from the evidence")}</h3></div>${countNote}</div><div class="choice-list">${choices}</div><div class="decision-actions"><button class="primary-action" data-action="submit">${submitLabel} →</button></div></div>`;
  }

  function renderHints(scene) {
    const count = state.hintCounts[scene.id] || 0;
    if (!count || !scene.hints || !scene.hints.length) return "";
    const visible = scene.hints.slice(0, count).map(function (hint, index) {
      return `<p><strong>Hint ${index + 1}:</strong> ${escapeHtml(hint)}</p>`;
    }).join("");
    return `<div class="hint-box"><h3>Hints</h3>${visible}</div>`;
  }

  function renderFeedback(feedback) {
    const title = feedback.title || (feedback.type === "good" ? "Recovered" : "Check Evidence");
    return `<div class="feedback ${feedback.type === "good" ? "good" : ""}"><h3>${escapeHtml(title)}</h3>${paragraphs(feedback.text || "")}</div>`;
  }

  function renderBoard() {
    return `<section class="board-panel"><div class="panel-head"><div class="scene-kicker-row"><span class="mode-badge">CASE BOARD</span><span>LIVE NOTES</span></div><h2 class="scene-title">What the class has established</h2><div class="action-row"><button class="subtle-action" data-action="closeBoard">CLOSE BOARD</button></div></div><div class="panel-body">${renderBoardColumns()}</div></section>`;
  }

  function renderBoardColumns() {
    return `<div class="board-columns">
      ${boardColumn("CONFIRMED", state.board.confirmed)}
      ${boardColumn("POSSIBLE", state.board.possible)}
      ${boardColumn("UNRESOLVED", state.board.unresolved)}
    </div>`;
  }

  function boardColumn(title, items) {
    const list = (items || []).map(function (item) { return `<li>${escapeHtml(item)}</li>`; }).join("");
    return `<section class="board-column"><h3>${escapeHtml(title)}</h3><ul>${list || "<li>None</li>"}</ul></section>`;
  }

  function renderDisplayCheck() {
    return `
      <div class="display-check">
        <span class="edge-marker edge-top">TOP SAFE EDGE</span>
        <span class="edge-marker edge-bottom">BOTTOM SAFE EDGE</span>
        <span class="edge-marker edge-left">LEFT</span>
        <span class="edge-marker edge-right">RIGHT</span>
        <header>
          <div class="eyebrow">Student Display Check</div>
          <h1>RESET.EXE classroom screen test</h1>
        </header>
        <div class="display-check-grid">
          <div class="display-check-panel">
            <div class="phone-status"><span>10:47 PM</span><span class="battery">3%</span></div>
            <div class="lock-clock glitch">10:47</div>
            <div class="notification-stack">
              ${notification("RESET.EXE", "SYSTEM FAILURE DETECTED")}
              ${notification("Messages", "14 unread")}
            </div>
          </div>
          <div class="display-check-panel">
            <h2>Normal Evidence Text</h2>
            <p>This paragraph should be readable from across the classroom without clipping. Essential content should sit inside the amber safe-area border.</p>
            <div class="evidence-grid">
              <div class="evidence-card">Evidence panel example</div>
              <div class="evidence-card">Bottom UI example</div>
            </div>
          </div>
        </div>
        <footer class="student-warning">If edges are cropped, adjust the TV/projector fit or use Text - / Text + from the facilitator view.</footer>
      </div>`;
  }

  function renderSceneList() {
    return `<ol class="fac-list">${SCENES.map(function (scene, index) {
      const classes = index === state.sceneIndex ? "current" : "";
      const done = state.completed[scene.id] ? " ✓" : state.skipped[scene.id] ? " skipped" : "";
      return `<li class="${classes}">${index + 1}. ${escapeHtml(scene.file)} - ${escapeHtml(scene.title)}${done}</li>`;
    }).join("")}</ol>`;
  }

  function submitOverride(scene) {
    const current = state.selections[scene.id] || {};
    if (current.confirm) {
      completeScene(scene);
      state.feedback[scene.id] = { type: "good", text: scene.reveal };
      return;
    }
  }

  const originalSubmitScene = submitScene;
  submitScene = function (scene) {
    if (scene.type === "override") {
      const selected = state.selections[scene.id];
      if (selected === "override") {
        state.selections[scene.id] = { confirm: true };
        state.feedback[scene.id] = { type: "good", text: "RESET.EXE requires confirmation because four tasks will remain incomplete." };
        return;
      }
      if (selected && selected.confirm) {
        completeScene(scene);
        state.feedback[scene.id] = { type: "good", text: "OLD DECISION MODEL DISABLED" };
        return;
      }
      state.feedback[scene.id] = { type: "warn", text: "Cancelling would return to the old 'finish everything' model. The investigation suggests overriding it." };
      return;
    }
    if (scene.type === "curveball") {
      const changing = state.selections[scene.id] && state.selections[scene.id].change;
      const plan = Array.isArray(state.selections.finalNight) ? state.selections.finalNight : [];
      if (changing) {
        const result = evaluateFinalPlan(plan, { allowEnglish: false, reveal: scene.reveal });
        if (!result.ok) {
          state.feedback[scene.id] = { type: "warn", text: result.message };
          return;
        }
        completeScene(scene);
        state.feedback[scene.id] = { type: "good", title: "Reassessment", text: "Plan updated after new data.", distinct: true };
        return;
      }
      if (plan.includes("english")) {
        state.feedback[scene.id] = { type: "warn", text: "The new evidence changes English's urgency. Before locking the plan, consider whether that move could do more somewhere else." };
        return;
      }
      const result = evaluateFinalPlan(plan, { allowEnglish: false, reveal: scene.reveal });
      if (!result.ok) {
        state.feedback[scene.id] = { type: "warn", text: result.message };
        return;
      }
      completeScene(scene);
      state.feedback[scene.id] = { type: "good", title: "Reassessment", text: "Plan kept after reviewing the new English data.", distinct: true };
      return;
    }
    originalSubmitScene(scene);
  };

  function sceneStateLabel(scene) {
    if (state.skipped[scene.id]) return "Skipped by facilitator";
    if (state.completed[scene.id]) return "Completed";
    return "In progress";
  }

  function choiceLabels(scene) {
    const map = {};
    (scene.choices || []).forEach(function (choice) { map[choice[0]] = choice[1]; });
    return map;
  }

  function studentUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "student");
    return url.toString();
  }

  function textScaleLabel() {
    if (state.textScale < 0) return "Small";
    if (state.textScale > 0) return "Large";
    return "Auto";
  }

  function formatTimer(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  function paragraphs(text) {
    return String(text || "").split(/\n{2,}/).map(function (block) {
      const lines = block.split(/\n/).map(escapeHtml).join("<br>");
      return `<p>${lines}</p>`;
    }).join("");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
