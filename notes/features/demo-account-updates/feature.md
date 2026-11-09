# demo account updates

Kept by the feature agents dashboard (`tools/cannu/`). Its notes are next to this file: `prompts.md` (everything I said, word for word), `log.md` and `decisions.md`.

- Status: planned
- Created: 2026-11-09 11:15

## What I asked for

Title: keep the demo accounts looking active

Make Sam's demo clients from scripts/seed-demo.js look like real people using the app every couple of days for the next two weeks or so, so the dashboard looks right whenever the marker opens it this week or next.

Right now the seed writes history counting back from the moment it runs, and then nothing more happens. As the days pass, "this week" counts go to zero and everyone ends up on the nudge list. I want the accounts to keep going in their roles:

    Priya trains about 4 times a week on upper/lower and keeps progressing. She sends a check-in about once a week and sometimes messages Sam.
    Tom trains about 3 times a week and stays stalled on bench and squat.
    Mia stays quiet, so she's always on the nudge list.
    Ben trains about 4 times a week and always has a workout in progress, so "Training now" is always there.
    Chloe stays invited and not signed up.
    Sam sometimes replies in chats, so it doesn't look one-sided.

The new data should follow the same progression rules as the seed (reps creep up, weight goes up at the top of the range, some bad days, the odd skipped session), so the progress lines still look real.

Rules:

    Only touch Sam and his demo clients. Never touch Oli, Jack or any real account.
    Only add data. Never change or delete logged sets. That's a rule in CLAUDE.md.
    No new dependency (ADR 0001).

To decide with me before building: how it runs. Options include a timer inside server.js that fills in missed days when the app starts or once a day, a script I run by hand every few days (node scripts/fly-exec.js ...), or something else. Fly stops the machine when nobody is using it, so anything relying on the server being awake has to catch up on missed days rather than run on the dot.

When it's done: if I open Sam's dashboard on any day in the next two weeks, there's recent activity, Ben is training now, Tom shows as stalled and Mia is the only one to nudge.
