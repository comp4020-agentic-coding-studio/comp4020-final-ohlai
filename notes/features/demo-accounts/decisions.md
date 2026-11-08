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

## 2026-11-09: Sam's email is sam@example.com

What came up: in the earlier entry I'd picked `marker@example.com` and left the name and email for me to confirm.

Picked (by me): keep the name Sam, and change the email to `sam@example.com` (I typed "same@", the agent read it as "sam@"). This replaces the email in the entry above.

## 2026-11-09: suggest Priya as the client to log in as

What came up: I asked if we should suggest one client account so the marker can see the client side easily, even though every account uses `demo1234` and they could pick any.

Options: list the clients with no suggestion, or point to one.

Picked (by me, the agent chose which one): suggest one. I said a suggestion makes it easy for them to see the features. The agent picked Priya because her account shows the most of the client side. The full table stays so they can try the others.
