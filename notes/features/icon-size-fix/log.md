# icon size fix: log

## 2026-11-09 00:50

I asked: "increase the size of the nav bar icons for the client side"

The client nav bar is the bottom pill from `public/nav.js` (Dashboard and Settings icons). Its icon size is set in one rule in `public/style.css`: `.pillnav svg`. Changed it from 22px to 28px. Nothing else changed.

Why 28px: it's a clear step up you can see at a glance, and it still sits well inside each 72px wide link. The pill gets 6px taller (about 46px to 52px of link height, 64px total with padding). `body.client main` already has 120px of bottom padding, so the taller pill doesn't cover page content.

`pnpm check` passed (typecheck and 20 tests).

Not done: I couldn't look at the page in a browser this session (no browser tool here), so the 390px light and dark check from CLAUDE.md still needs doing by eye.
