# Program

A PT writes a training program and sends it to a client. The client opens it on
their phone at the gym and logs every set as they go. The PT sees what was
actually lifted, instead of whatever the client remembers by Friday.

## Who it's for

One PT and the few clients they program for. The two people on a program
already know each other, so a private link is enough to tell them apart. The PT
gets one link, the client gets another, and nobody else can find the program.

## What good means here

Good means the app fits what each person needs, where they are when they use
it. The PT and the client want different things from the same program, so they
get different views of the same data.

**The client is on a phone, mid-set.** They're standing at a bench with sweaty
hands and two minutes of rest. Their page opens in a phone layout and every row
comes pre-filled with what they did last workout, so most of the time it's
lift, tick, rest. The rest timer starts on its own and removing a set is a
swipe. Anything that needs typing or a menu mid-session is a failure. I took the
row layout from Hevy, which already gets this right.

**The PT is at a desk, planning.** They write programs and check in on clients
between sessions, so their page opens in a desktop layout. They need to see
where a client stalled or went heavier than written, which is the point of
sending a program instead of a PDF.

Either person can flip layouts, since sometimes the PT checks in from the gym
floor. The default is just the guess that's right most of the time.

**Progress has to read the way a PT reads it.** Most PTs program a rep range.
You add reps at one weight until you hit the top, then go up a weight and drop
back to the bottom. A chart of weight times reps dips every time you go up a
weight. The default chart scores each set as the weight plus a share of one
weight step for every rep above the bottom of the range, so adding reps and
adding weight both push the line up.

**What's logged stays logged.** A workout from eight weeks ago needs to still be
there or the progress line means nothing.

## What I chose not to build

No accounts, since a private link does the job for two people who already
trust each other. No exercise library, because the PT already has names they
use. No feed or leaderboards. No email from the server either. The PT's own
mail app sends the link, so it comes from someone the client knows.

## Enforced and judged

The checks in `spec/` enforce that only the client link can log sets, that the
client link never gives away the PT link, that removing a set closes the gap in
set numbers, and that finishing a workout keeps its sets. The rest I have to
judge. Is logging really one tap between sets? I'll find out on my phone at the
gym. Does the progress line match how a PT reads progress? That needs an actual
PT.

## Sources

- Robin Sloan, [An app can be a home-cooked meal](https://www.robinsloan.com/notes/home-cooked-app/).
  Software for a few people you know gets to skip a lot of what public apps need.
- Clay Shirky, [Situated Software](https://web.archive.org/web/20040411202042/http://www.shirky.com/writings/situated_software.html).
  Building for one small group, and leaning on the trust that's already there.
- Luke Wroblewski, [Mobile First](https://abookapart.com/products/mobile-first).
  Starting from the phone forces you to work out what matters on the screen.
- [Hevy](https://www.hevyapp.com/), the workout logger I copied the set rows
  from.
