/* ============================================================
   Bah_ngupi — cafe directory importer
   ------------------------------------------------------------
   Regenerates js/cafes-directory.js from the public Brunei Coffee
   Places directory (https://bruneicoffeeplaces.com).

   That site is a static React app reading a Supabase table through
   its public anon key. The key below is the same one shipped in the
   site's own browser bundle; it grants read-only access to public
   rows, nothing more. Nothing secret is stored here.

   Run with:  node tools/import-cafes.mjs
   No dependencies, Node 18+ (uses global fetch).

   What it does:
     1. Pulls cafe_companies + cafe_branches + cafe_socials.
     2. Drops branches marked closed, and branches whose maintainer
        note says the place closed or is on hiatus.
     3. Skips brands already hand-curated in js/cafes.js, so the rich
        copy there always wins.
     4. Maps every remaining branch onto this app's cafe shape and
        writes the result as window.BN.CAFE_DIRECTORY.

   NEVER run this at runtime — the app must stay offline-first.
   ============================================================ */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SUPABASE_URL = "https://ksmhppjudlfieybcokhv.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbWhwcGp1ZGxmaWV5YmNva2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODk1MTksImV4cCI6MjA4NTk2NTUxOX0.r88zesNNXH-ntuv-DEuBoUr3QVwy1u1u-hzJEQLuRjE";

const OUT_FILE = join(ROOT, "js", "cafes-directory.js");
const SEED_FILE = join(ROOT, "js", "cafes.js");

const DISTRICTS = ["Brunei-Muara", "Tutong", "Belait", "Temburong"];

const CATEGORY_BY_STORE_TYPE = {
  "store-based": "Cafe",
  "pick-up": "Pick-up",
  "pop-up": "Pop-up",
  "home-based": "Home-based"
};

/* Flag → tag. Only `true` becomes a tag; `false` and null mean
   "not verified", never "no". */
const TAGS_BY_FLAG = [
  ["is_specialty_coffee", "Specialty coffee"],
  ["is_specialty_matcha", "Matcha"],
  ["has_full_meals", "Full meals"],
  ["is_study_spot", "Study spot"],
  ["opens_late", "Open late"],
  ["closes_early", "Early bird"],
  ["has_cats", "Cats"],
  ["is_dine_in", "Dine-in"],
  ["is_drinks_only_or_light_bites", "Drinks & light bites"],
  ["is_newly_added", "Newly added"]
];

/* A branch the maintainer has marked closed in prose but not in the
   is_closed column. */
const CLOSURE_NOTE = /\b(closed|closing|shut|hiatus|ceased|no longer)\b/i;

/* Notes that are really street addresses, not commentary. */
const ADDRESS_NOTE =
  /\b(unit|blok|block|floor|spg|simpang|jln|jalan|lot|no\.?\s*\d|bangunan|kompleks|shoplot)\b/i;

/* Notes written for the directory's own maintainers ("excluded from
   the reel", "Mr BCP say keep") — not fit to show in the app. */
