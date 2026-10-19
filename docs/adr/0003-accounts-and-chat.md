# 3. Accounts on top of the links, and a chat per PT and client

## Context

Until crit 10 the private link was the whole identity model. That broke down in
two places. A PT with ten clients had ten PT links and nowhere to see them
together. A client with a question had no way to ask it in the app. Crit
feedback asked for clearer multi-user, and a live chat or video with your PT.
The final project spec leaves "what counts as a person" open, so accounts are
allowed but not required.

## Options

1. **Email and password, links still work.** PTs sign up. A client sets a
   password from their link the first time, under the email the PT wrote the
   program for. Old links keep opening their programs.
2. **Email and password, links retired.** Cleaner, but breaks every link already
   sent and makes a client sign up before their first set.
3. **Magic link by email.** No passwords, but the server would have to send
   email, which needs a service and a dependency, and the README says the server
   sends no email.

## Decision

Option 1. Passwords are hashed with `scrypt` from `node:crypto`, so still no
dependency. A login is a random token in an HttpOnly, SameSite=Lax cookie,
stored in the `logins` table.

- **Claiming.** Opening a PT link while logged in as a PT offers "Add to my
  dashboard". It can't take a program that's already on someone else's
  dashboard. A client link offers to set a password, and makes the account with
  the program's client email (or adds the program to an account that already
  has that email, if the password matches).
- **Chat.** One thread per PT and client, not per program, so it carries on if
  the client gets a new block. A PT and client can message each other only if a
  program links both accounts. Messages are kept for good. Photos are shrunk to
  1600px on the phone before upload, capped at 5 MB, checked by their first
  bytes, stored on the volume and only served to the two people in the thread.
- **Live updates.** Server-sent events (`/api/events` for a logged-in user,
  `/api/p/<token>/events` for a link). The server sends a short "this changed"
  and the page fetches again. Chat, the dashboard and the PT's program view
  update this way. This is also the real-time requirement from crit 9.
- **Video calls** were left for later. Browser-to-browser video (WebRTC) works
  without a dependency, but on strict networks it needs a paid relay to connect.

## What this means

- Whoever holds a client link can set the client's password the first time. That
  was already true of the link itself (it is the client), so nothing gets
  weaker, but the link should still be treated like a password.
- No login rate limit yet. Fine for a handful of PTs, not for a public app.
- Live update subscribers live in memory, which works on one Fly machine. Two
  machines would need a shared channel between them.
- Programs made before accounts sit off the dashboard until their PT opens the
  PT link while logged in.
