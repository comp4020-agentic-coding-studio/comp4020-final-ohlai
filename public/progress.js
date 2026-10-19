// How progress is scored, shared by the server (dashboard) and the browser (chart).
//
// "Progress" follows double progression: reps climb through the PT's range at
// one weight, then the weight goes up and reps drop back to the bottom. A
// set scores weight + step * (reps - lo) / (hi - lo + 1), so the top of the
// range at one weight scores just under the bottom of the range one step up
// and the line keeps rising through the weight jump. step is the smallest
// weight increase the client has made on this exercise (2.5 kg until known).

export function repRange(reps) {
  const [lo, hi = lo] = String(reps).match(/\d+/g)?.map(Number) ?? [10];
  return [Math.min(lo, hi), Math.max(lo, hi)];
}

export function weightStep(sets) {
  const ws = [...new Set(sets.map((s) => s.weight).filter((w) => w > 0))].sort((a, b) => a - b);
  const gaps = ws.slice(1).map((w, i) => w - ws[i]).filter((g) => g > 0);
  return gaps.length ? Math.min(...gaps) : 2.5;
}

export function scorer(reps, allSets) {
  const [lo, hi] = repRange(reps);
  const step = weightStep(allSets);
  return (s) => (s.weight ?? 0) + (step * (s.reps - lo)) / (hi - lo + 1);
}

// sessions: one array of sets per workout, oldest first.
// "up": the last workout beat every one before it. "stalled": no new best in
// the last three workouts. "new": not enough workouts to tell. Else "steady".
export function trend(reps, sessions) {
  const score = scorer(reps, sessions.flat());
  const bests = sessions.map((sets) => Math.max(...sets.map(score)));
  if (bests.length < 2) return "new";
  const before = (n) => Math.max(...bests.slice(0, -n));
  if (bests.at(-1) > before(1)) return "up";
  if (bests.length >= 4 && Math.max(...bests.slice(-3)) <= before(3)) return "stalled";
  return "steady";
}
