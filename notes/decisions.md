# Decision log

Newest at the bottom. Each entry: what came up, the options, what I picked and
why. Every decision I make goes here, asked about or not. If the why isn't
clear, Claude asks me about that decision before writing it.

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

## 2026-10-19: Chat inside the program

- Wanted to message from the program view without leaving it: a chat button
  that opens a drawer from the bottom. I asked for bottom right, but mid-workout
  it covered the ✓ tick buttons. Options: bottom left, bottom right with page
  padding, or in the top bar during a workout. Picked bottom left on the phone,
  where it only covers the set number. The PT's desktop view keeps it bottom
  right. A red dot shows when a message arrives while it's closed.

## 2026-10-26: Record every decision, and ask why

- Asked for every decision I make to be recorded in the repo, not just the
  ones Claude asks me about. Where my reasoning isn't clear, Claude asks me
  about that specific decision. Added to "Working with me" in `CLAUDE.md`.

## 2026-10-26: The PT dashboard should be a desktop web app

- **What came up.** The dashboard looked like the phone layout stretched to a
  desktop screen. A PT managing several clients is at a desk, so it should look
  like a full web dashboard (sidebar, stat tiles, tables), like the example I
  shared.
- **Previews.** Claude can add the front end of features it thinks fit, with
  no backend, and I decide which are worth building. They're marked "Preview"
  on the page.
- Why: follows from the README's "fits each user where they are". The PT's
  screen is a desktop, so the dashboard should use it.

Claude's layout calls, waiting on my yes or no: the client detail opens as a
panel on the right instead of expanding in the list, a "Needs attention" list,
and a recent workouts feed across all clients. The 7-day strip of finished
workouts was kept when I dropped the calendar (see "Which previews to build").
Preview ideas: inbox, calendar, weekly check-ins, templates, CSV export, nudging
quiet clients, private notes per client.

## 2026-10-26: Which previews to build

- **Inbox: build it.** It's the way to manage chats on a desktop, one list of
  every client conversation instead of opening each client's chat.
- **Check-ins: build it.** Gives me a sense of how clients are going between
  workouts.
- **Templates: build it.** A no-brainer, nobody wants to write push / pull /
  legs again for every client.
- **Calendar: dropped.** I don't need to know ahead of time when a client plans
  to train. That's too personal and unnecessary. It might come back later for
  scheduling a call or meeting if I add calls, but not for workout sessions.
- **"Training now": keep it.** A client mid-workout might message with a
  question, so it helps to know. The client should probably be able to turn it
  off. That's a preview on the client's My programs page for now.
- **Export, nudge quiet clients, private notes:** stay as previews, undecided.

## 2026-10-26: How check-ins and templates work

- **Check-in questions.** Options: the PT writes their own, a fixed set with no
  body data, or a fixed set with bodyweight and photos. Picked the PT writes
  their own (1 to 5 or written answers), starting from a default set. A rehab
  PT asks about pain, a strength coach about sleep, which fits "good = fits each
  user".
- **Templates.** Options: save and start from in the builder, or also save from
  a client's live program. Picked save and start from, with a Templates page to
  rename and delete. A program is a copy of its template, so editing a template
  never changes a client's program.
- Claude's defaults, not asked: check-ins have no schedule or reminder, the
  client checks in whenever from My programs. Up to 8 questions. Each check-in
  keeps the questions it was answered against, so editing questions doesn't
  rewrite old answers. Built the "hide Training now" setting as a preview, not
  for real, because I said "perhaps".

## 2026-10-26: No mobile/desktop toggle on PT pages, builder in the app

- **Toggle.** Removed from the dashboard, builder and every PT page. On a
  desktop you want the desktop view and on a phone the phone view, so the
  button is clutter for the option of a worse experience. The layout follows
  the screen. The PT program view shares its page with the client, so it keeps
  the toggle for now.
- **Builder.** Moved inside the dashboard app with the sidebar, so navigation
  stays in one place.

## 2026-10-26: Editing a template

- Asked for an Edit button on each template that opens it full screen, the
  same way as writing a new program. It uses the builder itself (`/new?edit=`),
  with the template name in place of the client details and Save changes in
  place of Create program. Editing a template still never changes programs
  already started from it.
- Asked to put all of today's work on the live site instead of only local.

## 2026-10-26: Programs are written once, then assigned

- **No Write a program tab.** New program lives on the Programs page. It
  doesn't need its own tab.
- **Write without a client, assign after.** A PT very often writes a program
  once and reuses it for lots of clients, so having to pick a client while
  writing makes no sense. You assign a program to a specific client instead.
