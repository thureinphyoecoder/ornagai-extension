const DB_NAME = "ornagai_db";
const DB_VERSION = 1;
const STORE = "dict";

let dbInstance = null;

// -------------------------------
// Open / Get IndexedDB (singleton)
// -------------------------------
function getDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "word" });
      }
    };

    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };

    req.onerror = () => reject(req.error);
  });
}

// -------------------------------
// Ensure DB is seeded (idempotent)
// -------------------------------
async function ensureDBReady() {
  const db = await getDB();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const countReq = store.count();

    countReq.onsuccess = async () => {
      // already seeded
      if (countReq.result > 0) {
        resolve();
        return;
      }

      console.log("[Ornagai] Seeding database…");

      const data = await fetch(chrome.runtime.getURL("data/ornagai.json")).then((r) => r.json());

      const wtx = db.transaction(STORE, "readwrite");
      const wstore = wtx.objectStore(STORE);

      for (const word in data) {
        wstore.put({
          word: word.toLowerCase(),
          ...data[word],
        });
      }

      wtx.oncomplete = () => {
        console.log("[Ornagai] Seeding completed");
        resolve();
      };
    };
  });
}

// -------------------------------
// Extension install / update
// -------------------------------
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[Ornagai] Installed / Updated");

  await chrome.storage.local.set({
    autoPopup: true,
    ctrlOnly: false,
  });

  // optional warm-up
  await ensureDBReady();
});

// -------------------------------
// Message handler (LOOKUP)
// -------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "LOOKUP") return;

  (async () => {
    try {
      await ensureDBReady();

      const db = await getDB();
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(msg.word.toLowerCase());

      req.onsuccess = () => {
        sendResponse(req.result || null);
      };

      req.onerror = () => {
        sendResponse(null);
      };
    } catch {
      sendResponse(null);
    }
  })();

  // ⭐ MUST for MV3 async response
  return true;
});
