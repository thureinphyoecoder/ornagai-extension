document.addEventListener("mouseup", () => {
  const word = window.getSelection().toString().trim().toLowerCase();
  if (!word || word.includes(" ")) return;

  chrome.runtime.sendMessage({ type: "LOOKUP", word }, (result) => {
    if (result) showPopup(result);
  });
});
