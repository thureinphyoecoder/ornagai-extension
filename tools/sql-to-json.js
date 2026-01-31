const fs = require("fs");
const path = require("path");
const rabbit = require("rabbit-node");

// ---------------- helpers ----------------

// extract clean key and optional note from brackets
function cleanWord(raw) {
  const m = raw.match(/^(.+?)(?:\s*\((.+)\))?$/);
  return {
    word: m[1].trim().toLowerCase(),
    note: m[2]?.trim() || null,
  };
}

// normalize part-of-speech / type
function normalizeType(rawType, word, note) {
  if (!rawType) return "unknown";
  const t = rawType.toLowerCase();

  // 1️⃣ Trust explicit SQL type first
  if (t.includes("adj")) return "adj";
  if (t.includes("suff")) return "suff";
  if (t.includes("idm")) return "idm";
  if (t.includes("adv")) return "adv";
  if (t === "n") return "n";
  if (t === "v") return "v";

  // 2️⃣ Heuristic fallback only if type unclear
  if (
    word.startsWith("_") ||
    word.startsWith("-") ||
    (note && note.toLowerCase().includes("compound"))
  ) {
    return "suff";
  }

  return "unknown";
}

// very simple English detector
function looksEnglish(text) {
  return /^[a-z0-9\s\-]+$/i.test(text);
}

// clean English explanation
function cleanEnglish(en) {
  return en
    .replace(/\s+/g, " ")
    .replace(/\s-\s/g, "-")
    .replace(/[\.]+$/, "")
    .trim();
}

// ---------------- paths ----------------

const SQL_PATH = path.join(__dirname, "../source/dictionary2.sql");
const OUT_PATH = path.join(__dirname, "../extension/data/ornagai.json");

// ---------------- main ----------------

const sql = fs.readFileSync(SQL_PATH, "utf8");
const rows = sql.match(/INSERT INTO.*?VALUES\s*\((.*?)\);/gi);

if (!rows) {
  console.error("❌ No INSERT statements found");
  process.exit(1);
}

const dict = {};
let unknownTypeCount = 0;

for (const row of rows) {
  const body = row.match(/\((.*)\)/)[1];

  // split CSV safely (ignore commas inside quotes)
  const parts = body
    .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
    .map((v) => v.trim().replace(/^'|'$/g, ""));

  const rawWord = parts[1];
  const rawType = parts[2];
  let rawMeaning = parts[3];

  if (!rawWord || !rawMeaning) continue;

  const { word, note } = cleanWord(rawWord);
  const type = normalizeType(rawType, word, note);

  if (type === "unknown") unknownTypeCount++;

  // Zawgyi -> Unicode
  rawMeaning = rabbit.zg2uni(rawMeaning).trim();

  let en = null;
  let mm = null;

  if (looksEnglish(rawMeaning)) {
    en = cleanEnglish(rawMeaning);
  } else {
    mm = rawMeaning;
  }

  dict[word] = {
    type,
    ...(en ? { en } : {}),
    ...(mm ? { mm } : {}),
    ...(note ? { note } : {}),
  };
}

// write output
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(dict, null, 2), "utf8");

// summary
console.log(`✔ Converted ${Object.keys(dict).length} entries`);
console.log(`⚠ Unknown type entries: ${unknownTypeCount}`);
console.log(`✔ Output -> ${OUT_PATH}`);
