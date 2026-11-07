// One finished workout, closed to a line; tapping it shows every set.
import { el, utc, fmtDay } from "/ui.js";

export function workoutCard(w) {
  const vol = w.sets.reduce((s, l) => s + (l.weight ?? 0) * l.reps, 0);
  const byEx = Map.groupBy(w.sets, (l) => l.exercise);
  return el("details", { className: "card wo" },
    el("summary", {},
      el("span", {}, el("strong", { textContent: w.day }), el("br"),
        el("span", { className: "muted", textContent: `${fmtDay(utc(w.started_at))} · ${w.sets.length} sets · ${+vol.toFixed(0)} kg` }))),
    el("div", { className: "wo-body" },
      el("table", {}, ...[...byEx].flatMap(([name, sets]) => [
        el("tr", {}, el("th", { colSpan: 2, textContent: name })),
        ...sets.map((l) => el("tr", {}, el("td", { textContent: `Set ${l.set_no}` }),
          el("td", { className: "num", textContent: `${l.weight == null ? "–" : +l.weight + "kg"} × ${l.reps}` })))])),
      el("p", { className: "muted", textContent: w.title })));
}