- **Days hold exercises.** In the builder you create a day, then the exercises
  inside it. Picking a day on every exercise was too much repetition.
- **Naming.** Options: rename Templates to Programs, or keep Templates. Picked
  Programs, so "template" is gone from the app.
- **Editing a program clients already have.** Options: each client keeps their
  own copy, or edits push to everyone. I first wanted edits to push to
  everyone, but clients would get confused about why things changed in their
  history. Picked their copy stays: editing changes it for the next client
  only.
- **Who you can assign to.** Options: a client you already have or a new one,
  or existing clients only. Picked either, with a new client's name and email
  typed in.
- Claude's defaults, not asked: the database table is still called
  `templates` so nothing on the volume gets renamed, and old `/new` and
  `/templates` links redirect.

## 2026-10-26: Demo logins

- Asked for a demo PT login (Oli) and a demo client login. `seed-jack.js` now
  makes `oli@example.com` (PT) and `jack@example.com` (client), both with the
  password `demo1234`, and links Jack's program to them. The password is in the
  public repo on purpose, so anyone can try the app. Claude pointed out that
  means anyone can log in as the demo PT, and I said yes.

## 2026-11-06: Client side built for the phone

- **No mobile/desktop toggle for clients.** A client looks at the app on their
  phone in the gym, not on a laptop. A desktop view for looking back over
  training afterwards is a stretch goal.
- **Bottom nav with Dashboard and Settings.** Asked for the nav from my Macros
  app as one long pill, without the separate add button, since there's no add
  or log page.
- **Privacy and log out go in Settings**, not on the dashboard.
- **Dark mode.** Asked for it.
- **Dashboard shows the last three workouts**, which expand when tapped, with
  a button to an all workouts page.
- **Program days as shortcuts on the dashboard**, with small text saying who
  the program is from. The program name on its own didn't say what it was.
- Claude's defaults, not yet confirmed by me:
  - `/me` stays the URL for the Dashboard.
  - The theme choice is System, Light or Dark, saved in this browser only,
    not on the account.
  - Tapping a day starts that workout straight away, with no confirm step.

## 2026-11-07: One branch, folder and session per feature, run from a dashboard

- **What came up.** I want to give feedback on each feature on its own, with
  one Claude session per feature, and see from one place which agents are
  working on what, instead of clicking through ten terminal tabs. I also need
  to add features, give feedback after an agent has worked on one, and merge
  features into main.
- **Agents in the same folder.** Several agents in one checkout would trip over
  each other. Picked git worktrees: one folder per feature in
  `COMP4020/worktrees/<slug>`, each on `feat/<slug>`, each with its own app port
  and data folder so the servers and SQLite files don't collide.
- **Wrapper or links.** Options: build a wrapper around Claude Code, or keep
  real Claude sessions and have the dashboard link to them. Picked links. I'd
  rather open the real session than use a wrapper, but I want the overview on
  the dashboard. Status comes from Claude Code hooks, so it works with the
  course API key and with a subscription.
- **Where the dashboard lives.** Picked `COMP4020/meta/`, outside the final
  project folder. (Reason not recorded yet.)
- **Notes per feature.** Options: keep one shared `features.md`,
  `decisions.md` and day file, or one folder per feature. Picked per feature.
  Shared files would conflict every time two branches merge.
- **How much the notes keep.** I want as much as possible about why we did
  things, so the docs are nearly written by the time I get to them. So: every
  message I send is saved word for word by a hook (not by Claude, so nothing
  gets summarised away), including the starting prompt and every bit of
  feedback, and notes are append-only. Claude never shortens or rewrites an
  earlier entry, it adds a new one.

## 2026-11-08: The dashboard runs each feature's app, notifications, a prompt for every agent

Follows the 2026-11-07 entry above. Built in `COMP4020/meta/`.

- **Who runs a feature's app.** Before, `CLAUDE.md` told every agent to run
  the app, so each one spent turns starting, checking and restarting it. I
  asked for the dashboard to start and stop each feature's app instead, and
  for the instruction to go, to save the agent's tokens. Now the dashboard
  starts the app when setup finishes, the card has Start preview, Preview and
  Stop app, and `CLAUDE.md` tells feature agents not to start it. After
  changing `server.js` an agent restarts it with one `curl` to the dashboard.
- **The app button's label.** "Open app :8081" became "Preview". I don't care
  what the port number is, so it's gone from the card. Other labels
  considered: View app, Open site, Try it, a bare ↗ icon.
- **Notifications.** Asked for a notification when an agent needs me or
  finishes, with a three-way toggle (silent, selected features, all) in case
  it gets annoying. Icons only, no names. In "selected" mode each card gets a
  small square bell to turn it on for that feature. They only show while the
  dashboard is open in a browser tab.
