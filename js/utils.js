/* ============================================================
   Bah_ngupi — shared utilities
   Image compression, XSS-safe helpers, storage guardrails and UI
   primitives. Exposed as window.BN.Utils (classic scripts keep the
   app working when opened straight from the filesystem).
   ============================================================ */
(function () {
  "use strict";

  const BN = (window.BN = window.BN || {});

  const ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };

  const PALETTE = [
    ["#c98a4b", "#5b3820"],
    ["#9e7b55", "#3e2d21"],
    ["#b8694a", "#4d261b"],
    ["#8b9a72", "#35402b"],
    ["#a9853f", "#4a3518"],
    ["#a06f8a", "#42283a"],
    ["#6f8f96", "#283c40"],
    ["#c27b5c", "#4f2a1e"]
  ];

  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function uid(prefix) {
    return (
      (prefix || "id") +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function initials(name) {
    const cleaned = String(name || "").trim();
    if (!cleaned) return "BN";
    const words = cleaned.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0].slice(0, 2).toUpperCase();
  }

  function paletteFor(seed) {
    const text = String(seed || "bah-ngupi");
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return PALETTE[hash % PALETTE.length];
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = toDate(value);
    if (!date) return "";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function formatDay(value) {
    const date = toDate(value);
    if (!date) return "";
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }

  function formatTime(value) {
    const date = toDate(value);
    if (!date) return "";
    return date
      .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })
      .replace(/\bam\b/i, "am")
      .replace(/\bpm\b/i, "pm")
      .toLowerCase();
  }

  function relativeDay(value) {
    const date = toDate(value);
    if (!date) return "";
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((start.getTime() - target.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff > 1 && diff < 7) {
      return date.toLocaleDateString("en-GB", { weekday: "long" });
    }
    return formatDate(date);
  }

  function stampDateParts(value) {
    const date = toDate(value) || new Date();
    return {
      day: String(date.getDate()).padStart(2, "0"),
      month: MONTHS[date.getMonth()],
      year: String(date.getFullYear())
    };
  }

  function stars(rating) {
    const value = clamp(Math.round(Number(rating) || 0), 0, 5);
    return "★★★★★".slice(0, value) + "☆☆☆☆☆".slice(0, 5 - value);
  }

  function debounce(fn, wait) {
    let timer = null;
    return function debounced() {
      const args = arguments;
      const context = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn.apply(context, args), wait);
    };
  }

  function plural(count, singular, pluralForm) {
    return count === 1 ? singular : pluralForm || singular + "s";
  }

  /* ── Storage guardrails ─────────────────────────────────── */

  function readJSON(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error && error.name ? error.name : "StorageError",
        message: error && error.message ? error.message : "Could not write to storage"
      };
    }
  }

  function removeKey(key) {
    try {
      window.localStorage.removeItem(key);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error && error.name ? error.name : "StorageError" };
    }
  }

  /* ── Image compression pipeline ─────────────────────────── */

  function compressImage(file, options) {
    const settings = options || {};
    const maxSize = settings.maxSize || 800;
    const quality = settings.quality || 0.7;

    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No image selected."));
        return;
      }
      if (!/^image\//.test(file.type || "")) {
        reject(new Error("That file is not an image."));
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      const cleanup = () => URL.revokeObjectURL(objectUrl);

      image.onload = () => {
        try {
          const naturalWidth = image.naturalWidth || image.width;
          const naturalHeight = image.naturalHeight || image.height;
          const scale = Math.min(1, maxSize / Math.max(naturalWidth, naturalHeight));
          const width = Math.max(1, Math.round(naturalWidth * scale));
          const height = Math.max(1, Math.round(naturalHeight * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas is not available on this device.");
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(image, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          cleanup();

          if (!/^data:image\/jpeg;base64,/.test(dataUrl)) {
            reject(new Error("Could not compress that photo."));
            return;
          }

          resolve({
            dataUrl,
            width,
            height,
            bytes: Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75)
          });
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      image.onerror = () => {
        cleanup();
        reject(new Error("That photo could not be read. Try another one."));
      };

      image.src = objectUrl;
    });
  }

  function formatBytes(bytes) {
    if (!bytes || bytes < 1024) return "under 1 KB";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function isSafeImageData(value) {
    return (
      typeof value === "string" &&
      /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) &&
      value.length < 1400000
    );
  }

  /* ── Timer helpers ──────────────────────────────────────── */

  function formatTimer(ms) {
    const safe = Math.max(0, Number(ms) || 0);
    const minutes = Math.floor(safe / 60000);
    const seconds = Math.floor((safe % 60000) / 1000);
    const tenths = Math.floor((safe % 1000) / 100);
    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0") +
      "." +
      tenths
    );
  }

  function parseTimer(text) {
    const match = String(text || "").match(/^(\d{1,2}):(\d{2})(?:\.(\d))?$/);
    if (!match) return null;
    return (
      Number(match[1]) * 60000 +
      Number(match[2]) * 1000 +
      Number(match[3] || 0) * 100
    );
  }

  function ratioValue(dose, yieldValue) {
    const inValue = Number(dose);
    const outValue = Number(yieldValue);
    if (!inValue || !outValue) return null;
    return outValue / inValue;
  }

  function formatRatio(ratio) {
    return ratio ? "1 : " + ratio.toFixed(1) : "1 : —";
  }

  /* ── Overlay lock & sheet manager ───────────────────────── */

  function syncOverlayLock() {
    const hasOverlay = document.querySelector(".sheet.is-open, .modal.is-open");
    document.body.classList.toggle("no-scroll", Boolean(hasOverlay));
  }

  let lastFocused = null;
  let sheetMounted = false;

  function bindSheetChrome() {
    if (sheetMounted) return;
    sheetMounted = true;

    const sheet = document.getElementById("sheet");
    if (!sheet) return;

    $$("[data-close-sheet]", sheet).forEach((node) => {
      node.addEventListener("click", closeSheet);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sheet.classList.contains("is-open")) {
        if (document.querySelector(".modal.is-open")) return;
        closeSheet();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      if (document.querySelector(".modal.is-open")) return;
      const panel = document.querySelector(".sheet.is-open .sheet-panel");
      if (!panel) return;
      const focusable = $$(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        panel
      ).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function openSheet(options) {
    bindSheetChrome();
    const sheet = document.getElementById("sheet");
    if (!sheet) return;

    const titleNode = document.getElementById("sheetTitle");
    const eyebrowNode = document.getElementById("sheetEyebrow");
    const bodyNode = document.getElementById("sheetBody");

    if (!sheet.classList.contains("is-open")) {
      lastFocused = document.activeElement;
    }
    titleNode.textContent = options.title || "Details";
    eyebrowNode.textContent = options.eyebrow || "";
    eyebrowNode.hidden = !options.eyebrow;
    bodyNode.innerHTML = options.content || "";
    bodyNode.scrollTop = 0;

    sheet.classList.add("is-open");
    sheet.removeAttribute("inert");
    sheet.setAttribute("aria-hidden", "false");
    syncOverlayLock();

    const closeButton = sheet.querySelector(".sheet-close");
    if (closeButton) closeButton.focus({ preventScroll: true });

    if (typeof options.onMount === "function") {
      options.onMount(bodyNode);
    }
  }

  function closeSheet() {
    const sheet = document.getElementById("sheet");
    if (!sheet || !sheet.classList.contains("is-open")) return;
    sheet.classList.remove("is-open");
    sheet.setAttribute("inert", "");
    sheet.setAttribute("aria-hidden", "true");
    syncOverlayLock();
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  }

  /* ── Toast ──────────────────────────────────────────────── */

  let toastTimer = null;

  function toast(message, type) {
    const node = document.getElementById("toast");
    if (!node) return;
    const icon = node.querySelector(".toast-icon");
    const text = node.querySelector(".toast-msg");
    const kind = type || "info";

    text.textContent = String(message || "");
    if (icon) icon.textContent = kind === "error" ? "!" : kind === "success" ? "✓" : "☕";
    node.className = "toast is-show toast--" + kind;

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      node.classList.remove("is-show");
    }, 3400);
  }

  /* ── Confirmation dialog ────────────────────────────────── */

  function confirmAction(options) {
    const opts = options || {};
    return new Promise((resolve) => {
      const wrapper = document.createElement("div");
      wrapper.className = "modal is-open";
      wrapper.setAttribute("aria-hidden", "false");
      wrapper.innerHTML =
        '<div class="modal-backdrop" data-cancel></div>' +
        '<div class="modal-card modal-card--sm" role="alertdialog" aria-modal="true">' +
        '<p class="eyebrow">' +
        escapeHtml(opts.eyebrow || "Please confirm") +
        "</p>" +
        "<h3>" +
        escapeHtml(opts.title || "Are you sure?") +
        "</h3>" +
        '<p class="muted">' +
        escapeHtml(opts.message || "") +
        "</p>" +
        '<div class="btn-row">' +
        '<button class="btn btn-ghost" data-cancel type="button">' +
        escapeHtml(opts.cancelLabel || "Cancel") +
        "</button>" +
        '<button class="btn ' +
        (opts.danger ? "btn-danger-ghost" : "btn-primary") +
        '" data-confirm type="button">' +
        escapeHtml(opts.confirmLabel || "Confirm") +
        "</button>" +
        "</div></div>";

      document.body.appendChild(wrapper);
      syncOverlayLock();

      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKeydown);
        wrapper.remove();
        syncOverlayLock();
        resolve(value);
      };

      const onKeydown = (event) => {
        if (event.key === "Escape") finish(false);
      };

      wrapper.querySelectorAll("[data-cancel]").forEach((node) => {
        node.addEventListener("click", () => finish(false));
      });
      const confirmButton = wrapper.querySelector("[data-confirm]");
      if (confirmButton) confirmButton.addEventListener("click", () => finish(true));
      document.addEventListener("keydown", onKeydown);

      const cancelButton = wrapper.querySelector("[data-cancel].btn");
      if (cancelButton) cancelButton.focus({ preventScroll: true });
    });
  }

  /* ── Misc ───────────────────────────────────────────────── */

  function downloadFile(filename, contents, mimeType) {
    const blob = new Blob([contents], { type: mimeType || "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function timeGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat tengah hari";
    if (hour < 19) return "Selamat petang";
    return "Selamat malam";
  }

  BN.Utils = {
    escapeHtml,
    $,
    $$,
    uid,
    initials,
    paletteFor,
    clamp,
    formatDate,
    formatDay,
    formatTime,
    relativeDay,
    stampDateParts,
    stars,
    debounce,
    plural,
    readJSON,
    writeJSON,
    removeKey,
    compressImage,
    formatBytes,
    isSafeImageData,
    formatTimer,
    parseTimer,
    ratioValue,
    formatRatio,
    syncOverlayLock,
    openSheet,
    closeSheet,
    toast,
    confirmAction,
    downloadFile,
    timeGreeting
  };
})();
