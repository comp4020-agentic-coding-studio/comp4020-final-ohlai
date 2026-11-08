# Client workout flow: decisions

## 2026-11-09 Where Discard and Finish go during a workout

What came up: Discard and Finish had a row of their own at the top of the workout page, which I said looks ugly and weird.

Options the agent gave:
- A: Finish as a small pill next to the day name, Discard at the bottom of the exercise list (the agent's pick, to keep the destructive button away from Finish).
- B: a sticky bottom bar with a full-width Finish.
- C: both at the bottom of the exercise list.

What I picked: none of these exactly. Both buttons, made smaller, go on the same line as the day name.

Why: having them on a row of their own at the top looked ugly and weird.

## 2026-11-09 Where Discard takes the client

What came up: after Discard, the client landed on the program page's picker, the full list of days. I said it should go back to the dash.

What I picked: after Discard, a signed-up client goes to their dashboard (`/me`).

Left as it was, as small details: a link-only client, who has no dashboard, stays on the picker. Finish still stays on the program page, because I only asked about Discard.

## 2026-11-09 No fallback for clients without an account

What came up: the agent kept a "link-only client stays on the picker" case after Discard. I pointed out that we'd already phased out links without accounts (2026-11-08, change-assign-client-flow, "Drop support for old links").

What I picked: no special case. After Discard, every client goes to `/me`. This replaces the "Left as it was" line in the entry above.

## 2026-11-09 Delete the client's program picker page

What came up: after Discard, the old program page (the list of days with Start buttons) flashed for a moment before the dashboard loaded.

What I picked: "fully delete that program page even if we have to rewrite or refactor some of the app to do so". The client only ever sees the workout in progress on `/p/<token>`. With no workout open, they go to `/me`.

Follows from it: Finish now goes to the dashboard too, because the page it used to land on is gone. This replaces "Finish still stays on the program page" in the "Where Discard takes the client" entry.

Why: I didn't want the flash, and the dashboard already does what that page did.
