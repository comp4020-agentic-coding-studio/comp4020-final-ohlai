# 1. Node built-ins and SQLite, no dependencies

## Context

The app runs on one shared-cpu-1x Fly machine with 256 MB of memory and one
volume at `/data`. It needs HTTP, a database that survives redeploys, and a
mobile page for logging sets. I develop on a Windows ARM64 laptop, where native
Node modules such as better-sqlite3 have failed to build before.

## Options

1. **A framework (SvelteKit or Astro) with better-sqlite3 and Drizzle.** What I
   used in crit 7. Fast to build pages, but it brings a native build that
   breaks on my laptop and a bundler step.
2. **Postgres on Fly.** Outside the course setup (one machine, one volume).
3. **Node 24's built-in `node:http` and `node:sqlite`, plain HTML and JS
   pages.** No install step, no native build, nothing to update.

## Decision

Option 3. `server.js` is the whole backend; `public/` holds three pages and a
stylesheet. The database is one SQLite file on the volume.

## Costs

- No router, templating or component model: every page builds its own DOM.
  Fine at three pages, painful at fifteen.
- `node:sqlite` is still marked experimental in Node 24.
- Real-time (crit 9) has to be written by hand, likely server-sent events,
  since there is no framework to provide it.

If the pages grow past what plain JS handles well, switch and write a new record.
