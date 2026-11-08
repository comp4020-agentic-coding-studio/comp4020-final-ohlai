# Video call with your PT: log

Imported word for word from the board in `notes/features.md` on 2026-11-08, when the board moved to one folder per feature. It was on the board before the feature agents dashboard existed, and hasn't been built, so there's no prompts.md yet.

- 2026-10-19: Asked for alongside chat, put off for now. Browser WebRTC needs
  no dependency, but needs a TURN relay (paid) to connect on strict networks.

- 2026-11-09 00:35: I asked "how hard would this be to implement?" Nothing
  built yet. Looked at what's already there: chat (`/api/chat/:id`,
  `public/chat.js`), live updates over server-sent events (`push()` in
  `server.js`) and `paired()` for who can talk to who. Together those cover
  most of call setup (the "signalling"), so a call needs no new dependency.
  The hard parts are a TURN relay for networks where the two phones can't
  reach each other directly, and ringing: the other person only hears the
  call if they have the app open, since there are no push notifications.
  Laid out three options (link out to an existing video app, WebRTC with free
  STUN only, WebRTC plus a hosted TURN relay) and asked which one to build.

- 2026-11-09 00:40: I said "could it be done with free servers but it doesnt
  need to account for thier phone being off or a privacy policy as this is
  just for a uni project like i just need a video and audio streamed from one
  device to". The message cut off; Claude read it as "to the other" (PT to
  client and back). Before: Claude had recommended option A (link out to
  Meet/FaceTime). Now: option B, built-in WebRTC with free STUN only. My
  reason: it's a uni project, so it only needs to stream video and sound
  between two devices, not handle phones being off or privacy policy work.

- 2026-11-09 00:45: Claude went quiet for a long time after saying "building
  it now". It spent about eight rounds reading chat, live updates, CSS and the
  spec without writing anything, retried around two blocked shell commands,
  and when the dashboard asked for a status it answered "No response
  requested", which told me nothing. I asked "why did you get stuck?". Claude
  said nothing was blocking it: it over-read instead of starting, and the
  status reply should have said what it was doing. Then it built the feature.

- 2026-11-09 00:55: Built the video call.
  - `server.js`: new `POST /api/call/:id`. Same check as chat (`paired()`),
    404 for anyone else, 400 for an unknown message kind. It passes the
    setup messages (offer, answer, ice, end) to the other person's open
    `/api/events` streams as a named `call` event, so every page's existing
    live-update handler (which only hears unnamed messages) ignores them.
    Every call message and refusal goes through `audit()`, no tokens logged.
    Nothing is stored in the database.
  - `public/call.js` (new): the call popup (their video full size, yours in
    the corner, status line, Answer and End buttons) and the WebRTC code.
    Uses Google's free STUN server, no TURN, marked with a `ponytail:`
    comment. Tells the caller if the other person doesn't have the app open,
    and if the connection fails. Esc or End hangs up for both sides.
  - `public/chat.js`: a video camera button left of the photo button in the
    chat compose bar, disabled until the thread loads. Because every chat
    (chat page, program page drawer, PT inbox, PT dashboard side panel) uses
    `mountChat`, that one change puts Call in all four.
  - `public/nav.js` and `public/side.js` import `call.js`, so a call rings on
    any client app page and any PT page, not only when the chat is open.
  - `public/style.css`: `.call` popup styles, tokens only.
  - `spec/programs.test.ts`: the paired PT and client can send call messages,
    a stranger PT and an anonymous request get 404, a bad kind gets 400.
  - Got wrong on first pass: the caller's network candidates can reach the
    other phone before its offer, and the first version dropped them, which
    would make some calls fail at random. Fixed by holding them until the
    offer arrives.
  - `pnpm check`: 20 tests pass. Claude did not look at the call popup in a
    browser (no browser tool in this session) and can't test real video
    without two devices with cameras, so I need to try it on two devices.
