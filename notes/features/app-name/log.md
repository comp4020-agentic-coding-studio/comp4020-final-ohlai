# App name: log

## 2026-11-09 09:17 Rename the app to Spotter

I asked: "update the app name to be 'Spotter'"

The app was called "Program", which is also the word the app uses for a training program. So I couldn't just find and replace "Program". I grepped for the brand only (the `.brand` link, page titles, the README heading) and left every "program" that means a training program alone.

Changed, from "Program" to "Spotter":

- `public/landing.html`: the page title ("Spotter | training programs your clients actually log") and the header brand link.
- `public/login.html`: header brand link.
- `public/join.html`: header brand link.
- `public/side.js`: the brand at the top of the PT sidebar, so every PT page shows it.
- `README.md`: the top heading.

Left alone:

- Client pages have no brand on them, so nothing to change there.
- `package.json` `name` is `comp4020-final`, the repo name, not the app name. Not shown to anyone.
- Other page titles ("Dashboard", "Log in", etc.) never had the app name in them, so I didn't add it.
- Old notes and ADRs that say "Program" stay as they were (notes are append-only).

`pnpm check` passed (typecheck plus 20 tests). No `server.js` change, so no app restart. "Spotter" is the same length as "Program", so the header and sidebar layouts don't shift.