- **Time and cost per feature.** Asked for it if it was easy. Both come from
  the conversations Claude Code saves for each worktree. Cost is worked out at
  API prices, so on a subscription it's what it would have cost, not what I
  paid. Agent time only counts time inside a turn, not time waiting on me.
- **A prompt for every agent.** I want every feature agent to use
  `/ponytail full`, and I want to be able to add anything else every agent
  should hear. So there's an editable "Prompt for every agent" on the
  dashboard that goes at the start of each new agent's first prompt. Agents
  that already started don't get it.

## 2026-11-08: The prompt for every agent becomes a system prompt

- **What changed.** In the entry above, the text for every agent went at the
  start of each new agent's first prompt. I changed it to a system prompt.
  It's now added to every claude run with `--append-system-prompt`, so it
  also reaches agents that had already started, on their next turn.
- **What that changes for skills.** A slash command like `/ponytail full`
  only runs from a typed message, not from a system prompt. So the system
  prompt asks the agent to load the skill in words. Tested: an agent given
  that system prompt loaded ponytail at full level on its first turn.
- **Notification toggle look.** Asked for the toggle to look like the app's
  black-and-white style with a sliding selection, then for square corners
  instead of a pill, filled bell icons, and black for the selected one on a
  white background. A feature's bell turns black and rings when it's on.

## 2026-11-08: The dashboard moves into the repo, and features get a folder each

- **Where the dashboard lives.** On 2026-11-07 I said it mustn't be in the
  final project folder. I changed my mind because I may include it in the
  submission as an interesting part of how I built the app. Options: a
  `tools/` folder in the app repo, its own separate repo, or keep it outside
  and out of git. Picked `tools/feature-agents/` in the app repo. To keep it
  apart from the PT gym app: its own folder and README, not in the Docker
  image, not covered by `pnpm check`, feature agents never edit it, and its
  machine-local data (`local/`) is gitignored. It runs from main's folder only.
- **Where features are recorded.** The board in `notes/features.md` is
  retired. Options: one `feature.md` per feature in `notes/features/<slug>/`
  on main, or only the dashboard's own list. Picked a file per feature, so the
  record is in git, readable without the dashboard, and next to each
  feature's prompts, log and decisions. The dashboard commits every change
  to it on main.
- **Importing the old board.** Every feature on it got a folder, with its
  notes copied word for word into `log.md`. Before the move I checked the
  features under Doing and moved Real-time, Landing page and PT dashboard,
  Weekly check-ins and Programs to Done myself. Logout conformation stays in
  progress (it's had an issue I'll describe separately). My edit also took
  three features off the board. Asked about each: Client app for the phone
  is planned (Macros nav and the habit tracker are still to do), Chat between
  PT and client is done, Pick a niche is dropped (kept on record with the
  crit feedback).
- **Planned features.** Asked to be able to add a feature and plan it without
  an agent starting straight away. A planned feature is just its `feature.md`
  on main, with no branch, folder or agent. Start agent turns it into a
  normal feature. The imported "Next" features are planned.
- **Filters.** Asked for filters. Active (planned, building, merged), Planned,
  Building, Merged, Done, Dropped and All, plus a search box.
- **Talking to agents from the dashboard.** I closed the logout agent's
  terminal tab, which ended that run, and asked whether agents can keep
  running in the background, or whether it's better to talk to them only
  from the dashboard, with my messages going straight into the conversation
  instead of me copying and pasting. Closing a terminal tab always ends that
  run (the conversation itself is saved). Went with the dashboard: messages
  are sent as background turns, wait if the agent is mid-turn, and close an
  idle terminal session first, since one session can't run in two places.
  Each card has a chat view of the conversation. Open session is still there
  for watching live or approving something.
- **Reply size.** Asked for agent replies to show in full without scrolling,
  at least as long as the toggles and logout replies, and to scroll only when
  longer. The reply box now goes up to about 520px (both of those are about
  350px).

## 2026-11-08: Feature agents dashboard, second round of changes

- **Merged and done are one status.** Asked for merged and done to be the
  same thing: "as soon as you merge it should be considered done". Picked the
  word merged. Move to Done is gone. The 8 features marked done had their
  `feature.md` rewritten to merged, keeping the merge date (or the date I moved
  them to Done on the old board, for the imported ones).
- **@ tagging instead of the related features checkboxes.** Asked to remove
  the checkboxes and tag related features by typing @ in the description,
  with matching features popping up as soon as @ is typed. The hint under the
  box now starts "@ to tag a related feature". Works in the Add form, Edit,
  Reopen and the chat box.
