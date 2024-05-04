"use strict";

const engineUrl = document.getElementById("engine-url-input");
const engineName = document.getElementById("name-input");
const engineDescription = document.getElementById("description-input");

const autofillButton = document.getElementById("autofill-button");
const confirmButton = document.getElementById("confirm-button");

const dataNoticeCheckbox = document.getElementById("data-notice-checkbox");
const dataNoticeText = document.getElementById("data-notice-text");

const XMLTemplate = `<?xml version="1.0" encoding="utf-8"?>
    <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"
                           xmlns:moz="http://www.mozilla.org/2006/browser/search/">
        <ShortName></ShortName>
        <Description></Description>
        <InputEncoding>UTF-8</InputEncoding>
        <Image height="16" width="16"></Image>
        <Url type="text/html" method="get" template=""></Url>
        <moz:SearchForm></moz:SearchForm>
    </OpenSearchDescription>`;

const generateXMLstring = (name, url, description, form) => {
  let domParser = new DOMParser();
  let parsed = domParser.parseFromString(XMLTemplate, "application/xml");

  parsed.getElementsByTagName("ShortName")[0].textContent = name;
  parsed.getElementsByTagName("Url")[0].setAttribute("template", url);
  parsed.getElementsByTagName("Description")[0].textContent = description;
  parsed.getElementsByTagName("moz:SearchForm")[0].textContent = form;

  let XMLString = new XMLSerializer().serializeToString(parsed.documentElement);
  return XMLString;
};

const popoverMessage = async (msg, duration = 1.5) => {
  const popover = document.getElementById("popover");
  popover.classList = [];
  popover.querySelector("p").innerHTML = msg;
  await new Promise((resolve) => setTimeout(resolve, duration * 1000));
  popover.classList = ["hidden"];
};

const handleConfirmButton = async (event) => {
  let alerts = new Array();
  if (!engineName.value) {
    await popoverMessage("You need to provide a name!");
    return;
  }

  let urlForm;
  try {
    let validated = new URL(engineUrl.value);
    urlForm = validated.origin + validated.pathname;
  } catch (error) {
    await popoverMessage("You need to provide a valid URL!");
    return;
  }

  let xml = generateXMLstring(
    engineName.value,
    engineUrl.value,
    engineDescription.value,
    urlForm
  );

  try {
    let resp = await fetch(
      // Export data to https://paste.mozilla.org
      "https://paste.mozilla.org/api/",
      {
        method: "POST",
        body: new URLSearchParams({
          content: xml,
          format: "json",
          expires: "3600", // Ensure that data is gone, even if it isn't used
          lexer: "xml",
        }),
      }
    );

    let json = await resp.json();

    let rel = "search";
    let type = "application/opensearchdescription+xml";
    let title = engineName.value;
    let href = json.url + "/raw";

    let tabs = await browser.tabs.query({ active: true, currentWindow: true });
    let activeTabId = tabs[0].id;

    await browser.tabs.executeScript(activeTabId, {
      code: `injectEntryPoint('${rel}', '${type}', '${title}', '${href}');`,
    }); // Inject the OpenSearch entrypoint to the active tab's DOM

    engineName.value = "";
    engineUrl.value = "";
    engineDescription.value = "";
    await popoverMessage(
      "Search engine successfully created! You can now add it from the search bar."
    );
  } catch (error) {
    await popoverMessage(`Something went wrong! Technical details:\n${error}`);
    return;
  }
};

const handleAutofillButton = async (event) => {
  // Extract a destination and autofill it
  let ret = await browser.tabs.executeScript({ code: "extractDest();" });
  engineUrl.value = ret;
};

const handleToggleDataNotice = (event) => {
  // Show/hide the privacy stuff
  if (dataNoticeCheckbox.checked) {
    dataNoticeText.classList = [];
  } else {
    dataNoticeText.classList = ["hidden"];
  }
};

autofillButton.addEventListener("click", handleAutofillButton);
confirmButton.addEventListener("click", handleConfirmButton);
dataNoticeCheckbox.addEventListener("change", handleToggleDataNotice);

(async () => {
  let elementId = await browser.runtime.sendMessage("getElementId");
  if (elementId) {
    // Don't autofill if we aren't being opened from a context menu
    let ret = await browser.tabs.executeScript({
      code: "extractDest(" + elementId + ");",
    });
    engineUrl.value = ret;
  }
})();
