/* =====================================================================
 * js/state.js
 *
 * GameState shape, initial state factory, persistent RunState, the
 * transactional store (commit/back/forward/undo), validation, and the
 * small time/energy helpers shared by every other module.
 *
 * Time is represented as minutes since midnight throughout the app.
 *   07:10 = 430   15:45 = 945   16:00 = 960   22:30 = 1350
 *
 * Only ONE module is allowed to mutate the live state objects: this one.
 * Everything else calls commitAction({ actionId, mutate }).
 * ===================================================================== */

// ── Small shared helpers ────────────────────────────────────────────────
function clampEnergy(e) { return Math.max(0, Math.min(100, e)); }

function formatTime(m) {
  if (m == null) return "--:--";
  const h = Math.floor(m / 60), mm = m % 60, p = h < 12 ? "AM" : "PM", hh = h % 12 || 12;
  return `${hh}:${String(mm).padStart(2, "0")} ${p}`;
}

function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

function generateUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── GameState (reversible — lives in history, Undo/Back restore it) ────
/**
 * Returns a fresh reversible GameState object.
 * Called on activity start and on full reset.
 */
function createInitialGameState() {
  return {
    // Core resources
    energy: 100,
    currentTime: null,          // null before story begins; minutes-since-midnight once started

    // Food model
    breakfastHistory: "not_yet",  // "not_yet" | "covered"
    lunchHistory:     "not_yet",  // "not_yet" | "covered" | "missed" | "late_food_obtained"
    currentHunger:    false,
    dinnerStatus:     "not_yet",  // "not_yet" | "needed" | "covered"

    // Assessment model — never both > 0 at once (validated below)
    assessmentRemaining: 0,       // minutes still needed today
    assessmentTomorrow:  0,       // minutes deliberately moved to tomorrow
    assessmentWorkedTonight: false,

    // Support plan
    supportPlan: "none",          // "none" | "planned"

    // Friend status
    friendKnownBeforeLunch: false,
    friendStatus: null,           // null | "resolved" | "pending"

    // Group chat & videos (parked phone content)
    groupChatStatus: null,        // null | "done" | "later" | "muted" | "tomorrow"
    videosStatus:    null,        // null | "done" | "later" | "muted" | "tomorrow"

    // Transient attention sort (R2) — which NOW item Jordan actually checked
    friendDMStatus: null,         // null | "checked" | "deferred"

    // Work schedule
    workStart: null,
    workEnd:   null,
    extraPaidMinutes: 0,

    // Interactive planning state
    workChoice: null,
    workGapTotal: 0,
    workGapRemaining: 0,
    workGapActions: [],
    workEnergyApplied: false,
    workResetUsed: false,       // R5 reset — once per gap
    eveningResetUsed: false,    // R6 reset — once per evening
    organisedUsed: false,
    eveningActions: [],
    tomorrowClassWindow: 0,
    tomorrowBasicsDecision: null,

    // Home / training times
    homeTime:      null,
    trainingStart: null,
    trainingEnd:   null,

    // Basketball
    basketballStatus: "undecided",  // "undecided" | "attend" | "late" | "skip"

    // Home noise (Life Happens 2 "Home Is Loud")
    homeBusyUntil: null,

    // Tomorrow calculations
    tomorrowBasics: "undone",     // "undone" | "partial" | "done"
    tomorrowLoad:   0,            // minutes deferred to tomorrow (derived)
    targetBedtime:  null,

    // Life-Happens effect tracking (prevents double-apply)
    lifeEffectsApplied: { life1: false, life2: false, life3: false },

    // Structured decision log (facilitator "story so far" + result rendering)
    // Each entry: { round, phase?, choiceId?, label?, summary? }
    decisionLog: [],

    // UI/navigation state — single source of truth for both screens
    currentRound:   0,            // 0 = not started
    currentPhase:   "none",       // "none" | "story" | "choice" | "discussion" | "result" | "life_happens"
    viewDescriptor: "home",       // symbolic view ID consumed by both screens
  };
}

// ── RunState (persistent — survives Undo/Back; only a full reset clears it) ──
/**
 * Life-Happens event assignments are drawn once per run and must never
 * reroll just because a facilitator used Back/Undo/Forward.
 */
function createInitialRunState() {
  return { life1: null, life2: null, life3: null, sessionId: generateUuid() };
}

// ── Live state ───────────────────────────────────────────────────────────
let gs = createInitialGameState();
let rs = createInitialRunState();

// Committed history: each entry is a POST-action snapshot.
let history = [];
let cursor = -1;

// Projector (child) window reference, set by the facilitator after window.open().
let projectorWindow = null;

function initStore() {
  gs = createInitialGameState();
  rs = createInitialRunState();
  history = [_makeEntry("__baseline__")];
  cursor = 0;
}

/** Full activity reset: fresh GameState, fresh RunState (new Life-Happens draws), history cleared. */
function fullReset() {
  gs = createInitialGameState();
  rs = createInitialRunState();
  history = [_makeEntry("__baseline__")];
  cursor = 0;
  _broadcast();
}

/**
 * commitAction — the ONLY way to mutate state.
 *   1. Truncate any abandoned forward branch.
 *   2. Clone gs into a draft.
 *   3. mutate(draft) — caller applies changes.
 *   4. Validate.
 *   5. No-op detection (nothing changed → no history entry).
 *   6. Draft becomes live gs; push history; broadcast.
 */
