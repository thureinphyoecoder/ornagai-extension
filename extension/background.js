const DB_NAME = "ornagai_db";
const DB_VERSION = 1;
const STORE = "dict";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "word" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const db = await openDB();

  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);

  const countReq = store.count();
  countReq.onsuccess = async () => {
    if (countReq.result > 0) return; // already seeded

    const data = await fetch(chrome.runtime.getURL("data/ornagai.json")).then((r) => r.json());

    const wtx = db.transaction(STORE, "readwrite");
    const wstore = wtx.objectStore(STORE);

    for (const word in data) {
      wstore.put({ word, ...data[word] });
    }
  };
});

chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (msg.type !== "LOOKUP") return;

  openDB().then((db) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);

    const req = store.get(msg.word);
    req.onsuccess = () => send(req.result || null);
  });

  return true; // async response
});
