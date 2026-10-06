# Process overview

## Where it started

I had been building a personal nutrition tracker (Macros) since August and
first asked whether I could reuse it. It failed the brief: it is single-user,
the code lives on my home server, and porting it in would have made the commit
history meaningless. I kept the domain I know (training, logging, progress) and
started fresh in this repo.

The app came from a real situation: a PT writes a program, sends it, and then
has no idea what the client actually lifted. I sketched the client side from
two Hevy screenshots, the logging screen and an exercise summary, because Hevy
already solves the hardest part, one-tap logging between sets.

## Stack

Node 24's built-in HTTP server and SQLite module, with plain HTML and JS pages
and no dependencies. The reasons and costs are in
[docs/adr/0001-stack.md](docs/adr/0001-stack.md). The short version: the box is
256 MB, the course gives one volume, and better-sqlite3 will not build on my
ARM64 laptop, which cost me time in crit 7.

## How I worked with the agent

I gave Claude Code the brief, the screenshots and the behaviour I wanted, and
had it read the template's `fly.toml`, `Dockerfile` and `spec/` before writing
anything. It deployed the first version before the UI was finished so the deploy
path was proven early.

The most useful exchange was about the progress chart. I described double
progression: reps go up at one weight until the top of the range, then the
weight goes up and reps drop. Weight times reps dips at every weight jump, so it
draws a lifter going backwards exactly when they progress. The agent proposed
scoring each set as weight plus a share of one weight step per rep above the
bottom of the range, and checked it against a sequence (30x8, 30x12, 32.5x8)
before wiring it into the chart.

## Corrections

- The agent first read the page's default layout before it knew whether the
  viewer was the PT or the client, so the PT page opened in mobile layout. Seen
  in a headless screenshot, fixed in `public/view.js`. The rule that client
  pages start mobile and PT pages start desktop is now in `CLAUDE.md`.
- `spec/programs.test.ts` came from the rule that the PT link must never log
  sets and the client link must never reveal the PT link.

## What's next

Crit 9 makes it real-time: the PT should see a set appear while the client is
still in the gym. This account will be rewritten at each crit.
