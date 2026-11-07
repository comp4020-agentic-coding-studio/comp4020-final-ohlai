# Harness

The app is a gym program tracker for one PT and their clients. `README.md` says
what good means, which is that the app fits each person where they are: the
client on a phone mid-workout, the PT at a desk. These rules follow from that.

## Never

- Never let the PT link log or change a client's sets, and never put the PT
  link in anything the client link or a client login returns.
  `spec/programs.test.ts` checks both.
- Never show a PT another PT's clients, and never let anyone but the PT and
  client a program links read their chat or its photos. The spec checks the
  dashboard and the chat.
- Never delete or rewrite logged sets as a side effect. A set goes away only
  when the client removes it.
- Never put a link token in a log line. Every API action and refusal goes
  through `audit()` in `server.js`, so the logs say who did what
  (`docs/adr/0002-who-can-do-what.md`).
- Never add a dependency without a decision record in `docs/adr/`. The stack is
  Node built-ins and SQLite on purpose (`docs/adr/0001-stack.md`).

## Who's on what screen

For now the PT only uses a desktop and the client only uses a phone. Design and
check PT pages (dashboard, builder, PT program view) at desktop width, and
client pages (program, dashboard, settings, chat) at phone width (390px). Don't spend
effort making PT pages fit a phone.

## Every PT page

- Lives in the PT app shell: `class="app"` on `<body>` and `mountSide()` from
  `public/side.js`, so the sidebar is always there to navigate with.
- No mobile/desktop toggle. A PT on a desktop wants the desktop layout, so the
  layout follows the screen instead of a button.

## Every client page

- Logging a set is one tap when the client repeats last session. Rows are
  pre-filled from the previous session.
- Works at phone width (390px) with no horizontal scroll, and every control is
  reachable by keyboard.
- No mobile/desktop toggle. The client is on a phone in the gym, so client
  pages are built for phone width only. A desktop view for looking back over
  training is a stretch goal, not now.
- Client app pages (dashboard, settings, all workouts) have the bottom pill
  nav from `public/nav.js` and `class="client"` on `<body>`.
- Dark mode: every page loads `public/theme.js` in `<head>`. Colours follow the
  phone unless the client picks Light or Dark in Settings.
- Uses the mono style only (`data-style="mono"` on `<html>`). Colours come
  from the tokens in `public/style.css`, never a component's own hex value.

## Every change

- Run the app (`node server.js`), then `pnpm check`. Both must pass before a
  commit.
- Node doesn't reload `server.js`. After changing it, restart the server (or
  start a new one) before checking a page or pointing me at a URL, and stop
  the old one, so I never end up looking at a stale server.
- Look at the changed page at its width (see "Who's on what screen") before
  calling it done.
- An `onclick = (e) => ...` handler never returns a value (use braces, not
  `a && b`). One that returns false cancels the click, which once broke the
  client's Send button in the chat drawer.
- Test a form by clicking its button, not by calling submit in code, and check
  the result reached the server.
- Schema changes are additive: add columns with a guarded `ALTER TABLE` in
  `server.js`, never drop data on the volume.
- When the agent gets something wrong, the fix goes into this file or `spec/`,
  not just into the code.

## Working with me

I want the final docs written from what actually happened, so every session
leaves a trail in `notes/`.

- At the start of a session, read `notes/features.md` and say which feature
  we're picking up. Never move a feature to Done yourself, I do that.
- The notes are the raw material for my final docs, so more detail is always
  better than less. Notes are append-only: never delete, shorten, merge or
  reword an earlier entry, even one that turned out wrong. If something
  changed, add a new dated entry saying what changed and why, and point back
  to the old one.
- When a choice comes up that changes what the app does or how it's built
  (data shape, what a user sees, a library, a trade-off), stop and ask me with
  the options and your recommendation. Don't decide it silently. Small code
  details that nobody would notice are yours.
- Record every decision I make, not just the ones you asked about: things I
  pick, reject, change my mind on, or ask for in passing ("make it look like
  X", "drop that"). Write what came up, the options, what I picked and why. If
  it changes the architecture, also write an ADR. On main this goes in
  `notes/decisions.md`. In a feature session it goes in the feature's
  `decisions.md` (see below).
- If you can't tell why I made a decision, ask me before writing it down. Ask
  about that one decision specifically ("why bottom left rather than in the
  top bar?"), not a general "any reasons?". Never make up a reason for me.
- On main, keep `notes/sessions/YYYY-MM-DD.md` for today (create it if
  missing): what I asked for, what we did, what you got wrong and how it was
  fixed. Update it before each commit, not just at the end.
- Write notes plainly, in my voice. No em dashes.

## Feature sessions

Each feature has its own branch (`feat/<slug>`), its own folder
(`../worktrees/<slug>`), its own app port and its own data folder. The meta
dashboard in `COMP4020/meta/` starts these sessions. If `FEATURE_SLUG` is set
in your environment, you're in one.

- Work and commit only on your feature branch, in your folder. Never check
  out, commit to or merge into main, and never touch another feature's
  folder. I merge from the dashboard.
- Run the app with the `PORT` and `DATA_DIR` already in your environment, so
  you don't collide with other features. Use that port for every URL you give
  me.
- Everything about the feature goes in `notes/features/<slug>/`:
  - `prompts.md` is every message I send, word for word, with the time. A
    hook writes it. Never edit it. Read it at the start of every session.
  - `log.md` is what happened, newest at the bottom. For every piece of work:
    what I asked (quote me), what you did and which files changed, why it was
    done that way, what you tried that didn't work, what you got wrong and
    how it got fixed. When my feedback changes, adds or removes something,
    write what it was before, what it is now, and my reason.
  - `decisions.md` is every decision on this feature, in the same format as
    `notes/decisions.md`.
  - Update both before each commit, not just at the end.
- Don't edit `notes/features.md`, `notes/decisions.md` or `notes/sessions/`
  in a feature session. Every feature would conflict at merge time.