function commitAction({ actionId, mutate }) {
  if (typeof mutate !== "function") throw new Error("commitAction: mutate must be a function");

  if (cursor < history.length - 1) history = history.slice(0, cursor + 1);

  const draft = _deepClone(gs);
  mutate(draft);
  _validate(draft);

  if (JSON.stringify(draft) === JSON.stringify(gs)) return { committed: false };

  gs = draft;
  history.push(_makeEntry(actionId));
  cursor = history.length - 1;
  _broadcast();
  return { committed: true };
}

function back() {
  if (cursor <= 0) return false;
  cursor--;
  _restoreFromHistory(cursor);
  return true;
}

function forward() {
  if (cursor >= history.length - 1) return false;
  cursor++;
  _restoreFromHistory(cursor);
  return true;
}

/** Undo — discards the current entry and everything ahead of it, then restores the previous one. */
function undo() {
  if (cursor <= 0) return false;
  history = history.slice(0, cursor);
  cursor--;
  _restoreFromHistory(cursor);
  return true;
}

/** Assigns (once, idempotently) the event ID for a Life-Happens slot. Never rerolls. */
function getOrAssignLifeEvent(slot, pickFn) {
  if (!["life1", "life2", "life3"].includes(slot)) throw new Error(`Unknown slot: ${slot}`);
  if (rs[slot] !== null) return rs[slot];
  rs[slot] = pickFn();
  return rs[slot];
}

// ── Projector window management ─────────────────────────────────────────
function registerProjectorWindow(win) {
  projectorWindow = win;
  _broadcast(); // if the child hasn't attached its listener yet, its own REQUEST_STATE retries this
}

/** Broadcast facilitator-only transient UI (votes/sort/timer) without touching history. */
function broadcastUi(uiState) {
  if (!projectorWindow || typeof projectorWindow.postMessage !== "function") return;
  projectorWindow.postMessage({ type: "UI_STATE", uiState: _deepClone(uiState || {}) }, "*");
}

/** Handle REQUEST_STATE from the projector (reconnect / fresh load). */
function handleProjectorRequest(event) {
  if (event.source !== projectorWindow) return;
  const msg = event.data;
  if (!msg || msg.type !== "REQUEST_STATE") return;
  _broadcast();
}

// ── Read accessors ──────────────────────────────────────────────────────
function getGameState() { return _deepClone(gs); }
function getRunState()  { return { ...rs }; }
function getHistory()   { return history.map(e => ({ actionId: e.actionId, viewDescriptor: e.gameState.viewDescriptor })); }
function getCursor()    { return cursor; }

// ── Internal helpers ─────────────────────────────────────────────────────
function _deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function _makeEntry(actionId) { return { gameState: _deepClone(gs), actionId }; }

function _restoreFromHistory(idx) {
  gs = _deepClone(history[idx].gameState);
  _broadcast();
}

function _broadcast() {
  if (!projectorWindow || typeof projectorWindow.postMessage !== "function") return;
  projectorWindow.postMessage({
    type: "FULL_STATE",
    sessionId: rs.sessionId,
    gameState: _deepClone(gs),
    runAssignments: { life1: rs.life1, life2: rs.life2, life3: rs.life3 },
    viewDescriptor: gs.viewDescriptor,
  }, "*");
}

/** Lightweight schema validator — throws on known violations. Catches state bugs early. */
function _validate(draft) {
  const FOOD_BREAKFAST = ["not_yet", "covered"];
  const FOOD_LUNCH     = ["not_yet", "covered", "missed", "late_food_obtained"];
  const FOOD_DINNER    = ["not_yet", "needed", "covered"];
  const SUPPORT        = ["none", "planned"];
  const PHONE_STATUS   = [null, "done", "later", "muted", "tomorrow"];
  const BASKETBALL     = ["undecided", "attend", "late", "skip"];
  const TOMORROW       = ["undone", "partial", "done"];

  function check(val, allowed, field) {
    if (!allowed.includes(val)) throw new Error(`Invalid ${field}: "${val}"`);
  }

  check(draft.breakfastHistory, FOOD_BREAKFAST, "breakfastHistory");
  check(draft.lunchHistory,     FOOD_LUNCH,     "lunchHistory");
  check(draft.dinnerStatus,     FOOD_DINNER,    "dinnerStatus");
  check(draft.supportPlan,      SUPPORT,        "supportPlan");
  check(draft.groupChatStatus,  PHONE_STATUS,   "groupChatStatus");
  check(draft.videosStatus,     PHONE_STATUS,   "videosStatus");
  check(draft.basketballStatus, BASKETBALL,     "basketballStatus");
  check(draft.tomorrowBasics,   TOMORROW,       "tomorrowBasics");

  if (draft.assessmentRemaining < 0) throw new Error("assessmentRemaining cannot be negative");
  if (draft.assessmentTomorrow  < 0) throw new Error("assessmentTomorrow cannot be negative");
  if (draft.assessmentRemaining > 0 && draft.assessmentTomorrow > 0) {
    throw new Error("Assessment minutes cannot exist in both today and tomorrow at once");
  }

  if (draft.energy < 0 || draft.energy > 100) throw new Error(`energy out of range: ${draft.energy}`);
}

// ── Test helpers (not used by the live app; kept for future automated tests) ──
function _resetStoreForTests({ gameState, runState } = {}) {
  gs = gameState ? _deepClone(gameState) : createInitialGameState();
  rs = runState ? { ...runState } : createInitialRunState();
  history = [_makeEntry("__baseline__")];
  cursor = 0;
  projectorWindow = null;
}
