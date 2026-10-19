# Decision log

Newest at the bottom. Each entry: what came up, the options, what I picked and
why. Claude asks me before deciding anything here, then writes it down.

## 2026-10-19: How the logs say who did what (crit 10)

- **Identity in a log line.** Options: role + name + program, role + short
  token hash, or both. Picked role + name + program. Easy to read out at the
  crit, and names aren't the password, tokens are.
- **What gets logged.** Options: actions only, actions + opens + refusals, or
  every request. Picked actions + opens + refusals. Opens let me say "the PT
  just looked", refusals show the permission check working. Static files say
  nothing about people.
- **Format.** Options: readable sentence or JSON lines. Picked sentences, since
  I'm reading them aloud from `flyctl logs`.
- **Where it's kept.** Options: stdout only, or stdout + an events table. Picked
  both. Fly only keeps stdout for a short while, and the table could become a
  PT-facing activity view later.

Full write-up in `docs/adr/0002-who-can-do-what.md`.

## 2026-10-19: Claude prompts me on decisions and keeps notes

- After crit feedback I want deeper docs for the final project, written from
  what actually happened, not reconstructed at the end. Claude now asks me when
  a decision comes up and logs it here, keeps a session log, and works from a
  feature board. Rules are in `CLAUDE.md`.

## 2026-10-19: Mono style only

- Dropped the classic/mono toggle and kept mono everywhere. The look comes from
  my Macros app (black and white, colour for data only). One style means one
  thing to design and check, and the toggle wasn't for either user.

## 2026-10-19: Landing page, logins, PT dashboard, chat

- **How logging in works.** Options: email + password with links still working,
  email + password with links retired, or magic link by email. Picked the first.
  Nobody has to sign up to start training, Jack's seeded links keep working, and
  no email service. Asked whether "a private link is enough" was a course
  requirement. It wasn't, it was my own call, and the spec leaves identity open.
- **What the dashboard shows per client.** Picked who's gone quiet, the last 7
  days against the program, and lifts moving up or stalled, each opening into
  the detail. Instead of a live activity feed I asked for chat with the PT.
- **Video calls.** Options: browser WebRTC with Google's free STUN server, a
  hosted video service, or chat only for now. Picked chat only, with photos.
  Video goes on the board.
- **Chat shape.** Options: one thread per program, one per PT and client, or
  live only. Picked one per PT and client, so it carries on across programs.
- **Landing page audience.** PTs in general, with a small link for clients. The
  niche is still open.
- **Old programs.** Claimed by opening the PT link while logged in, nothing moved
  automatically.
- **Screens.** For now the PT only uses a desktop and the client only uses a
  phone. PT pages don't need to fit a phone.
- Claude's defaults, not asked: only a logged-in PT can write a program, the
  dashboard counts the last 7 days rather than a calendar week, photos are
  shrunk on the phone and capped at 5 MB.

Write-up in `docs/adr/0003-accounts-and-chat.md`.

## 2026-10-19: Logs for multi-user testing (crit 10 whiteboard)

- The tutor's checklist asked for logs of connect, disconnect, actions received,
  updates broadcast, refusals and state sent to one user. Ours had actions,
  refusals and opens, but nothing for live connections. Added connect and
  disconnect lines with counts, and a line for every update sent with how many
  connections it reached. Stopped logging "opened" on refetches after a live
  update, since they flooded the log.
- Kept plain sentences rather than the whiteboard's `key=value` example, same
  reason as before: I read them aloud.
- Wrote `docs/testing/multi-user-test-report.md` with the expected behaviour for
  the eight scenarios, observations to fill in.
- `scripts/fly-logs.js` follows the logs through Fly's API, because Smart App
  Control blocks flyctl.exe on my laptop.
