# Real-time: the PT sees a set land without reloading: log

Imported word for word from the board in `notes/features.md` on 2026-11-08, when the board moved to one folder per feature. Built on main before the feature agents dashboard existed, so there's no prompts.md.

- 2026-10-19: Still missing from crit 9. Needs server-sent events (ADR 0001
  already guessed this). The events table from crit 10 could be what gets
  pushed.
- 2026-10-19: Built with the accounts work. Server-sent events push a short
  "this changed" and the page refetches. The PT program view, dashboard and
  chat all update live. Checked the stream with curl, not yet with two real
  browsers side by side.
