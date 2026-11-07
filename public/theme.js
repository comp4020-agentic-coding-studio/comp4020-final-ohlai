// Light, dark or follow the phone, picked in Settings and kept in this browser.
// Loaded in <head> so the page never flashes the wrong colours.
try {
  const t = localStorage.getItem("theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch {}
