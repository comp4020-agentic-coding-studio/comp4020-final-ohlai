// Small helpers the account pages share (landing, login, dash, me, chat, new).

export const $ = (id) => document.getElementById(id);

export function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids.filter((k) => k !== null && k !== undefined && k !== false));
  return n;
}

// GET when there's no body, POST JSON when there is. Returns [data, ok].
export async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  return [await res.json().catch(() => ({})), res.ok];
}

export const utc = (t) => new Date(t.replace(" ", "T") + "Z");
export const fmtDay = (d) => d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
export const fmtTime = (d) => d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

export function ago(t) {
  if (!t) return "Never";
  const days = Math.floor((Date.now() - utc(t)) / 864e5);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}

// A yes/no popup in the app's style, instead of the browser's confirm().
// Resolves true when they pick `yes`. Cancel, Esc or a tap outside is false.
export function ask(title, text, yes) {
  const cancel = el("button", { type: "button", textContent: "Cancel", autofocus: true });
  const ok = el("button", { type: "button", className: "primary", textContent: yes });
  const d = el("dialog", { className: "pop confirm" },
    el("h2", { textContent: title }),
    text ? el("p", { textContent: text }) : null,
    el("div", { className: "actions" }, cancel, ok));
  cancel.onclick = () => { d.close(); };
  ok.onclick = () => { d.close("yes"); };
  d.onclick = (e) => { if (e.target === d) d.close(); }; // tap outside the box
  document.body.append(d);
  document.documentElement.classList.add("locked");
  d.showModal();
  return new Promise((done) => {
    d.onclose = () => { document.documentElement.classList.remove("locked"); d.remove(); done(d.returnValue === "yes"); };
  });
}

// Asks first, so a stray tap on Log out doesn't sign you out.
export async function logout() {
  if (!(await ask("Log out?", "You'll need to log in again to get back in.", "Log out"))) return;
  await api("/api/logout", {});
  location.href = "/";
}

// Sends you to log in, coming back here after.
export const toLogin = () => (location.href = `/login?next=${encodeURIComponent(location.pathname + location.hash)}`);

// Re-runs `fn` whenever the server says something you can see changed.
export function live(src, fn) {
  const es = new EventSource(src);
  es.onmessage = (e) => fn(JSON.parse(e.data));
  return es;
}
