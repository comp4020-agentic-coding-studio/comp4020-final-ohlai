# Process overview

## Where it started

I've been building a nutrition tracker called Macros since August, and my first
thought was to just use that. It doesn't fit the brief though. It's single-user,
the code lives on my home server, and dumping it into this repo would have made
the commit history pretty meaningless. So I kept the area I know (training,
logging, tracking progress) and started fresh here.

The idea came from a real gap. A PT writes a program, sends it off, and then has
no idea what the client actually lifted. I sketched the client side from two
Hevy screenshots, the logging screen and an exercise summary.

## What good means, and where it came from

The through line is fit. The PT and the client want different things from the
same program, so the app should fit each of them where they are. The client is
on a phone in the gym between sets, so their side opens in a phone layout and
logging is one tap. The PT is at a desk building programs and checking on
clients, so their side opens in a desktop layout. Both can switch. That idea is
the README's argument, it's a rule in `CLAUDE.md`, and it's why the first bug I
fixed was a layout bug (below).

## Stack

It runs on Node 24's built-in HTTP server and SQLite module, with plain HTML and
JS pages and no dependencies. The full reasoning is in
[docs/adr/0001-stack.md](docs/adr/0001-stack.md). At a high level the Fly box
only has 256 MB, the course gives one volume, and better-sqlite3 won't build on
my ARM64 laptop, which already cost me time in crit 7. This did mean writing the
pages without a framework, which is fine at three pages but won't be at fifteen.

## How I worked with the agent

I gave Claude Code the brief, the screenshots and how I wanted each side to
behave, and had it read the template's `fly.toml`, `Dockerfile` and `spec/`
before writing anything. It deployed a first version before the UI was done, so
I knew the deploy worked early ([`db21e72`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/db21e72)).

The most useful back and forth was about the progress chart. I explained double
progression to it. Reps go up at one weight until you hit the top of the range,
then the weight goes up and the reps drop. Weight times reps dips at every
weight jump, so it shows you going backwards right when you're progressing. The
agent came back with scoring each set as the weight plus a share of one weight
step per rep above the bottom of the range, and checked it against a run of sets
(30x8, 30x12, 32.5x8) to make sure the line never drops.

After using the first version I asked for the things a client actually needs
mid-workout: picking which workout to do, finishing and saving it, and swiping a
set away ([`426caa7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/426caa7)).
That meant sets now belong to a workout rather than a calendar day, so
"previous" shows the last time you did that workout. I also had it write a seed
script for a demo client, Jack, with ten weeks of uneven double progression, so
the chart has something real looking to show.

The look comes from Macros. I tried its warm paper style first and then
switched to its black and white mono style, which keeps colour for data only.
It started as a toggle with the classic look still there. In crit 10 I dropped
classic and kept mono only.

## Corrections

- The PT page opened in the mobile layout, because the page picked its default
  before it knew who was looking. I caught it in a screenshot and the fix is in
  `public/view.js`. The rule that client pages start on mobile and PT pages
  start on desktop is now in `CLAUDE.md` so it doesn't come back.
- The agent named a helper `history`, which would have replaced the browser's
  own `history` and broken the back button. It caught that before shipping and
  renamed it.
- `spec/programs.test.ts` came out of the rules that the PT link can never log
  sets and the client link can never show the PT link. When workouts arrived
  the spec broke, because logging now needs a started workout. I updated the
  spec to the new flow and added checks for removing a set and finishing.

## Crit 10: telling people apart

The app already knew who was looking, since the PT link and the client link are
different, but nothing on the server said so. I had Claude ask me how the logs
should work before writing any code, and it came back with four questions:
how to name a person, what to log, what format, and where to keep it. I went
with role, name and program id (never the token, since that's the password),
every action plus program opens and refusals, plain sentences I can read out at
the crit, and both stdout and an events table so the history outlives Fly's log
retention. The access rules and why are in
[`docs/adr/0002-who-can-do-what.md`](docs/adr/0002-who-can-do-what.md), and
`CLAUDE.md` now says tokens never go in a log line.

The crit feedback so far kept pointing at the same gap: I make decisions but
don't keep a record of them, so the docs end up reconstructed at the end. So I
set up `notes/` with a feature board, a decision log and a session log, and
added rules to `CLAUDE.md` so Claude asks me when a decision comes up and writes
it down as we go.

## What's next

Real-time is still missing from crit 9, so that's first: the PT should see a set
land without reloading. After that, picking a niche and making the multi-user
side clearer, both from crit feedback. The board in `notes/features.md` has the
detail.
