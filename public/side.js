// The PT's sidebar, shared by every desktop page in the PT app. Marks the
// current page and shows unread messages next to Inbox. No mobile/desktop
// toggle on PT pages: the layout follows the screen.
import { $, el, api, logout, live } from "/ui.js";

const LINKS = [["/dash", "Dashboard"], ["/inbox", "Inbox"], ["/checkins", "Check-ins"], ["/programs", "Programs"]];

export function mountSide() {
  const badge = el("span", { className: "badge", hidden: true });
  const nav = el("nav", { className: "side", ariaLabel: "Main" },
    el("a", { href: "/dash", className: "brand", textContent: "Program" }),
    el("ul", {}, ...LINKS.map(([href, text]) => el("li", {},
      el("a", { href, ariaCurrent: location.pathname === href ? "page" : null }, text, href === "/inbox" ? badge : null)))),
    el("div", { className: "side-foot" },
      el("strong", { id: "me", textContent: " " }),
      el("button", { type: "button", className: "small", textContent: "Log out", onclick: logout })));
  document.body.prepend(nav);

  async function count() {
    const [data, ok] = await api("/api/inbox");
    if (!ok) return;
    $("me").textContent = data.me.name;
    const n = data.threads.reduce((s, t) => s + t.unread, 0);
    badge.hidden = !n;
    badge.textContent = n;
  }
  count();
  live("/api/events", (e) => e.type === "chat" && count());
}
