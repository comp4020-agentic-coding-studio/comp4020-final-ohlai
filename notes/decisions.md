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
