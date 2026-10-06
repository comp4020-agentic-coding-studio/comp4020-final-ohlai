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
  // Style: "classic" or "mono", one choice per browser for every page.
  let style;
  try { style = new URLSearchParams(location.search).get("style") ?? localStorage.getItem("style"); } catch {}
  const applyStyle = () => {
    document.documentElement.dataset.style = style === "mono" ? "mono" : "classic";
    for (const b of document.querySelectorAll(".style-toggle"))
      b.textContent = style === "mono" ? "Classic style" : "Mono style";
  };
  applyStyle();
  document.addEventListener("click", (e) => {
    if (e.target.closest(".style-toggle")) {
      style = style === "mono" ? "classic" : "mono";
      try { localStorage.setItem("style", style); } catch {}
      return applyStyle();
    }
    if (!e.target.closest(".view-toggle")) return;
    view = view === "mobile" ? "desktop" : "mobile";
    try { localStorage.setItem(key, view); } catch {}
    apply();
  });
  setDefaultView(document.body.dataset.defaultView);
})();
