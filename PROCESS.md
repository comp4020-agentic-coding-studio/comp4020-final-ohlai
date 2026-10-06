# Process overview

## Where it started

I've been building a nutrition tracker called Macros since August, and my first
thought was to just use that. It doesn't fit the brief though. It's single-user,
the code lives on my home server, and dumping it into this repo would have made
the commit history pretty meaningless. So I kept the area I know (training,
logging, tracking progress) and started fresh here.

The idea came from a real gap. A PT writes a program, sends it off, and then has
no idea what the client actually lifted. I sketched the client side from two
Hevy screenshots, the logging screen and an exercise summary, since Hevy already
solves the hardest part, which is logging a set in one tap between sets.

## Stack

It runs on Node 24's built-in HTTP server and SQLite module, with plain HTML and
JS pages and no dependencies at all. The full reasoning is in
[docs/adr/0001-stack.md](docs/adr/0001-stack.md). At a high level the Fly box
only has 256 MB, the course gives one volume, and better-sqlite3 won't build on
my ARM64 laptop, which already cost me time in crit 7. This did mean writing the
pages without a framework, which is fine at three pages but won't be at fifteen.

## How I worked with the agent

I gave Claude Code the brief, the screenshots and how I wanted it to behave, and
had it read the template's `fly.toml`, `Dockerfile` and `spec/` before writing
anything. It deployed a first version before the UI was done, so I knew the
deploy worked early.

The most useful back and forth was about the progress chart. I explained double
progression to it. Reps go up at one weight until you hit the top of the range,
then the weight goes up and the reps drop. Weight times reps dips at every
weight jump, so it shows you going backwards right when you're progressing. The
agent came back with scoring each set as the weight plus a share of one weight
step per rep above the bottom of the range. It checked that against a run of
sets (30x8, 30x12, 32.5x8) to make sure the line never drops before putting it
in the chart.

## Corrections

- The PT page opened in the mobile layout, because the page picked its default
  before it knew who was looking. I caught it in a screenshot and the fix is in
  `public/view.js`. The rule that client pages start on mobile and PT pages
  start on desktop is now in `CLAUDE.md` so it doesn't come back.
- `spec/programs.test.ts` came out of the rule that the PT link can never log
  sets and the client link can never show the PT link.

## What's next

Crit 9 makes it real-time, so the PT sees a set land while the client is still
at the gym. I'll rewrite this at each crit.
