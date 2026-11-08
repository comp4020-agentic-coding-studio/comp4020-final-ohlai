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

- 2026-11-09 01:05: I tried it locally and it worked. I said: "just move the
  end button from overlay on the video (on the pt side) to outside the
  overlay (it shuold also be an a rounded square button) also move the
  reflection of your camera to outside the incoming video, (kinda like a
  bento box) This is to see the whole image of what your client is sending
  you and not covering anything up with your own face or text. Also please
  make the icons and button bgs the same size when in messenger. And on
  mobile actually move the start video call button up the top of the screen
  instead of in line with the text input. then commit and deploy"
  - Before: the call popup was one video filling the box, with your camera
    small in its top-right corner and the status text and Answer/End buttons
    laid over the video. Now it's a bento grid of tiles: the other person's
    video in a big tile on its own, shown whole (`object-fit: contain`, so
    nothing is cropped) with nothing on top; your camera (mirrored) in a
    smaller tile; and a panel tile with the status line and the Answer/End
    buttons as rounded squares (12px radius). On desktop the tiles sit to the
    right of the video; on a phone they go below it, side by side. End uses
    the `--warn` token. My reason: to see the whole image the client sends
    without your own face or text covering any of it.
  - Before: the call and photo buttons in the chat compose bar were
    different sizes, and the photo button sat a few px low (it's a `<label>`,
    which gets the global label top margin). Now both are 46px squares and
    the text box and Send are 46px tall too.
  - Before: the client's Call button was in the compose bar next to the text
    box. Now on the client's screens it sits top right: in the top bar on
    the chat page, and in the drawer header (before the close button) on the
    program page. `mountChat` takes a `top` option for this. The PT's inbox
    and dashboard chat keep it in the compose bar, since I only asked for
    mobile.
  - Merged main into this branch first (`Merge main into
    feat/video-call-with-your-pt`), since main had moved on about 10 merges
    and deploying this branch alone would have rolled those back.
  - Checked with two headless Chromes with fake cameras, driven over Chrome's
    DevTools protocol by a throwaway script outside the repo (not committed):
    PT at 1366px, client at 390px, light and dark. Client calls, PT answers,
    video plays both ways (640x480 each side), End doesn't overlap the
    video, no sideways scroll on the phone, PT pressing End closes the call
    on the client too.
  - Got wrong / still open: one early test run failed with "Failed to parse
    SessionDescription" on the PT side when answering. The next runs
    connected fine with no errors and I couldn't get it to happen again, so
    the cause isn't known. Possibly the script clicked Answer before the
    page was ready. Worth watching for when I test on real devices.
  - A batch of four repeat runs got cut off when the session ended, and the
    headless Chrome windows from it may still be running (Claude couldn't
    stop them without approval). Harmless, close them from Task Manager.
  - Deploy: I said commit and deploy, then changed it to "yep commit then
    ill merge it in and deploy and give it a go". So Claude committed on the
    feature branch only; I merge and deploy from the dashboard.
  - `pnpm check`: 20 tests pass.
