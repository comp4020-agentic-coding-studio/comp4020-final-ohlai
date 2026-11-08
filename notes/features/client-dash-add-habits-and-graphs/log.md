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

## 2026-11-08 23:47 Polish pass on the whole client dashboard

What I asked: "the text feels like it doesnt fit with the rest of the dash. Can you please go over the whole client dash and make it look more aesthetic with text are the correct sizes? For a start the +37.6 kg in range is wayyyy too big. Also like the habit tracker is probably to big comapred to other elements. Maybe you need to look at the site visually to see how the dashboard is failing miserably at having good design and just general UI. Can you try to remoeve the workout today - i want to see if you got the outlined square to show you havent logged something today but you still can."

Removing today's workout: there's no API to delete a finished workout (a set only goes away when the client removes it, and the client can only discard an open workout). This was the one-set Pull workout I logged myself as a test in the entry above, in this feature's own data folder, so I deleted that session (id 42) and its one set straight from the SQLite file. No real data was touched.

What changed, before and after, all checked by screenshot at 390px in light and dark:

- Progress number: before, "+37.6" at 1.3rem bold with "kg in range" under the chart, the biggest text on the page after the greeting. Now it sits top right of the card at 1.15rem, weight 500, the same as the stats numbers, with a small muted "kg". The card has a bold "Progress" title and a muted "All lifts since 28 July" under it, laid out like the workout cards. "in range" is gone because it meant nothing on its own.
- Progress chart: before, a dot on every one of about 30 workouts, which looked busy at phone width. Now it's the line plus one dot on the latest point. The program page's per-lift chart still shows every dot.
- Week strip: squares went from 22px to 16px and the gap from 6px to 5px. The label went from "Workouts" in regular weight to "Last 7 days" in bold like the other card titles. Today, when nothing's logged, is now an empty square with a muted outline. Before it was a grey fill with a faint outline, which barely looked different from the other days. The screenshot shows the outlined square on the right.
- Stats card: "38 days ago" wrapped onto two lines. Columns now size to their content and the numbers don't wrap.
- Secondary text on the dashboard was a mix of 0.8rem and 0.9rem (day buttons, program line, workout cards, PT card). On client pages it's all 0.85rem now.
- The PT card buttons were desktop size (16px text, 12px by 16px padding) and looked heavy on a phone. On client pages they're 0.95rem with 10px by 14px padding. Workout card rows are a bit tighter (14px top and bottom).

Files: public/me.html, public/style.css. `pnpm check` passes (19 tests).
