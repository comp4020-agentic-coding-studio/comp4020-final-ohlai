// A chat thread with one person: messages, a text box and a photo button.
// Used by the chat page and by the drawer on the program page.
import { el, api, utc, fmtDay, fmtTime } from "/ui.js";

export function mountChat(root, other, { onLoad } = {}) {
  const thread = el("ol", { className: "thread", ariaLive: "polite" });
  const text = el("input", { id: "chatText", autocomplete: "off", maxLength: 2000, placeholder: "Message" });
  const file = el("input", { type: "file", accept: "image/*" });
  const err = el("p", { className: "error", role: "alert" });
  const form = el("form", { className: "compose" },
    el("label", { className: "btn photo", title: "Send a photo" },
      el("span", { ariaHidden: "true", textContent: "📷" }), el("span", { className: "sr", textContent: "Send a photo" }), file),
    el("label", { htmlFor: "chatText", className: "sr", textContent: "Message" }),
    text,
    el("button", { className: "primary", type: "submit", textContent: "Send" }));
  root.replaceChildren(thread, err, form);

  async function load() {
    const [data, ok] = await api(`/api/chat/${other}`);
    if (!ok) return onLoad?.(null, data.error);
    const { me, messages } = data;
    text.placeholder = me.role === "pt" ? `Message ${data.other.name}` : "Ask about your program";
    let lastDay;
    const items = [];
    for (const m of messages) {
      const t = utc(m.created_at), day = fmtDay(t);
      if (day !== lastDay) items.push(el("li", { className: "day", textContent: (lastDay = day) }));
      items.push(el("li", { className: m.sender_id === me.id ? "mine" : "theirs" },
        m.image ? el("a", { href: `/api/img/${m.image}`, target: "_blank" },
          el("img", { src: `/api/img/${m.image}`, alt: "Photo", loading: "lazy" })) : el("p", { textContent: m.body }),
        el("time", { textContent: fmtTime(t) })));
    }
    if (!messages.length) items.push(el("li", { className: "day", textContent: "No messages yet. Say hi." }));
    thread.replaceChildren(...items);
    thread.lastElementChild?.scrollIntoView({ block: "end" });
    onLoad?.(data);
  }

  async function post(path, init) {
    const res = await fetch(path, { method: "POST", ...init });
    err.textContent = res.ok ? "" : (await res.json()).error;
    return res.ok;
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    const body = text.value.trim();
    if (!body) return;
    if (await post(`/api/chat/${other}`, { headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) })) text.value = "";
  };

  // Photos from a phone camera are huge; shrink to 1600px on the long side first.
  file.onchange = async () => {
    const f = file.files[0];
    file.value = "";
    if (!f) return;
    const img = await createImageBitmap(f).catch(() => null);
    if (!img) return (err.textContent = "Couldn't read that photo.");
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = Object.assign(document.createElement("canvas"), { width: Math.round(img.width * scale), height: Math.round(img.height * scale) });
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
    await post(`/api/chat/${other}/image`, { headers: { "content-type": "image/jpeg" }, body: blob });
  };

  return { load, focus: () => text.focus() };
}
