var form = document.querySelector("form");
var activationThreshold = document.getElementById("activationThreshold");
var showSubcommentCount = document.getElementById("showSubcommentCount");
var showDescendantCount = document.getElementById("showDescendantCount");
var feedback = document.getElementById("feedback");

var s;
if (typeof browser !== "undefined") {
  s = browser.storage;
} else {
  s = chrome.storage;
}

function saveOptions(e) {
  feedback.classList.remove("fadein");
  s.sync.set({
    activationThreshold: Number(activationThreshold.value),
    showSubcommentCount: showSubcommentCount.checked,
    showDescendantCount: showDescendantCount.checked,
  }).then(function() {
    feedback.textContent = "✓";
  }).catch(function(error) {
    console.error(error);
    feedback.textContent = "⚠";
  }).finally(function() {
    feedback.classList.add("fadein");
  });
  e.preventDefault();
}

function restoreOptions() {
  s.sync.get("activationThreshold").then(function(res) {
    if (typeof res.activationThreshold !== "number") {
      activationThreshold.value = 10;
    } else {
      activationThreshold.value = res.activationThreshold;
    }
  });
  s.sync.get("showSubcommentCount").then(function(res) {
    if (typeof res.showSubcommentCount !== "boolean") {
      showSubcommentCount.checked = true;
    } else {
      showSubcommentCount.checked = res.showSubcommentCount;
    }
    if (showSubcommentCount.checked) {
      showDescendantCount.disabled = false;
    } else {
      showDescendantCount.disabled = true;
    }
  });
  s.sync.get("showDescendantCount").then(function(res) {
    if (typeof res.showDescendantCount !== "boolean") {
      showDescendantCount.checked = false;
    } else {
      showDescendantCount.checked = res.showDescendantCount;
    }
  });
}

form.addEventListener("change", saveOptions);
form.addEventListener("submit", saveOptions);

showSubcommentCount.addEventListener("change", function() {
  if (showSubcommentCount.checked) {
    showDescendantCount.disabled = false;
  } else {
    showDescendantCount.disabled = true;
  }
});

document.addEventListener("DOMContentLoaded", restoreOptions);
