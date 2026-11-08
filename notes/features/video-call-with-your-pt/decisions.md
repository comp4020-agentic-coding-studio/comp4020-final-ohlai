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
