# pop up styling: decisions

## 2026-11-08 Every popup looks like the PT dash's client card

**What came up:** I asked for every popup in the app to use the client card popup from the PT dash as the style.

**Picked:** one shared `.pop` style taken from the client card (card, border, radius, shadow, blurred page behind, pop-in), used by Export, Nudge, Log out and Assign.

**Why:** I asked for it. I haven't said why the client card is the one to copy.

## 2026-11-08 Browser confirm() boxes count as popups (agent's call, needs my OK)

**What came up:** Delete program, Discard workout and Finish workout used the browser's own `confirm()` box, which can't be styled.

**Options:** leave them as browser boxes, or swap them for the same in-app popup as Log out.

**Picked (by the agent, not me yet):** swapped them for `ask()` in `public/ui.js`, the Log out popup made general. They read as popups to someone using the app, so they seemed in scope for "all pop ups".

## 2026-11-08 Chat drawer stays a bottom sheet (open question)

**What came up:** the chat on the program page slides up from the bottom on a phone, rather than being a card in the middle.

**Options:** keep it a bottom sheet with only the blur matching, or make it a centred card like the client card.

**Picked for now (agent):** kept the bottom sheet, only the blurred backdrop matches. Waiting on me.

## 2026-11-08 22:06 Why the client card, and the two open questions settled

This adds to the three entries above, which stay as they were.

**Why the client card (my words, in short):** it's the one I polished to look the best. The blur makes people focus on what's needed, blocking scroll stops them getting distracted, and it has a nice fluid animation in.

**Follow-on:** because blocking scroll is part of the reason, every popup now blocks the page scrolling behind it, not just the yes/no ones (see log.md, 22:06).

**Browser confirm() boxes:** I OK'd swapping them for the in-app popup. Settles the "agent's call, needs my OK" entry above.

**Chat drawer:** I OK'd keeping it a bottom sheet with the matching blur. Settles the "open question" entry above. The agent's reason was that it's easier to reach with a thumb. I didn't give my own reason, I said all of it looks good.
