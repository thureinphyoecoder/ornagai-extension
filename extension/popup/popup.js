const search = document.getElementById("search");

const resultBox = document.getElementById("result");
const emptyBox = document.getElementById("empty");

const rWord = document.getElementById("r-word");
const rType = document.getElementById("r-type");
const rEn = document.getElementById("r-en");
const rMm = document.getElementById("r-mm");
const rNote = document.getElementById("r-note");

search.addEventListener("input", () => {
  const word = search.value.trim().toLowerCase();

  if (!word) {
    showEmpty("Type a word to search");
    return;
  }

  chrome.runtime.sendMessage({ type: "LOOKUP", word }, (data) => {
    if (!data) {
      showEmpty("Not found");
      return;
    }
    renderResult(word, data);
  });
});

function renderResult(word, data) {
  emptyBox.classList.add("hidden");
  resultBox.classList.remove("hidden");

  resultBox.innerHTML = `
    <div class="result-item">
      <div class="result-word">
        <span class="word">${word}</span>
        <span class="badge ${data.type === "unknown" ? "unknown" : ""}">
          ${data.type}
        </span>
      </div>
      ${
        data.mm
          ? `<div class="meaning">${data.mm}</div>`
          : data.en
            ? `<div class="meaning">${data.en}</div>`
            : ""
      }
    </div>
  `;
}

function showEmpty(text) {
  resultBox.classList.add("hidden");
  emptyBox.classList.remove("hidden");
  emptyBox.textContent = text;
}

const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const auto = document.getElementById("autoPopup");
const ctrl = document.getElementById("ctrlOnly");

// toggle dropdown (STOP propagation)
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menu.classList.toggle("hidden");
});

// prevent menu click from closing itself
menu.addEventListener("click", (e) => {
  e.stopPropagation();
});

// close menu when clicking outside
document.addEventListener("click", () => {
  menu.classList.add("hidden");
});

// load settings
chrome.storage.local.get({ autoPopup: true, ctrlOnly: false }, (s) => {
  auto.checked = s.autoPopup;
  ctrl.checked = s.ctrlOnly;
});

// save settings
auto.onchange = () => chrome.storage.local.set({ autoPopup: auto.checked });

ctrl.onchange = () => chrome.storage.local.set({ ctrlOnly: ctrl.checked });
