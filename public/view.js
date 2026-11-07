// Sets the page layout from data-default-view. No toggle: the client is on a
// phone, the PT on a desktop (a shared page can switch with setDefaultView).
window.setDefaultView = (d) => { document.body.dataset.view = d; };
setDefaultView(document.body.dataset.defaultView);
