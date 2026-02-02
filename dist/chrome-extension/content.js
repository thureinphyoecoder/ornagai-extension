let popupEl = null;
let lastWord = null;
let settings = {
  autoPopup: true,
  ctrlOnly: false,
};

const TYPE_MAP = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  interj: "interjection",
};

// ⭐ Browser API compatibility
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// ---------------- CSS inject ----------------
(function loadInlineCSS() {
  const id = "ornagai-inline-style";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = browserAPI.runtime.getURL("styles/inline-popup.css");
  document.head.appendChild(link);
})();

// ---------------- settings sync ----------------
browserAPI.storage.local
  .get(settings)
  .then((s) => {
    settings = { ...settings, ...s };
  })
  .catch(() => {
    // Fallback for Chrome callback style
    browserAPI.storage.local.get(settings, (s) => {
      settings = { ...settings, ...s };
    });
  });

browserAPI.storage.onChanged.addListener((c) => {
  if (c.autoPopup) settings.autoPopup = c.autoPopup.newValue;
  if (c.ctrlOnly) settings.ctrlOnly = c.ctrlOnly.newValue;
});

// ---------------- safe message ----------------
function safeSend(msg, cb) {
  try {
    // Firefox uses Promises, Chrome uses callbacks
    const sending = browserAPI.runtime.sendMessage(msg);

    if (sending && typeof sending.then === "function") {
      // Firefox Promise style
      sending.then(cb).catch(() => {});
    } else {
      // Chrome callback style
      browserAPI.runtime.sendMessage(msg, (res) => {
        if (browserAPI.runtime.lastError) return;
        cb?.(res);
      });
    }
  } catch (_) {}
}

// ---------------- TTS ----------------
function speakWord(word) {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

// ---------------- selection handler ----------------
document.addEventListener("mouseup", (e) => {
  const sel = window.getSelection();
  const word = sel.toString().trim().toLowerCase();

  if (!word || word.includes(" ")) return;
  if (word === lastWord) return;

  // 🔑 trigger rules
  if (settings.ctrlOnly && !e.ctrlKey) return;
  if (!settings.ctrlOnly && !settings.autoPopup) return;

  lastWord = word;
  safeSend({ type: "LOOKUP", word }, (data) => {
    if (!data) return destroyPopup();
    showPopup(word, data, sel);
  });
});

// ---------------- popup render ----------------
function showPopup(word, data, sel) {
  destroyPopup();

  popupEl = document.createElement("div");
  popupEl.id = "ornagai-popup";

  const type = TYPE_MAP[data.type] || data.type || "";

  popupEl.innerHTML = `
    <div class="ornagai-header">
      <div class="word-row">
        <b>${word}</b>
        ${type ? `<span class="badge">${type}</span>` : ""}
      </div>
      <div class="popup-actions">
        <button class="audio-btn" title="Pronounce">🔊</button>
        <span class="ornagai-close">×</span>
      </div>
    </div>
    <div class="ornagai-body">
      <div class="meaning">${data.mm || data.en}</div>
      ${data.note ? `<div class="note">${data.note}</div>` : ""}
    </div>
  `;

  document.body.appendChild(popupEl);

  // events
  popupEl.querySelector(".ornagai-close").onclick = destroyPopup;
  const audioBtn = popupEl.querySelector(".audio-btn");
  if (audioBtn) audioBtn.onclick = () => speakWord(word);

  // position (viewport safe)
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  const maxLeft = window.innerWidth - popupEl.offsetWidth - 12;
  popupEl.style.top = `${window.scrollY + rect.bottom + 8}px`;
  popupEl.style.left = `${Math.min(rect.left, maxLeft)}px`;
}

// ---------------- close handlers ----------------
document.addEventListener("mousedown", (e) => {
  if (popupEl && !popupEl.contains(e.target)) destroyPopup();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") destroyPopup();
});

function destroyPopup() {
  popupEl?.remove();
  popupEl = null;
  lastWord = null;
}
