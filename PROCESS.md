# Process overview

## Where it started

I've been building a nutrition tracker called Macros since August, and my first
thought was to just use that. It's single-user though, the code lives on my
home server, and dumping it in here would have made the commit history pretty
meaningless. So I kept the area I know (training, logging, progress) and
started fresh. The idea came from a real gap: a PT writes a program, sends it
off, and then has no idea what the client actually lifted.

## What good means, and where it came from

The through line is fit. The client is on a phone between sets, so their side
is built for a phone and logging a set is one tap. The PT is at a desk planning,
so their side is a desktop dashboard. That idea is the README's argument, it's
the "Who's on what screen" section of `CLAUDE.md`, and the never rules (the PT
link can't log sets, a PT never sees another PT's clients, only the two people
on a program read its chat) are checked in `spec/programs.test.ts`.

The sources shaped how small I let it be. Sloan's home-cooked meal and Shirky's
situated software both say software for a few people who already trust each
other can skip a lot, which is why a private link was enough for the first
three weeks and accounts only came in when chat needed them
([ADR 0003](docs/adr/0003-accounts-and-chat.md)). Crit feedback kept saying
"pick a niche" and "make multi-user clearer". Both went on the board and both
got dropped as features. Multi-user ended up coming from chat, the dashboard
and live updates instead. <!-- TODO Oli: why drop pick a niche? not recorded -->


## Stack

Node 24's built-in HTTP server and SQLite module, plain HTML and JS, no
dependencies ([ADR 0001](docs/adr/0001-stack.md)). The Fly box only has 256 MB,
the course gives one volume, and better-sqlite3 won't build on my ARM64 laptop,
which already cost me time in crit 7. This did mean writing pages without a
framework, which was fine at three pages and got harder at fifteen.
Real-time is server-sent events. The server pushes a short "this changed" and
the page refetches, so there's one code path for loading and updating
([`2c16515`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/2c16515)).
ADR 0001 already guessed it would be server-sent events, since with no
framework it had to be written by hand. <!-- TODO Oli: why SSE over WebSockets or polling? spec asks for it -->


## How I worked with the agent

For crits 8 to 10 it was one Claude Code session on main. I gave it the brief
and two Hevy screenshots, had it read the template's `fly.toml`, `Dockerfile`
and `spec/` first, and deployed before the UI was done
([`db21e72`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/db21e72)).
The best back and forth was the progress chart. I explained double progression
(reps go up, then weight goes up and reps drop), and it came back with scoring
each set as the weight plus a share of one weight step per rep, checked against
30x8, 30x12, 32.5x8 so the line never dips.

The crit feedback kept saying I make decisions but don't keep a record of them.
So in crit 10 I had Claude ask before deciding (the logging work came back as
four questions with a recommendation each), and set up `notes/` with a decision
log and a session log
([`8b2fae1`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/8b2fae1)).
`CLAUDE.md` now says to stop and ask on anything a user would notice, and to
ask me why rather than make up a reason.

## Cannu

By November I wanted to give feedback on each feature on its own, and see from
one place which agent was working on what, instead of clicking through ten
terminal tabs. Several agents in one checkout would trip over each other. So I
built Cannu, a dashboard that runs one
Claude Code agent per feature, each on its own branch (`feat/<slug>`), git
worktree, app port and database
([decision](notes/decisions.md), [README](tools/cannu/README.md)). I picked
links to real sessions over a wrapper, so it works with the course key, and
status comes from Claude Code hooks. A hook writes every message I send into
the feature's `prompts.md` word for word, so nothing gets summarised away, and
the agent keeps `log.md` and `decisions.md` next to it.

I message agents from the board, preview each feature's version of the app, and
Check and merge runs `pnpm check` against the branch's own server before
`git merge --no-ff`. Fifteen features came through it, like
[`7b8541f`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/7b8541f)
(nudge quiet clients), and some got dropped from the board instead of half
built. It moved into the repo once I decided it was worth showing
([`e995f92`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/e995f92)),
but it isn't in the Docker image or `pnpm check`, and feature agents can't edit
it.

It took a few rounds to get right. Agents couldn't
commit with no git identity, merge refused everything because the hook wrote
`prompts.md` after the last commit, and a closed terminal tab lost its session
because the dashboard inherited variables from the Claude session that started
it. Each fix is in `notes/sessions/2026-11-07.md`. Every agent also gets
ponytail at full through `agent-defaults.json`, so they reach for the smallest
change.

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

The mobile/desktop toggle came out of every page in the end, since the PT is on
a desktop and the client is on a phone. <!-- TODO Oli: anything you'd do differently here? --> Accounts came late and left old link flows to clean up
([`168c326`](https://github.com/comp4020-agentic-coding-studio/comp4020-final-ohlai/commit/168c326)).
And I'd still like a real PT to judge the progress chart, since that's the one
claim in the README nothing here can check.
