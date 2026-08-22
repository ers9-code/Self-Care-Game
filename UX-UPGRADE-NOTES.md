# RESET.EXE — Cinematic Investigation Rebuild

## Why this version exists

The previous build was functional but still looked and read too much like a classroom dashboard. This rebuild changes the presentation model rather than only changing colours or spacing.

## What changed

- Student screen now behaves like a **case-recovery interface**, not a three-column dashboard.
- Added a clear day thread across the whole investigation: Recovery → Morning → School → After School → Night → Case Close.
- Opening rebuilt as a cinematic recovered-phone briefing with a much clearer mission.
- Each evidence source now has its own visual treatment rather than using the same generic cards everywhere.
- Device Activity is now an overnight activity trace rather than a grid of equal boxes.
- Morning Recovery is shown as a connected route/timeline.
- Calendar and School Portal are styled as two believable apps being compared side by side.
- Photo Recovery uses a local recovered-still asset with a forensic treatment instead of flat CSS shapes.
- Deleted Data uses a dedicated recovery-key / locked-folder interface.
- Message Archive now looks and behaves like a real message list, with the decision task beside it.
- Final Night is a dedicated three-move command screen with persistent move slots.
- System Override and Root Cause have dedicated high-stakes layouts rather than standard question cards.
- Completed scenes now become **CLUE LOCKED** screens that explicitly connect the class conclusion to why the evidence matters.
- Investigation Board remains available, but no longer competes with the active evidence unless deliberately opened.
- Facilitator view rebuilt as **Mission Control** with a live student preview and a right-side runbook: SAY, LISTEN FOR, IF IT STALLS.
- Advanced/display controls are moved out of the main teaching flow.

## Preserved

- Approved Jordan storyline and evidence logic.
- Flexible message outcomes and final-plan logic.
- Final Curveball third-move reassessment fix.
- Root Cause flexible validation.
- Facilitator-authoritative two-screen sync.
- Localhost launcher/server architecture.
- Offline operation and no external assets/requests.
- No required student-screen scrolling.

## Small content realism change retained from the prior UX pass

- `7:46 AM — Breakfast reminder dismissed` replaces the implausible phone claim `kitchen activity: none recorded`.
- Wording still only infers that breakfast **appears** to have been skipped.

## QA completed for this rebuild

- `node --check app.js` passes.
- Critical interaction smoke tests pass for Device Activity, Deadline Mismatch, Deleted Data 5491, Message Archive, Final Night and Root Cause.
- All 18 default student scenes checked at:
  - 1024×768
  - 1280×720
  - 1366×768
  - 1600×900
  - 1920×1080
  - 2560×1440
  - 3840×2160
- No required document scrolling, active-scene internal overflow or off-screen action buttons found in those checks.
- Facilitator view visually checked at 1366×768 and 1600×1000. Facilitator scrolling remains allowed.
- Saved-state schema bumped to version 3 so earlier prototype progress does not contaminate this rebuild.
