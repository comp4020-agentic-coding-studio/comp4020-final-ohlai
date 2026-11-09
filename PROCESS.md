# Process overview

## Where it started

I've been building a nutrition tracker called Macros since starting COMP4020, and my first
thought was to just use that. It's single-user though, the code lives on my
home server, and dumping it in here would have made the commit history pretty
meaningless. So I kept to the same niche because its the the area I know and
started fresh. The idea came from a real gap: a PT writes a program, sends it
off, and then has no idea what the client actually lifted.

## What good means, and where it came from

I set the bar for good as the app fitting each person where they are. The client is on a phone between sets, so their side is built for a phone, logging a set is one tap and everything is easy to reach on a small screen. The PT is at a desk planning, so their side is a desktop dashboard with the detail they need to do their job. The README explains why, CLAUDE.md turns it into rules ("Who's on what screen"), and spec/programs.test.ts checks the ones that can be tested.

For the set rows I didn't want to reinvent the wheel, so I based them on [Hevy](https://www.hevyapp.com/), a workout logger with tried and true UI. Hevy has nothing for a PT and client working together though, so everything bar the reps / weight input for clients I had to do myself. The nav bar and styling come from my other app, Macros: two fonts and a pill shaped nav bar with a slider that moves to the tab you're on, which I designed to match how nav bars look after the iOS update.

Feedback in the crit said "pick a niche" and "make multi-user clearer". I chose not to pick a niche, because it defeats the point of having a PT build your program. A rowing-only gym app wouldn't leave much variety for a PT to customise, and if you don't need a PT you don't need the app to be real-time or multi-user either.

I did take on the multi-user feedback though. The PT dashboard shows each client's stats and status in real time, and PTs and clients can message and video call each other ([`b3d4e51`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/b3d4e51)). A client might have a question about their program, not know how to do an exercise, or need their PT to check their form, and bad form means injuries and less progress. That has to happen inside the app, since neither of them may want to hand out their personal number or social media.

## Stack

Node 24's built-in HTTP server and SQLite, plain HTML and JS, no dependencies
([ADR 0001](docs/adr/0001-stack.md)). The Fly box has 256 MB and one volume,
and better-sqlite3 won't build on my ARM64 laptop, which already cost me time
in crit 7. No framework was fine at three pages and got harder at fifteen.
Real-time is server-sent events. The server tells open pages "this changed"
and they refetch, so loading and updating is one code path
([`2c16515`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/2c16515)).
I picked it over WebSockets because updates only go one way and Node serves it
with no package, and over polling because hitting a second means every page
asking every second.

## How I worked with the agent

For crits 8 to 10 it was one Claude Code session on main. I gave it the brief
and Hevy as the reference for the client's set logging, had it read the
template's `fly.toml`, `Dockerfile` and `spec/` first, and deployed before the
UI was done
([`db21e72`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/db21e72)).
When I explained double progression (reps increase until the weight goes up then reps drop) it came up with the progress score that counts both adding reps and adding weight.

Crit feedback asked me to explain how decisions were made, and for most
of crits 8 and 9 I couldn't because nothing was written down. So in crit 10 I
had Claude ask me before deciding and prompt me if it wasn't sure of why I chose something, and set up `notes/` with a decision log and a session log
([`8b2fae1`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/8b2fae1)).

### Cannu

By November I was tired of queuing up changes for different features in one
long Claude session, or trying to remember which Claude tab was for which
feature, and several agents in one checkout would trip over each other. So I
built Cannu, a dashboard and agent management layer that runs one Claude Code
agent per feature, each with its own branch (`feat/<slug>`), git worktree, app
port for previews, database and notes. I chat with each agent from its
card and give feedback at the end of its turn, and can still open the real
session in a terminal. A hook writes every message I send into the feature's
`prompts.md` word for word, and the agent keeps `log.md` and `decisions.md`
next to it, like
[`notes/features/nudge-quiet-clients/`](notes/features/nudge-quiet-clients/).

Check and merge runs `pnpm check` against the branch's own server before it
merges. 19 features came through it, like
[`7b8541f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/7b8541f)
(nudge quiet clients). It moved into
the repo once I decided it was worth showing
([`e995f92`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/e995f92)),
but it isn't in the Docker image or `pnpm check`. I think Cannu is one of the
most interesting parts of this project, maybe more than Spotter itself, and it
has its own page at [`tools/cannu/README.md`](tools/cannu/README.md).

## Corrections

The rule is that a mistake ends up in `CLAUDE.md` or `spec/`, not just the code.

- The client's Send button in the chat drawer did nothing. An onclick written
  `e.target === drawer && drawer.close()` returned false and cancelled every
  click inside the drawer. Enter still worked, which hid it. The fix came with
  two rules: onclick handlers never return a value, and forms get tested by
  clicking
  ([`a794468`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/a794468)).
- The sidebar vanished because the server only served scripts on a hand-kept
  list, and I was on a stale server anyway. Now any top-level script is served,
  a spec test checks every script a page loads comes back, and `CLAUDE.md` says
  to restart after changing `server.js`
  ([`e5b86cc`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/e5b86cc)).
- "nullnullnull" showed up in the PT's client card, so nullable values now go
  through `el()`
  ([`9389668`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/9389668)).
- The Onboard client button shipped white on white because it was only checked
  behind a popup's blur. Pages now get checked with no popup open, in light and
  dark
  ([`bc81bf7`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/bc81bf7)).
- The nudge popup's Send could go to last time's list, because it was
  clickable before the new one loaded. Popups that load what they act on now
  stay disabled until the load finishes
  ([`d27a1af`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/d27a1af)).

## What I'd change

I ended up removing the mobile/desktop toggle from both sides as I didnt have time or tokens to polish them, but for the most part the client isnt using a PC to log gym sets and a PT isnt using a mobile to track clients. Accounts came late and left old link flows to clean up ([`168c326`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/168c326)), it would have been better to build them in from the start. 
And I'd still like a real PT to judge the progress chart, since that's the one
claim in the README nothing here can check. 
