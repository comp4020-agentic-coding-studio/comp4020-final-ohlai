# Multi-user test report

How the app behaves with several people in it, tested against the deployed app
by reading its logs. Expected behaviour is written before testing. The
observations get filled in from the test.

## Setup

- Follow the logs: `node scripts/fly-logs.js --app` (or
  `mise exec -- flyctl logs -a comp4020-final-ohlai` where flyctl runs).
- Two people, each in their own Chrome profile or incognito window, so they
  share no cookies.
- Person A: a PT, signed up from the home page. Person B: a client, opening the
  client link A sends them and setting a password.

### What a "room" is here

There are no rooms as such. A browser on a program link listens to that program
(`p<id>`). A logged-in browser listens to its own account (`u<id>`), which hears
about the programs and chats that person is in.

### Log lines to look for

| Event | Example line |
|---|---|
| Someone connects | `pt "Oli" u1 connected to live updates (1 watching u1, 2 connected in all)` |
| Someone leaves | `pt "Oli" p1 left live updates (0 watching p1, 1 connected in all)` |
| Server receives an action | `client "Jack" p1 logged Squat set 1: 5 x 100kg` |
| Server broadcasts an update | `server sent program update for program p1 to 2 connections` |
| Server refuses an action | `pt "Oli" p1 DENIED log (403 Only the client logs sets.)` |
| Server sends one person the full state | `client "Jack" p1 opened program` / `pt "Oli" u1 opened dashboard` |

## Scenarios

### a) Two users join

**Expected:** a `connected` line for each, with the counts going up. A on the
dashboard shows as `u<A>`, B on their program as `p<id>`.

**Observed:**

### b) One user's action reaches the people it's relevant to

**Expected:** B ticks a set. One `logged` line, then
`sent program update for program p<id> to N connections`, where N counts A's
dashboard, A's program view (if open) and B's own tabs. A's screen changes
within a second with no reload. Chat: B sends a message, `sent chat update`
reaches both of them.

**Observed:**

### c) Two actions in the same second

**Expected:** both actions are logged, each followed by its own broadcast.
SQLite takes writes one at a time. Two different sets both land. The same set
ticked twice from two tabs ends up as whichever arrived last, since logging a
set replaces that set number.

**Observed:**

### d) A user joins late

**Expected:** an `opened program` or `opened dashboard` line (the full state
sent to that one person), then a `connected` line. They see everything that
happened before they arrived, because it's all in the database, not in memory.

**Observed:**

### e) Leave and return (tab closed)

**Expected:** a `left live updates` line with the count going down. Changes
made while they're gone are logged and broadcast to whoever is left. When they
come back: `opened ...`, `connected ...`, and they see the changes they missed.

**Observed:**

### f) Separate rooms stay separate

**Expected:** a second PT (C) with their own client. C's actions broadcast only
to C's program and accounts. A's broadcast counts don't include C's
connections, A's dashboard never shows C's clients, and opening a chat with
someone you're not linked to gives `DENIED chat (404 ...)`.

**Observed:**

### g) Two users on different machines (`fly scale count 2`)

**Expected: live updates break.** Who is listening is kept in memory on one
machine (ADR 0003), so an action on machine 1 broadcasts to machine 1's
connections only. The broadcast count will be lower than the number of people
watching, and the person on the other machine has to reload. The data is still
right, since it's one SQLite file, but a second machine can't attach the same
volume, so scaling may not work at all. Scale back with `fly scale count 1`.

**Observed:**

### h) Restart the machine mid-session (`fly machine restart <machine-id>`)

**Expected:** every connection drops (no `left` lines, since the process is
killed), the machine restarts, then each open browser reconnects on its own
within a few seconds: a burst of `connected` lines. Nothing is lost, since
everything is in SQLite on the volume. An action sent during the restart
fails and the client sees an error, then works again after.

**Observed:**

## Findings

(What surprised me, and what changed because of it.)
