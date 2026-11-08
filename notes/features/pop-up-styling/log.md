# pop up styling: log

## 2026-11-08 21:24 Make every popup look like the client card

I asked: "update all pop ups in the app to use the view client popup from the PT dash. Idk if / how many there are apart from the client popup"

**What was there.** Searched `public/` for `dialog`, `popover`, `confirm(`, `alert(` and `prompt(`. Apart from the client card on the dash (`dialog.detail` with `.dcard` inside) there were:

1. Export sets popover on the dash (`#pv-export`, class `.pv`).
2. Nudge quiet clients preview popover on the dash (`#pv-nudge`, `.pv`).
3. Log out? popup (`logout()` in `public/ui.js`, class `.confirm`), used from the PT sidebar and client Settings.
4. Assign popup on the Programs page (`dialog.assign` in `public/templates.html`).
5. Chat drawer on the program page (`dialog.drawer`), a bottom sheet.
6. Three browser `confirm()` boxes: Delete program (Programs page), Discard workout and Finish workout (client program page).

Each of 1 to 4 had its own copy of the card CSS (padding, border, radius, shadow). They differed from the client card in small ways: Export, Nudge and Assign had no blur behind them and no pop-in animation, the titles were `h3` not `h2`, and Assign had no round close button.

**What I did.**

- `public/style.css`: one shared `.pop` class with the client card's look (20px padding, line border, 18px radius, card background, big soft shadow), the same blurred backdrop as `.detail`, and the same `confirm-in` pop-in animation. `.dcard` (the client card itself) now uses the same rule, so there is one place to change the look. Removed the duplicated card CSS from `.pv`, `.assign` and `.confirm`, they only keep their width now. Reduced motion turns the animations off for all of them.
- `public/ui.js`: `logout()`'s popup became a general `ask(title, text, yesLabel)` that returns a promise (true for yes; Cancel, Esc or a click outside is false). `logout()` now just calls it. Same markup as before plus the `pop` class, title is an `h2` like the client card.
- `public/program.html`: Discard and Finish use `ask()` instead of `confirm()`. Fixed "1 sets will be saved" to "1 set" while there.
- `public/templates.html`: Delete uses `ask()`. The Assign popup got the client card's head (title `h2` plus the round ✕ close button top right, same `.detail-head` markup) and closes on a click outside like the client card. Its "Assigned" step now changes the head title instead of having its own `h3`.
- `public/dash.html`: Export and Nudge popovers got the `pop` class and `h2` titles, so they blur the dash and pop in.
- Chat drawer: left as a bottom sheet on the phone (a centred card would be a different layout, see decisions.md, open question). Only its backdrop changed to the same blur as the others.
- `spec/logout.test.ts`: the jsdom stand-in for `dialog.close()` now keeps the return value, since `ask()` reads it.

**Checked.** `pnpm check` passes (13 tests). Headless Edge on port 8086 with real mouse clicks, screenshotted each one: dash client card (unchanged), Export, Log out, Assign, Assigned, Delete at 1440x900, Finish and Discard on the client program page at 390x844. All read as the same card now. Clicking Cancel on Delete left the program on the server (still 1 template) and clicking Discard really ended the workout (`open_session` null after). No horizontal scroll at 390.
