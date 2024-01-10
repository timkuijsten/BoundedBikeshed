if (typeof browser !== "undefined") {
  // firefox
  browser.action.onClicked.addListener((tab) => {
    browser.tabs.sendMessage(tab.id, { action: "toggle" });
  });
} else if (typeof chrome !== "undefined") {
  // chrome
  // Wrap in an onInstalled callback to avoid unnecessary work
  // every time the background script is run
  chrome.runtime.onInstalled.addListener(() => {
    chrome.action.onClicked.addListener((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: "toggle" });
    });
  });
}
