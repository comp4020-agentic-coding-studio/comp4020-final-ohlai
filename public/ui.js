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

export async function logout() {
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
