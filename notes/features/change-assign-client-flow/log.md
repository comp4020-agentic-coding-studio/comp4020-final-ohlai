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

## 2026-11-08 21:25 Dropping support for old links

I asked: "we can assume that no one has gotten an old link to a program so we dont have to depreciate them we can just dont aknowledge them or support them, Please check if we are doing any of that in the app atm?"

I listed ten things in the app that only exist for old links or old data, with a recommendation for each. My answer:

- On links from before accounts existed: "im happy with your recs."
- "Yes remove old page addresses."
- "Just leave the old data for now."
- On the "old program links after a Change program" group: "i dont really get what you mean ... if we send an invite link to a client it should be an invite to the app not a program so they should always be able to use that link to sign up but that link shuold not be tied to a program. The program shuold be tied to the user. Does that make sense? Is that how youve implemented it atm?" That's the next entry.

Removed in this commit:

- Dashboard footer "Got a program from before you had an account? Open its PT link while you're logged in and add it here." (`public/dash.html`).
- The "This program isn't on a dashboard yet / Add to my dashboard" banner on a PT link, and the PT side of `/api/p/<token>/claim`, which now refuses a PT link with 403 (`public/program.html`, `server.js`).
- The "Set a password" banner on a client `/p/` link. `/join` does that now.
- `POST /api/programs` (writing a program straight for a client). Nothing in the app called it any more. The spec helper `program()` now saves a program and onboards a client with it, the same way the app does, and the "rejects a program with no exercises" spec checks `/api/templates` instead.
- The `/templates` and `/new` redirects. Both now 404.

Changed: the login page hint "Client without a password yet? Open the link your PT sent you and set one there." is now "Client without a password yet? Open the invite your PT sent you."

Kept: sets with no session (old data), grouped by day, as I asked.

Not touched yet: the ended-program banner, `moved_to` and the `/join` forward. They depend on the next question.

`pnpm check`: 16 pass.

## 2026-11-08 21:40 Invites are to the app, not to a program

On the invite I said: "if we send an invite link to a client it should be an invite to the app not a program so they should always be able to use that link to sign up but that link shuold not be tied to a program. The program shuold be tied to the user. Does that make sense? Is that how youve implemented it atm?"

It wasn't. Until now (see "Built the onboard flow" above) the `/join/<token>` invite was the program's own client link. So changing a client's program before they signed up left their invite on the old program, which is why I'd added the "moved to a new program" banner, `moved_to` and the `/join` forwarding in "Change program, and Duplicate on Programs".

I gave two options: A, an invites table, or B, keep the token on the program but look up the current program. I recommended A. Then: "yes this is a better fit for what were trying to do. yes invite link just goes to login once used. im confused by what you mean with program links for a loggedin client"

On program links I explained it in plain words: when Ana taps "Day 1" on her dashboard, her phone opens an address like `/p/Xk3f9...`. Before this, that address was also what got emailed. Now nobody sees or shares it; it's just where the Day 1 button goes. I'm keeping it as it is, since changing it would change nothing for the PT or the client, and said so in case you want it gone.

What changed:

- New `invites` table in `server.js` (token, PT, name, email, created, used). Additive.
- Onboard client (`POST /api/templates/:id/assign`) now also makes an invite and returns its token. The dashboard popup builds the `/join/<invite>` link from that.
- `GET /api/invite/<token>` gives the name, email, PT name and the client's current program title. Once used, it just returns `{ used: true }` and `public/join.html` sends them to `/login?next=/me`.
- `POST /api/invite/<token>` signs up (or logs into an existing client account with that email), links every program this PT has for the invite's email that has no account yet, marks the invite used and logs them in. The client can still fix their name and email.
- Removed: `/api/p/<token>/claim` completely, the `moved_to` field, the "moved you to a new program" banner on the program page, and the `/join` forward. An ended program still can't start a workout and shows no Start buttons ("Ended"), but nothing in the app links to one.
- Wording that still talked about setting a password from a link: chat and check-in hints in the dashboard side panel, the inbox empty state, the check-ins empty state and the landing page now talk about the invite.
- New ADR `docs/adr/0005-invites-and-changing-programs.md`, which replaces the "Claiming" part of ADR 3.
- Spec: the helper now returns the invite, and a `join()` helper signs up through it. The invite test checks the sign-up page, the invite details, a bad token, a bad email, a short password, signing up with an edited name and email, and that a used invite returns `{ used: true }` and refuses a second sign-up. The "before sign-up" test now checks that the same invite shows and gets the new program. The change-program test checks the client's `/me` has the new program and note, and no `pt_token`. The dashboard test checks another PT can't change the client's program (the old "can't claim with a PT link" check went with the endpoint).

