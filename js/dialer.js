/* ============================================================
   Bah_ngupi — espresso dialer, shot timer & recipe log
   ============================================================ */
(function () {
  "use strict";

  const BN = (window.BN = window.BN || {});
  const U = BN.Utils;

  const els = {};
  let store = null;
  let bound = false;

  let timerInterval = null;
  let timerStartedAt = 0;
  let elapsed = 0;
  let running = false;

  let selectedBean = null;
  let beanMatches = [];

  const DIAL_CIRCUMFERENCE = 603.19;
  const DIAL_MAX_MS = 45000;

  /* ── Timer ──────────────────────────────────────────────── */

  function renderTimer(ms) {
    const value = Math.max(0, ms);
    if (els.shotTimer) els.shotTimer.textContent = U.formatTimer(value);

    if (els.timerRing) {
      const progress = U.clamp(value / DIAL_MAX_MS, 0, 1);
      els.timerRing.style.strokeDashoffset = String(DIAL_CIRCUMFERENCE * (1 - progress));
      els.timerRing.classList.toggle("is-over", value > 32000);
    }

    if (els.timerHint) {
      let hint = "Target 25–32s";
      let state = "";
      if (value > 0 && value < 25000) {
        hint = "Extracting…";
      } else if (value >= 25000 && value <= 32000) {
        hint = "In the sweet spot";
        state = "is-good";
      } else if (value > 32000) {
        hint = "Running long — adjust grind";
        state = "is-over";
      }
      els.timerHint.textContent = hint;
      els.timerHint.className = "timer-hint" + (state ? " " + state : "");
    }
  }

  function startTimer() {
    if (running) return;
    running = true;
    timerStartedAt = Date.now() - elapsed;
    timerInterval = window.setInterval(() => {
      elapsed = Date.now() - timerStartedAt;
      renderTimer(elapsed);
    }, 50);

    if (els.timerStart) els.timerStart.disabled = true;
    if (els.timerStop) els.timerStop.disabled = false;
  }

  function stopTimer() {
    if (!running) {
      renderTimer(elapsed);
      return;
    }
    running = false;
    window.clearInterval(timerInterval);
    timerInterval = null;
    elapsed = Date.now() - timerStartedAt;
    renderTimer(elapsed);

    if (els.timeInput && elapsed > 0) {
      els.timeInput.value = U.formatTimer(elapsed);
    }

    if (els.timerStart) els.timerStart.disabled = false;
    if (els.timerStop) els.timerStop.disabled = true;
  }

  function resetTimer() {
    running = false;
    window.clearInterval(timerInterval);
    timerInterval = null;
    elapsed = 0;
    renderTimer(0);
    if (els.timerStart) els.timerStart.disabled = false;
    if (els.timerStop) els.timerStop.disabled = true;
  }

  /* ── Bean picker ────────────────────────────────────────── */

  function closeBeanResults() {
    if (!els.beanResults) return;
    els.beanResults.hidden = true;
    els.beanResults.innerHTML = "";
    beanMatches = [];
  }

  function renderBeanResults(query) {
    if (!els.beanResults) return;
    const term = query.trim().toLowerCase();
    if (term.length < 1) {
      closeBeanResults();
      return;
    }

    beanMatches = (BN.COFFEE_BEANS || [])
      .filter((bean) => {
        return [bean.roaster, bean.name, bean.origin, bean.region, bean.process, bean.notes]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .slice(0, 8);

    if (!beanMatches.length) {
      els.beanResults.innerHTML = '<div class="bean-empty">No beans found. Try another roaster.</div>';
      els.beanResults.hidden = false;
      return;
    }

    els.beanResults.innerHTML = beanMatches
      .map(
        (bean, index) =>
          '<button type="button" class="bean-option" role="option" data-bean-index="' +
          index +
          '"><strong>' +
          U.escapeHtml(bean.roaster + " — " + bean.name) +
          "</strong><span>" +
          U.escapeHtml(bean.origin + " · " + bean.region + " · " + bean.process) +
          " · " +
          U.escapeHtml(bean.notes) +
          "</span></button>"
      )
      .join("");
    els.beanResults.hidden = false;
  }

  function selectBean(index) {
    const bean = beanMatches[index];
    if (!bean || !els.selectedBean) return;
    selectedBean = bean;
    els.selectedBean.hidden = false;
    els.selectedBean.innerHTML =
      '<div><strong>' +
      U.escapeHtml(bean.roaster + " — " + bean.name) +
      "</strong><span>" +
      U.escapeHtml(bean.origin + " · " + bean.region + " · " + bean.process + " · " + bean.notes) +
      '</span></div><button type="button" data-clear-bean aria-label="Clear bean"><svg class="icon icon-sm" aria-hidden="true"><use href="#i-close"></use></svg></button>';
    if (els.beanSearch) els.beanSearch.value = "";
    closeBeanResults();
  }

  function clearBean() {
    selectedBean = null;
    if (els.selectedBean) {
      els.selectedBean.hidden = true;
      els.selectedBean.innerHTML = "";
    }
    if (els.beanSearch) els.beanSearch.value = "";
    closeBeanResults();
  }

  /* ── Ratio ──────────────────────────────────────────────── */

  function updateRatio() {
    if (!els.shotRatio) return;
    const ratio = U.ratioValue(
      els.doseInput ? els.doseInput.value : "",
      els.yieldInput ? els.yieldInput.value : ""
    );
    els.shotRatio.textContent = U.formatRatio(ratio);
  }

  /* ── Shot log ───────────────────────────────────────────── */

  function resetForm() {
    if (els.doseInput) els.doseInput.value = "";
    if (els.yieldInput) els.yieldInput.value = "";
    if (els.grindInput) els.grindInput.value = "";
    if (els.timeInput) els.timeInput.value = "";
    if (els.shotNotes) els.shotNotes.value = "";
    clearBean();
    updateRatio();
    resetTimer();
  }

  function saveShot() {
    if (!store) return;

    const timeValue = (els.timeInput ? els.timeInput.value : "").trim() || U.formatTimer(elapsed);
    const parsed = U.parseTimer(timeValue);
    if (!timeValue || parsed === null || parsed <= 0) {
      U.toast("Add a shot time in mm:ss.s format (e.g. 00:28.0).", "error");
      if (els.timeInput) els.timeInput.focus();
      return;
    }

    if (running) stopTimer();

    const dose = els.doseInput ? els.doseInput.value.trim() : "";
    const yieldValue = els.yieldInput ? els.yieldInput.value.trim() : "";
    const ratio = U.ratioValue(dose, yieldValue);

    const shot = {
      id: U.uid("shot"),
      date: new Date().toISOString(),
      time: timeValue,
      bean: selectedBean ? selectedBean.roaster + " — " + selectedBean.name : "Unknown bean",
      beanDetails: selectedBean
        ? [selectedBean.origin, selectedBean.region, selectedBean.process].filter(Boolean).join(" · ")
        : "",
      dose,
      yield: yieldValue,
      ratio: ratio || 0,
      grind: els.grindInput ? els.grindInput.value.trim() : "",
      notes: els.shotNotes ? els.shotNotes.value.trim() : ""
    };

    const result = store.addShot(shot);
    if (!result.ok) {
      U.toast("Could not save this shot. Storage may be full.", "error");
      return;
    }

    renderHistory();
    resetForm();
    U.toast("Shot logged. Dial in the next one.", "success");
  }

  function shotCard(shot) {
    const bean = shot.bean || "Unknown bean";
    const dose = shot.dose ? shot.dose + "g" : "—";
    const out = shot.yield ? shot.yield + "g" : "—";
    const ratio = Number(shot.ratio) ? "1 : " + Number(shot.ratio).toFixed(1) : "—";
    return (
      '<article class="shot-card">' +
      '<div class="shot-date"><span>' +
      U.escapeHtml(U.relativeDay(shot.date)) +
      " · " +
      U.escapeHtml(U.formatTime(shot.date)) +
      "</span>" +
      '<button class="shot-delete" data-delete-shot="' +
      U.escapeHtml(shot.id) +
      '" aria-label="Delete shot"><svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
      "</div>" +
      '<div class="shot-bean">' +
      U.escapeHtml(bean) +
      "</div>" +
      '<div class="shot-stats">' +
      '<span><svg class="icon" aria-hidden="true"><use href="#i-timer"></use></svg>' +
      U.escapeHtml(shot.time) +
      "</span>" +
      "<span>" +
      U.escapeHtml(dose) +
      " → " +
      U.escapeHtml(out) +
      "</span>" +
      "<span>" +
      U.escapeHtml(ratio) +
      "</span>" +
      (shot.grind ? "<span>" + U.escapeHtml(shot.grind) + "</span>" : "") +
      "</div>" +
      (shot.beanDetails ? '<div class="shot-notes">' + U.escapeHtml(shot.beanDetails) + "</div>" : "") +
      (shot.notes ? '<div class="shot-notes">“' + U.escapeHtml(shot.notes) + "”</div>" : "") +
      "</article>"
    );
  }

  function renderHistory() {
    if (!store) return;
    const shots = store.shots || [];
    if (els.shotCount) els.shotCount.textContent = String(shots.length);

    if (!els.shotHistory) return;
    if (!shots.length) {
      els.shotHistory.innerHTML =
        '<div class="empty-state">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-timer"></use></svg>' +
        "<strong>No shots logged yet</strong>" +
        "<p>Pull a shot, stop the timer, and save the recipe to start your dial-in diary.</p>" +
        "</div>";
      return;
    }

    els.shotHistory.innerHTML = shots.slice(0, 40).map(shotCard).join("");
  }

  /* ── Wiring ─────────────────────────────────────────────── */

  function bindEvents() {
    if (bound) return;
    bound = true;

    if (els.timerStart) els.timerStart.addEventListener("click", startTimer);
    if (els.timerStop) els.timerStop.addEventListener("click", stopTimer);
    if (els.timerReset) els.timerReset.addEventListener("click", resetTimer);
    if (els.saveShotBtn) els.saveShotBtn.addEventListener("click", saveShot);

    if (els.beanSearch) {
      els.beanSearch.addEventListener("input", () => {
        renderBeanResults(els.beanSearch.value);
      });
      els.beanSearch.addEventListener("focus", () => {
        if (els.beanSearch.value.trim()) renderBeanResults(els.beanSearch.value);
      });
    }

    if (els.beanResults) {
      els.beanResults.addEventListener("click", (event) => {
        const option = event.target.closest("[data-bean-index]");
        if (!option) return;
        selectBean(Number(option.getAttribute("data-bean-index")));
      });
    }

    if (els.selectedBean) {
      els.selectedBean.addEventListener("click", (event) => {
        if (event.target.closest("[data-clear-bean]")) clearBean();
      });
    }

    [els.doseInput, els.yieldInput].forEach((input) => {
      if (input) input.addEventListener("input", updateRatio);
    });

    if (els.shotHistory) {
      els.shotHistory.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-delete-shot]");
        if (!button) return;
        const confirmed = await U.confirmAction({
          eyebrow: "Delete shot",
          title: "Remove this recipe?",
          message: "The shot time, ratio and tasting notes will be deleted from this device.",
          confirmLabel: "Delete shot",
          danger: true
        });
        if (!confirmed) return;
        store.removeShot(button.getAttribute("data-delete-shot"));
        renderHistory();
        U.toast("Shot removed.");
      });
    }

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".bean-picker") && els.beanResults && !els.beanResults.hidden) {
        closeBeanResults();
      }
    });
  }

  function init(appStore) {
    store = appStore;
    els.shotTimer = document.getElementById("shotTimer");
    els.timerRing = document.getElementById("timerRing");
    els.timerHint = document.getElementById("timerHint");
    els.timerStart = document.getElementById("timerStart");
    els.timerStop = document.getElementById("timerStop");
    els.timerReset = document.getElementById("timerReset");
    els.beanSearch = document.getElementById("beanSearch");
    els.beanResults = document.getElementById("beanResults");
    els.selectedBean = document.getElementById("selectedBean");
    els.doseInput = document.getElementById("doseInput");
    els.yieldInput = document.getElementById("yieldInput");
    els.grindInput = document.getElementById("grindInput");
    els.timeInput = document.getElementById("timeInput");
    els.shotNotes = document.getElementById("shotNotes");
    els.shotRatio = document.getElementById("shotRatio");
    els.saveShotBtn = document.getElementById("saveShotBtn");
    els.shotHistory = document.getElementById("shotHistory");
    els.shotCount = document.getElementById("shotCount");

    bindEvents();
    renderTimer(0);
    updateRatio();
    renderHistory();
  }

  BN.Dialer = {
    init,
    render: renderHistory,
    resetTimer
  };
})();
