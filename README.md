# Program

A PT writes a training program and sends it to one client. The client opens it
on their phone in the gym and logs every set. The PT sees what was actually
lifted, not what the client remembers on Friday.

## Who it's for

One PT and the handful of clients they program for. Not a public fitness
network, not a marketplace. The two people on a program already know each
other, so a private link is enough to tell them apart: the PT has one link, the
client has another, and nobody else can find the program.

## What good means here

**Logging a set takes one tap between sets.** The client is standing at a bench
with a dumbbell in each hand and two minutes of rest. Every row is pre-filled
with what they did last time, so the common case is: lift, tick. Anything that
needs typing, scrolling or a menu in the middle of a session is a failure. I
took the row layout (set, previous, kg, reps, tick) from Hevy, which gets this
right.

**The progress line tells the truth about double progression.** Most PTs
program a rep range: add reps at one weight until you hit the top, then add
weight and drop back to the bottom. Charting heaviest weight hides the rep work,
and charting weight times reps punishes the weight jump. The default chart
scores each set as weight plus a share of one weight step for every rep above
the bottom of the range, so both kinds of progress move the line up. The client
can still switch to raw weight, reps, estimated 1RM or volume.

**The PT sees real sets.** The point of sending a program instead of a PDF is
that the PT can see where the client stalled, skipped a set or went heavier
than written.

**What's logged stays logged.** Sets persist across sessions, restarts and
redeploys. A session from eight weeks ago has to still be there for the progress
line to mean anything.

## What I chose not to build

Accounts and passwords: a private link does the job for two people who already
trust each other. An exercise library with pictures and muscle maps: the PT
types the names they already use. A social feed, likes or leaderboards: this is
between a PT and a client. Server-sent email: the PT's own mail app sends the
link, so it comes from someone the client knows.

## Enforced and judged

Enforced in `spec/`: only the client link can log sets, the client link never
reveals the PT link, and a program needs at least one exercise. Judged: whether
logging really is one tap between sets, which I will judge by using it on my phone at
the gym, and whether the progress line matches how a PT reads progress.

## Sources

- Robin Sloan, [An app can be a home-cooked meal](https://www.robinsloan.com/notes/home-cooked-app/):
  software for a few people you know is allowed to skip what public apps need.
- Clay Shirky, [Situated Software](https://web.archive.org/web/20040411202042/http://www.shirky.com/writings/situated_software.html):
  building for a specific small group, and relying on the trust already in it.
- [Hevy](https://www.hevyapp.com/), the workout logger whose set rows I copied
  because they already solve one-tap logging.