Checks: `pnpm check`, 16 pass. Clicked through in headless Chrome: logged in as the PT through the login form, onboarded Ben, changed his program to "Strength block (copy)" with a note before he signed up, and the dashboard showed one Ben row on the new program. At 390px with no login, opened the invite: it said "Your program "Strength block (copy)" is ready". Typed a password, clicked Sign up, landed on `/me` with only the new program and the note. Opened the invite again with no login and it went to `/login?next=/me`.

## 2026-11-08 22:55 Merged main into this branch

The dashboard asked: "Main has moved on and merging your branch conflicts in: {files}. Merge main into your branch, resolve the conflicts keeping both sides' intent, run the app and pnpm check, log what you did, and commit." (The file list came through as the literal `{files}`, so I found the conflicts by running the merge.)

Main had merged four features since this branch started: pop up styling (every popup is a `.pop` card like the dash client card, and `ask()` in `public/ui.js` for yes/no questions), viewing a client in the PT dash (the client card is now a centred `<dialog class="detail">` with `#d-client` and a side card for a lift chart or chat; "Open program" was dropped from it), Export as CSV, and private notes on clients. Main also had a "changing program" feature planned and then dropped, so nothing of it was in main's code. It also renamed `tools/feature-agents/` to `tools/cannu/`, which merged cleanly.

Conflicts and how each was resolved:

- `server.js`, schema: kept both new blocks, my `invites` table and program columns, and main's `client_notes` table.
- `server.js`, `dashRow`: kept both, my `pending` and main's private `note`.
- `public/style.css`: kept main's reduced-motion rule for `.pop`. My `.confirm.onboard` rules depended on the old `.confirm` popup, which main rebuilt as `.pop`, so they're now `.onboard`, used with `.pop`. Also dropped main's `.assign` and `.who-pick` rules, since the Programs page assign dialog they styled is gone on this branch.
- `public/templates.html`: main restyled the assign dialog as a `.pop` and moved Delete to `ask()`. Kept the assign dialog removed (this feature moved linking clients to the dashboard), and took main's `ask()` for Delete with this branch's wording ("Clients who already have it keep their copy.").
- `public/dash.html`:
  - Header: main's plain "Export" (it's built now, so no Preview tag) next to my "Onboard client" instead of main's "Assign a program" link.
  - Onboard client and Change program popups: now `class="pop onboard"` with main's header (title, round close button top right), like every other popup. The "Invite ready" step changes the popup title instead of having its own heading. Dropped my `locked` class handling, since main's CSS locks the page behind any open `.pop` dialog.
  - Open and close: took main's dialog-based client card. My Escape handler, which checked the Onboard and Change popups, went with it, since each `<dialog>` handles its own Escape now.
  - Client card actions: took main's Message button (opens chat in the side card) and Export sets, added Change program between them. Dropped "Open program" as main did. The "Chat opens once..." hint keeps this branch's wording about the invite.
  - Lifts and private notes: took main's (lift buttons open the chart beside the card, and real saved notes). Both sides had fixed the "nullnullnull" bug separately. Kept main's `el("div")` wrapper for the lift lists and kept a `.filter(Boolean)` on the card's children for my pending-change line.
  - After Change program, the card now stays open and follows the client onto the new program. Main's card is a modal dialog, so my old "close the panel" (`selected = null`) would have left it open showing nothing. To do that, the change endpoint now also returns the new `program_id`.
- `spec/programs.test.ts`: merged cleanly, but main's new private notes spec signed the client up through `/api/p/<token>/claim`, which this branch removed. It now uses `join(a.invite)`.

Checked: `scripts/seed-jack.js` (main's demo data for every feature database) writes straight to the database and doesn't use the claim or invite endpoints, so it still works.

Checks: restarted the app, `pnpm check` 18 pass (my 16 plus main's notes and CSV specs). Clicked through in headless Chrome at 1366px: logged in through the form, Onboard client (new popup style, light and dark), Create invite gave a `/join/` link and the title changed to "Invite ready", opened Ana's card (Message, Change program, Export sets, lifts, private notes), Change program opened on top of the card, and after the change the card stayed open on the new program. On Programs, Delete opened main's `ask()` popup. No script errors.

Noticed but not caused by the merge: the dashboard has a 6px horizontal scroll at 1366px from the right-hand `.panel` column. My branch's `style.css` only differs from main's in the header button rule, the removed `.assign` rules and the new `.onboard` rules, none of which touch `.panel` or the grid, so this is on main too. Not fixed here, since it's main's layout. Flagging it.

