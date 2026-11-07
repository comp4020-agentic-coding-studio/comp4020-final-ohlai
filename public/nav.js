// The client's bottom nav: one long pill with Dashboard and Settings.
// shortcut: own icons and styling; swap for the Macros nav once its source is pulled from atlas.
import { el } from "/ui.js";

const LINKS = [
  ["/me", "Dashboard", "M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"],
  ["/settings", "Settings", "M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7 7 0 0 0-1.7-1L15 3h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7 7 0 0 0 1.7 1L11 21h4l.4-2.6a7 7 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"],
];

const icon = (d) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = `<path d="${d}" fill="currentColor"/>`;
  return s;
};

export function mountNav() {
  document.body.append(el("nav", { className: "pillnav", ariaLabel: "Main" },
    ...LINKS.map(([href, text, d]) => el("a", { href, ariaCurrent: location.pathname === href ? "page" : null }, icon(d), el("span", { textContent: text })))));
}
