# Client dash add habits and graphs: decisions

## 2026-11-08 Progress uses the double progression score, not weight, sets or volume

What came up: I asked for progress across all exercises "summed up", using "the good progress measurement taken from the reps within the reprange not just weight or sets or volume by itself".

Picked: the existing score in `public/progress.js` (weight plus reps through the rep range as a fraction of a weight step). That's what I asked for, so this one isn't open.

## 2026-11-08 Open: how lifts are added up (waiting on me)

The agent picked, for now: each lift's latest best minus its first best, added over every lift, shown as "+N kg in range". Other options it gave me:

- Latest minus first (built). Shows the total moved. A bad last session on one lift pulls it down.
- Best ever minus first. Never goes down, but hides a slump.
- Average percent change per lift. Fairer between a squat and a curl, but a percent is harder to read than kg.

Agent's recommendation: keep latest minus first. I haven't answered yet.

## 2026-11-08 Progress number and week strip were too big

What came up: I said "+37.6 kg in range is wayyyy too big" and the habit tracker "is probably to big comapred to other elements", and asked for a pass over the whole client dashboard so the text sizes fit.

Picked: the progress number is the same size as the stats numbers and moves into the card's header, the strip squares shrink to 16px, and secondary text on client pages is one size (0.85rem). The before and after is in log.md (2026-11-08 23:47). The agent also chose these: drop "in range", show one dot on the progress line instead of one per workout, and make client buttons a step smaller. I asked for the general pass, so I didn't pick those one by one.

## 2026-11-08 Today's square is a thick light outline

What came up: the outlined "today, not logged yet" square.

Picked: a lighter grey outline, thicker, with the background showing in the middle, and the same outside size as the other squares. My call, from looking at it.

## 2026-11-08 Dashboard program days become full-width cards with a start button, "See it all" goes

What came up: the dashboard had small two-column day tiles and a "See it all" link to the program page, which has big black "Start Push" buttons.

Options: keep the tiles and the link, or merge the two. I suggested a full-width card per day with a black chevron button on the right meaning start, and asked what the agent thought. It agreed.

Picked: full-width cards with a round black chevron button, "Last done ..." on each card, and the "See it all" link removed completely.

## 2026-11-08 All workouts gets a chevron

What came up: the All workouts button at the bottom of the history didn't look like it went anywhere.

Picked: a chevron on the right, so it's clear it opens a new page.

## 2026-11-09 Touching the progress graph shows that point's value and date

What came up: I asked that touching the graph shows the value at that date, with the date in small text under it.

Picked: touch or drag along the line, and the number in the card's top right corner switches to that workout, with the date in small text under it. The agent put it in the corner rather than in a floating tooltip because a tooltip sits under the finger on a phone. The point stays picked after letting go. I haven't said anything about those two choices yet.

## 2026-11-09 Start buttons are rounded squares, not circles

What came up: the black chevron start buttons on the day cards were circles.

Picked: rounded squares (12px radius, matching the app's other buttons). This changes the 2026-11-08 entry above, where the agent built them as circles.

## 2026-11-08 Open: what else the habit card shows (waiting on me)

The example has three habits. The app only knows about workouts, so there's one "Workouts" row. Weekly check-in could be a second row since that data exists. Rows for meals, protein or weigh-ins would need new data. I haven't answered yet.
