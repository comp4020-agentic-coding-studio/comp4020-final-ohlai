# 5. Invites to the app, and changing a client's program

Replaces the "Claiming" part of ADR 3. The rest of ADR 3 still holds.

## Context

ADR 3 kept the private links working and put accounts on top: a client set a
password from their program's link. Two things changed. The PT now onboards a
client from the dashboard (name, email, a saved program) and emails them an
invite. And the PT can change a client's program. With the invite being the
program's link, changing the program before the client signed up left them
holding a link to the wrong program, which needed a "moved to a new program"
banner and forwarding. We assume nobody holds an old link, so nothing has to
keep working for them.

## Options

1. **Invite on the program.** The `/join` link is the program's client link.
   Simple, but the invite goes stale when the program changes.
2. **Invite looks up the current program.** The `/join` token finds "this PT's
   current program for this email". Smaller, but the invite still lives on a
   program row underneath.
3. **Invites table.** An invite is to the app: who invited whom (token, PT,
   name, email, when it was used). Programs are tied to the client by email
   until they sign up, then by their account.

## Decision

Option 3.

- **Onboard client** makes the client's copy of the program and an invite. The
  PT emails `/join/<invite>` from their own email app (`mailto:`). The server
  sends no email.
- **Signing up** (`POST /api/invite/<token>`) makes the client's account, or
  logs into one with that email, and links every program that PT has for the
  invite's email, whatever it is by then. The client can fix their name and
  email on the way. The invite is then used: opening it again goes to log in.
- **Program links** (`/p/<token>`) stay as the address of a program inside the
  app (the client's day buttons, the PT's "Open program"). They are never sent
  to anyone. Nobody can sign up or claim through them any more: the PT side of
  claiming and the "set a password" banner are gone.
- **Changing a program** makes the client a fresh copy of another saved program
  and ends the old one (`ended_at`, `replaced_by`). Nothing is deleted, so
  every logged set stays. If the client is mid-workout the change waits in
  `pending_change` until they finish or discard it. The PT can add a note
  (`change_note`) that shows on the client's dashboard.

## What this means

- The invite token is a password until it's used, same as the program link was.
- An ended program can't start a workout. It only shows up in the client's
  history; nothing in the app links to it.
- Programs made before accounts with no PT account can no longer be added to a
  dashboard. We're assuming there aren't any.
