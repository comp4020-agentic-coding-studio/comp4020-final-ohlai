# landing page polish: log

## 2026-11-09 00:32 Copy pass, footer link, mobile check

What I asked: "run a oli-voice skill pass over it and maybe an unslop skill over it then remove the about this link. also make sure it looks good on mobile."

What was done:

- Ran the oli-writing-style and unslop skills over the copy in `public/landing.html`.
  - Title: "Program: training programs..." became "Program | training programs..." (colon mid-sentence is an unslop tell).
  - Meta description: "one link" became "a link".
  - h1: the three staccato fragments "Write the program. Send the link. See what they actually lifted." became one sentence, "Write a program, send the link, see what they actually lifted." The voice skill says not to break one thought into jolting fragments.
  - Lede: "You see it land on your dashboard, instead of whatever they remember by Friday" became "it shows up on your dashboard. Which beats whatever they remember by Friday."
  - Step 3: dropped "who's moving" from "who's gone quiet, who's stalled and who's moving" (a forced rule of three).
  - h2 "Built around how you coach" became "What's in it" (the old one was brand-speak).
  - Card 1 reworded to "Each row is filled in from last session, so most of the time your client just lifts and ticks." Dropped "lifts, ticks and rests" (another three).
  - Card 2 heading "Progress the way you read it" became "Progress that makes sense". Body dropped "scored properly" and "double progression" jargon, now says it knows about rep ranges so a heavier weight with fewer reps counts as progress.
  - Card 3: "The chat sits next to the training" became "The chat is right next to the workout".
  - CTA: dropped "Sign up, write a program, send the link." since the steps section already says that and the button is right under it.
- Removed the footer with the "About this project" link to `/readme/`. `/readme/` itself still works (the spec checks it), it's just not linked from the landing page now. Removed the now unused `footer.site` CSS in `public/style.css`.
- Mobile: screenshots with headless Chrome needed a permission I didn't have, so I checked the CSS by hand instead. Found a real bug: the builder's `.ex-head` rule (`public/style.css`, the six-column grid with a 180px min first column, about 650px wide) applied everywhere, so it overrode the workout `.ex-head` flex rule. That made the "Bench Press 3 × 6-10" header in the landing page's phone mockup a wide grid, which pushes the page sideways at 390px. The same rule was also hitting the day pick cards on the client's `program.html`. Scoped it to `.builder .ex-head`, which is the only place the grid version is used (`new.html`).

Files: `public/landing.html`, `public/style.css`.

Not done: I didn't get to look at the page in a browser at 390px in light and dark, so that still needs a look.

`pnpm check` passes (20 tests).
