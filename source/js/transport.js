/* =====================================================================
 * js/transport.js
 *
 * Facilitator <-> projector postMessage sync. Sends the full committed
 * GameState (via state.js's broadcast helpers) plus the transient UI
 * state (vote counts, countdown, runoff, sort placements, checked-NOW
 * item) that never enters history. Supports reconnect: the projector
 * always asks for REQUEST_STATE on load, and the facilitator always
 * answers with the current authoritative state, regardless of how long
 * the projector was closed or whether it is a brand-new window.
 * ===================================================================== */

/** Builds the transient UI snapshot sent alongside every FULL_STATE/UI_STATE broadcast. */
function uiState() {
  return {
    votes: { ...votes },
    runoffIds: runoffIds ? [...runoffIds] : null,
    timerLeft, timerStarted, timerExpired,
    sortAssignments: { ...sortAssignments },
    checkedNowItem,
  };
}

// ── Facilitator side ─────────────────────────────────────────────────────
let projectorPopup = null;

function openProjector() {
  const u = new URL(location.href);
  u.searchParams.set("projector", "1");
  projectorPopup = window.open(u.toString(), "projector", "width=1366,height=768,menubar=no,toolbar=no");
  if (projectorPopup) {
    registerProjectorWindow(projectorPopup);
    broadcastUi(uiState());
  }
}

function installFacilitatorTransport() {
  window.addEventListener("message", e => {
    if (e.data?.type === "REQUEST_STATE") {
      handleProjectorRequest(e);
      broadcastUi(uiState());
    }
  });
}

// ── Projector side ───────────────────────────────────────────────────────
let projLocalSessionId = null, projLocalGS = null, projLocalRS = null, projLocalUI = {};

function initProjector() {
  document.body.classList.add("projector-mode");
  const root = document.getElementById("projector-root");
  if (root) root.innerHTML = renderShell({ energy: 100, currentRound: 0, viewDescriptor: "home" }, {});
  window.addEventListener("message", handleProjectorMessage);
  if (window.opener) window.opener.postMessage({ type: "REQUEST_STATE", lastSessionId: projLocalSessionId }, "*");
}

function handleProjectorMessage(event) {
  if (event.source !== window.opener) return;
  const m = event.data;
  if (!m) return;
  const root = document.getElementById("projector-root");
  if (m.type === "UI_STATE") {
    projLocalUI = JSON.parse(JSON.stringify(m.uiState || {}));
    if (root && projLocalGS) root.innerHTML = renderShell(projLocalGS, projLocalRS, projLocalUI);
    return;
  }
  if (m.type !== "FULL_STATE" || !m.gameState) return;
  projLocalSessionId = m.sessionId;
  projLocalGS = JSON.parse(JSON.stringify(m.gameState));
  projLocalRS = JSON.parse(JSON.stringify(m.runAssignments || {}));
  if (root) root.innerHTML = renderShell(projLocalGS, projLocalRS, projLocalUI);
}
