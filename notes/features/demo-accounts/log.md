# demo accounts: log

## 2026-11-09 10:38: demo PT and clients for the marker

I asked: "setup and backfill demo account for the marker with good data not just my oli and jack account with some good and some random data. When i merge this into main idk if the branch DB will move onto main too.... Also need to update the README with the correct logins for the account you make"

### Does the branch DB move to main on merge?

No. `data/` is in `.gitignore`, so the branch's `app.db` never goes into git and a merge can't carry it. The live site's database is on the Fly volume at `/data`, which a deploy doesn't touch either. So the demo data has to be a script that writes it, run once on each database that needs it. That's how Jack already works (`scripts/seed-jack.js`), so I did the same.

### What I did

- New `scripts/seed-demo.js`. It makes one PT, Sam (`marker@example.com`), with five clients, each set up to show a different part of the app:
  - Priya Shah: five weeks on "Beginner full body", then moved to "Upper / lower" 3 weeks ago (the old program is ended and kept, with its sets, and the new one has a change note). Moving well. Has three check-ins, a private note from Sam, coach notes on two exercises, a chat with a call stamp, and one message Sam hasn't read yet.
  - Tom Nguyen: ten weeks of 5x5 A/B. Bench and squat are held flat for the last 4 weeks so the dashboard shows them as stalled. A low-energy check-in and a chat about sleep.
  - Mia Roberts: six weeks of push/pull/legs, then nothing for 10 days, so she is the one client on the nudge list.
  - Ben Carter: four weeks of upper/lower and an open session started 25 minutes before the seed runs, so Sam's dashboard shows "Training now".
  - Chloe Martin: a program and an invite, no account, to show a client who hasn't signed up.
  - Sam's program library has four programs in it.
- The training history uses the same double progression and seeded random as `seed-jack.js` (reps creep up, weight goes up at the top of the range, some bad days, some skipped sessions), so it's "good with some random" and the same on every run.
- It writes everything in one transaction, and does nothing if `marker@example.com` already exists, so running it twice is safe.
- Dates are relative to when it runs, like Jack's. Run it close to when the marker will look, or Ben's "Training now" and Mia's 10 days go stale.
- `Dockerfile` copies `seed-demo.js` into the image so it can be run on Fly with `node scripts/fly-exec.js node /app/scripts/seed-demo.js`.
- `README.md` now leads with Sam's login and a table of the client logins and what each shows. Oli and Jack are still mentioned underneath.

### Checked

Ran it on this feature's `DATA_DIR` (twice, second run said "Already seeded"), then hit the API as Sam and as Priya:

- Dashboard order: Chloe (never trained), Mia, Tom, Ben, Priya.
- Tom: Back Squat and Bench stalled. Ben: in progress on Upper. Priya: unread 1.
- Nudge list: only Mia.
- Priya's client view: 20 workouts over both programs, progress line has 20 points, last check-in 2 days ago.

`pnpm check`: 22 tests pass. No page code changed, so I didn't do a light/dark screenshot pass; this is data only.

### What I got wrong

- First draft had a leftover line that wrote a check-in with Priya as her own PT and then deleted it. Removed before running.
- I wrote an emoji in one of Priya's messages, then took it out since the app moved off emojis.

### Not done

- I haven't run it on the live Fly site. That writes to the real database, so it waits for you to say so (after merge and deploy).

## 2026-11-09: Sam's email, and one suggested client login

I said: "just change the email for Sam to be same@example.com shuold we suggest one account for the marker to log into to see the client side? I mean we will mention that the password for all are demo1234 so they can choose any but we should suggest one to make it easy for them to see the features."

- Email: before it was `marker@example.com`, now it's `sam@example.com`. I read "same@" as a typo for "sam@" since the PT is called Sam (flagged to me to correct if not). Changed in `scripts/seed-demo.js` and `README.md`. Updated the one row in this feature's local database instead of reseeding, since the seed skips once the account exists.
- README: before, it gave Sam's login and then a table of every client with no pick. Now it suggests one pair up top: Sam, plus Priya (`priya.demo@example.com`) in a second browser. It says why Priya (two programs' worth of workouts, a program change, check-ins, a chat with Sam), then keeps the full table and says any client can log in.
- Checked: both logins return 200 on port 8097. `pnpm check` passes.
