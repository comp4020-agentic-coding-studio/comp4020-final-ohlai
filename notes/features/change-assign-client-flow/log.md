# Change assign client flow: log

## 2026-11-08 18:10 Reading the current flow

I asked: "Let's change the current assigned client workflow, which goes from the dashboard to the Programmes page to assign popup. instead that's creating a new flow where from the main dashboard page you click onboard client which then takes you to a pop up (use the pop up from CANNU with the blurred bg and animation etc), this should have inputs for the clients name and email as well as program so we can send an invite link ... which takes them to a sign up page where they can input their details."

How it works today, from reading the code:

- Dashboard (`public/dash.html`) has an "Assign a program" button that just links to `/programs`.
- On `/programs` (`public/templates.html`) each program card has "Assign to client", which opens the `.assign` dialog: pick an existing client or type a new name and email. It posts to `POST /api/templates/:id/assign` in `server.js`, which copies the program for that client and returns the PT and client links.
- The done step shows the client link and a "Email it to them" button, which is a `mailto:` link, so it opens the PT's own email app with the message filled in. The server sends no email.
- The client link (`/p/<client token>`) opens the program straight away. Making an account is optional: a banner on the program asks the client to set a password, which posts to `/api/p/<token>/claim` and makes a client account under the email the PT typed.
- The "CANNU" popup is the `.confirm` dialog in `public/style.css` (blurred backdrop, fade and rise animation), used by the Log out confirm in `public/ui.js`.

On sending email from the backend: Node has no built-in way to send email, and the app has no email account. Options are an email API called with plain `fetch` (no new package, but needs an account, an API key and usually a domain we own), or SMTP through a package like nodemailer (a new dependency, so it needs an ADR). Asked before building anything.

## 2026-11-08 19:00 Built the onboard flow

I answered the five questions:

1. "yep lets keep mailto but it shuoldnt read as being sent from a external source as its from the PTs email."
2. Sign-up page at `/join/<token>`: "yep that looks ok."
3. "keep as name email password for now."
4. "no the program page should just be to update the program itself and the clients or dash tabs should be for linking people to programs."
5. "no you need to have the program ready to give someone before you invite them."

What was there before and what it is now:

- Before: the dashboard button "Assign a program" linked to `/programs`, and each program card had "Assign to client", which opened the `.assign` dialog. Now: the dashboard button is "Onboard client" and opens a popup on the dashboard itself. The Programs page only edits programs. The assign dialog, its code and the "Assign to client" button are gone, and Edit is now the main button on each card. The intro text on Programs points to Onboard client on the dashboard, and so does the empty state.
- The popup (`public/dash.html`, `#ob`) uses the CANNU `.confirm` dialog style (blurred backdrop, fade and rise), with a `.confirm.onboard` modifier in `public/style.css` that makes it a bit wider for a form. Fields: client name, client email, and program (a dropdown of saved programs, required). If the PT has no saved programs, Create invite is disabled and the popup says to write a program first, with a link to New program. The dashboard's own empty state ("No clients yet") now has an Onboard client button instead of a link to Programs. Esc closes the popup without also closing the client side panel.
- Create invite posts to the same `POST /api/templates/:id/assign` the Programs page used, so the server side of making the client's copy didn't change. The client shows up on the dashboard straight away.
- The done step shows the invite link and "Email invite", a `mailto:` link. Subject: "{PT name} invited you to their gym app". The body is in the PT's own voice ("I've just invited you to join my gym app"), signed with the PT's name, because it goes from the PT's own email. The wording from my brief, "{PT name} just invited you to join their gym app", reads like the app sent it, so per answer 1 it only appears on the sign-up page, where the app is the one talking.
- The invite link is `/join/<client token>`, a new client page (`public/join.html`) at phone width. It says "Hi {name}" and "{PT name} just invited you to join their gym app. Your program "{title}" is ready." Name and email are filled in from what the PT typed and can be changed, plus a password field. Sign up posts to the existing claim endpoint and goes to `/me`. If the link was already used, it sends them to log in. A bad link says to ask the PT to send it again.
- `server.js`: new `GET /join/<token>` route. The client claim (`/api/p/<token>/claim`) now takes optional `name` and `email`. They're saved onto the program in the same UPDATE that links the client account, so only once the account step works. With no name or email sent it behaves exactly as before, so the password banner on `/p/` still works.
- The old `/p/<client token>` link still opens the program, so links already sent keep working.

Checks:

- New spec in `spec/programs.test.ts`: `/join/<token>` serves the sign-up page, a bad email is refused, signing up with an edited name and email saves both, the client can log in with the new email, the PT's dashboard shows the new name, and a second claim is refused.
- `pnpm check`: 13 tests pass.
- Clicked through in headless Chrome (throwaway CDP script, not committed): signed up a PT at 1366px, saved a program, clicked Onboard client, typed name and email, clicked Create invite. The client was on the dashboard and the mailto had the right subject and body. Then, with cookies cleared and at 390px, I opened the invite link, typed a password, clicked Sign up and ended up on `/me`. No horizontal scroll at 390px (scrollWidth 390). Screenshots looked right: the dashboard blurred behind the popup, and the sign-up card fits the phone.

