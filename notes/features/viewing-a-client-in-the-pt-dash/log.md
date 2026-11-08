# viewing a client in the PT dash: log

Newest at the bottom.

## 2026-11-08 19:08 to 19:20: client detail as a popup, lift chart beside it

What I asked: "The side popup forces the whole dash to wrap when it opens.
Instead do a regular popup over the top of the dash. Also the it opens the
client screen when clicking into a client specific exercise that shuold be
embedded somehow in the popup. Maybe we have one centeral poup in the middle of
the screen then when you click on an exercise it opens a new popup to the side
on the main popup (like two cards side by side)"

Before: clicking a client opened `<aside class="detail">` as a third column of
the `body.app` grid (232px sidebar, main, auto). A `:has(#detail:not([hidden]))`
rule then dropped the dash to one column so the panel fit, which is the wrap I
didn't like. Each lift in the panel was a link to `/p/<pt_token>#ex-<id>`, so
clicking one left the dash for the PT program page.

Now:

- `public/dash.html`: the panel is a `<dialog class="detail">` opened with
  `showModal()`, centred over a dimmed, blurred dash. Inside it are two
  `<section class="dcard">`: the client card (same content as the old panel)
  and a lift card that starts hidden. Each lift is now a button. Clicking it
  shows the lift card to the right of the client card, fetches
  `/api/p/<pt_token>` (the same data the PT program page uses) and draws the
  chart and personal records there. The open lift's button is
  `aria-pressed="true"`. Closing: the lift card's ✕, or Esc, closes only the
  lift card and puts focus back on that lift's button. A second Esc, the
  client ✕, or clicking the dimmed dash closes the lot. "Open program" is still
  there for going to the full program page.
- `public/lift-chart.js` (new): the chart, metric pills and records moved out
  of `program.html` so the dash and the program page draw a lift the same way
  from one copy. Also holds `workouts()` and `exHistory()`, which both pages
  need to group sets into workouts.
- `public/program.html`: imports those instead of its own copies.
  `renderSummary` is now three lines. No visible change on the client or PT
  program page.
- `public/style.css`: `body.app` grid is back to two columns, the `:has` rule
  that collapsed the dash is gone, and the `.detail` / `.dcard` rules make the
  dialog a flex row of cards (420px client, 480px lift), each scrolling on its
  own inside the window height. In the lift card the metric pills wrap instead
  of scrolling sideways. Under 760px the cards stack.

Why this way: a native `<dialog>` with `showModal()` gives the overlay, focus
trap and Esc for free, and doesn't touch the dash layout at all, so nothing
can reflow. Reusing the PT link's API meant no server change and no restart.

What went wrong and how it got fixed:

- First version caught Esc in the dialog's `cancel` event and called
  `preventDefault()` to close just the lift card. In headless Chrome the first
  Esc closed the whole dialog anyway: Chrome ignores `preventDefault` on a
  `cancel` that wasn't preceded by a user click (close-watcher anti-abuse
  rule). Moved it to a `keydown` handler on the dialog, which runs before
  `cancel`. Checked again: first Esc closes the lift card, focus goes back to
  the lift button, second Esc closes the dialog.
- The metric pills in the 480px lift card scrolled sideways (they're built for
  the phone page). Added a wrap rule scoped to `#d-lift`.

How I checked it: logged in as the demo PT on port 8083 and drove headless
Chrome at 1440x900. The `.dashgrid` bounding box was identical before and
after opening the popup (1152px wide both times), so the dash no longer
moves. Screenshots of the client card alone and of both cards side by side
looked right. Clicked a lift: lift card showed Triceps Pushdown with its
chart, URL stayed `/dash`. Switched metric to Heaviest weight. No page
errors. Also opened the client link's lift summary (`#ex-1`) at 390px to
make sure the moved chart still works there: chart drawn, `scrollWidth` 390,
back to the workout fine. `pnpm check` passes (12 tests).

## 2026-11-08 20:13 to 20:20: chat in the side card, wider client card, no Open program

What I asked: "clicking message jack from the dash popup should open the
messenger on the side like the graph view. Also make the Client popup wider,
and remove the view program button (you can already see the exercises in the
popup)"

Before (see the 19:08 entry): the client card had "Open program" (a link to
`/p/<pt_token>`) and "Message" (a link to `/chat/<id>`, which left the dash).
The client card was 420px. The second card only ever showed a lift.

Now:

- `public/dash.html`: the second card is now a general side card
  (`#d-side`, was `#d-lift`) that holds either a lift or the chat. "Message
  Jack" is a button that opens the chat in it, using `mountChat` from
  `public/chat.js`, the same thread and compose box as the Inbox and the
  program page drawer, so photos work too. Focus goes to the text box. The
  side card's ✕ or Esc closes it and puts focus back on whichever button
  opened it (the lift or Message). Opening a lift while the chat is open swaps
  it, and the other way round. New messages show up live: the existing
  `/api/events` stream already fires on chat, so the dash reloads the thread
  when one comes in. "Open program" is gone.
- `public/style.css`: client card 420px to 580px. When the side card is the
  chat it fills the window height, the thread scrolls and the text box sits at
  the bottom. Their messages get the soft background the Inbox uses.

How I checked it: headless Chrome at 1440x900 as the demo PT. Dash grid still
didn't move when the popup opened. Client card measured 580px, no Open
program button. Clicked Message Jack: side card showed Jack's thread with
focus in the text box. Typed a message and clicked Send (not a submit in
code): it came back in the thread from the server and the box cleared. Esc
closed the chat and focus went back to Message Jack, second Esc closed the
popup. Lift card still works. No page errors. The two cards fit side by side
at 1440px (580 + 16 + 480). `pnpm check` passes.

Note: that test left a "Popup test ..." message from Oli to Jack in this
feature's own data folder only.
