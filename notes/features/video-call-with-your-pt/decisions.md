# Video call with your PT: decisions

Newest at the bottom. Same format as `notes/decisions.md`.

## 2026-11-09: How to do video calls

- **What came up.** How to let a PT and client video call. Options: A, a
  button that posts a Meet/FaceTime/Jitsi link in the chat (an hour, always
  connects); B, built-in WebRTC with free STUN servers only (about a day,
  fails on some strict networks); C, B plus a paid TURN relay (connects
  everywhere, monthly cost). Claude recommended A.
- **Picked B.** It's a uni project, so it just needs video and sound
  streamed between two devices. Ringing a phone that's off, and privacy
  policy work, are out of scope.
- No new dependency (browser WebRTC plus the existing live-update stream), so
  no ADR needed under the dependency rule.

## 2026-11-09: Where the Call button goes (Claude's call, small)

- Put it in the chat compose bar, next to the photo button, so it shows up
  everywhere a chat does. Calls ring on every client app page and PT page.
  Not asked about; easy to move if I want it somewhere else.

## 2026-11-09: Call layout, buttons, where Call goes on a phone

- **Call popup layout.** Before: one video filling the box, your camera in
  the corner and the text and buttons laid over it. Picked a bento layout:
  separate tiles for their video, your camera, and the status + End. Why: to
  see the whole image the client sends, not covered by your own face or text.
- **End button.** A rounded square outside the video, not on top of it.
- **Compose bar.** Icon buttons and their backgrounds all the same size.
- **Call button on mobile.** Moved from beside the text box to the top of
  the screen (top right of the chat page and of the program page's chat
  drawer). The PT's desktop chats keep it in the compose bar, since this was
  asked for mobile only.
- **Deploy.** First asked for commit and deploy, then changed to: Claude
  commits, I merge and deploy myself from the dashboard so I can try it.
  That also matches the rule that feature sessions never touch main.
