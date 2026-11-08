# Program

A PT writes a training program and invites a client to it. The client logs
every set on their phone at the gym, and the PT sees what was actually lifted,
as it's lifted.

To try it, log in as the demo PT, `oli@example.com`, or the demo client,
`jack@example.com`. Both use the password `demo1234`, public on purpose. Use
two browsers to see both sides at once.

## What good means here

Good means the app fits each person where they are when they use it. The PT
and the client want different things from the same program, so they get
different apps over the same data. Wroblewski's *Mobile First* argues the phone
forces you to decide what matters. Only the client is on a phone, so only their
side is built that way.

**The client is on a phone, mid-set,** with sweaty hands and two minutes of
rest. Every row comes pre-filled from last workout, so most sets are one tap.
The row layout is Hevy's, which already gets this right. There's no layout
toggle: a client in the gym never wants the desktop view.

**The PT is at a desk, planning.** Their dashboard answers what a PT asks of a
client list: who's gone quiet, who's done this week's sessions, and which lifts
are moving or stalled. Progress is scored the way PTs program it, so adding
reps and adding weight both push the line up.

**It's real-time because the help is only useful during the session.** A client
who asks "bench felt heavy, should I drop it?" needs the answer inside their
rest, not on Friday. The PT sees sets land and a "Training now" marker, which
the client can hide, so they know when a question is coming. Form is the one
thing sets and reps can't show, and a PT can't check it from across town, so
video calls are next.

**It's multi-user because the relationship is the product.** Shirky calls this
situated software: built for a group that already exists, leaning on the trust
it already has. A PT never sees another PT's clients, and a chat is only for
the two people in it.

**What's logged stays logged.** A workout from eight weeks ago has to still be
there, or the progress line means nothing. Changing a client's program keeps
every set, and waits if they're mid-workout.

## What I chose not to build

No feed, leaderboard or exercise library. Sloan's "home-cooked meal" is an app
for the people you know, and a PT's clients don't need strangers. No email from
the server: the PT's own mail app sends the invite, so it comes from someone
the client knows. No calendar of training sessions: when a client trains is
their business. No desktop view for clients, yet.

## Enforced and judged

`spec/` enforces the rules good rests on. Only the client logs sets. Removing a
set closes the gap and finishing keeps the workout. A program change keeps
every set. A PT sees only their own clients, notes and exports. Only the PT and
client on a program can read their chat and check-ins. An invite works once.

The rest is judged. I've used it on my phone at the gym, which is how I judge
one-tap logging. Classmates used it at the crits as PT and client from the URL
alone. No working PT has used it yet, so whether the progress line reads the
way a PT reads progress is still open.

## Sources

- Robin Sloan, [An app can be a home-cooked meal](https://www.robinsloan.com/notes/home-cooked-app/).
- Clay Shirky, [Situated Software](https://web.archive.org/web/20040411202042/http://www.shirky.com/writings/situated_software.html).
- Luke Wroblewski, [Mobile First](https://abookapart.com/products/mobile-first).
- [Hevy](https://www.hevyapp.com/), the workout logger the set rows come from.
