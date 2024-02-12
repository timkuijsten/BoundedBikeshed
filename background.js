if (typeof browser == "undefined") {
  globalThis.browser = chrome;
}

browser.action.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, { action: "toggle" });
});
