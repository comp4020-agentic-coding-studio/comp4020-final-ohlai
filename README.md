# Spotter

A PT writes a training program and invites a client to it. The client logs
every set on their phone at the gym, and the PT sees what was actually lifted,
as it's lifted.

To try it, log in as the demo PT, `sam@example.com`, and in a second browser (ideally on a mobile phone) as the client `priya@example.com`. Both use the password `demo1234`.
Priya shows the most of the client side: two programs' worth of workouts, a
program change, check-ins and a chat with Sam.

Sam has five clients, each showing a different part of the app. Any of them
can log in:

| Client | Login | What it shows |
| --- | --- | --- |
| Priya Shah | `priya@example.com` | Moving well, changed program 3 weeks ago, check-ins, a private note, an unread message |
| Tom Nguyen | `tom@example.com` | Bench and squat stalled for a month |
| Mia Roberts | `mia@example.com` | No workout in 10 days, so she's on the nudge list |
| Ben Carter | `ben@example.com` | Mid-workout, so "Training now" is on Sam's dashboard |
| Chloe Martin | none | Invited, hasn't signed up yet |

They all use the same `demo1234` for a password. Also try out signing up a new account yourself!


## What good means here

Good means the app fits each person where they are when they use it. The PT
and the client want different things from the same program, so they get
different apps over the same data.

**The client is on a phone, mid-set,** with sweaty hands and two minutes of
rest. Every row comes pre-filled from last workout, so most sets are one tap.
I based the set rows on Hevy rather than reinvent them, since its logging UI
already works. The look and the pill nav bar at the bottom come from my other
app, Macros, which I'd already designed to match how phone nav bars look now.
There's no layout toggle, because a client in the gym never wants the desktop
view.

**The PT is at a desk, planning.** Their dashboard answers what a PT asks of a
client list: who's gone quiet, who's done this week's sessions, and which lifts
are moving or stalled. Progress is scored the way PTs program it, so adding
reps and adding weight both push the line up.

**It's real-time because the help is only useful during the session.** A client
who asks "bench felt heavy, should I drop it?" needs the answer inside their
rest, not on Friday. The PT sees sets land and a "Training now" marker, which
the client can hide, so they know when a question is coming. Form is the one
thing sets and reps can't show, and a PT can't check it from across town, so
the client can video call their PT from the app. Bad form means injuries and
less progress.

**It's multi-user because the app is the PT and client working together.**
Hevy has none of that, which is why the set rows are the only part I took from
it. A PT never sees another PT's clients, and a chat or call is only for the
two people in it. It all happens inside the app, so neither of them has to
hand out their personal number or social media.

**What's logged stays logged.** A workout from eight weeks ago has to still be
there, or the progress line means nothing. Changing a client's program keeps
every set, and waits if they're mid-workout.

## What I chose not to build

No niche. Crit feedback said to pick one, but a rowing-only app wouldn't leave
a PT much to customise, and without a PT there's nothing to be real-time or
multi-user about. No feed, leaderboard or exercise library, since a PT's
clients don't need strangers and the PT already has names they use. No email
from the server: the PT's own mail app sends the invite, so it comes from
someone the client knows. No calendar of training sessions, because when a
client trains is their business. No desktop view for clients, yet.

## Enforced and judged

`spec/` enforces the rules good rests on. Only the client logs sets. Removing a
set closes the gap and finishing keeps the workout. A program change keeps
every set. A PT sees only their own clients, notes and exports. Only the PT and
client on a program can read their chat and check-ins, or call each other. An
invite works once.

The rest is judged. I've used it on my phone at the gym, which is how I judge
one-tap logging. Classmates used it at the crits as PT and client from the URL
alone. No working PT has used it yet, so whether the progress line reads the
way a PT reads progress is still open.

## Sources

- [Hevy](https://www.hevyapp.com/), the workout logger the set rows are based
  on.
- Macros, my own nutrition tracker, where the look and nav bar come from.

## How it was built

[PROCESS.md](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/blob/main/PROCESS.md)
covers how I built it and why. Most of it was built with
[Cannu](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/tree/main/tools/cannu),
the dashboard I made to run one Claude Code agent per feature.
