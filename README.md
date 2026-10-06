# Program

A PT writes a training program and sends it to a client. The client opens it on
their phone at the gym and logs every set as they go. The PT then sees what was
actually lifted, instead of whatever the client remembers by Friday.

## Who it's for

One PT and the few clients they program for. It's not a fitness social network
and it's not a marketplace. The two people on a program already know each other,
so a private link is enough to tell them apart. The PT gets one link, the client
gets another, and nobody else can find the program.

## What good means here

**Logging a set takes one tap.** The client is standing at a bench with a
dumbbell in each hand and two minutes of rest. Every row comes pre-filled with
what they did last session, so most of the time it's lift, tick, rest. If
logging needs typing or a menu halfway through a session, the app has failed. I
took the row layout (set, previous, kg, reps, tick) straight from Hevy, because
Hevy already gets this right.

**The progress line follows double progression.** Most PTs program a rep range.
You add reps at one weight until you hit the top, then go up a weight and drop
back to the bottom. A chart of heaviest weight hides all the rep work, and a
chart of weight times reps dips every time you go up a weight, which is kind of
the opposite of what happened. So the default chart scores each set as the
weight plus a share of one weight step for every rep above the bottom of the
range. Adding reps and adding weight both push the line up. You can still switch
it to plain weight, reps, estimated 1RM or volume.

**The PT sees real sets.** The whole point of sending a program instead of a PDF
is that the PT can see where the client stalled, skipped a set or went heavier
than written.

**What's logged stays logged.** Sets survive sessions, restarts and redeploys. A
session from eight weeks ago needs to still be there or the progress line means
nothing.

## What I chose not to build

No accounts or passwords, since a private link does the job for two people who
already trust each other. No exercise library with pictures and muscle maps. The
PT just types the names they already use. No feed, likes or leaderboards,
because this is between a PT and their client. No email sent from the server
either. The PT's own mail app sends the link, so it comes from someone the
client actually knows.

## Enforced and judged

The checks in `spec/` enforce that only the client link can log sets, that the
client link never gives away the PT link, and that a program needs at least one
exercise. The rest I have to judge. Is logging really one tap between sets? I'll
find out by using it on my phone at the gym. Does the progress line match how a
PT reads progress? That one needs an actual PT.

## Sources

- Robin Sloan, [An app can be a home-cooked meal](https://www.robinsloan.com/notes/home-cooked-app/).
  Software for a few people you know gets to skip a lot of what public apps need.
- Clay Shirky, [Situated Software](https://web.archive.org/web/20040411202042/http://www.shirky.com/writings/situated_software.html).
  Building for one small group, and leaning on the trust that's already there.
- [Hevy](https://www.hevyapp.com/), the workout logger I copied the set rows
  from.
