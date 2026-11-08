# viewing a client in the PT dash: decisions

Newest at the bottom. Same format as `notes/decisions.md`.

## 2026-11-08: Client detail on the dash

- **Side panel or popup.** The client detail opened as a panel on the right
  that squashed the dash into one column. Options: keep the side panel, or a
  popup over the dash. I picked a regular popup in the middle of the screen,
  because the side panel made the whole dash wrap when it opened.
- **Where a lift's chart opens.** Clicking a lift used to leave the dash for
  the PT program page. I asked for it to stay inside the popup, as a second
  card beside the client card ("like two cards side by side"), not a new page.
- Claude's calls, for me to say yes or no to: Esc and the lift card's ✕ close
  only the lift card first, then the client. Clicking the dimmed dash closes
  everything. "Open program" stays on the client card for the full program
  page. The chart code moved into `public/lift-chart.js` so the dash and the
  program page share one copy.
