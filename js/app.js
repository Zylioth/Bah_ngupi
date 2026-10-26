/* ============================================================
   Bah_ngupi — application store, router, profile & PWA setup
   ============================================================ */
(function () {
  "use strict";

  const BN = (window.BN = window.BN || {});
  const U = BN.Utils;

  const KEYS = {
    customCafes: "bn_custom_cafes_v1",
    visits: "bn_visits_v1",
    favorites: "bn_favorites_v1",
    profile: "bn_profile_v1",
    shots: "espresso_history"
  };

  const DISTRICTS = ["Brunei-Muara", "Tutong", "Belait", "Temburong"];
  const VIEWS = ["passport", "explore", "dialer", "profile"];
  const VIEW_TITLES = {
    passport: "Bah_ngupi — Cafe Hopping Passport",
    explore: "Explore cafes — Bah_ngupi",
    dialer: "Espresso dialer — Bah_ngupi",
    profile: "Your passport — Bah_ngupi"
  };

  function passportNumber(profile) {
    const joined = new Date(profile.joined);
    const year = Number.isNaN(joined.getTime()) ? new Date().getFullYear() : joined.getFullYear();
    const seed = String(profile.joined || "") + "|" + String(profile.name || "bah-ngupi");
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }
    return "BN " + year + " " + String(hash % 10000).padStart(4, "0");
  }

  const state = {
    customCafes: [],
    visits: [],
    favorites: [],
    profile: {
      name: "",
      district: "",
      joined: new Date().toISOString()
    },
    shots: []
  };

  /* ── Normalisers ────────────────────────────────────────── */

  const text = (value, max) => String(value === null || value === undefined ? "" : value).trim().slice(0, max || 200);

  function listOfStrings(value, maxItems, maxLength) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => text(item, maxLength || 30))
      .filter(Boolean)
      .slice(0, maxItems || 8);
  }

  function isoOrNow(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  function normalizeProfile(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
      name: text(source.name, 24),
      district: DISTRICTS.includes(source.district) ? source.district : "",
      joined: isoOrNow(source.joined)
    };
  }

  function normalizeCustomCafes(rawList) {
    const seedIds = new Set((BN.SEED_CAFES || []).map((cafe) => cafe.id));
    const usedIds = new Set(seedIds);
    const list = [];

    (Array.isArray(rawList) ? rawList : []).slice(0, 120).forEach((raw) => {
      if (!raw || typeof raw !== "object") return;
      const name = text(raw.name, 60);
      const area = text(raw.area, 40);
      if (!name || !area) return;

      const palette = U.paletteFor(name + area);
      let id = typeof raw.id === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(raw.id) ? raw.id : "";
      if (!id || usedIds.has(id)) id = U.uid("cafe");
      usedIds.add(id);

      list.push({
        id,
        name,
        area,
        district: DISTRICTS.includes(raw.district) ? raw.district : "Brunei-Muara",
        category: text(raw.category, 30) || "Cafe",
        tags: listOfStrings(raw.tags, 8, 26),
        description: text(raw.description, 240),
        address: text(raw.address, 100),
        hours: text(raw.hours, 60),
        price: ["$", "$$", "$$$"].includes(raw.price) ? raw.price : "$$",
        menu: listOfStrings(raw.menu, 10, 32),
        color: /^#[0-9a-f]{6}$/i.test(raw.color || "") ? raw.color : palette[0],
        color2: /^#[0-9a-f]{6}$/i.test(raw.color2 || "") ? raw.color2 : palette[1],
        custom: true
      });
    });

    return list;
  }

  function normalizeVisits(rawList) {
    const list = [];
    (Array.isArray(rawList) ? rawList : []).slice(0, 300).forEach((raw) => {
      if (!raw || typeof raw !== "object") return;
      const cafeId = text(raw.cafeId, 64);
      if (!cafeId) return;

      const visit = {
        id: typeof raw.id === "string" && raw.id ? raw.id.slice(0, 64) : U.uid("visit"),
        cafeId,
        date: isoOrNow(raw.date),
        drink: text(raw.drink, 60) || "Coffee",
        notes: text(raw.notes, 180),
        rating: U.clamp(Math.round(Number(raw.rating) || 0), 0, 5),
        photo: U.isSafeImageData(raw.photo) ? raw.photo : ""
      };
      list.push(visit);
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function normalizeShots(rawList) {
    const list = [];
    (Array.isArray(rawList) ? rawList : []).slice(0, 150).forEach((raw) => {
      if (!raw || typeof raw !== "object") return;
      const dose = text(raw.dose, 10).replace("-", "");
      const yieldValue = text(raw.yield, 10).replace("-", "");
      const ratio = Number(raw.ratio) || U.ratioValue(dose, yieldValue) || 0;

      list.push({
        id: typeof raw.id === "string" && raw.id ? raw.id.slice(0, 64) : U.uid("shot"),
        date: isoOrNow(raw.date),
        time: text(raw.time, 8) || "00:00.0",
        bean: text(raw.bean, 80) || "Unknown bean",
        beanDetails: text(raw.beanDetails, 100),
        dose,
        yield: yieldValue,
        ratio,
        grind: text(raw.grind, 40),
        notes: text(raw.notes, 180)
      });
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function normalizeFavorites(rawList, validIds) {
    if (!Array.isArray(rawList)) return [];
    const ids = Array.from(new Set(rawList.map((id) => text(id, 64)).filter(Boolean)));
    return (validIds ? ids.filter((id) => validIds.has(id)) : ids).slice(0, 200);
  }

  /* ── Persistence ────────────────────────────────────────── */

  function loadState() {
    const custom = normalizeCustomCafes(U.readJSON(KEYS.customCafes, []));
    state.customCafes.splice(0, state.customCafes.length, ...custom);

    const visits = normalizeVisits(U.readJSON(KEYS.visits, []));
    state.visits.splice(0, state.visits.length, ...visits);

    const rawFavorites = U.readJSON(KEYS.favorites, []);
    const favorites = normalizeFavorites(
      rawFavorites,
      new Set(allCafes().map((cafe) => cafe.id))
    );
    state.favorites.splice(0, state.favorites.length, ...favorites);
    if (JSON.stringify(rawFavorites) !== JSON.stringify(favorites)) {
      U.writeJSON(KEYS.favorites, favorites);
    }

    const storedProfile = U.readJSON(KEYS.profile, null);
    Object.assign(state.profile, normalizeProfile(storedProfile));
    if (!storedProfile) {
      U.writeJSON(KEYS.profile, state.profile);
    }

    const shots = normalizeShots(U.readJSON(KEYS.shots, []));
    state.shots.splice(0, state.shots.length, ...shots);
  }

  function persistVisits() {
    return U.writeJSON(KEYS.visits, state.visits);
  }

  function persistShots() {
    return U.writeJSON(KEYS.shots, state.shots);
  }

  /* ── Store API ──────────────────────────────────────────── */

  function allCafes() {
    return state.customCafes.concat(BN.SEED_CAFES || []);
  }

  function getCafe(cafeId) {
    return (
      state.customCafes.find((cafe) => cafe.id === cafeId) ||
      (BN.SEED_CAFES || []).find((cafe) => cafe.id === cafeId) ||
      null
    );
  }

  function visitsFor(cafeId) {
    return state.visits.filter((visit) => visit.cafeId === cafeId);
  }

  function isFavorite(cafeId) {
    return state.favorites.includes(cafeId);
  }

  function toggleFavorite(cafeId) {
    if (!getCafe(cafeId)) return false;
    const index = state.favorites.indexOf(cafeId);
    if (index >= 0) {
      state.favorites.splice(index, 1);
    } else {
      state.favorites.push(cafeId);
    }
    U.writeJSON(KEYS.favorites, state.favorites);
    return isFavorite(cafeId);
  }

  function addVisit(payload) {
    const cafe = getCafe(payload && payload.cafeId);
    if (!cafe) return { ok: false, error: "UNKNOWN_CAFE" };

    const visit = {
      id: U.uid("visit"),
      cafeId: cafe.id,
      date: isoOrNow(payload.date),
      drink: text(payload.drink, 60) || "Coffee",
      notes: text(payload.notes, 180),
      rating: U.clamp(Math.round(Number(payload.rating) || 0), 0, 5),
      photo: U.isSafeImageData(payload.photo) ? payload.photo : ""
    };

    state.visits.unshift(visit);
    state.visits.sort((a, b) => new Date(b.date) - new Date(a.date));

    let photoDropped = false;
    let result = persistVisits();

    if (!result.ok && visit.photo) {
      visit.photo = "";
      photoDropped = true;
      result = persistVisits();
    }

    if (!result.ok) {
      const failedIndex = state.visits.findIndex((item) => item.id === visit.id);
      if (failedIndex >= 0) state.visits.splice(failedIndex, 1);
      return { ok: false, error: result.error };
    }

    return { ok: true, visit, photoDropped };
  }

  function removeVisit(visitId) {
    const index = state.visits.findIndex((visit) => visit.id === visitId);
    if (index < 0) return false;
    const [removed] = state.visits.splice(index, 1);
    persistVisits();
    return Boolean(removed);
  }

  function addCafe(payload) {
    const source = payload || {};
    const name = text(source.name, 60);
    const area = text(source.area, 40);
    if (!name || !area) return null;

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 22) || "cafe";

    const palette = U.paletteFor(name + area);
    const cafe = normalizeCustomCafes([
      Object.assign({}, source, {
        id: "cafe-" + slug + "-" + Math.random().toString(36).slice(2, 6),
        color: palette[0],
        color2: palette[1],
        custom: true
      })
    ])[0];

    if (!cafe) return null;
    state.customCafes.unshift(cafe);
    const result = U.writeJSON(KEYS.customCafes, state.customCafes);
    if (!result.ok) {
      state.customCafes.shift();
      return null;
    }
    return cafe;
  }

  function updateCafe(cafeId, payload) {
    const index = state.customCafes.findIndex((cafe) => cafe.id === cafeId);
    if (index < 0) return null;
    const existing = state.customCafes[index];
    const merged = normalizeCustomCafes([
      Object.assign({}, existing, payload, {
        id: existing.id,
        color: existing.color,
        color2: existing.color2,
        custom: true
      })
    ])[0];
    if (!merged) return null;

    state.customCafes[index] = merged;
    const result = U.writeJSON(KEYS.customCafes, state.customCafes);
    if (!result.ok) {
      state.customCafes[index] = existing;
      return null;
    }
    return merged;
  }

  function deleteCafe(cafeId) {
    const index = state.customCafes.findIndex((cafe) => cafe.id === cafeId);
    if (index < 0) return false;
    const [removed] = state.customCafes.splice(index, 1);

    for (let i = state.visits.length - 1; i >= 0; i -= 1) {
      if (state.visits[i].cafeId === cafeId) state.visits.splice(i, 1);
    }
    for (let i = state.favorites.length - 1; i >= 0; i -= 1) {
      if (state.favorites[i] === cafeId) state.favorites.splice(i, 1);
    }

    U.writeJSON(KEYS.customCafes, state.customCafes);
    persistVisits();
    U.writeJSON(KEYS.favorites, state.favorites);
    return Boolean(removed);
  }

  function addShot(shot) {
    if (!shot) return { ok: false };
    state.shots.unshift(
      Object.assign({}, shot, {
        id: shot.id || U.uid("shot"),
        date: isoOrNow(shot.date)
      })
    );
    if (state.shots.length > 150) state.shots.length = 150;
    const result = persistShots();
    if (!result.ok) {
      state.shots.shift();
      return { ok: false, error: result.error };
    }
    return { ok: true };
  }

  function removeShot(shotId) {
    const index = state.shots.findIndex((shot) => shot.id === shotId);
    if (index < 0) return false;
    state.shots.splice(index, 1);
    persistShots();
    return true;
  }

  function saveProfile(fields) {
    const next = normalizeProfile(Object.assign({}, state.profile, fields));
    Object.assign(state.profile, next);
    const result = U.writeJSON(KEYS.profile, state.profile);
    return result.ok;
  }

  function exportData() {
    return {
      app: "bah-ngupi",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      customCafes: state.customCafes,
      favorites: state.favorites,
      visits: state.visits,
      shots: state.shots
    };
  }

  function importData(raw) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "INVALID" };
    }

    const visits = normalizeVisits(raw.visits || []);
    const customCafes = normalizeCustomCafes(raw.customCafes || []);
    const favorites = normalizeFavorites(
      raw.favorites || [],
      new Set((BN.SEED_CAFES || []).concat(customCafes).map((cafe) => cafe.id))
    );
    const shots = normalizeShots(raw.shots || []);
    const profile = normalizeProfile(raw.profile || state.profile);

    if (JSON.stringify(visits).length > 4400000) {
      return { ok: false, error: "TOO_LARGE" };
    }

    const writes = [
      U.writeJSON(KEYS.visits, visits),
      U.writeJSON(KEYS.customCafes, customCafes),
      U.writeJSON(KEYS.favorites, favorites),
      U.writeJSON(KEYS.shots, shots),
      U.writeJSON(KEYS.profile, profile)
    ];
    const failed = writes.find((write) => !write.ok);
    if (failed) {
      return { ok: false, error: failed.error };
    }

    state.visits.splice(0, state.visits.length, ...visits);
    state.customCafes.splice(0, state.customCafes.length, ...customCafes);
    state.favorites.splice(0, state.favorites.length, ...favorites);
    state.shots.splice(0, state.shots.length, ...shots);
    Object.assign(state.profile, profile);

    return {
      ok: true,
      counts: {
        visits: visits.length,
        cafes: customCafes.length,
        shots: shots.length
      }
    };
  }

  function resetAll() {
    Object.keys(KEYS).forEach((key) => U.removeKey(KEYS[key]));
    state.customCafes.length = 0;
    state.visits.length = 0;
    state.favorites.length = 0;
    state.shots.length = 0;
    Object.assign(state.profile, normalizeProfile({}));
  }

  const store = {
    customCafes: state.customCafes,
    visits: state.visits,
    favorites: state.favorites,
    profile: state.profile,
    shots: state.shots,
    allCafes,
    getCafe,
    visitsFor,
    isFavorite,
    toggleFavorite,
    addVisit,
    removeVisit,
    addCafe,
    updateCafe,
    deleteCafe,
    addShot,
    removeShot,
    saveProfile,
    exportData,
    importData,
    resetAll
  };

  BN.store = store;

  /* ── Profile view ───────────────────────────────────────── */

  function renderProfile() {
    const profile = state.profile;
    const cafes = allCafes();
    const cafeIds = new Set(state.visits.map((visit) => visit.cafeId));
    const visited = cafes.filter((cafe) => cafeIds.has(cafe.id));
    const districts = new Set(visited.map((cafe) => cafe.district));
    const photos = state.visits.filter((visit) => visit.photo).length;
    const achievements = BN.Achievements.evaluate(store);
    const earned = achievements.filter((badge) => badge.earned).length;

    const nameInput = document.getElementById("profileName");
    const districtInput = document.getElementById("profileDistrict");
    const avatar = document.getElementById("profileAvatar");
    const topAvatar = document.getElementById("topAvatar");

    if (nameInput && document.activeElement !== nameInput) nameInput.value = profile.name;
    if (districtInput && document.activeElement !== districtInput) districtInput.value = profile.district;

    const initials = U.initials(profile.name || "Bah Ngupi");
    if (avatar) avatar.textContent = initials;
    if (topAvatar) {
      topAvatar.textContent = initials;
      topAvatar.setAttribute("aria-label", "Open profile (" + initials + ")");
    }

    const displayName = document.getElementById("profileDisplayName");
    if (displayName) displayName.textContent = profile.name || "Kopi lover";

    const joined = document.getElementById("profileJoined");
    if (joined) joined.textContent = U.formatDate(profile.joined);

    const home = document.getElementById("profileHome");
    if (home) home.textContent = profile.district ? profile.district + " · Brunei" : "Brunei Darussalam";

    const serial = passportNumber(profile);
    const coverSerial = document.getElementById("passportSerial");
    if (coverSerial) coverSerial.textContent = serial;
    const profileSerial = document.getElementById("profilePassportNo");
    if (profileSerial) profileSerial.textContent = serial;
    const idDistrict = document.getElementById("profileIdDistrict");
    if (idDistrict) idDistrict.textContent = profile.district || "Not set";

    const setText = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.textContent = String(value);
    };

    setText("profileCafes", visited.length);
    setText("profileStamps", state.visits.length);
    setText("profileDistricts", districts.size);
    setText("profileShots", state.shots.length);
    setText("profileFavourites", state.favorites.length);
    setText("profilePhotos", photos);

    const badgeGrid = document.getElementById("profileBadges");
    if (badgeGrid) {
      badgeGrid.innerHTML = achievements
        .map((badge) => BN.Passport.badgeMarkup(badge, false))
        .join("");
    }
    const badgeCount = document.getElementById("profileBadgeCount");
    if (badgeCount) badgeCount.textContent = earned + " / " + achievements.length;
  }

  /* ── Router ─────────────────────────────────────────────── */

  function go(view, updateHash) {
    const target = VIEWS.includes(view) ? view : "passport";
    document.querySelectorAll(".view").forEach((section) => {
      section.classList.toggle("is-active", section.getAttribute("data-view") === target);
    });
    document.querySelectorAll(".nav-btn").forEach((button) => {
      const active = button.getAttribute("data-nav") === target;
      button.classList.toggle("is-active", active);
      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    document.title = VIEW_TITLES[target] || VIEW_TITLES.passport;
    if (updateHash !== false && window.location.hash !== "#" + target) {
      try {
        window.history.replaceState(null, "", "#" + target);
      } catch (error) {
        /* file:// or a locked-down browser — tabs still work */
      }
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function refresh() {
    BN.Passport.render();
    BN.Dialer.render();
    renderProfile();
  }

  /* ── Data tools ─────────────────────────────────────────── */

  function bindDataTools() {
    const exportButton = document.getElementById("exportData");
    if (exportButton) {
      exportButton.addEventListener("click", () => {
        const payload = store.exportData();
        const stamp = new Date().toISOString().slice(0, 10);
        U.downloadFile("bah-ngupi-backup-" + stamp + ".json", JSON.stringify(payload, null, 2), "application/json");
        U.toast("Backup exported. Keep it somewhere safe.", "success");
      });
    }

    const importButton = document.getElementById("importData");
    const importFile = document.getElementById("importFile");
    if (importButton && importFile) {
      importButton.addEventListener("click", () => importFile.click());
      importFile.addEventListener("change", async () => {
        const file = importFile.files && importFile.files[0];
        importFile.value = "";
        if (!file) return;

        let raw;
        try {
          const contents = await file.text();
          raw = JSON.parse(contents);
        } catch (error) {
          U.toast("That file is not a valid Bah_ngupi backup.", "error");
          return;
        }

        if (!raw || typeof raw !== "object" || (!Array.isArray(raw.visits) && !Array.isArray(raw.customCafes))) {
          U.toast("That backup does not contain passport data.", "error");
          return;
        }

        const confirmed = await U.confirmAction({
          eyebrow: "Import backup",
          title: "Replace this passport?",
          message:
            "Your current stamp diary will be replaced by the backup (" +
            (Array.isArray(raw.visits) ? raw.visits.length : 0) +
            " visits, " +
            (Array.isArray(raw.shots) ? raw.shots.length : 0) +
            " shots).",
          confirmLabel: "Import backup",
          danger: true
        });
        if (!confirmed) return;

        const result = store.importData(raw);
        if (!result.ok) {
          U.toast(
            result.error === "TOO_LARGE"
              ? "That backup is too large for this browser's storage."
              : "Import failed — storage may be full.",
            "error"
          );
          return;
        }

        refresh();
        U.toast(
          "Imported " + result.counts.visits + " visits and " + result.counts.shots + " shots.",
          "success"
        );
      });
    }

    const resetButton = document.getElementById("resetData");
    if (resetButton) {
      resetButton.addEventListener("click", async () => {
        const confirmed = await U.confirmAction({
          eyebrow: "Reset passport",
          title: "Start from zero?",
          message:
            "Every stamp, photo, custom cafe and espresso shot on this device will be deleted. This cannot be undone.",
          confirmLabel: "Delete everything",
          danger: true
        });
        if (!confirmed) return;
        store.resetAll();
        U.toast("Passport reset. A fresh page.");
        window.setTimeout(() => window.location.reload(), 450);
      });
    }
  }

  /* ── Profile form ───────────────────────────────────────── */

  function bindProfile() {
    const form = document.getElementById("profileName");
    const district = document.getElementById("profileDistrict");
    const save = document.getElementById("saveProfile");
    if (!save) return;

    save.addEventListener("click", () => {
      const name = form ? form.value.trim().slice(0, 24) : "";
      const districtValue = district ? district.value : "";
      const ok = store.saveProfile({ name, district: districtValue });
      if (!ok) {
        U.toast("Could not save your profile. Storage may be full.", "error");
        return;
      }
      refresh();
      U.toast(name ? "Passport updated, " + name + "." : "Passport updated.", "success");
    });

    [form, district].forEach((input) => {
      if (!input) return;
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && input.tagName === "INPUT") {
          event.preventDefault();
          save.click();
        }
      });
    });
  }

  /* ── PWA ────────────────────────────────────────────────── */

  let deferredPrompt = null;

  function setupPWA() {
    const installButton = document.getElementById("installApp");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (installButton && !standalone) {
      window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event;
        installButton.hidden = false;
      });

      installButton.addEventListener("click", async () => {
        if (!deferredPrompt) {
          U.toast("Use your browser menu → Add to Home Screen.", "info");
          return;
        }
        deferredPrompt.prompt();
        try {
          await deferredPrompt.userChoice;
        } catch (error) {
          /* prompt may be dismissed */
        }
        deferredPrompt = null;
        installButton.hidden = true;
      });

      window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        installButton.hidden = true;
        U.toast("Bah_ngupi installed. Selamat ngupi!", "success");
      });
    }

    if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {
          /* offline support simply stays off */
        });
      });
    }
  }

  /* ── Boot ───────────────────────────────────────────────── */

  function bindNavigation() {
    document.addEventListener("click", (event) => {
      const nav = event.target.closest("[data-nav]");
      if (!nav) return;
      event.preventDefault();
      go(nav.getAttribute("data-nav"));
    });

    window.addEventListener("hashchange", () => {
      go(window.location.hash.replace("#", ""), false);
    });
  }

  function init() {
    loadState();

    BN.Passport.init(store);
    BN.Dialer.init(store);
    renderProfile();

    bindNavigation();
    bindProfile();
    bindDataTools();
    setupPWA();

    const initial = window.location.hash.replace("#", "");
    go(VIEWS.includes(initial) ? initial : "passport", false);

    BN.refresh = refresh;
    BN.go = go;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
