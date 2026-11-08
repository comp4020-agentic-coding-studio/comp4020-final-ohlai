# Cannu: parallel agent management

The feature agents dashboard, called Cannu (a moth logo, `logo.png`). Not part of the app. This is the tool I used to build the app: one git
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

In `feature.md` a feature is **planned** (no branch yet), **building**
(branch, folder and agent), **merged** (in main, and that's finished) or
**dropped** (kept on record, not doing it). There was a separate **done** until
2026-11-08; merged features are now done by definition. On the page, building
splits into **waiting** (its agent has stopped and it's my turn) and
**working**, so every card shows one of: waiting, working, planned, merged,
dropped. The features on the old board in `notes/features.md`
were imported on 2026-11-08, with their notes copied word for word into each
`log.md`.

## What each button does

- **+ New feature** (a popup): name, what I want, and a model (the agent
  default unless I pick one, recorded in `feature.md`). What I've typed is
  kept for the browser tab if I close the popup to look at something else.
  **Start agent** commits its `feature.md` on main,
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
- **Reopen** (merged or dropped features): a new feature that continues
  it, with a new branch from current main and a new session pointed at the old
  notes.
- **@ tagging**: typing @ in a description or a chat message lists matching
  features. Picking one writes `@slug`, which points the agent at that
  feature's notes (recorded as Related in `feature.md`).
- **Agent defaults** (a popup): everything the dashboard sends an agent. The
  default model, the system prompt, extra environment variables, the carry
  on, new session and merge conflict messages, and what background turns may
  and may never do. Saved in `agent-defaults.json` (only what differs from
  the built-in values) and committed on main. It also lists what's fixed
  because the dashboard relies on it, and what every session gets anyway
  (`CLAUDE.md` and my Claude Code plugins).
- **Ponytail**: a Claude Code plugin I have installed. It switches itself on at
  the start of every session at its own default level, which is off on my
  machine, so it was never on for agents. `agent-defaults.json` sets
  `PONYTAIL_DEFAULT_MODE=full` in the agents' environment, so every agent runs
  it at full and nothing else changes.
- **Bells**: notifications when an agent needs me, finishes, fails or is
  interrupted. Silent, only features with their bell on, or all. Each
  feature's bell is before its name (select mode only), greyed out and
  unclickable while it has no agent.
  Only while the page is open.
- Filters: All, then one per status from most to least urgent (Waiting,
  Working, Planned, Merged, Dropped). All is sorted the same way, and within
  waiting, needing me comes before being cut off, then finished. Search is
  next to them. Click a card's title to collapse it.
- Every card ends with one row of buttons: everyday ones on the left, and on
  the right in black the one that moves the feature on (Start agent, Check
  and merge, Remove worktree).

## Waiting and working

A building feature is **working** while its agent is mid-turn or being set
up, and **waiting** otherwise. The pill adds why when it matters:

- **needs you**: it's asking for permission in its terminal.
- **terminal open**: finished its turn, and its terminal session is open.
- **interrupted**: it was mid-turn when its process died. Use Carry on.
- **error**: the last background run failed. Its output is on the card.
- **never started**: the agent never got going.
- No detail: finished its turn, no session running. Messages go straight to it.

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
reads the key. On a subscription, set it to `""`. `headlessAllowedTools` and
`headlessDisallowedTools` are the built-in permissions for background turns,
which Agent defaults can override. `defaultsFile` moves `agent-defaults.json`
(used to test on a throwaway clone).
