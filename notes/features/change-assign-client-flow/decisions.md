# Change assign client flow: decisions

## 2026-11-08 How the invite email gets sent

- Came up: I asked whether the server can send the invite email or whether it still has to open the PT's email app.
- Options: an email API like Resend or Postmark called with `fetch` (needs an account, an API key, our own domain and an ADR), SMTP with nodemailer (a new dependency, and Gmail-sent mail often lands in spam), or keep `mailto:`.
- Picked: keep `mailto:`. "it shuoldnt read as being sent from a external source as its from the PTs email." So the email body is in the PT's own voice and signed with their name.

## 2026-11-08 Where the invite link goes

- Options: a new sign-up page at `/join/<token>`, or the existing program link with its optional password banner.
- Picked: the new `/join/<token>` sign-up page ("yep that looks ok"). Underneath, it reuses the client token and the claim endpoint.

## 2026-11-08 What the client fills in on sign-up

- Options: name, email and password, or more (phone, goals, injuries), which would need new columns.
- Picked: "keep as name email password for now." Name and email are filled in from what the PT typed, and the client can change them.

## 2026-11-08 Programs page vs dashboard

- Options: keep "Assign to client" on the Programs page next to the new dashboard popup, or take it off.
- Picked: take it off. "the program page should just be to update the program itself and the clients or dash tabs should be for linking people to programs." The Programs page now only writes and edits programs.

## 2026-11-08 Program required when inviting

- Options: program required in the popup, or optional so you can invite someone before writing their program (a data shape change, since a client only exists through a program).
- Picked: required. "you need to have the program ready to give someone before you invite them."

## 2026-11-08 How a client's program gets changed

- Came up: I asked "How should we handle changing a clients program?"
- Options: A, swap to a different saved program (a new copy, the old one ends and keeps its sets); B, edit the client's own copy in place (can't remove exercises they've logged); C, both.
- Picked: A ("yes lets do option a").

## 2026-11-08 Changing a program while the client is mid-workout

- Options: block the change until they finish, or end the old program anyway.
- Picked: neither. Queue it: "just queue it to change for them once they finish their workout." The PT can still submit it straight away.

## 2026-11-08 A note with the change

- Asked for in passing: "let the PT submit the change with a note letting them know." The note is optional and shows on the client's dashboard with the new program.

## 2026-11-08 Where Change program lives

- Options: the client's side panel only, or also in the Onboard client popup when the email matches an existing client.
- Picked: side panel only. "Why would it live on the onboard client?? only have it on the clients side panel." Onboard client is for new people.

## 2026-11-08 Duplicate a program

- Asked for: "add an option to duplicate a program in the programs page." Makes "{name} (copy)", which you then edit.

## 2026-11-08 Drop support for old links

- Came up: I said "we can assume that no one has gotten an old link to a program so we dont have to depreciate them we can just dont aknowledge them or support them".
- Picked: remove the dashboard footer about old programs, the "Add to my dashboard" and "Set a password" banners on program links, the PT side of claiming, `POST /api/programs`, and the `/templates` and `/new` redirects ("im happy with your recs", "Yes remove old page addresses"). Reword the login hint to point at the invite.
- Rejected for now: removing support for sets with no session. "Just leave the old data for now."

## 2026-11-08 Invites are to the app, not a program

- Came up: "if we send an invite link to a client it should be an invite to the app not a program so they should always be able to use that link to sign up but that link shuold not be tied to a program. The program shuold be tied to the user."
- Options: A, an invites table (token, PT, name, email, used), with programs tied to the client by email until sign-up, then by account; B, keep the token on the program but look up the current program.
- Picked: A. "yes this is a better fit for what were trying to do." ADR: `docs/adr/0005-invites-and-changing-programs.md`.
- This replaces the earlier "Where the invite link goes" decision, where `/join/<token>` used the program's client link.

## 2026-11-08 A used invite

- Picked: "yes invite link just goes to login once used."

## 2026-11-08 Program links inside the app

- Came up: whether to keep `/p/<token>` as the address of a program once a client is logged in, or rebuild it around the login. I wasn't clear the first time ("im confused by what you mean with program links for a loggedin client").
- What I did: kept `/p/<token>` as it is, since nobody shares it any more and changing it changes nothing anyone sees. I explained it again and said so. Waiting to hear if you want it gone.

## 2026-11-08 Merging main: what each side kept

- Came up: merging main, which had restyled every popup and rebuilt the dash client card, conflicted with this feature.
- Kept from main: the `.pop` popup style and `ask()`, the dialog client card with Message (chat in a side card) and Export sets, saved private notes, and dropping "Open program" from the card.
- Kept from this feature: Onboard client in the header instead of "Assign a program", no assign dialog on Programs, Change program in the client card, the invite wording.
- These are the merge instructions ("keeping both sides' intent"), not a new choice of mine. The one small call I made: after Change program, the card stays open on the client's new program, because main's card is a modal and closing my old way would have left it empty.
