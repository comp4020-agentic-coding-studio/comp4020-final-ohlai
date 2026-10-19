# 2. Who can do what, and the log that says who did

## Context

Two kinds of people use a program: the PT who wrote it and the client who
trains on it. There are no accounts (README, "What I chose not to build"). Each
program has two private links, and the link someone holds is who they are. Crit
10 asks the app to tell people apart and to show who did what from the server
logs alone.

## Decision

**Access.** The server checks the link on every request in `server.js`. The
page never decides anything.

| | PT link | Client link |
|---|---|---|
| See the program, sets and workouts | yes | yes |
| See the other link | sees the client link, to send it | never sees the PT link |
| Start, log, remove, finish, discard | 403 | yes |
| Add to a dashboard / set a password | logged-in PT, if no other PT has it | yes, first time only |

Once accounts exist (ADR 0003), a logged-in PT sees only the programs on their
own dashboard, and a chat can be read only by the PT and client a program links.

The PT can't log because a set is the client's record of what they lifted. If
the PT could change it, the progress line would stop being the client's own
truth. The client can't see the PT link because it would let them rewrite the
program they are being coached on. `spec/programs.test.ts` checks both.

**Logging.** Every action, every program open and every refusal writes one line:

```
2026-10-19T03:12:04Z client "Jack" p3 logged Squat set 1: 5 x 100kg
2026-10-19T03:12:09Z pt "Sam" p3 DENIED log (403 Only the client logs sets.)
2026-10-19T03:13:40Z client "Jack" u2 sent a message to "Sam"
```

- A person is shown as role, name, and either the program id (`p3`, someone on
  a link) or their user id (`u3`, someone logged in, for signing up, logging in,
  chat and the dashboard). A claim is logged as whoever is logged in, not the
  link's owner.
  Names are safe to print and easy to read out. The token never appears, since
  it is the password.
- Static files (CSS, fonts, pages) are not logged. They say nothing about who
  did what.
- Plain sentences, not JSON, so I can read them aloud from `flyctl logs`.
- Each line goes to stdout and into an `events` table on the volume. Fly keeps
  stdout only for a short while. The table keeps the history for debugging, and
  later for the PT.

## What this means

- Two clients called "Jack" on one program can't happen (one client per
  program), but two programs with the same names are told apart by `p<id>`.
- Anyone who gets a link is that person. That's the trade for no accounts.
- The `events` table grows forever. At one PT's traffic that's fine for years.