Got wrong on the way: my first server change saved the edited name and email onto the program before checking the password, so a failed sign-up would still have changed the program's email. I moved it into the final UPDATE.

Not done: sending the email from the backend (we picked mailto). No ADR, because nothing new was added to the stack.

## 2026-11-08 19:10 "Wrong email or password" on the feature app

I asked: "its saying wrong email or password. did you not liink or change the db?"

Nothing about login or the users table changed. The feature app runs with its own `DATA_DIR` (`worktrees/change-assign-client-flow/data`), so it has a fresh database. My accounts from main aren't in it. The only accounts there are the ones the spec and my browser check made (all `@example.com`). I should have said that when I gave the URL, along with a login to use. Gave the test PT login from the browser check: `pt-1794124721078@example.com` / `password123`.

## 2026-11-08 20:00 Onboard client button was white on white

I asked: "the button on the dash is all white and i cant see the text. Also How should we handle changing a clients program?"

Cause: `public/style.css` has `.apphead button { background: var(--card) }` for the plain header buttons (Export). It's more specific than `button.primary`, so my new `<button class="primary">` in the header got the card background with the white primary text. The old "Assign a program" was an `<a class="btn primary">`, which that rule doesn't touch, so it never showed up before. Fix: the rule is now `.apphead button:not(.primary)`. Checked in headless Chrome at 1366px in light (black button, white text) and dark (white button, black text).

What I got wrong: my first browser check only screenshotted the dashboard with the popup open, so the button was blurred and I didn't notice it was blank. Added to CLAUDE.md "Every change": look at the page in light and dark, and with no popup open.

Changing a client's program: asked with options before building anything (next entry once answered).

## 2026-11-08 21:00 Change program, and Duplicate on Programs

I asked: "yes lets do option a, and then also add an option to duplicate a program in the programs page. then if someones mid workout when you change just queue it to change for them once they finish their workout. but let the PT submit the change with a note letting them know. Why would it live on the onboard client?? only have it on the clients side panel."

Before: a client's program couldn't be changed at all. The only way was to assign a second program, which put the client on the dashboard twice.

Now:

- **Change program** is a button in the client's side panel on the dashboard (only there, not in Onboard client). It opens a popup in the same style as Onboard client: pick one of your saved programs, and an optional note for the client. If they're training, the popup says the change happens when they finish this workout.
- The server (`POST /api/programs/:id/change` in `server.js`) makes the client a fresh copy of the picked program, linked to the same client account, and marks the old one ended. Nothing is deleted: the old program, its workouts and every logged set stay. That's why it's a new copy rather than editing their program in place. Logged sets point at the old program's exercises, and deleting an exercise deletes its sets (CLAUDE.md "Never").
- **Mid-workout:** the PT can still submit. The change and note wait in `programs.pending_change` and happen when the client finishes or discards the workout. The side panel says "Moving to {program} once {name} finishes this workout." The PT gets a 202 with `queued: true` instead of the panel closing.
- **The note** is saved on the new program (`change_note`) and shows on the client's dashboard (`/me`) as a card under the program title: "New program from {PT}" plus the note.
- **Old links:** opening an ended program shows "{PT} has moved you to a new program. Your sets from this one are kept." with Open the new program, and no Start buttons. The client link leads to the new client link, the PT link to the new PT link, so a client never gets a PT link. Starting a workout on an ended program is refused on the server too.
- If the PT changes the program before the client has signed up, the old `/join` link moves on to the new program's invite, and signing up on the old one is refused. Otherwise the account would have been attached to the ended program.
- The dashboard, inbox titles and the client's day buttons only show current programs. "Last workout" on the dashboard also counts the client's ended programs with this PT, so changing someone's program doesn't make them show as "Hasn't started yet".
- **Duplicate** on each card on Programs makes "{name} (copy)" with the same exercises, then you edit it. Server: `POST /api/templates/:id/duplicate`.
- Schema: four new columns on programs (`ended_at`, `replaced_by`, `pending_change`, `change_note`) with guarded `ALTER TABLE`, so it's additive.

Checks:

- Three new specs in `spec/programs.test.ts`: a queued change mid-workout (another PT can't change it, the dashboard shows it pending, finishing makes the change, the old program keeps its set and won't start a new workout, the new link is a client link with the note, the dashboard and `/me` show only the new program and history still counts), a change before sign-up moving the invite, and Duplicate (another PT can't, and the copy is separate). `pnpm check`: 16 pass.
- Clicked through in headless Chrome: Duplicate at 1366px; as the PT, opened Ana's panel while she was mid-workout, Change program, picked the copy, typed a note, clicked Change program and saw the "Moving to..." line; then as Ana at 390px, clicked Finish, saw the moved banner on the old program, and saw the note on `/me`. Checked `/me` in dark mode as well. No horizontal scroll at 390px.

Got wrong on the way:

- The side panel showed "nullnullnull" above the lifts. `replaceChildren` prints `null` as text, and the panel already passed nulls for empty lift groups (it was there before this change, just never noticed). It now filters them out.
- The ended program still showed "Start Day 1", which the server would refuse. It now shows no Start buttons and says "Ended".
