# Cannu

Cannu is the tool I built to run several Claude Code agents at once while
building the gym app. Each feature gets its own git branch, folder, app port
and Claude Code session, and one page in the browser shows what every agent is
doing. From that page I plan features, message the agents, preview their
version of the app and merge their work into main.

It isn't part of the app. Nothing in the app imports it, it isn't in the Docker
image and `pnpm check` doesn't test it. The code is in `cannu/`, and
`cannu/README.md` explains every button and how it works.

## What you need

- **Windows 10 or 11.** Cannu uses `tasklist`, `taskkill` and PowerShell to
  check on agents and stop apps, and Windows Terminal (`wt.exe`) for Open
  session. On a Mac or Linux the page loads, but running agents show as
  interrupted, and Open session and stopping an app don't work.
- **Node 24 or newer**, for `node:sqlite`. `mise.toml` pins 24.21.0.
- **mise**, with the repo trusted (`mise trust` then `mise install` in the
  repo root). Cannu runs `pnpm` through `mise exec`, so mise must be on your
  PATH.
- **pnpm 11**. mise installs it from `mise.toml`.
- **git**.
- **Claude Code** (`claude` on your PATH), logged in. Agents run on your own
  Claude account and cost what any Claude Code session costs. Each card shows
  its time and cost at API rates.
- Ports 4000 (Cannu) and 8081 upward (one per feature's app) free.

`config.json` has `claudeSettings`, a path outside the repo to the settings
file with my course API key. If that file doesn't exist on your machine, Cannu
leaves it out and Claude Code uses your normal login, so you don't need to
change it.

## The database isn't in the repo

I didn't ship the database. `data/` is gitignored, so a fresh clone has no
`data/app.db`. When Cannu sets up a feature it copies main's `data/app.db`
into the feature's folder if there is one, starts the feature's app (which
creates any missing tables), then runs `scripts/seed-jack.js` on it. So every
feature's preview has Jack's ten weeks of training and the demo logins, with
or without a database on main. You don't need to do anything.

Demo logins: PT `oli@example.com` / `demo1234`, client `jack@example.com` /
`demo1234`.

## Trying it

From the repo root:

```
mise trust && mise install
pnpm install
node tools/cannu/server.js   # then open http://localhost:4000
```

1. Press **+ New feature**, give it a name and say what you want (something
   small, like "Change the dashboard heading to Clients"), and press
   **Start agent**. Cannu commits a `feature.md` on main, makes
   `../worktrees/<slug>` on branch `feat/<slug>`, installs packages, starts
   that feature's app and starts the agent.
2. Watch the card go from working to waiting. Open **Chat** to see what the
   agent said and reply to it, and **Preview** to open the feature's own copy
   of the app.
3. Press **Check and merge**. Cannu runs `pnpm check` on the branch and merges
   it into main if it passes. It never pushes.

The worktrees go in a `worktrees` folder next to the repo, not inside it.

## The cards already there are my history

Every feature I built with Cannu is on the page, read from
`notes/features/`. Cannu's live state (ports, folders, session IDs) is in the
gitignored `cannu/local/`, so on a fresh clone a feature I left mid-build
shows as building with no branch or agent behind it. Its Chat and Preview
won't do anything. Merged and dropped features still show their notes.
