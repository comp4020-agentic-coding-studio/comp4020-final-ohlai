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
