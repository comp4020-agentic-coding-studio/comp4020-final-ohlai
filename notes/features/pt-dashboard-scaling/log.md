# PT dashboard scaling: log

## 2026-11-09 00:05 Needs attention and Last 7 days overlap the other cards

What I asked: "when you change the window size of the pt dashboard dynamically there are some points where the needes attenention and 7 days cards overlap with the rest of the cards. I would rather then tile somewhere else rather than overlapping."

What was wrong: the dashboard body (`.dashgrid` in `public/style.css`) was a CSS grid with columns `minmax(0, 2fr) minmax(280px, 1fr)`, switching to one column only below 1100px. The `minmax(0, ...)` let the left column shrink below the clients table's real width. The table cells are `white-space: nowrap`, so the table can't get narrower than its content, and it ran out of its column and under the right column. I reproduced it with headless Chrome and the demo login: the Clients panel overlapped Needs attention, and Recent workouts overlapped Last 7 days, at every width I tried from 1101px to 1300px (window width, sidebar included). The page also got a horizontal scrollbar there. 1400px and up was fine, and 1100px and below was fine because the media query stacked everything.

What I did: changed `.dashgrid` from a grid to a wrapping flexbox. The left column is `flex: 2 1 0` and the right `flex: 1 1 0`, so it's still a 2:1 split when there's room. Flex items don't shrink below their content's minimum width, so when the clients table and the right column no longer fit side by side, the right column (Needs attention and Last 7 days) wraps down below Clients and Recent workouts and goes full width. The switch point follows the actual content (how wide the table is), not a fixed breakpoint, so it also holds when a client has a long name or more program days. Removed the `.dashgrid` line from the 1100px media query since it isn't needed any more. Files: `public/style.css`.

What I tried that didn't work:
- `flex: 2 1 auto; min-width: 0` on the left column: no overlap, but it wrapped at 1400px too, where the old layout fit fine side by side. `auto` makes the basis the table's full preferred width.
- `flex: 2 1 min-content`: same early wrap at 1400px.
- `flex: 2 1 0; min-width: min-content` on the left and `min-width: 280px` on the right: gave a horizontal scrollbar at 1350px. Dropping both explicit min-widths and leaving flexbox's default (content) minimum fixed it.

Checked with a headless Chrome script (kept outside the repo) that logs in as the demo PT, loads `/dash` at each width, checks every pair of panels and tiles for overlap and checks for a horizontal scrollbar. Light at 1000, 1100, 1200, 1250, 1300, 1350, 1400, 1450, 1600 and 1920px: no overlap and no horizontal scroll at any of them. Dark at 1300 and 1600: same. Looked at screenshots at 1300 (stacked), 1450 (side by side, the 7 day columns get tight), 1600 dark and 1920. No popup open. `pnpm check` passes (18 tests).

Login for the feature app on port 8089: oli@example.com / demo1234 (seeded with `node scripts/seed-jack.js`).
