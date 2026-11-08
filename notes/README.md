# Notes

Working notes for the final project, kept as I go so the final docs have
something real to come from. Claude writes to these during every session
(the rules are in `CLAUDE.md`, under "Working with me").

- `features/<slug>/` is one folder per feature, and is the board since
  2026-11-08. `feature.md` is its title, status (planned, building, merged,
  dropped), dates and what I asked for. `prompts.md` is everything I
  said, word for word, written by a hook. `log.md` and `decisions.md` are what
  Claude did and why. The feature agents dashboard in `tools/cannu/`
  plans, starts, merges and closes these.
- `features.md` was the board until 2026-11-08. Its features were imported
  into `features/<slug>/` (notes copied word for word into each `log.md`), and
  it's kept as it was.
- `decisions.md` is every decision, big or small, with what I picked and why.
  The ADRs in `docs/adr/` are the few that change the architecture. This is
  everything else.
- `sessions/` has one file per day for work done on main: what we did, what I asked, what Claude got
  wrong and how it got fixed.
- `questions.md` is the open questions from crit feedback that the final docs
  have to answer.
