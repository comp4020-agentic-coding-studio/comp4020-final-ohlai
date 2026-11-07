// Light, dark or follow the phone, picked in Settings and kept in this browser.
// Loaded in <head> so the page never flashes the wrong colours.
try {
  const t = localStorage.getItem("theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch {}

// Switch theme with a short colour fade instead of a jump. The "theming" class
// turns on colour transitions everywhere, only while the switch happens.
window.setTheme = (t) => {
  const root = document.documentElement;
  root.classList.add("theming");
  if (t === "system") delete root.dataset.theme;
  else root.dataset.theme = t;
  try { t === "system" ? localStorage.removeItem("theme") : localStorage.setItem("theme", t); } catch {}
  clearTimeout(window.setTheme.timer);
  window.setTheme.timer = setTimeout(() => root.classList.remove("theming"), 400);
};
