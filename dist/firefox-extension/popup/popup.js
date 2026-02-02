const search = document.getElementById("search");
const resultBox = document.getElementById("result");
const emptyBox = document.getElementById("empty");

const DEFAULT_SETTINGS = {
  autoPopup: true,
  ctrlOnly: false,
};

const typeMapping = {
  n: "noun",
  v: "verb",
  adj: "adjective",
  adv: "adverb",
  interj: "interjection",
  suff: "suffix",
  prep: "preposition",
  pron: "pronoun",
};

// ---------- helpers ----------
function safeSend(msg, cb) {
  try {
    chrome.runtime.sendMessage(msg, (res) => {
      if (chrome.runtime.lastError) return;
      cb?.(res);
    });
  } catch (_) {}
}

function speak(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ---------- search ----------
search.addEventListener("input", () => {
  const word = search.value.trim().toLowerCase();

  if (!word) {
    showEmpty("Type a word to search");
    return;
  }

  safeSend({ type: "LOOKUP", word }, (data) => {
    if (!data) {
      showEmpty("Not found");
      return;
    }
    renderResult(word, data);
  });
});

// ---------- render ----------
function renderResult(word, data) {
  emptyBox.classList.add("hidden");
  resultBox.classList.remove("hidden");

  const fullType = typeMapping[data.type] || data.type;

  resultBox.innerHTML = `
    <div class="result-item">
      <div class="ornagai-header">
        <div class="word-group">
          <span class="word-text">${word}</span>
          <button class="audio-btn" data-tts="${word}">🔊</button>
        </div>
        <span class="badge">${fullType}</span>
      </div>

      <div class="meaning">${data.mm || data.en}</div>

      ${renderExamples(data.example)}
      ${data.note ? `<div class="note">${data.note}</div>` : ""}
    </div>
  `;

  const ttsBtn = resultBox.querySelector(".audio-btn");
  if (ttsBtn) ttsBtn.onclick = () => speak(word);
}

function renderExamples(examples = []) {
  if (!examples.length) return "";
  return `
    <div class="example-box">
      <div class="example-label">EXAMPLES</div>
      ${examples.map((ex) => `<div class="example-item">• ${ex}</div>`).join("")}
    </div>
  `;
}

function showEmpty(text) {
  resultBox.classList.add("hidden");
  emptyBox.classList.remove("hidden");
  emptyBox.textContent = text;
}

// ---------- settings ----------
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const auto = document.getElementById("autoPopup");
const ctrl = document.getElementById("ctrlOnly");

menuBtn.onclick = (e) => {
  e.stopPropagation();
  menu.classList.toggle("hidden");
};

menu.onclick = (e) => e.stopPropagation();

document.addEventListener("click", () => {
  menu.classList.add("hidden");
});

// initial load
chrome.storage.local.get(DEFAULT_SETTINGS, (s) => {
  auto.checked = s.autoPopup;
  ctrl.checked = s.ctrlOnly;
});

auto.addEventListener("change", () => {
  if (auto.checked) {
    ctrl.checked = false;
    chrome.storage.local.set({
      autoPopup: true,
      ctrlOnly: false,
    });
  } else {
    // prevent both off
    auto.checked = true;
  }
});

// ctrl-only checked
ctrl.addEventListener("change", () => {
  if (ctrl.checked) {
    auto.checked = false;
    chrome.storage.local.set({
      autoPopup: false,
      ctrlOnly: true,
    });
  } else {
    ctrl.checked = true;
  }
});
