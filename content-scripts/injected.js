"use strict";

const extractDest = (elementId = null) => {
    try {
        let element;
        if (elementId) {
            element = browser.menus.getTargetElement(elementId).form;
        } else {
            element = document.querySelector("form");
        }
        let destUrl = new URL(element.action);
        let destination = new URL(destUrl.origin + destUrl.pathname);

        let data = {
            rel: null,
            type: "application/opensearchdescription+xml",
            title: null,
            href: null
        }
        data.href = destination.origin
        if (element[0].name) {
            destination.search = element[0].name + "={searchTerms}";
            return destination.toString();
        } else {
            return destination.toString() + "/{searchTerms}";
        }
    } catch { }
}

const injectEntryPoint = (rel, type, title, href) => {
    let entryPoint = document.createElement("link");
    entryPoint.rel = rel;
    entryPoint.type = type;
    entryPoint.title = title;
    entryPoint.href = href;
    document.head.append(entryPoint);
    // Inject an entrypoint for OpenSearch into the DOM of the active page
}
