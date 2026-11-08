# Export as csv: decisions

Newest at the bottom. Same format as `notes/decisions.md`.

## 2026-11-08: What the download offers

I didn't know what options the download should have, so Claude laid out five choices with a pick for each. I said "that all looks good (and your picks for all of them)". The reasons below are the ones Claude gave when it suggested them. I took the picks as they were and didn't add reasons of my own.

- **Who's in the file.** Options: one client per download, all clients in one file, or both. Picked both: one layout with a client column, so one endpoint covers it with an optional client filter.
- **Date range.** Options: everything always, from/to date pickers, or presets (last 4 weeks, 12 weeks, all). Picked from/to pickers, empty meaning everything. The browser's own date input, nothing extra to build. Presets later if I keep typing the same range.
- **What a row is.** Options: one row per logged set, or one row per exercise per session with a summary (best set, volume). Picked one row per set, since a spreadsheet can sum and pivot raw rows but you can't get raw rows back out of a summary.
- **Where the button goes.** Options: the PT program view, the dashboard, or both. Picked both.
- **Client export.** Picked not now. I asked for the PT, and a CSV is a desk thing, not a phone-in-the-gym thing.
- **Left out:** chat, check-ins, templates, and a lb option (the app only stores kg).

## 2026-11-08: No "prescribed reps" column

Claude's first column list had `prescribed_sets, prescribed_reps`. I said: "Idk where you are getting prescribed_reps from though - a program should only have a sets for an exercise and a rep range". A program exercise has a number of sets and a rep range (like "8-10"), not a fixed rep count. The columns are now `target_sets` and `rep_range`, and `rep_range` is the text the PT typed in the builder, as is.

## 2026-11-08: Close the popup on download

I asked for the Export popup to close once I click Download CSV. Before, it stayed open. No other options came up, and I didn't give a reason, so none is written here.
