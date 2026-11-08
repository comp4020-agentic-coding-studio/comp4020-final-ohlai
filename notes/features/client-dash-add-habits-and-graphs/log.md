# Client dash add habits and graphs: log

## 2026-11-08 23:35 Week strip and summed progress on the client dashboard

What I asked: "add a habit tracker (like github contributions) for workouts logged over the past week. See the photo at C:\Users\oliba\Downloads\dash-example.jpg for an example. It would also be nice to see your progress across all exercises summed up (the good progress measurement taken from the reps within the reprange not just weight or sets or volume by itself)."

The example photo is a "Habits" card with one row per habit ("Log every meal", "Weigh in", "Hit protein"), each with 7 rounded squares for the last 7 days: filled where done, grey where not, the last one (today) outlined. Above it are "Insights" cards with a small line chart and a big number.

What got built:

- `public/me.html`: under the stats card, a "Workouts" card with 7 squares, oldest on the left, today on the right. A square is filled (the `--trend` green) on any day with a finished workout. Today is outlined until it's filled. The list has an aria-label like "Worked out 1 of the last 7 days" and each square has a title with the weekday and "worked out" or "rest". Days are the phone's local days, from `data.workouts` the page already had, so no new API for this.
- Under that, a "Progress, all lifts" card: a line chart with one point per finished workout and a big "+37.6 kg in range" number under it. Hidden until there are at least 2 workouts.
- `public/progress.js`: new `summed()`. It uses the existing double progression score (`scorer()`: weight plus how far the reps are through the PT's rep range, as a fraction of the client's weight step), the same one behind each lift's "Progress" chart on the program page. For each workout it takes the best score per exercise, then the total is, over every exercise done so far, its latest best minus its first best. So reps going 5, 6, 7 at 100kg count as progress, and the weight jump with reps dropping back doesn't count as a fall.
- `server.js` `/api/me`: works out each workout's best score per exercise with `scorer()` and returns `progress: [{ at, gain }]`, oldest first. Done on the server because the client's `/api/me` workouts only carry exercise names, not rep ranges.
- `public/lift-chart.js`: `chart()` is exported and takes a label, so the dashboard reuses the lift chart instead of a second chart.
- `public/style.css`: `.habit`, `.week`, `.prog` styles, colours only from tokens.
- `spec/programs.test.ts`: new test. A client does 3 workouts at 100kg for 5, 6 and 7 reps, and `/api/me` progress has to go 0, then up, then up again.

Checked: `pnpm check` passes (19 tests). Screenshots of `/me` at 390px in light and dark, logged in as Jack (seed data), no horizontal scroll (scrollWidth 390). Jack's seeded workouts were all over a month old so the strip was empty at first. I finished his open Push workout and logged one Pull set today through the client link to see a filled square, so this feature's data folder now has two extra small workouts for Jack.

Not done, see decisions.md for the open questions: the strip only has a Workouts row (no other habits exist in the app yet), and squares aren't tappable.
