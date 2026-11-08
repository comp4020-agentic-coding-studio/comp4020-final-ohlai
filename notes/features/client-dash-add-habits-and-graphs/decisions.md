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

## 2026-11-08 Open: what else the habit card shows (waiting on me)

The example has three habits. The app only knows about workouts, so there's one "Workouts" row. Weekly check-in could be a second row since that data exists. Rows for meals, protein or weigh-ins would need new data. I haven't answered yet.
