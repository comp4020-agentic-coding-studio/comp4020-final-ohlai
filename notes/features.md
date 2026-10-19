# Feature board

Claude reads this at the start of every session. Each feature gets dated notes
underneath it as work happens. Only I move a feature to Done.

## Doing

### Real-time: the PT sees a set land without reloading
- 2026-10-19: Still missing from crit 9. Needs server-sent events (ADR 0001
  already guessed this). The events table from crit 10 could be what gets
  pushed.

## Next

### Pick a niche
- 2026-10-19: Crit feedback: pick a sport or a subset of people. Designing for
  "a PT and a client" is too broad to make calls from. Candidates to think
  about, not decided: strength/powerlifting coaching, rehab after injury, online
  coaching where the PT never sees the client in person.

### Make multi-user clearer
- 2026-10-19: Crit feedback: the PT and client sharing a program doesn't read
  as multi-user. Idea from the crit: a live chat or video mode with your PT.
  Depends on the niche (an online coach needs chat much more than a gym-floor
  PT does).

### README shows how to use it
- 2026-10-19: Crit feedback: the README says what good means but not how to
  actually use the app. Needs a walkthrough for the PT side and the client
  side.

### A PT view of the events log
- 2026-10-19: The events table already records every action per program. The
  PT could see "Jack started Day 1 at 6:12am" without anything new on the
  server.

## Done

### Server-side log of who did what (crit 10)
- 2026-10-19: `audit()` in `server.js`, events table, ADR 0002. Tagged
  `crit-10`.
