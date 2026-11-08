# Export as csv: log

## 2026-11-08 19:10

I asked: "Download your clients and their logged sets as a spreadsheet (CSV), for your own records or a client review. Im not sure what options should we for the download?"

Read the schema in `server.js` before suggesting anything. Logged sets live in `set_logs` (set_no, reps, weight, logged_at, session_id), each tied to an `exercises` row (day, name, prescribed sets and reps) and through that to a `programs` row (title, client_name, client_email, pt_user_id). Weight is stored as kg with no unit column, and the app shows it as kg everywhere. Sets logged before sessions existed have no session_id, so the export can't rely on sessions for the date and should use `logged_at`.

Nothing built yet. Since I asked what the options should be, the agent laid out the choices (who's in the file, date range, row shape, where the button goes, client access) with a recommendation for each, and is waiting on my answer before writing code.

## 2026-11-08 20:45

I said: "that all looks good (and your picks for all of them). Idk where you are getting prescribed_reps from though - a program should only have a sets for an exercise and a rep range"

**The column fix.** Before: the planned columns were `prescribed_sets, prescribed_reps`. That name was wrong. `exercises.reps` is TEXT and holds the rep range the PT types in the builder (default "8-10"), not a fixed count. Now: `target_sets` (exercises.sets) and `rep_range` (exercises.reps, as typed). The `reps` column in the export is what the client actually did on that set.

**What got built:**

- `server.js`: `GET /api/export.csv`. Logged-in PT only (401 and an audit line otherwise). Joins set_logs to exercises to programs and filters on `p.pt_user_id = me.id`, so a PT only ever gets their own clients. Optional `client` (email, matched case-insensitively, so one client's sets across all their programs), `from` and `to` (YYYY-MM-DD, anything else is ignored), `tz` (minutes east of UTC, clamped to +-14h). Columns: client, email, program, day, exercise, target_sets, rep_range, date, time, set, reps, weight_kg. Ordered by client then time. Every export goes through `audit()`, e.g. `exported 4 sets for all clients`, with the client name and date range when set. No tokens in the file or the log line. Also added `client_email` to each dashboard row so the dashboard can filter by client.
- `public/dash.html`: the Export button in the header was a "Preview" popover. It's now a real form in the same popover: Client (All clients or one name), From and To date inputs, Download CSV. A plain GET form, so the browser does the download itself and there's no JS for it. The client detail panel also got an "Export sets" button next to "Open program".
- `public/program.html`: "Export sets" next to "Dashboard" in the PT view of a program, only once the PT has claimed it (an unclaimed PT link has no login, and the export needs one).
- `public/style.css`: `.pv.built` hides the "Preview, not built" label on the export popover.
- `spec/programs.test.ts`: new test. Two clients under one PT, all-clients export has both, client filter has one, a date range in 2000 gives just the header, no link token in the file, another PT gets just the header, no login gets 401.

**Why it's done this way:**

- Dates come from SQLite as UTC. Without `tz` a set logged at 8am in Canberra would show as the day before. The browser sends its offset so date, time and the from/to filter all use the PT's own day.
- Every cell is quoted, quotes doubled, and a cell starting with `= + - @` gets a `'` in front. A client called "=Mia" would otherwise run as a formula when the PT opens the file in Excel. The file starts with a BOM so Excel reads names as UTF-8.
- One row per set with no maths on the server, as decided.

**Checked:** `pnpm check` passes (13 tests) after restarting the app through the dashboard. In headless Edge at 1440x900, on port 8082: signed up a PT, made two clients (`Jack, "the" Lifter` and `=Mia`), logged two sets each, clicked Export, clicked Download CSV with a real mouse click. The file `sets-all-2026-11-08.csv` landed with 4 rows, the comma and quotes in Jack's name escaped right, `=Mia` written as `'=Mia`, times in local time (tz 660). Client detail panel shows the Export sets button with the right link. Screenshots looked right, no layout problems.

**Got wrong:** the `prescribed_reps` name in my first proposal (above). Also my first bash command to append the spec got blocked by the permission check (quotes inside braces in a heredoc), so I added the test with the editor instead.

**Not done:** presets for the date range, client-side export, lb.
