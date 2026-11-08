// One lift's progress: a chart over workouts and personal records. Used by the
// program page (exercise summary) and the PT dashboard's lift card. The
// scoring is in public/progress.js, shared with the server.
import { repRange, weightStep, scorer } from "/progress.js";
import { el } from "/ui.js";

const utc = (t) => new Date(t + "Z");
const fmtDay = (d) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
const kg = (w) => (w == null ? "–" : `${+w}kg`);

// Every workout, oldest first, with its sets. Sets logged before workouts
// existed have no session, so they group by calendar day instead.
// `state` is what /api/p/<token> returns.
export function workouts(state) {
  const by = new Map();
  for (const s of state.sessions) by.set(s.id, { id: s.id, day: s.day, start: utc(s.started_at), finished: s.finished_at, logs: [] });
  for (const l of state.logs) {
    const key = l.session_id ?? "d" + utc(l.logged_at).toLocaleDateString("en-CA");
    if (!by.has(key)) by.set(key, { id: key, day: null, start: utc(l.logged_at), finished: l.logged_at, logs: [] });
    by.get(key).logs.push(l);
  }
  return [...by.values()].sort((a, b) => a.start - b.start);
}

// One exercise's sets per workout: [{ w, sets: { 1: log, 2: log } }], oldest first.
export function exHistory(state, exId) {
  return workouts(state).map((w) => ({ w, sets: Object.fromEntries(w.logs.filter((l) => l.exercise_id === exId).map((l) => [l.set_no, l])) }))
    .filter((h) => Object.keys(h.sets).length);
}

const METRICS = {
  progress: { label: "Progress", unit: "" },
  heaviest: { label: "Heaviest weight", unit: "kg" },
  reps: { label: "Most reps", unit: " reps" },
  orm: { label: "Est. 1RM", unit: "kg" },
  volume: { label: "Session volume", unit: "kg" },
};
let metric = "progress"; // kept when moving between lifts

export function liftSummary(ex, hist) {
  const box = el("div", { className: "liftsum" });
  const all = hist.flatMap((h) => Object.values(h.sets));
  if (!all.length) return el("p", { className: "muted", textContent: "No sets logged for this exercise yet." });

  const [lo, hi] = repRange(ex.reps);
  const step = weightStep(all);
  const w = (s) => s.weight ?? 0;
  const score = scorer(ex.reps, all);
  const epley = (s) => w(s) * (1 + s.reps / 30);
  const per = hist.map(({ w: wk, sets: bySet }) => {
    const sets = Object.values(bySet), k = wk.start;
    const top = (f) => Math.max(...sets.map(f));
    return { k, progress: top(score), heaviest: top(w), reps: top((s) => s.reps), orm: top(epley),
      volume: sets.reduce((a, s) => a + w(s) * s.reps, 0) };
  });
  const best = (f) => all.reduce((a, s) => (f(s) > f(a) ? s : a));
  const bestVol = best((s) => w(s) * s.reps);

  const draw = () => {
    const last = per.at(-1), m = METRICS[metric];
    const shown = (v) => `${+v.toFixed(metric === "progress" || metric === "orm" ? 1 : 2)}${m.unit}`;
    box.replaceChildren(
      ex.notes ? el("p", { className: "notes", textContent: ex.notes }) : "",
      el("p", { className: "big" }, el("strong", { textContent: shown(last[metric]) + " " }), el("span", { className: "accent", textContent: fmtDay(last.k) })),
      chart(per, metric),
      el("div", { className: "tabs pills", role: "group", ariaLabel: "Chart" },
        ...Object.entries(METRICS).map(([key, { label }]) =>
          el("button", { type: "button", textContent: label, ariaPressed: String(key === metric),
            onclick: () => { metric = key; draw(); box.querySelector(`[aria-pressed="true"]`)?.focus(); } }))),
      metric === "progress" ? el("p", { className: "muted", textContent:
        `Rep range ${lo}${hi > lo ? "–" + hi : ""}, weight step ${step}kg. Reaching the top of the range, then moving up a weight, both push the line up.` }) : "",
      el("h2", { textContent: "Personal records" }),
      el("dl", { className: "records" },
        ...[["Heaviest weight", `${Math.max(...per.map((p) => p.heaviest))}kg`],
            ["Best 1RM (est.)", `${+epley(best(epley)).toFixed(2)}kg`],
            ["Best set volume", `${kg(bestVol.weight)} x ${bestVol.reps}`],
            ["Best session volume", `${+Math.max(...per.map((p) => p.volume)).toFixed(1)}kg`]]
          .flatMap(([k, v]) => [el("dt", { textContent: k }), el("dd", { textContent: v })])));
  };
  draw();
  return box;
}

