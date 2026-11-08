# private notes on clients: log

## 2026-11-08 21:30

I asked: "implement the preview of private notes"

Read what's there first. The preview is at the bottom of the client card on the PT dashboard (`public/dash.html`, in `detail()`): a "Private notes" heading with a Preview tag, a 3-row textarea with the placeholder "Only you see this. Injuries, goals, what <name> said last session…", and "Not saved yet. This is a preview of the idea." Nothing on the server. It came from the 2026-10-26 previews (`notes/decisions.md`, "Which previews to build" left it as undecided).

The card is per program (the dashboard row is a program, `program_id`), but one client can have more than one program with the same PT. So where a note lives is a data shape choice, plus how it saves and whether it's one box or dated entries. Nothing built yet. Asked these before writing code, with a recommendation for each, and waiting on my answer.

## 2026-11-08 21:45: built it

I said: "the note shuold be on the CLIENT not the clients program so mirror if it appears in multiple spots. Yes free text can be whatever you want in there but no hardcoded date entries. Yep saved sounds good. Only PT can see the program." (The decisions are in `decisions.md`.)

Before: a textarea with a Preview tag that saved nothing. Now: a real private note per client.

**What got built:**

- `server.js`: new table `client_notes` (pt_user_id, client_email COLLATE NOCASE, body, updated_at), primary key on (PT, client email). A new table, so nothing existing changes. `POST /api/notes` with `{ email, body }`: logged-in PT only (401 otherwise), and only for an email that's on one of that PT's programs (404 otherwise, so another PT can't write notes on my client or find out who my clients are). The body is capped at 10,000 characters and stored as typed, empty allowed (that's how you clear it). Every save and refusal goes through `audit()`, e.g. `edited private notes on "Mia" (54 chars)`. The text of the note never goes in the log. The note is read in `dashRow()` as `note`, which only `/api/dash` uses, and that endpoint is the PT's own dashboard. Nothing on a program link or a client login reads the table.
- `public/dash.html`: the client card's "Private notes" section lost its Preview tag and "Not saved yet" line. The textarea is filled with the note and saves 0.6s after you stop typing, with "Saving…", then "Saved" or "Couldn't save: …" under it (aria-live, so a screen reader hears it). Typing also updates the note on every dashboard row with that client's email, so the other program's card shows the new text straight away without a reload. The live updates (`/api/events`) re-render the dashboard, so while the note box has focus the card isn't rebuilt. Otherwise a client logging a set would wipe the cursor out of my note mid-sentence.
- `spec/programs.test.ts`: new test. One PT, one client with two programs (the second with the email in capitals). Saving a note shows on both dashboard rows. Another PT gets 404, no login and a client login get 401. The note text isn't in the client link, the PT link, the client's `/api/me` or another PT's dashboard.

**Why it's done this way:**

- Keyed on the client's email and not `client_user_id`, because a client who hasn't set a password yet has no user id, and I still want notes on them. The email is also what the CSV export uses to group clients.
- No ADR: no dependency and no change to how the app is built, just one new table in the same style as the others.

**Changed from what I agreed to:** the option said it saves when I click out of the box. Closing the card with Esc or ✕ right after typing might not count as clicking out, and the note would be lost. So it saves as I type instead. Flagged to me in the reply. See `decisions.md`.

**Checked:** restarted the app through the dashboard, `pnpm check` passes (14 tests). Headless Edge at 1440x900 on port 8085, driven over the debug protocol with real clicks, typing and key presses (script outside the repo): signed up a PT, made two programs for "Mia" with the same email. Opened the first card, clicked the note, typed two lines. The status said "Saving…" and then "Saved". Typed more and pressed Esc straight away, which closed the card. Reloaded and opened the second program's card ("Summer cut"): the note was there with both lines and the bit typed just before Esc. No "null" text anywhere in the card. Screenshots look right at desktop width.

**Got wrong:** nothing caught in checking. Two of my bash commands were blocked by the permission check (several commands chained, and an env var check), so I split them up.

## 2026-11-08: saving after you stop typing, confirmed

I said: "yes after you stop typing is good rather than clicking out bc you might stop typing, review hat you said for a second (then hopefully by the time you re over what you wrote it should say saved. instead of only when you click off the input."

This confirms the change flagged in the entry above ("Changed from what I agreed to"). Before: the option I first agreed to saved when you click out of the box. Now, and as built: it saves 0.6s after you stop typing. My reason: you stop to read back over what you wrote, and by then it should already say "Saved". No code change, only the notes and `prompts.md` committed.