const INTERNAL_NOTE = /\b(reel|excluded|Mr BCP|keep|Remove|private account|Can't find IG)/i;

const norm = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/* Words that carry no brand identity. "Monochrome Coffee Co." and
   "Monochrome Coffee" are the same shop; their cores both read
   "monochrome". */
const GENERIC_WORDS = new Set([
  "the", "and", "co", "cafe", "coffee", "coffeeco", "roasters", "roaster",
  "roastery", "brunei", "house", "micro", "bakery", "company"
]);

const core = (value) => {
  const words = String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((word) => !GENERIC_WORDS.has(word));
  return words.join("") || norm(value);
};

const slug = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "cafe";

/* Same PALETTE + same hash as js/utils.js paletteFor(), so a generated
   cafe gets exactly the colours the app would have picked for it. */
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

function paletteFor(seed) {
  const text = String(seed || "bah-ngupi");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

const clean = (value, max) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max || 240);

async function table(name, query) {
  const url = SUPABASE_URL + "/rest/v1/" + name + (query ? "?" + query : "");
  const response = await fetch(url, {
    headers: { apikey: ANON_KEY, authorization: "Bearer " + ANON_KEY }
  });
  if (!response.ok) {
    throw new Error(`${name}: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
  }
  return response.json();
}

/* Hand-curated entries in js/cafes.js win over directory rows — but only
   for the neighbourhood they describe. A chain's other branches still
   come from the directory, so ZUS keeps all eight. */
function curatedNames() {
  const source = readFileSync(SEED_FILE, "utf8");
  const found = [];
  const pattern = /name:\s*"([^"]+)",\s*\n\s*area:\s*"([^"]+)"/g;
  for (const match of source.matchAll(pattern)) {
    found.push({
      name: match[1],
      area: match[2],
      norm: norm(match[1]),
      core: core(match[1]),
      areaKey: norm(match[2])
    });
  }
  return found;
}

/* Two names are the same shop when their cores match exactly. Names the
   two sources genuinely spell differently go here by hand — a guess
   wide enough to catch the rest also swallows real cafes ("Salt
   Coffee" is not "Salt:ed", "Beanery & Co." is not "Coffee Bean"). */
const CURATED_ALIASES = new Map([
  ["thecoffeebeantealeaf", "coffeebean"], // the directory drops the "& Tea Leaf"
  ["theslicebyia", "theslice"]
]);

function sameShop(name, curatedEntries) {
  const n = norm(name);
  const c = core(name);
  for (const entry of curatedEntries) {
    if (entry.norm === n) return entry;
    if (entry.core === c) return entry;
    if (CURATED_ALIASES.get(entry.norm) === n) return entry;
  }
  return null;
}

function buildDistrictLookup(branches) {
  const votes = new Map();
  for (const branch of branches) {
    if (!branch.district || !branch.location) continue;
    const key = norm(branch.location);
    if (!votes.has(key)) votes.set(key, new Map());
    const tally = votes.get(key);
    tally.set(branch.district, (tally.get(branch.district) || 0) + 1);
  }
  const lookup = new Map();
  for (const [key, tally] of votes) {
    lookup.set(key, [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  }
  return lookup;
}

async function main() {
  const [companies, branches, socials] = await Promise.all([
    table("cafe_companies", "select=*"),
    table("cafe_branches", "select=*"),
    table("cafe_socials", "select=*")
  ]);

  const byCompany = new Map();
  for (const branch of branches) {
    if (!byCompany.has(branch.company_id)) byCompany.set(branch.company_id, []);
    byCompany.get(branch.company_id).push(branch);
  }

  const instagramByCompany = new Map();
  for (const social of socials) {
    if (social.platform === "instagram" && social.username) {
      instagramByCompany.set(social.company_id, clean(social.username, 40));
    }
  }

  const districtLookup = buildDistrictLookup(branches);
  const curated = curatedNames();
  const matchedCurated = new Set();

  const records = [];
  const usedIds = new Set();
  const placed = new Map();
  const stats = {
    companies: companies.length,
    branches: branches.length,
    closedBranches: 0,
    closureNotes: 0,
    curatedSkipped: [],
    curatedOwned: 0,
    unknownBrand: 0,
    noLocation: 0,
    districtInferred: 0,
    districtUnknown: 0,
    duplicates: 0,
    brandDuplicates: 0
  };

  const ordered = [...companies].sort(
    (a, b) => String(a.brand_name || "").localeCompare(String(b.brand_name || "")) ||
      String(a.created_at).localeCompare(String(b.created_at))
  );

  for (const company of ordered) {
    const name = clean(company.brand_name, 60);
    /* The directory has one placeholder brand literally named "Unknown". */
    if (!name || norm(name) === "unknown") {
      stats.unknownBrand += 1;
      continue;
    }
    const clash = sameShop(name, curated);

    const companyBranches = (byCompany.get(company.id) || []).filter((branch) => {
      if (branch.is_closed) {
        stats.closedBranches += 1;
        return false;
      }
      if (branch.notes && CLOSURE_NOTE.test(branch.notes)) {
        stats.closureNotes += 1;
        return false;
      }
      return true;
    });

    const seenPlaces = new Set();

    /* Which branch does the hand-curated entry already cover? Prefer the
       one in the same neighbourhood; otherwise the only branch, or the
       first by name so the result is at least stable between runs. The
       sources word areas differently ("Rimba" vs "Bandar Seri Begawan"),
       so an exact match often cannot be made. */
    let ownedPlace = null;
    if (clash) {
      const places = companyBranches
        .map((branch) => ({ place: norm(branch.location), location: branch.location }))
        .filter((entry) => entry.place);
      const exact = places.find((entry) => entry.place === clash.areaKey);
      const chosen = exact || places.sort((a, b) => String(a.location).localeCompare(String(b.location)))[0];
      if (chosen) ownedPlace = chosen.place;
    }

    for (const branch of companyBranches) {
      const location = clean(branch.location, 40);
      if (!location) {
        stats.noLocation += 1;
        continue;
      }
      /* Two branches of one brand at the same location are one cafe. */
      const place = norm(location);
      if (seenPlaces.has(place)) {
        stats.duplicates += 1;
        continue;
      }
      seenPlaces.add(place);

      /* This branch is the one the hand-curated entry already describes. */
      if (ownedPlace && place === ownedPlace) {
        stats.curatedOwned += 1;
        matchedCurated.add(clash.name);
        stats.curatedSkipped.push(name + " @ " + location + "  ←→  " + clash.name + " (" + clash.area + ")");
        continue;
      }

      let district = DISTRICTS.includes(branch.district) ? branch.district : "";
      if (!district) {
        const inferred = districtLookup.get(norm(location));
        if (inferred) {
          district = inferred;
          stats.districtInferred += 1;
        } else {
          stats.districtUnknown += 1;
        }
      }

      const storeType = CATEGORY_BY_STORE_TYPE[branch.store_type] || "Cafe";
      const tags = [];
      if (company.is_franchise) tags.push("Franchise");
      for (const [flag, label] of TAGS_BY_FLAG) {
        if (branch[flag] === true && !tags.includes(label)) tags.push(label);
      }

      const rawNote = clean(branch.notes, 160);
      const noteIsAddress = rawNote && ADDRESS_NOTE.test(rawNote) && rawNote.length > 12;
      const noteIsUseful = rawNote && !noteIsAddress && rawNote.length > 8 && !INTERNAL_NOTE.test(rawNote);

      const address = noteIsAddress
        ? rawNote
        : [location, district || "Brunei"].join(", ");

      const descriptionParts = [storeType === "Cafe" ? "Cafe" : storeType + " cafe"];
      descriptionParts.push("in " + [location, district].filter(Boolean).join(", ") + ".");
      const headline = tags.filter((tag) => tag !== "Newly added" && tag !== "Franchise");
      const description =
        descriptionParts.join(" ").replace("Cafe in", "Cafe in") +
        (headline.length ? " " + headline.join(", ") + "." : "");

      let id = slug(name) + "-" + slug(location);
      let suffix = 2;
      while (usedIds.has(id)) id = slug(name) + "-" + slug(location) + "-" + suffix++;
      usedIds.add(id);

      const colors = paletteFor(name + location);
      const record = {
        id,
        name,
        area: location,
        district: district || "Brunei-Muara",
        category: storeType,
        tags: tags.slice(0, 4),
        description: clean(description, 240),
        address: clean(address, 100),
        hours: "",
        price: "$$",
        menu: [],
        color: colors[0],
        color2: colors[1],
        instagram: instagramByCompany.get(company.id) || "",
        directoryNote: noteIsUseful ? rawNote : ""
      };

      /* The directory occasionally holds one shop twice — same brand, same
         neighbourhood, same Instagram, entered as two companies. Keep the
         first row and let the later one donate anything more specific. */
      const placeKey = norm(name) + "@" + place;
      const previous = placed.get(placeKey);
      if (previous) {
        stats.brandDuplicates += 1;
        if (record.address.length > previous.address.length) previous.address = record.address;
        if (!previous.directoryNote && record.directoryNote) previous.directoryNote = record.directoryNote;
        if (!previous.instagram && record.instagram) previous.instagram = record.instagram;
        for (const tag of record.tags) {
          if (!previous.tags.includes(tag)) previous.tags.push(tag);
        }
        usedIds.delete(id);
        continue;
      }
      placed.set(placeKey, record);
      records.push(record);
    }
  }

  records.sort(
    (a, b) =>
      DISTRICTS.indexOf(a.district) - DISTRICTS.indexOf(b.district) ||
      a.name.localeCompare(b.name) ||
      a.area.localeCompare(b.area)
  );

  const body = records.map((record) => "    " + JSON.stringify(record) + ",").join("\n");

  const output = `/* ============================================================
   Bah_ngupi — generated cafe directory
   ------------------------------------------------------------
   DO NOT EDIT BY HAND. Regenerate with:  node tools/import-cafes.mjs
   Source: https://bruneicoffeeplaces.com (community-maintained
   Brunei coffee directory). ${records.length} entries, generated
   ${new Date().toISOString().slice(0, 10)}.

   These are directory rows, not hand-written copy: hours, price and
   menu are intentionally blank rather than invented. Cafes already
   curated in js/cafes.js are excluded here so the richer copy wins.
   ============================================================ */
(function () {
  "use strict";

  const BN = (window.BN = window.BN || {});

  BN.CAFE_DIRECTORY = [
${body}
  ];
})();
`;

  writeFileSync(OUT_FILE, output, "utf8");

  const districts = records.reduce((acc, record) => {
    acc[record.district] = (acc[record.district] || 0) + 1;
    return acc;
  }, {});

  console.log("Wrote " + OUT_FILE);
  console.log("  entries            :", records.length);
  console.log("  by district        :", JSON.stringify(districts));
  console.log("  skipped (curated)  :", stats.curatedSkipped.length);
  for (const line of stats.curatedSkipped) console.log("      ", line);
  console.log("  dropped is_closed  :", stats.closedBranches);
  console.log("  dropped by note    :", stats.closureNotes);
  console.log("  unknown brand      :", stats.unknownBrand);
  console.log("  no location        :", stats.noLocation);
  console.log("  duplicate place    :", stats.duplicates);
  console.log("  same shop, twice   :", stats.brandDuplicates);
  console.log("  district inferred  :", stats.districtInferred);
  console.log("  district unknown   :", stats.districtUnknown);
  console.log("  with instagram     :", records.filter((record) => record.instagram).length);
  console.log("  bytes              :", Buffer.byteLength(output, "utf8"));

  /* Curated shops the directory does not list at all. Not proof they
     closed — the directory may simply use another name — but worth a
     human look, so they are printed rather than silently trusted. */
  const unmatched = curated.filter((entry) => !matchedCurated.has(entry.name));
  console.log("\n  curated entries the directory does not confirm (" + unmatched.length + "):");
  for (const entry of unmatched) console.log("      ", entry.name);
}

main().catch((error) => {
  console.error("import failed:", error.message);
  process.exit(1);
});
