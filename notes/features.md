# Feature board

Claude reads this at the start of every session. Each feature gets dated notes
underneath it as work happens. Only I move a feature to Done.

## Doing

### Real-time: the PT sees a set land without reloading
- 2026-10-19: Still missing from crit 9. Needs server-sent events (ADR 0001
  already guessed this). The events table from crit 10 could be what gets
  pushed.
- 2026-10-19: Built with the accounts work. Server-sent events push a short
  "this changed" and the page refetches. The PT program view, dashboard and
  chat all update live. Checked the stream with curl, not yet with two real
  browsers side by side.

### Landing page, logins and the PT dashboard
- 2026-10-19: Landing page at `/` speaking to PTs. Email + password accounts on
  top of the links (ADR 0003). Dashboard per client: last workout, last 7 days
  against the program, lifts moving up or stalled, unread messages. Each client
  card opens into the detail, and each lift links to its chart.
- 2026-10-19: Old programs join a dashboard when their PT opens the PT link
  logged in. For Jack on Fly: sign up, open his PT link, Add to my dashboard.

### Chat between PT and client
- 2026-10-19: One thread per PT and client, text and photos, live. Video calls
  left for later (see below).

## Next

### Pick a niche
- 2026-10-19: Crit feedback: pick a sport or a subset of people. Designing for
  "a PT and a client" is too broad to make calls from. Candidates to think
  about, not decided: strength/powerlifting coaching, rehab after injury, online
  coaching where the PT never sees the client in person.

### Video call with your PT
- 2026-10-19: Asked for alongside chat, put off for now. Browser WebRTC needs
  no dependency, but needs a TURN relay (paid) to connect on strict networks.

### Make multi-user clearer
- 2026-10-19: Crit feedback: the PT and client sharing a program doesn't read
  as multi-user. Idea from the crit: a live chat or video mode with your PT.
  Depends on the niche (an online coach needs chat much more than a gym-floor
  PT does).
- 2026-10-19: Chat and the dashboard should go a long way here. Worth checking
  at the next crit whether it now reads as multi-user.

### README shows how to use it
- 2026-10-19: Crit feedback: the README says what good means but not how to
  actually use the app. Needs a walkthrough for the PT side and the client
  side.
- 2026-10-19: First version added ("How to use it"). Probably wants
  screenshots.

### A PT view of the events log
- 2026-10-19: The events table already records every action per program. The
  PT could see "Jack started Day 1 at 6:12am" without anything new on the
  server.

## Done

### Server-side log of who did what (crit 10)
- 2026-10-19: `audit()` in `server.js`, events table, ADR 0002. Tagged
  `crit-10`.
