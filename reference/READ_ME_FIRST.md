# Claude Handoff — Energy Bar Challenge

## File precedence

1. **MASTER_BUILD_SPEC_LOCKED.md** — authoritative activity design, mechanics, energy values, story, branching and teaching intent.
2. **Energy_Bar_Challenge_LATEST_RUNTIME.html** — most recent classroom/runtime implementation. This contains critical browser-level repairs made after the modular source baseline was packaged.
3. **source_baseline/** — latest clean modular source project available before those later browser-level critical repairs. Use this for maintainable source structure, but DO NOT assume it includes every fix present in the latest runtime HTML.
4. **latest_audit_harness/** — browser/branch/facilitator/viewport audit scripts used during the latest QA passes. These are supporting evidence/tools, not authoritative over the Master Spec.

## Important warning

The latest runtime HTML and the modular source baseline are intentionally both included because several critical fixes were made directly during browser-driven standalone auditing after the last clean source ZIP was produced.

Claude should:

- treat the Master Spec as design authority;
- reproduce defects against `Energy_Bar_Challenge_LATEST_RUNTIME.html`;
- inspect `source_baseline/` for maintainable project structure;
- reconcile/back-port required latest runtime repairs into modular source as part of the forensic repair;
- rebuild a new standalone from the corrected modular source;
- do not silently revert the latest runtime repairs merely because the older modular source differs.

## Known classes of defects discovered previously

Previous passes found issues including dead-looking/unclickable vote locks, bundle-level function name collisions, Round 3 follow-up freeze, transient reset/reconnect state, facilitator/student sequencing mismatches, unreachable Life Happens branches, vague result explanations, and facilitator information-order problems. Do not assume these are the only remaining defects.
