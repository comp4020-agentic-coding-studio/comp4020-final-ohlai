# nudge quiet clients: log

## 2026-11-08 23:35, custom nudge message on Check-ins, sent from the dashboard

I asked: "Build a custom message in the Check-ins tab which gets sent over in app messages when you click nudge inactive clients."

Before: the dashboard's Needs attention panel had a "Nudge quiet clients" button tagged Preview. It opened a popover that only described the idea ("One click sends every client who hasn't trained in 7 days a short chat message you've written once."). Nothing was sent and there was nowhere to write the message.

What I did:

- `server.js`
  - New column `users.nudge_message`, added with a guarded `ALTER TABLE` like `checkin_questions`. Empty means the default message (`DEFAULT_NUDGE`).
  - `GET /api/nudge` (PT only): the PT's message and the list of quiet clients it would go to.
  - `POST /api/nudge/message` (PT only): save the message. Empty is a 400.
  - `POST /api/nudge` (PT only): writes the message into the chat of each quiet client, as the PT, same `messages` table the Inbox and chat drawer use. Then pushes a `chat` event so the client's chat and the PT's inbox update live.
  - Every call, and the 401 refusal, goes through `audit()`. The log line says how many clients were nudged, not the message text.
- `public/checkins.html`: a "Nudge message" panel under "Your questions", with a textarea and Save message. `{name}` in the message becomes the client's first name.
- `public/dash.html`: the popover is real now. It loads who it will go to and the message, has a link to change the message on Check-ins (`/checkins#nudge`), and Cancel / Send. After Send it says who it went to. The Preview tag is gone.
- `public/style.css`: textarea width and a quote style for the message preview, both from existing tokens.
- `spec/programs.test.ts`: new test. Empty message is refused, the saved message reaches the quiet client's chat with their name in it, another PT sees nobody to nudge, a client can't nudge.

Why it's built this way:

- "Quiet" is worked out on the server with `dashRow` and the same rule as the dashboard's Gone quiet tile (no finished workout in 7 days, or never trained). So the popover, the tile and what actually gets sent can't disagree, and the browser can't send a nudge to someone who isn't the PT's client.
- Only clients who have signed up get a nudge, since chat needs an account. One client with two programs gets one message.
- Clients are de-duplicated by user id.

Checked:

- `pnpm check`: 19 tests pass, the new one included.
- Seeded Oli and Jack (`scripts/seed-jack.js`) into this feature's data folder and onboarded a second client, Sam Lee, who has never trained. Looked at Check-ins and the dashboard popover at 1440px in light and dark. Both quiet clients (Jack 38 days, Sam never) listed in the popover.
- Clicked Send in headless Chrome and read Sam's chat back as Sam. It read "Hi Sam, haven't seen a workout from you in a week. ...", so `{name}` worked and the message reached the server and the chat. The popover then said "Sent to Jack, Sam Lee."

What went wrong: my first screenshot script used DevTools port 9333. On the first run Chrome wasn't up in time. On the second run the script attached to a different Chrome that was already on 9333 and showing Jack's client page, so Send never got clicked and Sam's chat was empty. Fixed by giving the script its own port (9447) and profile folder and waiting longer for Chrome to start. I didn't close the other Chrome on 9333 because it might belong to another session.

Login for this feature's app (http://localhost:8088): PT `oli@example.com` / `demo1234`. Quiet clients to nudge: `jack@example.com` and `sam@example.com`, both `demo1234`.

## 2026-11-08 23:52, Send closes the popup

I asked: "once you click send it should close the pop up."

Before (see the 23:35 entry): after Send the popup stayed open and its top line changed to "Sent to Jack, Sam Lee." Now Send closes the popup straight away. If the send fails, the popup stays open and shows the error, so it never closes on something that didn't go through.

Changed `public/dash.html`: the Send handler calls `hidePopover()` instead of writing "Sent to ...". I didn't add a toast to say it sent. The app has no toast yet, and the messages show up in the Inbox.

Checked: clicked Send in headless Chrome at 1440px in dark mode. The popup was closed afterwards (`:popover-open` false) and the dashboard was clear behind it. `pnpm check` passes, 19 tests.

Got wrong: my first check run was cut off by a 50 second timeout before it printed anything, and the screenshot I opened was the old one from before the change, still showing "Sent to". I reran it with more time.

Also: `prompts.md` has a 23:40 entry that is a background task notice from my screenshot script, not something I wrote. The hook picked it up.

## 2026-11-09 00:00, choose who gets the nudge

I asked: "maybe also being able to nudge by person would be good". The agent gave two options: tick boxes in the popup, or a Nudge button per person in Needs attention / the client card. I picked "option 1", the tick boxes.

Before (see the 23:35 entry): Send went to every quiet client, no choice. Now the popup lists each quiet client with a tick box, all ticked to start. Untick anyone you don't want to nudge. Send is disabled once nobody is ticked.

Changed:
- `server.js`: `POST /api/nudge` takes `{ ids }`. The server still works out the quiet list itself and only sends to ids that are on it, so a made-up or other PT's client id goes nowhere. Nobody left after that is a 400 "Tick at least one client." No `ids` at all still means everyone quiet.
- `public/dash.html`: the popup builds a "Send to" fieldset of tick boxes from `/api/nudge`. Send posts the ticked ids, then closes the popup like before.
- `public/style.css`: `.nudge-list`, with `accent-color: var(--ink)` so the ticks are mono. The first version showed the browser's default blue tick in dark mode.
- `spec/programs.test.ts`: added: `ids: []` is a 400, an id that isn't theirs is a 400, ticking the client sends.
- `CLAUDE.md`: new rule under "Every change" (see below).

Still open: whether the list should show every signed-up client and not just quiet ones. I asked in the same message; not answered yet.

Got wrong: on the first browser run my script unticked Jack, clicked Send, and both Jack and Sam got a message. The debug run showed why: the script clicked Jack's box before the list had loaded, so there was no box to untick. The list then loaded with everyone ticked and Send sent to both. That was my test script being too quick, not the app.

It did show a real gap though. When the popup opens a second time, the old list and the old Send handler are still there until the new list loads, so a quick click on Send would go to the last list's ticks. Fixed by disabling Send as soon as the popup opens, until the new list has loaded. The script now waits for the list before unticking. Added a rule to `CLAUDE.md` so other popups don't do the same.

Checked: `pnpm check` passes, 19 tests. In headless Chrome at 1440px: unticked Jack, clicked Send. Before, Jack 4 and Sam 4 messages; after, Jack 4 and Sam 5. Popup closed. Screenshots of the list in light and dark with Jack unticked look right.

Open questions for me are in `decisions.md`.
