// One check-in's answers, drawn the same on the dashboard and the check-ins page.
// Each check-in carries the questions it was answered against, so changing the
// questions later doesn't rewrite old answers.
import { el, fmtDay, utc } from "/ui.js";

export function checkinCard(c) {
  return el("div", { className: "checkin" },
    el("small", { className: "muted", textContent: fmtDay(utc(c.at)) }),
    el("dl", {}, ...c.questions.flatMap((q, i) => {
      const a = c.answers[i];
      return [
        el("dt", { textContent: q.text }),
        q.kind === "scale"
          ? el("dd", { className: "scale", ariaLabel: a ? `${a} out of 5` : "Skipped" },
            ...(a ? [1, 2, 3, 4, 5].map((n) => el("i", { className: n <= a ? "on" : "" })) : []),
            el("span", { className: "num", textContent: a ? ` ${a}/5` : "Skipped" }))
          : el("dd", { textContent: a || "No answer", className: a ? "" : "muted" }),
      ];
    })));
}
