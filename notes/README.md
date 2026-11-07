# Notes

Working notes for the final project, kept as I go so the final docs have
something real to come from. Claude writes to these during every session
(the rules are in `CLAUDE.md`, under "Working with me").

- `features.md` is the board. Claude picks up from it at the start of each
  session and adds notes to a feature until I mark it done.
- `decisions.md` is every decision, big or small, with what I picked and why.
  The ADRs in `docs/adr/` are the few that change the architecture. This is
  everything else.
- `features/<slug>/` is one folder per feature built in its own branch and
  worktree (from 2026-11-07). `prompts.md` is everything I said, word for
  word, written by a hook. `log.md` and `decisions.md` are what Claude did and
  why. The meta dashboard in `COMP4020/meta/` starts and merges these.
- `sessions/` has one file per day for work done on main: what we did, what I asked, what Claude got
  wrong and how it got fixed.
- `questions.md` is the open questions from crit feedback that the final docs
  have to answer.
