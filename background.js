"use strict";

browser.menus.create({
    id: "engine-from-context",
    title: "Add search engine from input",
    contexts: ["editable"],
    documentUrlPatterns: ["http://*/*", "https://*/*"]
});

let elementId = null;

browser.menus.onClicked.addListener((info, tab) => {
    elementId = info.targetElementId;
    browser.pageAction.openPopup();
});

browser.runtime.onMessage.addListener(async (msg) => {
    if (msg === "getElementId") {
        try {
            return elementId;
        } finally {  // Reset to null after returning the value
            elementId = null;
        }
    }
})