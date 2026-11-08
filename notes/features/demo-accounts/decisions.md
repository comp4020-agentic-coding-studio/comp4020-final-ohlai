# demo accounts: decisions

## 2026-11-09: demo data is a seed script, not a copied database

What came up: I wasn't sure if the branch's database would move to main when I merge.

Options: copy a database file into the repo or onto the volume, or write a script that builds the data and run it on each database.

Picked (by the agent, following how Jack is already seeded): a script, `scripts/seed-demo.js`. `data/` is gitignored and the live database is on the Fly volume, so a merge can't carry data anyway. A script also can't overwrite real accounts: it only adds, and skips if it has already run.

## 2026-11-09: a separate PT for the marker, Oli and Jack kept

What came up: I asked for a demo account for the marker with good data, "not just my oli and jack account".

Options: add more clients to Oli, or make a new PT with their own clients.

Picked (by the agent, open for me to change): a new PT, Sam, `marker@example.com`, with five clients that each show one part of the app (moving well with a program change, stalled, quiet and nudgeable, training now, invited not signed up). Oli and Jack stay as they are and are still in the README. All passwords are `demo1234` like the existing demo logins.

Still to confirm with me: the email `marker@example.com` and the name Sam.
