// ⭐ Browser API compatibility
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

const DB_NAME = "ornagai_db";
const DB_VERSION = 1;
const STORE = "dict";
let db = null;
let seeding = false;

// --------------------
// Open DB
// --------------------
function openDB(cb) {
  if (db) return cb(db);

  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onupgradeneeded = (e) => {
    const d = e.target.result;
    if (!d.objectStoreNames.contains(STORE)) {
      d.createObjectStore(STORE, { keyPath: "word" });
    }
  };

  req.onsuccess = () => {
    db = req.result;
    cb(db);
  };

  req.onerror = () => cb(null);
}

// --------------------
// Ensure seeded
// --------------------
function ensureSeeded(cb) {
  if (seeding) return cb();

  openDB((db) => {
    if (!db) return cb();

    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const countReq = store.count();

    countReq.onsuccess = () => {
      if (countReq.result > 0) return cb();

      seeding = true;
      console.log("[Ornagai] Seeding…");

      fetch(browserAPI.runtime.getURL("data/ornagai.json"))
        .then((r) => r.json())
        .then((data) => {
          const wtx = db.transaction(STORE, "readwrite");
          const wstore = wtx.objectStore(STORE);

          for (const word in data) {
            wstore.put({
              word: word.toLowerCase(),
              ...data[word],
            });
          }

          wtx.oncomplete = () => {
            console.log("[Ornagai] Seed done");
            seeding = false;
            cb();
          };

          wtx.onerror = () => {
            console.error("[Ornagai] Seed failed");
            seeding = false;
            cb();
          };
        })
        .catch((err) => {
          console.error("[Ornagai] Fetch failed:", err);
          seeding = false;
          cb();
        });
    };

    countReq.onerror = () => cb();
  });
}

// --------------------
// Message listener
// --------------------
browserAPI.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "LOOKUP") return false;

  ensureSeeded(() => {
    openDB((db) => {
      if (!db) {
        sendResponse(null);
        return;
      }

      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(msg.word.toLowerCase());

      req.onsuccess = () => sendResponse(req.result || null);
      req.onerror = () => sendResponse(null);
    });
  });

  return true; // ⭐ async response - အရေးကြီးတယ်!
});

// --------------------
// Install/Update listener (Optional but good practice)
// --------------------
browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[Ornagai] Extension installed");
    // Pre-seed on install
    ensureSeeded(() => {
      console.log("[Ornagai] Initial seed complete");
    });
  } else if (details.reason === "update") {
    console.log("[Ornagai] Extension updated to", browserAPI.runtime.getManifest().version);
  }
});
