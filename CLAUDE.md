# Harness

The app is a gym program tracker for one PT and their clients. `README.md` says
what good means, which is that the app fits each person where they are: the
client on a phone mid-workout, the PT at a desk. These rules follow from that.

## Never

- Never let the PT link log or change a client's sets, and never put the PT
  link in anything the client link returns. `spec/programs.test.ts` checks both.
- Never delete or rewrite logged sets as a side effect. A set goes away only
  when the client removes it.
- Never add a dependency without a decision record in `docs/adr/`. The stack is
  Node built-ins and SQLite on purpose (`docs/adr/0001-stack.md`).

## Every client page

- Logging a set is one tap when the client repeats last session. Rows are
  pre-filled from the previous session.
- Works at phone width (390px) with no horizontal scroll, and every control is
  reachable by keyboard.
- Has the mobile/desktop toggle. Client pages start in mobile, PT pages in
  desktop. A new screen for the client is designed at phone width first; a new
  screen for the PT is designed at desktop width first.
- Has the classic/mono style toggle. Colours come from the tokens in
  `public/style.css`, never a component's own hex value.

## Every change

- Run the app (`node server.js`), then `pnpm check`. Both must pass before a
  commit.
- Look at the changed page at phone and desktop width before calling it done.
- Schema changes are additive: add columns with a guarded `ALTER TABLE` in
  `server.js`, never drop data on the volume.
- When the agent gets something wrong, the fix goes into this file or `spec/`,
  not just into the code.