- **Filters.** Asked what the difference between Building and Active was.
  Active was planned, building and merged; Building was only the ones with an
  agent. I suggested a one word filter for "waiting for you" in place of
  Building. Now: All (moved to the start), Active (planned or building, since
  merged now means finished), Waiting (an agent has stopped and it's my turn),
  Planned, Merged, Dropped. The chips are rounded rectangles like the
  notification toggle, not pills.
- **Buttons.** Asked for every card's buttons to be bottom left, with the
  suggested next action (the one that moves the state on) bottom right in
  black, like Start agent already was. Asked to remove the "Nothing written
  yet" line and "imported from the old board", and to show the created date on
  every feature. Card header order is time, status, then bell.
- **Preview.** Asked for Stop app to be fused with Preview, one outline with
  `[Preview | x]`, because the extra button appearing shifted the others. The
  x is always there and greyed out while the app isn't running.
- **Dropping a feature part way through.** Asked to be able to drop features
  that are already being built, if they turn out to be a bad idea. Drop stops
  the app and records it as dropped, but keeps the folder and branch. Remove
  worktree then commits anything left over to the branch and keeps the branch,
  since it isn't merged, so nothing is lost. Merged features can't be dropped
  (that would need a revert).

## 2026-11-08: The dashboard gets a name, agent defaults and popups

- **Name and logo.** Gave the dashboard a logo (an M-shaped mark) and the
  heading "Cannu - Parallel agent management", with the logo as the tab icon
  too. The logo file had a white background, so the dashboard's copy
  (`tools/feature-agents/logo.png`) is cropped, shrunk to 256px and made
  transparent, and it's inverted in dark mode.
- **One filter per status.** The last round mixed filters that covered several
  statuses (Active) with ones named after a status, which I found confusing.
  Now there's All, then one filter per status, from most urgent to least:
  Waiting, Working, Planned, Merged, Dropped. All is sorted the same way, so
  what needs me is at the top. Waiting and working replace "building" on the
  page, and every card's pill says one of the five, with the detail after it
  (needs you, interrupted...).
- **Agent defaults instead of System prompt.** Asked for the System prompt
  button to become Agent defaults, with the system prompt plus a default
  model, and a model choice in New feature. Also asked whether ponytail full
  was on for every agent, why it wasn't visible in the system prompt, what
  happens for someone who doesn't want it, and what else we send agents that
  isn't exposed, saying most of it should be customisable unless that would
  break how the agents work in this system.
  - What we found: ponytail is a Claude Code plugin installed for my user. It
    switches itself on in every session at its own default level, and that's
    set to off on this machine (`%APPDATA%\ponytail\config.json`, since
    2026-10-31). So it was never on for any agent. The system prompt was empty.
  - Options for ponytail: ask for the skill in the system prompt, or set
    ponytail's own `PONYTAIL_DEFAULT_MODE` in the agents' environment. Picked
    the environment variable: it's ponytail's own switch, applies from the
    first message, and leaves my other sessions alone. Agent defaults now sets
    `PONYTAIL_DEFAULT_MODE=full`, since I'd asked for every agent to run
    ponytail full on 2026-11-07. Someone who doesn't want it removes that line.
  - Made editable: default model, system prompt, extra environment variables,
    the carry on, new session and merge conflict messages, and what background
    turns may and may never do. Kept fixed and listed in the popup: the
    feature block on the first message, the variables the dashboard relies on
    (`FEATURE_SLUG`, `PORT`, `DATA_DIR`, `APP_URL`, git author), the hooks,
    accept-edits mode for background turns, and the credentials file.
  - Saved in `tools/feature-agents/agent-defaults.json`, committed on main,
    storing only what differs from the built-in values.
- **Popups.** Asked for New feature and Agent defaults to be popups over the
  page with a smart, modern popup animation (the page dims and blurs, the
  panel rises and settles), and for New feature to keep what I've typed if I
  click off it to check another feature. Kept for the browser tab only, not
  across sessions, as I said.

## 2026-11-08: The notification bell goes before the feature name

- Asked to move each feature's bell from the top right (after the time and
  status) to the top left, before the name, and to show it on every feature,
  greyed out when the feature can't notify right now. I didn't want it in the
  row with Edit, Notes and Drop, because it's a different type of button. Asked
  Claude what it thought: it agreed, since the bell is a setting that stays on,
  like a star or flag in a mail app, while the bottom row is actions.
- Greyed out means the feature has no agent (planned, dropped, or merged with
  its folder removed). It can still be clicked, so a planned feature can be
  set to notify before its agent starts. The bells still only show in the
  "select" notification mode, the only one where they do anything.
