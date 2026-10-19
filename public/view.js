// Mobile/desktop layout toggle. The page's data-default-view sets the start;
// a viewer's choice is remembered per default (so per role) in this browser only.
(() => {
  let key, view;
  const apply = () => {
    document.body.dataset.view = view;
    for (const b of document.querySelectorAll(".view-toggle"))
      b.textContent = view === "mobile" ? "Desktop view" : "Mobile view";
  };
  window.setDefaultView = (d) => {
    key = "view:" + d;
    try { view = localStorage.getItem(key); } catch {}
    view ||= d;
    apply();
  };
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".view-toggle")) return;
    view = view === "mobile" ? "desktop" : "mobile";
    try { localStorage.setItem(key, view); } catch {}
    apply();
  });
  setDefaultView(document.body.dataset.defaultView);
})();