// per: [{ k: Date, [key]: number }]. Also draws the client dashboard's summed progress.
// With onPick, touching, dragging or arrow keys pick a point: onPick(i), or onPick(null) when let go.
export function chart(per, key, label = METRICS[key].label, onPick) {
  const W = 320, H = 150, L = 40, B = 22, T = 10, R = 10;
  const ys = per.map((p) => p[key]);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; }
  const x = (i) => L + (per.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (per.length - 1));
  const y = (v) => T + ((hi - v) * (H - T - B)) / (hi - lo);
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "chart");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${label} per session, ${per.map((p) => `${fmtDay(p.k)} ${+p[key].toFixed(1)}`).join(", ")}`);
  const grid = [hi, (hi + lo) / 2, lo].map((v) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 4}" y="${y(v) + 3}" text-anchor="end">${+v.toFixed(1)}</text>`);
  const ticks = per.map((p, i) => ({ p, i })).filter(({ i }) => per.length <= 5 || i % Math.ceil(per.length / 5) === 0)
    .map(({ p, i }) => `<text class="axis" x="${x(i)}" y="${H - 6}" text-anchor="middle">${fmtDay(p.k)}</text>`);
  const pts = per.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  svg.innerHTML = grid.join("") + ticks.join("") + `<polyline class="line" points="${pts}"/>` +
    per.map((p, i) => `<circle class="dot${i === per.length - 1 ? " last" : ""}" cx="${x(i)}" cy="${y(p[key])}" r="3.5"/>`).join("");
  if (!onPick) return svg;

  svg.insertAdjacentHTML("beforeend", `<line class="cursor" y1="${T}" y2="${H - B}" hidden/><circle class="pick" r="5" hidden/>`);
  const [cursor, dot] = [svg.querySelector(".cursor"), svg.querySelector(".pick")];
  let at = null;
  const pick = (i) => {
    at = i;
    for (const n of [cursor, dot]) n.toggleAttribute("hidden", i == null);
    if (i != null) {
      cursor.setAttribute("x1", x(i)); cursor.setAttribute("x2", x(i));
      dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(per[i][key]));
    }
    onPick(i);
  };
  const near = (e) => {
    const r = svg.getBoundingClientRect(), vx = ((e.clientX - r.left) / r.width) * W;
    return Math.max(0, Math.min(per.length - 1, Math.round(((vx - L) / (W - L - R)) * (per.length - 1))));
  };
  svg.tabIndex = 0;
  svg.onpointerdown = (e) => { svg.setPointerCapture(e.pointerId); pick(near(e)); };
  svg.onpointermove = (e) => { if (e.pointerType === "mouse" || svg.hasPointerCapture(e.pointerId)) pick(near(e)); };
  // A finger lifting keeps its point showing, so the number isn't hidden under it then gone.
  svg.onpointerleave = (e) => { if (e.pointerType === "mouse") pick(null); };
  svg.onkeydown = (e) => {
    const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (d) { e.preventDefault(); pick(Math.max(0, Math.min(per.length - 1, (at ?? per.length - 1) + d))); }
    if (e.key === "Escape") pick(null);
  };
  svg.onblur = () => { pick(null); };
  return svg;
}
