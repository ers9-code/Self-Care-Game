/* =====================================================================
 * js/main.js
 *
 * Bootstrap and event wiring. Decides whether this window is the
 * facilitator controller or the projector (via ?projector=1), wires the
 * click-delegated control surface, and orchestrates re-rendering both
 * the facilitator's own screen and the (mirrored) preview pane after
 * every action.
 * ===================================================================== */

function initFacilitator() {
  initStore();
  installFacilitatorTransport();
  window.addEventListener("resize", fitFacPreview);
  installGlobalFacilitatorApi();
  const controller = document.getElementById("fac-controller");
  controller?.addEventListener("click", e => {
    const button = e.target.closest("[data-fac-action]");
    if (!button || button.disabled) return;
    e.preventDefault();
    runFacilitatorAction(button.dataset.facAction);
  });
  renderBoth();
}

function resetFacilitator() {
  resetTransientUi();
  fullReset();
  renderBoth();
}

/** The single entry point for every facilitator control: mutate, then always re-render once. */
function runFacilitatorAction(act) {
  performAction(act);
  renderBoth();
}

function renderBoth() {
  const gs = getGameState(), ui = uiState();
  renderStatusBar(gs);
  const root = document.getElementById("fac-controller");
  if (root) root.innerHTML = renderController(gs);
  const frame = document.getElementById("fac-preview-frame");
  if (frame) {
    frame.innerHTML = `<div class="fac-preview-canvas">${renderProjectorContent(gs, getRunState(), ui)}</div>`;
    requestAnimationFrame(fitFacPreview);
  }
  broadcastUi(ui);
}

function fitFacPreview() {
  const frame = document.getElementById("fac-preview-frame"), canvas = frame?.querySelector(".fac-preview-canvas");
  if (!frame || !canvas) return;
  const scale = Math.min(frame.clientWidth / 1366, frame.clientHeight / 768);
  canvas.style.transform = `scale(${Math.max(.1, scale)})`;
  canvas.style.left = `${Math.max(0, (frame.clientWidth - 1366 * scale) / 2)}px`;
  canvas.style.top = `${Math.max(0, (frame.clientHeight - 768 * scale) / 2)}px`;
}

function renderStatusBar(gs) {
  const b = document.getElementById("fac-status");
  if (!b) return;
  const energy = gs.energy, c = energy >= 70 ? "#10b981" : energy >= 45 ? "#f59e0b" : energy >= 20 ? "#f97316" : "#ef4444";
  const section = gs.viewDescriptor === "home" ? "Setup" : gs.currentRound ? `Round ${gs.currentRound}` : "Opening";
  b.innerHTML = `<span class="fac-status-chip">${section}</span><span style="text-transform:capitalize">${gs.currentPhase === "none" ? "Ready" : gs.currentPhase.replaceAll("_", " ")}</span>${gs.currentTime != null ? `<span>${formatTime(gs.currentTime)}</span>` : ""}<span class="fac-energy-pill"><span>Energy</span><span class="fac-energy-bar"><span class="fac-energy-fill" style="width:${energy}%;background:${c}"></span></span><strong>${energy}</strong></span>`;
}

/** Small imperative handlers exposed for the inline onclick attributes used by vote/sort/timer controls. */
function installGlobalFacilitatorApi() {
  window._fac = {
    openProjector,
    reset: resetFacilitator,
    togglePreview: () => { document.body.classList.toggle("preview-max"); requestAnimationFrame(fitFacPreview); },
    action: runFacilitatorAction,
    vote: (id, d) => { castVoteDelta(id, d); renderBoth(); },
    startTimer: (seconds) => { startVoteTimer(seconds, renderBoth); renderBoth(); },
    runoff: () => { runTopTwoRunoff(); renderBoth(); },
    sort: (id, z) => { setSortAssignment(id, z); renderBoth(); },
    checkNow: (id) => { setCheckedNowItem(id); renderBoth(); },
  };
}

/* ===== bootstrap ===== */
(function () {
  const isProjector = new URLSearchParams(location.search).has("projector");
  if (isProjector) {
    document.getElementById("projector-root").classList.remove("hidden");
    document.title = "Jordan's Day — Student Screen";
    initProjector();
  } else {
    document.getElementById("facilitator-root").classList.remove("hidden");
    initFacilitator();
  }
})();

