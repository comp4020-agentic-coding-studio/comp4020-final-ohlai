# Feature agents dashboard

Not part of the app. This is the tool I used to build the app: one git
branch, folder and Claude Code session per feature, with one page that shows
what every agent is doing and lets me plan features, talk to the agents, and
merge their work. Node built-ins only, nothing to install.

```
node server.js        # then open http://localhost:4000
```

Or double-click `start-hidden.vbs` to run it with no window (output goes to
`local/dashboard.log`). It keeps running after Claude Code closes, but not
after a restart or log out. To start it at login, put a shortcut to
`start-hidden.vbs` in `shell:startup`. Restart it after changing
`config.json`, `server.js` or `lib.js`. `index.html` is read on every load.

## Kept apart from the app

- It lives in `tools/feature-agents/` and nothing in the app imports it.
- The Docker image only copies `server.js`, `README.md`, `scripts/seed-jack.js`
  and `public/`, so it never ships.
- `pnpm check` doesn't cover it: TypeScript only checks `*.ts`, `spec/` and
  `scripts/`, and the tests only run `spec/`.
- Feature agents never edit it (`CLAUDE.md`, "Feature sessions"). It runs from
  the main folder only, even though every feature branch has a copy.
- `local/` (ports, session IDs, live state, logs) is gitignored.

## Where features are recorded

Each feature is a folder on main, `notes/features/<slug>/`:

- `feature.md`: title, status, dates and what I asked for. Only the dashboard
  writes it, and every change is a commit on main ("Start feature: X",
  "Merged: X", "Dropped: X").
- `prompts.md`: every message I sent the agent, word for word, written by a
  hook. Anything the dashboard added is after a line saying
  `[Added by the dashboard, not my words]`.
- `log.md` and `decisions.md`: what the agent did and why, and every decision.

Statuses: **planned** (no branch yet), **building** (branch, folder and agent),
**merged** (in main, and that's finished), **dropped** (kept on record, not
doing it). There was a separate **done** until 2026-11-08; merged features
are now done by definition. The features on the old board in `notes/features.md`
were imported on 2026-11-08, with their notes copied word for word into each
`log.md`.

## What each button does

- **+ Add feature**: **Start agent now** commits its `feature.md` on main,
  makes `../worktrees/<slug>` on branch `feat/<slug>`, copies my local
  database into it, runs `pnpm install`, starts the feature's app, and starts
  the agent on my prompt in the background. **Save as planned** only commits
  the `feature.md`.
- **Start agent / Edit / Drop** (planned features): start it as above, change
  what it says, or mark it dropped.
- **Drop** (building features): for a bad idea. Its app stops and it's
  recorded as dropped. Its folder and branch stay until **Remove worktree**,
  which commits anything uncommitted to the branch first and keeps the branch
  (it isn't merged), so the work and notes are still in git. Notes are then
  read from the branch.
- **Chat**: the conversation so far, read from Claude Code's saved transcript,
  and a box to message the agent. A message goes as a background turn
  (`claude -p --resume`). If the agent is mid-turn, it waits and goes as soon
  as the turn ends. If the session is open and idle in a terminal, sending
  closes that terminal session first, since one session can't run in two
  places. The conversation is kept, so Open session picks it back up.
  Anything a background turn wasn't allowed to do is listed in red.
- **Open session**: the same session in a Windows Terminal tab, for watching
  it live or approving something. Closing the tab ends that run of the
  session, not the session: its conversation is saved.
- **Preview ↗ | ✕**: Preview starts the feature's app if it isn't running and
  opens it. ✕ stops it. The dashboard runs each feature's
  app on its own port and data folder, so agents don't spend turns on it.
  After changing `server.js` an agent restarts it with
  `curl -s -X POST http://localhost:4000/api/features/$FEATURE_SLUG/apprestart`.
- **Check and merge**: commits the hook's `prompts.md`, refuses if the feature
  or main has uncommitted changes, starts the branch's own server on
  port + 1000, runs `pnpm check` against it, then `git merge --no-ff` into
  main. On a conflict it aborts and fills in a message asking the agent to
  merge main in. It never pushes.
- **Remove worktree**: deletes the folder and branch once merged. The feature
  stays in the list with its notes, read from main.
- **Carry on** (on an interrupted card): resumes the session with a message
  telling the agent it was cut off.
- **Retry setup**: re-runs setup. Each step skips what's already done.
  Unfinished setups also re-run when the dashboard starts.
- **Reopen** (merged, done or dropped features): a new feature that continues
  it, with a new branch from current main and a new session pointed at the old
  notes.
- **@ tagging**: typing @ in a description or a chat message lists matching
  features. Picking one writes `@slug`, which points the agent at that
  feature's notes (recorded as Related in `feature.md`).
- **System prompt**: text added to every feature agent's system prompt on
  every run (`system-prompt.md`, committed on main). Slash commands don't run
  from a system prompt, so ask for a skill in words.
- **Bells**: notifications when an agent needs me, finishes, fails or is
  interrupted. Silent, only features with their bell on, or all. Only while
  the page is open.
- Filters (All, Active = planned or building, Waiting = an agent has stopped
  and it's my turn, Planned, Merged, Dropped) and search are above the list.
  Click a card's title to collapse it.
- Every card ends with one row of buttons: everyday ones on the left, and on
  the right in black the one that moves the feature on (Start agent, Check
  and merge, Remove worktree).

## Statuses on a building feature

- **working / needs you / idle, open**: from the hooks, and the process is alive.
- **idle**: no session running. Messages go straight to the agent.
- **interrupted**: it was mid-turn when its process died. Use Carry on.
- **error**: the last background run failed. Its output is on the card.
- **never started**: the agent never got going.

Liveness comes from the claude process IDs that `launch.js` and background
runs record, checked against `tasklist`.

## How it knows what agents are doing

Each worktree gets a gitignored `.claude/settings.local.json` with its `PORT`,
`DATA_DIR`, `APP_URL`, git identity, and hooks that run this folder's
`hook.js`. It's rewritten whenever the dashboard starts. The hook writes
`local/state/<slug>.json` and appends every message to the feature's
`prompts.md`. Time and cost per feature come from the transcripts Claude Code
saves under `~/.claude/projects/`, priced at API rates.

## Config

`config.json`. `claudeSettings` is the path to a settings file with the
course API key, passed to Claude with `--settings` so this dashboard never
reads the key. On a subscription, set it to `""`. `headlessAllowedTools` is
what a background turn can do without asking (no push, checkout or reset).
