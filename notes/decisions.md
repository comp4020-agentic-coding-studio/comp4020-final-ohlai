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
