// ==============================
// Ornagai Inline Popup – content.js
// ==============================

let popupEl = null;
let lastWord = null;

let settings = {
  autoPopup: true,
  ctrlOnly: false,
};

// ------------------------------
// Load inline popup CSS (scoped)
// ------------------------------
(function loadInlineCSS() {
  const id = "ornagai-popup-style";
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("styles/inline-popup.css");
  document.head.appendChild(link);
})();

// ------------------------------
// Settings sync
// ------------------------------
chrome.storage.local.get(settings, (s) => {
  settings = { ...settings, ...s };
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.autoPopup) settings.autoPopup = changes.autoPopup.newValue;
  if (changes.ctrlOnly) settings.ctrlOnly = changes.ctrlOnly.newValue;
});

// ------------------------------
// Safe sendMessage wrapper
// (prevents context invalidated crash)
// ------------------------------
function safeSendMessage(message, callback) {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        // extension reloaded / context dead
        return;
      }
      callback?.(response);
    });
  } catch (e) {
    // context invalidated (dev reload)
    console.warn("Ornagai: extension context invalidated");
  }
}

// ------------------------------
// Selection handler
// ------------------------------
document.addEventListener("mouseup", (e) => {
  const selection = window.getSelection();
  if (!selection || !selection.toString) return;

  const word = selection.toString().trim().toLowerCase();

  if (!word) return;
  if (word.includes(" ")) return;
  if (word === lastWord) return;

  if (!settings.autoPopup) return;
  if (settings.ctrlOnly && !e.ctrlKey) return;

  lastWord = word;

  safeSendMessage({ type: "LOOKUP", word }, (data) => {
    if (!data) {
      destroyPopup();
      return;
    }
    showPopup(word, data);
  });
});

// ------------------------------
// Popup render
// ------------------------------
function showPopup(word, data) {
  if (!popupEl) {
    popupEl = document.createElement("div");
    popupEl.id = "ornagai-popup";
    document.body.appendChild(popupEl);
  }

  popupEl.innerHTML = `
    <div class="ornagai-header">
      <b>${word}</b>
      <span class="ornagai-close">×</span>
    </div>
    <div class="ornagai-body">
      ${data.mm ? `<div class="meaning">${data.mm}</div>` : ""}
      ${data.en ? `<div class="meaning">${data.en}</div>` : ""}
      ${data.note ? `<div class="note">${data.note}</div>` : ""}
    </div>
  `;

  popupEl.querySelector(".ornagai-close").onclick = destroyPopup;

  positionPopup();
}

// ------------------------------
// Position popup near selection
// ------------------------------
function positionPopup() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const rect = sel.getRangeAt(0).getBoundingClientRect();

  popupEl.style.top = `${rect.bottom + window.scrollY + 6}px`;
  popupEl.style.left = `${rect.left + window.scrollX}px`;
}

// ------------------------------
// Close logic
// ------------------------------
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") destroyPopup();
});

document.addEventListener("mousedown", (e) => {
  if (popupEl && !popupEl.contains(e.target)) {
    destroyPopup();
  }
});

function destroyPopup() {
  popupEl?.remove();
  popupEl = null;
  lastWord = null;
}
