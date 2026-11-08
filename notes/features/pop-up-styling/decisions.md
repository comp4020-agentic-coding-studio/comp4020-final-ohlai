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
