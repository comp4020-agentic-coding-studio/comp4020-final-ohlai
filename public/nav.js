// The client's bottom nav: one pill with icon-only links (Dashboard, Settings).
// A highlight slides to the tapped icon, then the page changes.
// shortcut: own icons and styling; swap for the Macros nav once its source is pulled from atlas.
import { el } from "/ui.js";
import "/call.js"; // a call from the PT rings on every client app page

const LINKS = [
  ["/me", "Dashboard", "M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z"],
  ["/settings", "Settings", "M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7 7 0 0 0-1.7-1L15 3h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7 7 0 0 0 1.7 1L11 21h4l.4-2.6a7 7 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"],
];
const SLIDE_MS = 220;

const icon = (d) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = `<path d="${d}" fill="currentColor"/>`;
  return s;
};

export function mountNav() {
  const here = LINKS.findIndex(([href]) => href === location.pathname);
  const links = LINKS.map(([href, text, d]) => el("a", { href, ariaLabel: text, title: text, ariaCurrent: location.pathname === href ? "page" : null }, icon(d)));
  const nav = el("nav", { className: "pillnav", ariaLabel: "Main" }, el("span", { className: "thumb" }), ...links);
  const place = (i) => {
    nav.classList.toggle("none", i < 0);
    nav.style.setProperty("--i", String(Math.max(i, 0)));
    links.forEach((a, j) => a.classList.toggle("on", j === i));
  };
  place(here);

  nav.onclick = (e) => {
    const a = e.target.closest("a");
    const i = links.indexOf(a);
    if (i < 0 || i === here || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const fromNowhere = here < 0;
    if (fromNowhere) { nav.classList.add("jump"); place(i); }
    else place(i);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => { location.href = a.href; }, reduce || fromNowhere ? 0 : SLIDE_MS);
  };
  // Coming back with the browser's back button can restore the page as it was
  // left, with the highlight on the other icon. Put it back.
  addEventListener("pageshow", (e) => { if (e.persisted) { nav.classList.add("jump"); place(here); requestAnimationFrame(() => nav.classList.remove("jump")); } });
  document.body.append(nav);
}
