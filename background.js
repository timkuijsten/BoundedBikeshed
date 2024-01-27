if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

// Wrap in an onInstalled callback to avoid unnecessary work
// every time the background script is run
browser.runtime.onInstalled.addListener(() => {
  browser.action.onClicked.addListener((tab) => {
    browser.tabs.sendMessage(tab.id, { action: "toggle" });
  });
});
