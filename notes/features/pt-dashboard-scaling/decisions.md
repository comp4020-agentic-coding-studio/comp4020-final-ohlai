# PT dashboard scaling: decisions

## 2026-11-09 Cards wrap instead of overlapping when the dashboard gets narrow

What came up: at some window widths the Needs attention and Last 7 days cards overlapped the Clients and Recent workouts cards.

Options:
- Let the cards overlap, as before. Rejected by me.
- Shrink or scroll the clients table inside its card so both columns always stay side by side.
- Move the right column somewhere else when there isn't room.

What I picked: "I would rather then tile somewhere else rather than overlapping." Where they go was left to the agent: the right column now drops below Clients and Recent workouts at full width once the two columns no longer fit side by side, the same stacked layout the dashboard already used under 1100px. The switch follows how wide the clients table actually is rather than a fixed screen width.
