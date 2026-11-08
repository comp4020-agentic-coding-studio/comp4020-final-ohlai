# Client workout flow: log

## 2026-11-09 00:19 Discard and Finish placement

I asked: "change discard and finish buttons and layout while in workout. it looks ugly and weird having them just at the top like they are now."

Before: in an open workout, Discard and Finish were full-size buttons in a row of their own (`#actions`, `.actions.top`), right-aligned under the subtitle and above the stats strip.

The agent didn't change anything yet. It came back with three options:
- A: Finish as a small pill in the top bar next to the day name, Discard moved to the bottom of the exercise list as a quiet text button (its pick).
- B: a sticky bottom bar with a full-width Finish. It would fight the rest timer and chat button for the bottom of the screen.
- C: both at the bottom of the list.

## 2026-11-09 00:25 Both buttons small, on the day name line

I said: "make them smaller and add them in line with the name of the programs day."

So neither A, B nor C exactly: both buttons stay together, but they move up onto the title line.

What changed:
- `public/program.html`: a new `#dayActions` container in the `.topbar`, after the `<h1>`. The client's open-workout render puts Discard and Finish there with `className: "small"` (and `small primary` for Finish) instead of in `#actions`. `#dayActions` is cleared on every render, so it's empty in the picker and the PT view. The handlers (confirm popup, `act("discard")`, `finish()`) are unchanged.
- `public/style.css`: `.day-actions` is a flex row with a 6px gap that doesn't shrink, hidden when empty. Buttons get `min-height: 36px` so they stay easy to tap even though `button.small` makes them shorter.

Checked: screenshots at 390px in light and dark on the feature app (port 8090), with a seeded client in an open "Upper A" workout. The two pills sit on the right of the day name, with no horizontal scroll. Finish is ink-filled (black in light, white in dark) and Discard is the soft grey. `pnpm check` passed (20 tests).

What didn't work first: Chrome headless on Windows won't make a window 390px wide, so the first screenshots laid out wider and looked cut off on the right. Loading the page in a 390px iframe inside a wider window gave a true phone-width render.
