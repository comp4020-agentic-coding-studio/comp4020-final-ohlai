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
