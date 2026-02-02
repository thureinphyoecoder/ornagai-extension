# Ornagai Dictionary Extension 🇲🇲

Ornagai is a lightweight English–Myanmar dictionary browser extension for Chrome, Edge, and Firefox. It is designed to help users understand English words while reading, without breaking focus or switching tabs.

## ❓ Why Ornagai?

Most dictionary extensions interrupt the reading flow by requiring new tabs or manual searches. Ornagai focuses on how people actually read:

- **You don’t want to stop reading.**
- **You don’t want to open a new tab.**
- **You just want to understand the word, right now.**

### 🎯 Core Idea

**Select a word → See the meaning instantly → Continue reading.** No context switching. No distraction. No friction.

---

## ✨ Features

### 🔍 Inline Popup (Main Feature)

- Select any English word on a webpage and the meaning appears instantly near the selection.
- Works seamlessly on most websites.

### 🔊 Text-to-Speech (TTS)

- Listen to correct English pronunciation with a single click.
- Perfect for English learners and self-study.

### ⚡ Fast & Offline

- Uses **IndexedDB** (local database) for near-instant lookups.
- Fully offline after the first load—no network delay.

### 🌙 Clean UI for Myanmar Text

- Proper Myanmar Unicode rendering with comfortable line-height.
- Modern dark-themed, distraction-free interface.

### ⚙️ Flexible Controls

- **Auto Popup mode:** Automatically shows meaning on selection.
- **Ctrl + Select mode:** Shows popup only when holding `Ctrl` while selecting.

### 🌍 Cross-Browser Support

- **Chrome / Edge:** Manifest V3 compatible.
- **Firefox:** Manifest V2 compatibility support.

---

## 🚀 Installation

### 📥 The Easy Way (From Releases)

1. Go to the [Releases](https://github.com/thureinphyoecoder/ornagai-extension/releases) page.
2. Download the ZIP file from the latest **Tag** (e.g., `v1.0.1`):
   - `ornagai-chrome-v1.0.1.zip` (For Chrome, Edge, Brave)
   - `ornagai-firefox-v1.0.1.zip` (For Firefox)
3. Extract the downloaded ZIP file on your computer.

### 🛠 Loading into Browser

#### Chrome / Edge / Brave

1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode** (toggle in the top right).
3. Click the **Load unpacked** button.
4. Select the extracted `dist/chrome-extension` folder.

#### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file inside your extracted `dist/firefox-extension` folder.
   _(Note: Temporary add-ons are removed when you restart Firefox.)_

---

## 🧠 Design Philosophy

Ornagai is intentionally simple: **No accounts, no ads, no tracking, and no AI guessing.** It is not a "study app"; it is a **reading companion**. If you forget the extension exists while using it, then it’s working correctly.

---

## ⚠️ Limitations

- **Incomplete Vocabulary:** Some technical or rare words may be missing due to dictionary data limits.
- **Website Restrictions:** Some websites (like Chrome Web Store) block content scripts.
- **Data Quality:** Meanings depend on original Ornagai data; some translations may feel minimal.

---

## 🛠 Tech Stack

- HTML / CSS / JavaScript
- IndexedDB for local storage
- Browser Extension APIs (V2/V3)
- SpeechSynthesis API for TTS

---

## 👨‍💻 Author

Created with ❤️ by **Thu Rein Phyo**

## 📜 Credits & Acknowledgments

This extension uses dictionary data from the **Ornagai Project**.

- **Original Data Source:** [ornagai.com](http://www.ornagai.com)
- **Credits:** Special thanks to **U Nyein Kyaw** and the Ornagai community.
- **My Contribution:** Extension architecture, IndexedDB integration, inline popup system, cross-browser build system, and UI/UX design.

## 🛠 CI/CD & Automation

This project uses **GitHub Actions** to automate the build and release process. Whenever code is pushed to the main branch or a new tag is created, the system automatically:

- **Validates** the extension source code.
- **Builds** separate versions for both Chrome (Manifest V3) and Firefox (Manifest V2).
- **Packages** the extensions into production-ready ZIP files.
- **Generates** GitHub Releases with version tags (e.g., `v1.0.1`).

## 🏗 Development & Build Process

If you want to build the extension locally, you can use the following NPM scripts:

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Build for all browsers:**
    ```bash
    npm run build:all
    ```
    This will generate the `dist/chrome-extension` and `dist/firefox-extension` folders with their respective `manifest.json` files.
