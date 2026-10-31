/* ============================================================
   Bah_ngupi — passport, cafe directory, check-ins & achievements
   ============================================================ */
(function () {
  "use strict";

  const BN = (window.BN = window.BN || {});
  const U = BN.Utils;

  const emptyState = {
    stampGrid: null,
    stampCount: null,
    achievementStrip: null,
    achievementCount: null,
    recentVisits: null,
    progressRing: null,
    progressPct: null,
    statUnique: null,
    statTotal: null,
    statVisits: null,
    statDistricts: null,
    statPhotos: null,
    passportName: null,
    passportDate: null,
    cafeSearch: null,
    clearSearch: null,
    districtChips: null,
    cafeList: null,
    cafeCount: null,
    favouritesToggle: null,
    exploreView: null,
    passportView: null
  };

  let store = null;
  let selectedDistrict = "All";
  let queryText = "";
  let favouritesOnly = false;
  let pendingPhoto = null;
  let pendingPhotoMeta = null;
  let pendingRating = 0;
  let submittingVisit = false;
  let bound = false;

  const DISTRICTS = ["Brunei-Muara", "Tutong", "Belait", "Temburong"];
  const CATEGORIES = ["Cafe", "Roastery", "Bakery", "Brunch", "Patisserie", "Tea room"];

  /* ── Achievements ───────────────────────────────────────── */

  const BADGES = [
    {
      id: "first-sip",
      title: "First Sip",
      description: "Collect your first cafe stamp.",
      icon: "i-logo",
      target: 1
    },
    {
      id: "cafe-crawler",
      title: "Cafe Crawler",
      description: "Visit 5 different cafes.",
      icon: "i-compass",
      target: 5
    },
    {
      id: "district-hopper",
      title: "District Hopper",
      description: "Check in across 3 different districts.",
      icon: "i-map",
      target: 3
    },
    {
      id: "photo-journal",
      title: "Photo Journal",
      description: "Add photo proof to 3 check-ins.",
      icon: "i-camera",
      target: 3
    },
    {
      id: "regular",
      title: "Local Regular",
      description: "Check in 3 times at the same cafe.",
      icon: "i-heart",
      target: 3
    },
    {
      id: "night-owl",
      title: "Night Owl",
      description: "Collect a stamp after 8pm.",
      icon: "i-clock",
      target: 1
    },
    {
      id: "passport-pro",
      title: "Passport Pro",
      description: "Visit 10 different cafes.",
      icon: "i-passport",
      target: 10
    },
    {
      id: "island-hopper",
      title: "Island Hopper",
      description: "Visit 15 different cafes.",
      icon: "i-spark",
      target: 15
    },
    {
      id: "dialed-in",
      title: "Dialed In",
      description: "Log 5 espresso shots in the dialer.",
      icon: "i-timer",
      target: 5
    },
    {
      id: "perfect-shot",
      title: "Sweet Spot",
      description: "Log a 25–32s shot at a 1:1.8–1:2.3 ratio.",
      icon: "i-star",
      target: 1
    }
  ];

  function evaluateAchievements() {
    if (!store) return [];
    const visits = store.visits || [];
    const cafes = store.allCafes();
    const cafeById = new Map(cafes.map((cafe) => [cafe.id, cafe]));

    const uniqueIds = new Set();
    const districts = new Set();
    const perCafe = new Map();
    let photos = 0;
    let nightVisit = false;

    visits.forEach((visit) => {
      const cafe = cafeById.get(visit.cafeId);
      if (!cafe) return;
      uniqueIds.add(cafe.id);
      districts.add(cafe.district);
      perCafe.set(cafe.id, (perCafe.get(cafe.id) || 0) + 1);
      if (visit.photo) photos += 1;
      const hour = new Date(visit.date).getHours();
      if (hour >= 20 || hour < 5) nightVisit = true;
    });

    const maxAtOne = perCafe.size ? Math.max.apply(null, Array.from(perCafe.values())) : 0;
    const shots = store.shots || [];
    const perfectShot = shots.some((shot) => {
      const ms = U.parseTimer(shot.time);
      const ratio = Number(shot.ratio);
      return ms !== null && ms >= 25000 && ms <= 32000 && ratio >= 1.8 && ratio <= 2.3;
    });

    const currentById = {
      "first-sip": visits.length,
      "cafe-crawler": uniqueIds.size,
      "district-hopper": districts.size,
      "photo-journal": photos,
      "regular": maxAtOne,
      "night-owl": nightVisit ? 1 : 0,
      "passport-pro": uniqueIds.size,
      "island-hopper": uniqueIds.size,
      "dialed-in": shots.length,
      "perfect-shot": perfectShot ? 1 : 0
    };

    return BADGES.map((badge) => {
      const current = Math.min(currentById[badge.id] || 0, badge.target);
      return Object.assign({}, badge, {
        current,
        earned: current >= badge.target
      });
    });
  }

  function earnedIds(list) {
    return new Set(list.filter((badge) => badge.earned).map((badge) => badge.id));
  }

  /* ── Stamp artwork ──────────────────────────────────────── */

  function safeId(value) {
    return String(value || "stamp").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "stamp";
  }

  function colorOf(cafe) {
    const color = cafe && cafe.color;
    const color2 = cafe && cafe.color2;
    return {
      color: /^#[0-9a-f]{6}$/i.test(color || "") ? color : "#a06a40",
      color2: /^#[0-9a-f]{6}$/i.test(color2 || "") ? color2 : "#4b3221"
    };
  }

  function coverStyle(cafe) {
    const colors = colorOf(cafe);
    return "--cafe:" + colors.color + ";--cafe-2:" + colors.color2;
  }

  function photoSrc(visit) {
    return visit && U.isSafeImageData(visit.photo) ? visit.photo : "";
  }

  function stampSvg(cafe, visit, options) {
    const opts = options || {};
    const colors = colorOf(cafe);
    const monogram = U.escapeHtml(U.initials(cafe && cafe.name ? cafe.name : "Bah Ngupi"));
    const area = (cafe && cafe.area ? cafe.area : "Brunei").toUpperCase().slice(0, 17);
    const parts = U.stampDateParts(visit && visit.date ? visit.date : new Date());
    const gradientId = "g-" + safeId(visit && visit.id ? visit.id : cafe && cafe.id ? cafe.id : "cafe") + (opts.suffix || "");

    const label =
      U.escapeHtml((cafe ? cafe.name : "Cafe") + " stamp, " + parts.month + " " + parts.day);
    const a11y = opts.decorative
      ? 'aria-hidden="true" focusable="false"'
      : 'role="img" aria-label="' + label + '"';

    return (
      '<svg viewBox="0 0 120 120" ' +
      a11y +
      ">" +
      "<defs>" +
      '<radialGradient id="' +
      gradientId +
      '" cx="32%" cy="22%" r="86%">' +
      '<stop offset="0%" stop-color="' +
      colors.color +
      '"/>' +
      '<stop offset="100%" stop-color="' +
      colors.color2 +
      '"/>' +
      "</radialGradient>" +
      "</defs>" +
      '<circle cx="60" cy="60" r="58" fill="#0b0806" opacity="0.42"/>' +
      '<circle cx="60" cy="60" r="53.5" fill="url(#' +
      gradientId +
      ')" stroke="#f7e8d2" stroke-opacity="0.62" stroke-width="1.4" stroke-dasharray="2.2 2.8"/>' +
      '<circle cx="60" cy="60" r="46" fill="none" stroke="#fff6e8" stroke-opacity="0.34" stroke-width="0.9"/>' +
      '<circle cx="60" cy="60" r="44" fill="none" stroke="#fff6e8" stroke-opacity="0.18" stroke-width="2.4" stroke-dasharray="0.6 4"/>' +
      '<path id="' +
      gradientId +
      '-arc" d="M 23 60 A 37 37 0 0 1 97 60" fill="none"/>' +
      '<text fill="#fff8ec" fill-opacity="0.88" font-family="ui-sans-serif, system-ui, sans-serif" font-size="5.7" font-weight="700" letter-spacing="1.65">' +
      '<textPath href="#' +
      gradientId +
      '-arc" startOffset="50%" text-anchor="middle">BAH_NGUPI · BRUNEI</textPath>' +
      "</text> " +
      '<text x="60" y="67" text-anchor="middle" fill="#fffaf1" font-family="Georgia, serif" font-size="25" font-weight="600" letter-spacing="0.5">' +
      monogram +
      "</text> " +
      '<path d="M44 74h32" stroke="#fff6e8" stroke-opacity="0.35" stroke-width="0.8" stroke-dasharray="1.5 2"/>' +
      '<text x="60" y="82" text-anchor="middle" fill="#fff8ec" fill-opacity="0.9" font-family="ui-monospace, monospace" font-size="4.9" font-weight="600" letter-spacing="1.1">' +
      parts.month +
      " " +
      parts.day +
      " · " +
      parts.year +
      "</text> " +
      '<text x="60" y="91.5" text-anchor="middle" fill="#fff8ec" fill-opacity="0.72" font-family="ui-sans-serif, system-ui, sans-serif" font-size="4.4" font-weight="700" letter-spacing="1.3">' +
      U.escapeHtml(area) +
      "</text> " +
      "</svg>"
    );
  }

  function placeholderStampSvg(cafe) {
    const monogram = U.escapeHtml(U.initials(cafe && cafe.name ? cafe.name : "?"));
    const gradientId = "x-" + safeId(cafe && cafe.id ? cafe.id : "cafe");
    return (
      '<svg viewBox="0 0 120 120" role="img" aria-label="Uncollected stamp">' +
      '<circle cx="60" cy="60" r="53.5" fill="#241b15" stroke="#453528" stroke-width="1.4" stroke-dasharray="3 3.4"/>' +
      '<circle cx="60" cy="60" r="46" fill="none" stroke="#3b2d23" stroke-width="0.9"/>' +
      '<circle cx="60" cy="60" r="44" fill="none" stroke="#3b2d23" stroke-width="2.4" stroke-dasharray="0.6 4"/>' +
      '<path id="' +
      gradientId +
      '" d="M 23 60 A 37 37 0 0 1 97 60" fill="none"/>' +
      '<text fill="#7e6f60" font-family="ui-sans-serif, system-ui, sans-serif" font-size="5.7" font-weight="700" letter-spacing="1.65">' +
      '<textPath href="#' +
      gradientId +
      '" startOffset="50%" text-anchor="middle">NOT YET · COLLECT</textPath>' +
      "</text>" +
      '<text x="60" y="67" text-anchor="middle" fill="#5d4d3f" font-family="Georgia, serif" font-size="25" font-weight="600">' +
      monogram +
      "</text>" +
      '<text x="60" y="86" text-anchor="middle" fill="#6b5b4d" font-family="ui-sans-serif, system-ui, sans-serif" font-size="4.6" font-weight="700" letter-spacing="1.2">CHECK IN TO UNLOCK</text>' +
      "</svg>"
    );
  }

  function badgeMarkup(badge, compact) {
    const lock = badge.earned
      ? ""
      : '<span class="badge-lock"><svg class="icon" aria-hidden="true"><use href="#i-lock"></use></svg></span>';
    const progress = compact ? "" : "<br>" + badge.current + " / " + badge.target;
    return (
      '<div class="badge ' +
      (badge.earned ? "is-earned" : "") +
      '" title="' +
      U.escapeHtml(badge.description + " (" + badge.current + "/" + badge.target + ")") +
      '">' +
      '<span class="badge-medal"><svg class="icon" aria-hidden="true"><use href="#' +
      badge.icon +
      '"></use></svg></span>' +
      '<span class="badge-name">' +
      U.escapeHtml(badge.title) +
      progress +
      "</span>" +
      lock +
      "</div>"
    );
  }

  /* ── Passport rendering ─────────────────────────────────── */

  function uniqueVisited() {
    const cafes = store.allCafes();
    const idSet = new Set(store.visits.map((visit) => visit.cafeId));
    return cafes.filter((cafe) => idSet.has(cafe.id));
  }

  function renderPassport() {
    const cafes = store.allCafes();
    const visits = store.visits;
    const visitedCafes = uniqueVisited();
    const districts = new Set(visitedCafes.map((cafe) => cafe.district));
    const photoCount = visits.filter((visit) => visit.photo).length;
    const total = cafes.length;
    const unique = visitedCafes.length;
    const percent = total ? Math.round((unique / total) * 100) : 0;

    emptyState.passportDate.textContent = U.formatDay(new Date());
    emptyState.passportName.textContent = store.profile.name || "friend";

    emptyState.statUnique.textContent = String(unique);
    emptyState.statTotal.textContent = String(total);
    emptyState.statVisits.textContent = String(visits.length);
    emptyState.statDistricts.textContent = String(districts.size);
    emptyState.statPhotos.textContent = String(photoCount);
    emptyState.progressPct.textContent = percent + "%";

    const circumference = 320.44;
    emptyState.progressRing.style.strokeDashoffset = String(circumference * (1 - (total ? unique / total : 0)));

    /* Stamps */
    emptyState.stampCount.textContent = visits.length + " " + U.plural(visits.length, "stamp");
    const cafeById = new Map(cafes.map((cafe) => [cafe.id, cafe]));
    const stampable = visits.filter((visit) => cafeById.has(visit.cafeId));

    if (!stampable.length) {
      emptyState.stampGrid.classList.add("is-empty");
      emptyState.stampGrid.innerHTML =
        '<div class="stamp-grid-empty">' +
        '<div class="empty-art"><svg class="icon" aria-hidden="true"><use href="#i-passport"></use></svg></div>' +
        "<p><strong>Your first stamp is waiting.</strong><br>Check in at any cafe to start your Brunei coffee passport.</p>" +
        '<button class="btn btn-primary btn-sm" data-nav="explore">Explore cafes</button>' +
        "</div>";
    } else {
      emptyState.stampGrid.classList.remove("is-empty");
      emptyState.stampGrid.innerHTML = stampable
        .map((visit) => {
          const cafe = cafeById.get(visit.cafeId);
          const parts = U.stampDateParts(visit.date);
          const stampLabel =
            "Open " +
            cafe.name +
            " stamp from " +
            U.formatDate(visit.date) +
            " — BAH_NGUPI · BRUNEI, " +
            U.initials(cafe.name) +
            ", " +
            parts.month +
            " " +
            parts.day +
            " · " +
            parts.year +
            ", " +
            (cafe.area || "Brunei").toUpperCase().slice(0, 17);
          return (
            '<button class="stamp" data-action="open-cafe" data-cafe-id="' +
            U.escapeHtml(cafe.id) +
            '" aria-label="' +
            U.escapeHtml(stampLabel) +
            '">' +
            stampSvg(cafe, visit, { decorative: true }) +
            "</button>"
          );
        })
        .join("");
    }

    /* Achievements */
    const achievements = evaluateAchievements();
    const earned = achievements.filter((badge) => badge.earned).length;
    emptyState.achievementCount.textContent = earned + " / " + achievements.length;
    emptyState.achievementStrip.innerHTML = achievements.map((badge) => badgeMarkup(badge, true)).join("");

    /* Recent visits */
    const recent = stampable.slice(0, 4);
    if (!recent.length) {
      emptyState.recentVisits.innerHTML =
        '<div class="empty-state">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-logo"></use></svg>' +
        "<strong>No sips logged yet</strong>" +
        "<p>Your cafe diary starts with one cup. Find a spot and check in.</p>" +
        '<button class="btn btn-primary btn-sm" data-nav="explore">Find a cafe</button>' +
        "</div>";
    } else {
      emptyState.recentVisits.innerHTML = recent
        .map((visit) => {
          const cafe = cafeById.get(visit.cafeId);
          const colors = colorOf(cafe);
          const photo = photoSrc(visit)
            ? '<img src="' + photoSrc(visit) + '" alt="" loading="lazy">'
            : U.escapeHtml(U.initials(cafe.name));
          return (
            '<button class="timeline-item" data-action="open-cafe" data-cafe-id="' +
            U.escapeHtml(cafe.id) +
            '">' +
            '<span class="timeline-thumb" style="background:linear-gradient(135deg,' +
            colors.color +
            "," +
            colors.color2 +
            ')">' +
            photo +
            "</span>" +
            '<span class="timeline-body"><strong>' +
            U.escapeHtml(cafe.name) +
            "</strong><span>" +
            U.escapeHtml(visit.drink || "Coffee run") +
            " · " +
            U.escapeHtml(U.relativeDay(visit.date)) +
            "</span></span>" +
            '<span class="timeline-meta"><span>' +
            U.escapeHtml(U.formatTime(visit.date)) +
            "</span>" +
            (visit.rating ? '<span class="stars">' + U.stars(visit.rating) + "</span>" : "") +
            "</span></button>"
          );
        })
        .join("");
    }

    /* Header avatar */
    const avatar = document.getElementById("topAvatar");
    if (avatar) {
      const initials = U.initials(store.profile.name || "Bah Ngupi");
      avatar.textContent = initials;
      avatar.setAttribute("aria-label", "Open profile (" + initials + ")");
    }
  }

  /* ── Explore rendering ──────────────────────────────────── */

  function renderDistricts(cafes) {
    const counts = new Map();
    cafes.forEach((cafe) => counts.set(cafe.district, (counts.get(cafe.district) || 0) + 1));
    if (selectedDistrict !== "All" && !DISTRICTS.includes(selectedDistrict)) {
      selectedDistrict = "All";
    }
    const chip = (label, value, count) =>
      '<button class="chip ' +
      (selectedDistrict === value ? "is-active" : "") +
      '" data-district="' +
      U.escapeHtml(value) +
      '">' +
      "<span>" +
      U.escapeHtml(label) +
      '</span><span class="chip-count">' +
      count +
      "</span></button>";
    const chips = [chip("All districts", "All", cafes.length)]
      .concat(DISTRICTS.map((district) => chip(district, district, counts.get(district) || 0)))
      .join("");
    emptyState.districtChips.innerHTML = chips;
  }

  function matchingCafes() {
    const query = queryText.trim().toLowerCase();
    return store.allCafes().filter((cafe) => {
      if (selectedDistrict !== "All" && cafe.district !== selectedDistrict) return false;
      if (favouritesOnly && !store.isFavorite(cafe.id)) return false;
      if (!query) return true;
      const haystack = [
        cafe.name,
        cafe.area,
        cafe.district,
        cafe.category,
        cafe.description,
        (cafe.tags || []).join(" "),
        (cafe.menu || []).join(" ")
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  function cafeCard(cafe) {
    const visits = store.visitsFor(cafe.id);
    const isFav = store.isFavorite(cafe.id);
    const colors = colorOf(cafe);
    const tags = (cafe.tags || []).slice(0, 2);
    const visited = visits.length > 0;
    const dot = visited ? '<span class="cafe-mono-dot" aria-hidden="true"></span>' : "";
    /* A real brand logo sits on a cream plate; without one the generated
       monogram keeps the card readable and consistent. */
    const mark = cafe.logo
      ? '<span class="cafe-mono is-logo">' +
        '<img class="cafe-logo" src="' +
        U.escapeHtml(cafe.logo) +
        '" alt="" width="128" height="128" loading="lazy" decoding="async">' +
        dot +
        "</span>"
      : '<span class="cafe-mono" style="background:linear-gradient(135deg,' +
        colors.color +
        "," +
        colors.color2 +
        ')">' +
        U.escapeHtml(U.initials(cafe.name)) +
        dot +
        "</span>";
    return (
      '<article class="cafe-card' +
      (visited ? " is-visited" : "") +
      '">' +
      '<button class="cafe-open" data-action="open-cafe" data-cafe-id="' +
      U.escapeHtml(cafe.id) +
      '">' +
      mark +
      '<span class="cafe-body">' +
      '<span class="cafe-title-row"><strong>' +
      U.escapeHtml(cafe.name) +
      '</strong><span class="cafe-category">' +
      U.escapeHtml(cafe.category) +
      "</span></span>" +
      '<span class="cafe-meta">' +
      U.escapeHtml(cafe.area) +
      " · " +
      U.escapeHtml(cafe.district) +
      "</span>" +
      '<span class="cafe-foot">' +
      '<span class="cafe-tags">' +
      tags.map((tag) => '<span class="cafe-tag">' + U.escapeHtml(tag) + "</span>").join("") +
      "</span>" +
      '<span class="stamp-tally' +
      (visited ? "" : " stamp-tally--new") +
      '">' +
      (visited ? visits.length + " " + U.plural(visits.length, "stamp") : "Not visited") +
      "</span>" +
      "</span></span></button>" +
      '<button class="cafe-fav" data-action="toggle-fav" data-cafe-id="' +
      U.escapeHtml(cafe.id) +
      '" aria-pressed="' +
      (isFav ? "true" : "false") +
      '" aria-label="' +
      (isFav ? "Remove from favourites" : "Add to favourites") +
      '"><svg class="icon" aria-hidden="true"><use href="#' +
      (isFav ? "i-heart-filled" : "i-heart") +
      '"></use></svg></button>' +
      "</article>"
    );
  }

  function renderExplore() {
    const all = store.allCafes();
    renderDistricts(all);

    const results = matchingCafes();
    const filtered = selectedDistrict !== "All" || queryText.trim() || favouritesOnly;
    emptyState.cafeCount.textContent = filtered
      ? results.length + " of " + all.length + " cafes"
      : all.length + " cafes";
    emptyState.favouritesToggle.setAttribute("aria-pressed", favouritesOnly ? "true" : "false");

    if (queryText) {
      emptyState.clearSearch.hidden = false;
    } else {
      emptyState.clearSearch.hidden = true;
    }

    if (!results.length) {
      emptyState.cafeList.innerHTML =
        '<div class="empty-state">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-search"></use></svg>' +
        "<strong>No cafes found</strong>" +
        "<p>Try a different district, or add this hidden gem yourself.</p>" +
        '<button class="btn btn-ghost btn-sm" data-action="clear-filters">Clear filters</button>' +
        "</div>";
      return;
    }

    emptyState.cafeList.innerHTML = results.map(cafeCard).join("");
  }

  /* ── Cafe detail sheet ──────────────────────────────────── */

  function mapsUrl(cafe) {
    return (
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(cafe.name + " " + cafe.area + " Brunei")
    );
  }

  function visitCard(visit) {
    const photo = photoSrc(visit)
      ? '<img src="' + photoSrc(visit) + '" alt="Check-in photo" loading="lazy">'
      : '<svg class="icon" aria-hidden="true"><use href="#i-logo"></use></svg>';
    return (
      '<div class="visit-card">' +
      '<div class="visit-thumb">' +
      photo +
      "</div>" +
      '<div class="visit-body"><strong>' +
      U.escapeHtml(visit.drink || "Coffee run") +
      "</strong><span>" +
      U.escapeHtml(U.relativeDay(visit.date)) +
      " · " +
      U.escapeHtml(U.formatTime(visit.date)) +
      (visit.rating ? ' · <span class="visit-stars">' + U.stars(visit.rating) + "</span>" : "") +
      "</span>" +
      (visit.notes ? "<span>“" + U.escapeHtml(visit.notes) + "”</span>" : "") +
      "</div>" +
      '<button class="visit-del" data-action="delete-visit" data-visit-id="' +
      U.escapeHtml(visit.id) +
      '" aria-label="Delete this visit"><svg class="icon" aria-hidden="true"><use href="#i-trash"></use></svg></button>' +
      "</div>"
    );
  }

  function openCafeDetail(cafeId) {
    const cafe = store.getCafe(cafeId);
    if (!cafe) {
      U.toast("That cafe is no longer in your passport.", "error");
      return;
    }

    const visits = store.visitsFor(cafe.id);
    const isFav = store.isFavorite(cafe.id);
    const latest = visits[0];
    const stampBlock = latest
      ? '<div class="stamp-preview"><div class="stamp-preview-art">' +
        stampSvg(cafe, latest, { suffix: "-detail" }) +
        '</div><div class="stamp-preview-copy"><strong>' +
        visits.length +
        " " +
        U.plural(visits.length, "stamp") +
        " collected</strong><p>Latest: " +
        U.escapeHtml(U.relativeDay(latest.date)) +
        ". Keep collecting visits to fill your passport.</p></div></div>"
      : '<div class="stamp-preview"><div class="stamp-preview-art">' +
        placeholderStampSvg(cafe) +
        '</div><div class="stamp-preview-copy"><strong>No stamp yet</strong><p>Check in when you visit to collect this cafe\'s passport stamp.</p></div></div>';

    const menu = (cafe.menu || []).length
      ? '<div class="detail-section"><div class="detail-section-head"><h3>Worth ordering</h3></div><div class="drink-chips">' +
        cafe.menu
          .slice(0, 6)
          .map((item) => '<span class="cafe-tag">' + U.escapeHtml(item) + "</span>")
          .join("") +
        "</div></div>"
      : "";

    const danger = cafe.custom
      ? '<div class="danger-zone">' +
        '<button class="btn btn-ghost btn-sm" data-action="edit-cafe"><svg class="icon icon-sm" aria-hidden="true"><use href="#i-edit"></use></svg>Edit cafe</button>' +
        '<button class="btn btn-danger-ghost btn-sm" data-action="delete-cafe"><svg class="icon icon-sm" aria-hidden="true"><use href="#i-trash"></use></svg>Delete</button>' +
        "</div>"
      : "";

    const visitBlock = visits.length
      ? '<div class="visit-list">' + visits.map(visitCard).join("") + "</div>"
      : '<p class="muted small">No visits logged at this cafe yet. Your first stamp is one tap away.</p>';

    const content =
      '<div class="detail-cover" style="' +
      coverStyle(cafe) +
      '">' +
      (cafe.logo
        ? '<span class="detail-cover-mono is-logo"><img src="' +
          U.escapeHtml(cafe.logo) +
          '" alt=""></span>'
        : '<span class="detail-cover-mono">' +
          U.escapeHtml(U.initials(cafe.name)) +
          "</span>") +
      '<div class="detail-cover-badges">' +
      '<span class="tag">' +
      U.escapeHtml(cafe.category) +
      "</span>" +
      (visits.length
        ? '<span class="tag tag--visited"><svg class="icon" aria-hidden="true"><use href="#i-check"></use></svg> Visited</span>'
        : "") +
      (cafe.custom ? '<span class="tag">Added by you</span>' : "") +
      "</div></div>" +
      '<p class="detail-desc">' +
      U.escapeHtml(cafe.description || "A cafe in your Brunei coffee passport.") +
      "</p>" +
      '<div class="detail-actions">' +
      '<button class="btn btn-primary" data-action="check-in"><svg class="icon icon-sm" aria-hidden="true"><use href="#i-camera"></use></svg>' +
      (visits.length ? "Check in again" : "Check in") +
      "</button>" +
      '<button class="btn btn-ghost fav-btn" data-action="toggle-detail-fav" aria-pressed="' +
      (isFav ? "true" : "false") +
      '"><svg class="icon icon-sm" aria-hidden="true"><use href="#' +
      (isFav ? "i-heart-filled" : "i-heart") +
      '"></use></svg><span>' +
      (isFav ? "Saved" : "Favourite") +
      "</span></button>" +
      "</div>" +
      '<div class="info-list">' +
      '<div class="info-row"><svg class="icon" aria-hidden="true"><use href="#i-map"></use></svg><div><strong>Find it</strong><a href="' +
      U.escapeHtml(mapsUrl(cafe)) +
      '" target="_blank" rel="noopener noreferrer">' +
      U.escapeHtml(cafe.address || cafe.area + ", Brunei") +
      " — open in Maps</a></div></div>" +
      '<div class="info-row"><svg class="icon" aria-hidden="true"><use href="#i-clock"></use></svg><div><strong>Hours</strong><span>' +
      U.escapeHtml(cafe.hours || "Check Maps for today's hours") +
      "</span></div></div>" +
      '<div class="info-row"><svg class="icon" aria-hidden="true"><use href="#i-bean"></use></svg><div><strong>Price</strong><span>' +
      U.escapeHtml(cafe.price || "$$") +
      " · " +
      U.escapeHtml(cafe.area) +
      " · " +
      U.escapeHtml(cafe.district) +
      "</span></div></div>" +
      "</div>" +
      menu +
      '<div class="detail-section">' +
      '<div class="detail-section-head"><h3>Stamp card</h3><span class="pill">' +
      visits.length +
      "</span></div>" +
      stampBlock +
      "</div>" +
      '<div class="detail-section">' +
      '<div class="detail-section-head"><h3>Visit diary</h3><span class="pill pill--quiet">' +
      visits.length +
      " " +
      U.plural(visits.length, "visit") +
      "</span></div>" +
      visitBlock +
      "</div>" +
      danger;

    U.openSheet({
      eyebrow: cafe.area + " · " + cafe.category,
      title: cafe.name,
      content,
      onMount(body) {
        const checkInButton = body.querySelector('[data-action="check-in"]');
        if (checkInButton) {
          checkInButton.addEventListener("click", () => openCheckIn(cafe.id));
        }

        const favButton = body.querySelector('[data-action="toggle-detail-fav"]');
        if (favButton) {
          favButton.addEventListener("click", () => {
            const nowFav = store.toggleFavorite(cafe.id);
            favButton.setAttribute("aria-pressed", nowFav ? "true" : "false");
            favButton.innerHTML =
              '<svg class="icon icon-sm" aria-hidden="true"><use href="#' +
              (nowFav ? "i-heart-filled" : "i-heart") +
              '"></use></svg><span>' +
              (nowFav ? "Saved" : "Favourite") +
              "</span>";
            U.toast(nowFav ? "Saved to favourites." : "Removed from favourites.", "success");
            renderExplore();
          });
        }

        body.querySelectorAll('[data-action="delete-visit"]').forEach((button) => {
          button.addEventListener("click", async () => {
            const visitId = button.getAttribute("data-visit-id");
            const confirmed = await U.confirmAction({
              eyebrow: "Delete visit",
              title: "Remove this stamp?",
              message: "The visit, rating and photo will be deleted from this device.",
              confirmLabel: "Delete stamp",
              danger: true
            });
            if (!confirmed) return;
            store.removeVisit(visitId);
            U.toast("Visit removed.");
            BN.refresh();
            openCafeDetail(cafe.id);
          });
        });

        const editButton = body.querySelector('[data-action="edit-cafe"]');
        if (editButton) {
          editButton.addEventListener("click", () => openCafeForm(cafe));
        }

        const deleteButton = body.querySelector('[data-action="delete-cafe"]');
        if (deleteButton) {
          deleteButton.addEventListener("click", async () => {
            const confirmed = await U.confirmAction({
              eyebrow: "Delete cafe",
              title: "Delete " + cafe.name + "?",
              message:
                "This removes the cafe and its " +
                visits.length +
                " " +
                U.plural(visits.length, "stamp") +
                " from your passport.",
              confirmLabel: "Delete cafe",
              danger: true
            });
            if (!confirmed) return;
            store.deleteCafe(cafe.id);
            U.closeSheet();
            U.toast("Cafe removed from your passport.");
            BN.refresh();
          });
        }
      }
    });
  }

  /* ── Check-in sheet ─────────────────────────────────────── */

  function openCheckIn(cafeId) {
    const cafe = store.getCafe(cafeId);
    if (!cafe) {
      U.toast("That cafe is no longer available.", "error");
      return;
    }

    pendingPhoto = null;
    pendingPhotoMeta = null;
    pendingRating = 0;
    submittingVisit = false;

    const drinkChips = (cafe.menu || [])
      .slice(0, 5)
      .map(
        (item) =>
          '<button type="button" class="drink-chip" data-drink="' +
          U.escapeHtml(item) +
          '">' +
          U.escapeHtml(item) +
          "</button>"
      )
      .join("");

    const stars = [1, 2, 3, 4, 5]
      .map(
        (value) =>
          '<button type="button" class="rating-star" data-rating="' +
          value +
          '" aria-label="' +
          value +
          ' ' +
          U.plural(value, "star") +
          '" aria-pressed="false"><svg class="icon" aria-hidden="true"><use href="#i-star"></use></svg></button>'
      )
      .join("");

    const content =
      '<div class="checkin-cafe" style="' +
      coverStyle(cafe) +
      '">' +
      '<span class="checkin-mono" style="background:linear-gradient(135deg,' +
      colorOf(cafe).color +
      "," +
      colorOf(cafe).color2 +
      ')">' +
      U.escapeHtml(U.initials(cafe.name)) +
      "</span>" +
      "<div><strong>" +
      U.escapeHtml(cafe.name) +
      "</strong><span>" +
      U.escapeHtml(cafe.area + " · " + cafe.district) +
      "</span></div></div>" +
      '<form id="checkinForm" novalidate>' +
      '<div class="field"><label>Photo proof <span class="muted">(optional)</span></label>' +
      '<label class="photo-picker" for="checkinPhoto">' +
      '<input type="file" id="checkinPhoto" accept="image/*">' +
      '<span id="photoPreview" class="photo-placeholder">' +
      '<svg class="icon" aria-hidden="true"><use href="#i-camera"></use></svg>' +
      "<strong>Snap or upload your cup</strong>" +
      "<span>Compressed to max 800px · 0.7 JPEG</span>" +
      "</span></label>" +
      '<p class="form-note">Photos are resized on your device and stored locally. Nothing is uploaded.</p></div>' +
      '<div class="field"><label for="drinkInput">What did you order?</label>' +
      '<input id="drinkInput" type="text" maxlength="60" placeholder="e.g. Flat white" autocomplete="off">' +
      (drinkChips ? '<div class="drink-chips">' + drinkChips + "</div>" : "") +
      "</div>" +
      '<div class="field"><label>Rating</label><div class="rating-input" id="ratingInput" role="group" aria-label="Rate this visit">' +
      stars +
      "</div></div>" +
      '<div class="field"><label for="visitNotes">Tasting notes <span class="muted">(optional)</span></label>' +
      '<textarea id="visitNotes" maxlength="180" rows="2" placeholder="Fruity, chocolatey, great vibes…"></textarea></div>' +
      '<div class="form-actions">' +
      '<button type="submit" class="btn btn-primary btn-block" id="submitVisit">Collect stamp</button>' +
      '<button type="button" class="btn btn-ghost btn-block" data-close-sheet>Cancel</button>' +
      "</div></form>";

    U.openSheet({
      eyebrow: "Check in · " + U.formatDate(new Date()),
      title: cafe.name,
      content,
      onMount(body) {
        const form = body.querySelector("#checkinForm");
        const photoInput = body.querySelector("#checkinPhoto");
        const preview = body.querySelector("#photoPreview");
        const drinkInput = body.querySelector("#drinkInput");
        const notesInput = body.querySelector("#visitNotes");
        const submitButton = body.querySelector("#submitVisit");
        const ratingGroup = body.querySelector("#ratingInput");

        const renderPreview = () => {
          if (!pendingPhoto) {
            preview.className = "photo-placeholder";
            preview.innerHTML =
              '<svg class="icon" aria-hidden="true"><use href="#i-camera"></use></svg>' +
              "<strong>Snap or upload your cup</strong>" +
              "<span>Compressed to max 800px · 0.7 JPEG</span>";
            return;
          }
          preview.className = "";
          preview.innerHTML =
            '<img class="photo-preview" src="' +
            pendingPhoto +
            '" alt="Preview of your check-in photo">' +
            '<span class="photo-badge">' +
            U.formatBytes(pendingPhotoMeta ? pendingPhotoMeta.bytes : 0) +
            " · " +
            (pendingPhotoMeta ? pendingPhotoMeta.width + "×" + pendingPhotoMeta.height : "") +
            "</span>" +
            '<button type="button" class="photo-remove" data-remove-photo aria-label="Remove photo">' +
            '<svg class="icon" aria-hidden="true"><use href="#i-close"></use></svg></button>';
          const remove = preview.querySelector("[data-remove-photo]");
          if (remove) {
            remove.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              pendingPhoto = null;
              pendingPhotoMeta = null;
              if (photoInput) photoInput.value = "";
              renderPreview();
            });
          }
        };

        if (photoInput) {
          photoInput.addEventListener("change", async () => {
            const file = photoInput.files && photoInput.files[0];
            if (!file) return;
            preview.className = "photo-busy";
            preview.textContent = "Compressing photo…";
            try {
              const result = await U.compressImage(file, { maxSize: 800, quality: 0.7 });
              pendingPhoto = result.dataUrl;
              pendingPhotoMeta = result;
              renderPreview();
              U.toast("Photo compressed to " + U.formatBytes(result.bytes) + ".", "success");
            } catch (error) {
              pendingPhoto = null;
              pendingPhotoMeta = null;
              renderPreview();
              U.toast(error.message || "Could not process that photo.", "error");
            } finally {
              photoInput.value = "";
            }
          });
        }

        body.querySelectorAll("[data-drink]").forEach((chip) => {
          chip.addEventListener("click", () => {
            if (drinkInput) drinkInput.value = chip.getAttribute("data-drink") || "";
          });
        });

        if (ratingGroup) {
          ratingGroup.addEventListener("click", (event) => {
            const button = event.target.closest("[data-rating]");
            if (!button) return;
            pendingRating = Number(button.getAttribute("data-rating")) || 0;
            ratingGroup.querySelectorAll("[data-rating]").forEach((star) => {
              const on = Number(star.getAttribute("data-rating")) <= pendingRating;
              star.classList.toggle("is-on", on);
              star.setAttribute("aria-pressed", on ? "true" : "false");
            });
          });
        }

        if (form) {
          form.addEventListener("submit", (event) => {
            event.preventDefault();
            if (submittingVisit) return;
            submittingVisit = true;
            if (submitButton) {
              submitButton.disabled = true;
              submitButton.textContent = "Stamping…";
            }

            const before = earnedIds(evaluateAchievements());
            const drink = drinkInput && drinkInput.value.trim() ? drinkInput.value.trim() : "Coffee";
            const notes = notesInput ? notesInput.value.trim() : "";

            const result = store.addVisit({
              cafeId: cafe.id,
              date: new Date().toISOString(),
              drink,
              notes,
              rating: pendingRating,
              photo: pendingPhoto
            });

            if (!result.ok) {
              submittingVisit = false;
              if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Collect stamp";
              }
              U.toast(
                result.error === "QuotaExceededError"
                  ? "Storage is full. Delete an old photo visit, then try again."
                  : "Could not save this visit. Please try again.",
                "error"
              );
              return;
            }

            const after = evaluateAchievements();
            const newBadges = after.filter((badge) => badge.earned && !before.has(badge.id));

            pendingPhoto = null;
            pendingPhotoMeta = null;
            pendingRating = 0;
            U.closeSheet();
            BN.refresh();
            showStampReveal(cafe, result.visit, newBadges, result.photoDropped);

            if (navigator.vibrate) {
              try {
                navigator.vibrate([18, 40, 24]);
              } catch (error) {
                /* haptics are a nice-to-have */
              }
            }
          });
        }
      }
    });
  }

  /* ── Stamp reveal ───────────────────────────────────────── */

  function showStampReveal(cafe, visit, newBadges, photoDropped) {
    const modal = document.getElementById("stampModal");
    if (!modal) return;

    const title = document.getElementById("stampModalTitle");
    const art = document.getElementById("stampModalArt");
    const meta = document.getElementById("stampModalMeta");
    const badges = document.getElementById("stampModalBadges");

    title.textContent = cafe.name;
    art.innerHTML = stampSvg(cafe, visit, { suffix: "-reveal" });
    art.classList.remove("is-animating");
    void art.offsetWidth;
    art.classList.add("is-animating");

    meta.innerHTML =
      U.escapeHtml(visit.drink || "Coffee") +
      " · " +
      U.escapeHtml(U.relativeDay(visit.date)) +
      (photoDropped ? "<br><span class=\"muted small\">Photo skipped — storage was full.</span>" : "");

    badges.innerHTML = newBadges.length
      ? newBadges
          .map(
            (badge) =>
              '<span class="reveal-badge">New badge · ' + U.escapeHtml(badge.title) + "</span>"
          )
          .join("")
      : "";

    modal.classList.add("is-open");
    modal.removeAttribute("inert");
    modal.setAttribute("aria-hidden", "false");
    U.syncOverlayLock();
    const close = modal.querySelector("[data-close-modal]");
    if (close) close.focus({ preventScroll: true });
  }

  function closeStampReveal() {
    const modal = document.getElementById("stampModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("inert", "");
    modal.setAttribute("aria-hidden", "true");
    U.syncOverlayLock();
  }

  /* ── Add / edit cafe ────────────────────────────────────── */

  function openCafeForm(existing) {
    const isEdit = Boolean(existing);
    const cafe = existing || {
      name: "",
      area: "",
      district: store.profile.district || "Brunei-Muara",
      category: "Cafe",
      tags: [],
      description: "",
      address: "",
      hours: "",
      price: "$$",
      menu: []
    };

    const knownAreas = Array.from(new Set(store.allCafes().map((item) => item.area))).sort();

    const districtOptions = DISTRICTS.map(
      (district) =>
        '<option value="' +
        district +
        '"' +
        (cafe.district === district ? " selected" : "") +
        ">" +
        district +
        "</option>"
    ).join("");

    const categoryOptions = CATEGORIES.map(
      (category) =>
        '<option value="' +
        category +
        '"' +
        (cafe.category === category ? " selected" : "") +
        ">" +
        category +
        "</option>"
    ).join("");

    const priceOptions = ["$", "$$", "$$$"]
      .map(
        (price) =>
          '<option value="' +
          price +
          '"' +
          (cafe.price === price ? " selected" : "") +
          ">" +
          price +
          "</option>"
      )
      .join("");

    const content =
      '<form id="cafeForm" novalidate>' +
      '<div class="field"><label for="cafeName">Cafe name *</label>' +
      '<input id="cafeName" type="text" maxlength="60" value="' +
      U.escapeHtml(cafe.name) +
      '" placeholder="e.g. Kopi Corner" autocomplete="off">' +
      '<p class="field-error" id="cafeNameError" hidden>Please add a cafe name.</p></div>' +
      '<div class="field-row">' +
      '<div class="field"><label for="cafeArea">Area *</label>' +
      '<input id="cafeArea" type="text" maxlength="40" value="' +
      U.escapeHtml(cafe.area) +
      '" placeholder="e.g. Kiulap" list="areaOptions" autocomplete="off">' +
      '<p class="field-error" id="cafeAreaError" hidden>Please add an area.</p></div>' +
      '<div class="field"><label for="cafeDistrict">District</label>' +
      '<select id="cafeDistrict">' +
      districtOptions +
      "</select></div></div>" +
      '<datalist id="areaOptions">' +
      knownAreas.map((area) => '<option value="' + U.escapeHtml(area) + '"></option>').join("") +
      "</datalist>" +
      '<div class="field-row">' +
      '<div class="field"><label for="cafeCategory">Type</label><select id="cafeCategory">' +
      categoryOptions +
      "</select></div>" +
      '<div class="field"><label for="cafePrice">Price</label><select id="cafePrice">' +
      priceOptions +
      "</select></div></div>" +
      '<div class="field"><label for="cafeTags">Vibe tags</label>' +
      '<input id="cafeTags" type="text" maxlength="100" value="' +
      U.escapeHtml((cafe.tags || []).join(", ")) +
      '" placeholder="Specialty coffee, Brunch, Quiet" autocomplete="off">' +
      '<p class="form-note">Separate tags with commas.</p></div>' +
      '<div class="field"><label for="cafeDescription">Short description</label>' +
      '<textarea id="cafeDescription" maxlength="240" rows="3" placeholder="What makes this cafe worth a stamp?">' +
      U.escapeHtml(cafe.description || "") +
      "</textarea></div>" +
      '<div class="field"><label for="cafeAddress">Address or landmark</label>' +
      '<input id="cafeAddress" type="text" maxlength="100" value="' +
      U.escapeHtml(cafe.address || "") +
      '" placeholder="e.g. Next to the Kiulap shops" autocomplete="off"></div>' +
      '<div class="field"><label for="cafeHours">Hours</label>' +
      '<input id="cafeHours" type="text" maxlength="60" value="' +
      U.escapeHtml(cafe.hours || "") +
      '" placeholder="e.g. 8am – 10pm, closed Friday noon" autocomplete="off">' +
      '<p class="form-note">Optional. Hours can change — leave it blank to prompt a Maps check.</p></div>' +
      '<div class="field"><label for="cafeMenu">Signature orders</label>' +
      '<input id="cafeMenu" type="text" maxlength="140" value="' +
      U.escapeHtml((cafe.menu || []).join(", ")) +
      '" placeholder="Flat white, Cold brew, Croissant" autocomplete="off">' +
      '<p class="form-note">Separate items with commas — they become quick-pick chips at check-in.</p></div>' +
      '<div class="form-actions">' +
      '<button type="submit" class="btn btn-primary btn-block">' +
      (isEdit ? "Save changes" : "Add to directory") +
      "</button>" +
      '<button type="button" class="btn btn-ghost btn-block" data-close-sheet>Cancel</button>' +
      "</div></form>";

    U.openSheet({
      eyebrow: isEdit ? "Edit your cafe" : "Community directory",
      title: isEdit ? "Edit cafe" : "Add a cafe",
      content,
      onMount(body) {
        const form = body.querySelector("#cafeForm");
        const nameInput = body.querySelector("#cafeName");
        const areaInput = body.querySelector("#cafeArea");
        const nameError = body.querySelector("#cafeNameError");
        const areaError = body.querySelector("#cafeAreaError");

        const splitList = (value) =>
          String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 10);

        if (form) {
          form.addEventListener("submit", (event) => {
            event.preventDefault();
            const name = nameInput ? nameInput.value.trim() : "";
            const area = areaInput ? areaInput.value.trim() : "";
            let valid = true;

            if (!name) {
              if (nameError) nameError.hidden = false;
              if (nameInput) nameInput.focus();
              valid = false;
            } else if (nameError) {
              nameError.hidden = true;
            }

            if (!area) {
              if (areaError) areaError.hidden = false;
              if (areaInput && name) areaInput.focus();
              valid = false;
            } else if (areaError) {
              areaError.hidden = true;
            }

            if (!valid) return;

            const palette = U.paletteFor(name + area);
            const payload = {
              name,
              area,
              district: body.querySelector("#cafeDistrict").value,
              category: body.querySelector("#cafeCategory").value,
              price: body.querySelector("#cafePrice").value,
              tags: splitList(body.querySelector("#cafeTags").value),
              description: body.querySelector("#cafeDescription").value.trim().slice(0, 240),
              address: body.querySelector("#cafeAddress").value.trim().slice(0, 100),
              hours: body.querySelector("#cafeHours").value.trim().slice(0, 60),
              menu: splitList(body.querySelector("#cafeMenu").value)
            };

            let saved;
            if (isEdit) {
              saved = store.updateCafe(cafe.id, payload);
            } else {
              saved = store.addCafe(
                Object.assign({}, payload, {
                  color: palette[0],
                  color2: palette[1]
                })
              );
            }

            if (!saved) {
              U.toast("Could not save this cafe.", "error");
              return;
            }

            BN.refresh();
            U.toast(isEdit ? "Cafe updated." : "Cafe added to your passport.", "success");
            openCafeDetail(saved.id);
          });
        }
      }
    });
  }

  /* ── Wiring ─────────────────────────────────────────────── */

  function bindEvents() {
    if (bound) return;
    bound = true;

    const passportView = document.getElementById("view-passport");
    const exploreView = document.getElementById("view-explore");

    [passportView, exploreView].forEach((view) => {
      if (!view) return;
      view.addEventListener("click", (event) => {
        const actionNode = event.target.closest("[data-action]");
        if (!actionNode || !view.contains(actionNode)) return;
        const action = actionNode.getAttribute("data-action");

        if (action === "open-cafe") {
          openCafeDetail(actionNode.getAttribute("data-cafe-id"));
        } else if (action === "add-cafe") {
          openCafeForm();
        } else if (action === "toggle-fav") {
          event.preventDefault();
          event.stopPropagation();
          const cafeId = actionNode.getAttribute("data-cafe-id");
          const nowFav = store.toggleFavorite(cafeId);
          renderExplore();
          U.toast(nowFav ? "Saved to favourites." : "Removed from favourites.", "success");
        } else if (action === "clear-filters") {
          queryText = "";
          selectedDistrict = "All";
          favouritesOnly = false;
          if (emptyState.cafeSearch) emptyState.cafeSearch.value = "";
          renderExplore();
        }
      });
    });

    if (emptyState.cafeSearch) {
      emptyState.cafeSearch.addEventListener("input", (event) => {
        queryText = event.target.value;
        renderExplore();
      });
    }

    if (emptyState.clearSearch) {
      emptyState.clearSearch.addEventListener("click", () => {
        queryText = "";
        if (emptyState.cafeSearch) {
          emptyState.cafeSearch.value = "";
          emptyState.cafeSearch.focus();
        }
        renderExplore();
      });
    }

    if (emptyState.districtChips) {
      emptyState.districtChips.addEventListener("click", (event) => {
        const chip = event.target.closest("[data-district]");
        if (!chip) return;
        selectedDistrict = chip.getAttribute("data-district") || "All";
        renderExplore();
      });
    }

    if (emptyState.favouritesToggle) {
      emptyState.favouritesToggle.addEventListener("click", () => {
        favouritesOnly = !favouritesOnly;
        renderExplore();
      });
    }

    document.querySelectorAll("#stampModal [data-close-modal]").forEach((node) => {
      node.addEventListener("click", closeStampReveal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeStampReveal();
    });

    const modal = document.getElementById("stampModal");
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeStampReveal();
      });
    }
  }

  function init(appStore) {
    store = appStore;
    emptyState.stampGrid = document.getElementById("stampGrid");
    emptyState.stampCount = document.getElementById("stampCountPill");
    emptyState.achievementStrip = document.getElementById("achievementStrip");
    emptyState.achievementCount = document.getElementById("achievementCount");
    emptyState.recentVisits = document.getElementById("recentVisits");
    emptyState.progressRing = document.getElementById("passportRing");
    emptyState.progressPct = document.getElementById("progressPct");
    emptyState.statUnique = document.getElementById("statUnique");
    emptyState.statTotal = document.getElementById("statTotal");
    emptyState.statVisits = document.getElementById("statVisits");
    emptyState.statDistricts = document.getElementById("statDistricts");
    emptyState.statPhotos = document.getElementById("statPhotos");
    emptyState.passportName = document.getElementById("passportName");
    emptyState.passportDate = document.getElementById("passportDate");
    emptyState.cafeSearch = document.getElementById("cafeSearch");
    emptyState.clearSearch = document.getElementById("clearSearch");
    emptyState.districtChips = document.getElementById("districtChips");
    emptyState.cafeList = document.getElementById("cafeList");
    emptyState.cafeCount = document.getElementById("cafeCount");
    emptyState.favouritesToggle = document.getElementById("favouritesToggle");
    emptyState.exploreView = document.getElementById("view-explore");
    emptyState.passportView = document.getElementById("view-passport");

    bindEvents();
    render();
  }

  function render() {
    if (!store) return;
    renderPassport();
    renderExplore();
  }

  BN.Achievements = {
    list: BADGES,
    evaluate: evaluateAchievements,
    earnedIds
  };

  BN.Passport = {
    init,
    render,
    renderExplore,
    openCafeDetail,
    openCafeForm,
    badgeMarkup
  };
})();
