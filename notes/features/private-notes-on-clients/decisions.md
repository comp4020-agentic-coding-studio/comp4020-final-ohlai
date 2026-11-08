# private notes on clients: decisions

Newest at the bottom. Same format as `notes/decisions.md`.

## 2026-11-08: How private notes work

Building the preview needed four choices first, so Claude asked with a pick for each. I said: "the note shuold be on the CLIENT not the clients program so mirror if it appears in multiple spots. Yes free text can be whatever you want in there but no hardcoded date entries. Yep saved sounds good. Only PT can see the program."

- **What a note belongs to.** Options: the client (my user id plus the client's email, matched ignoring case, the same way the CSV export groups clients), or the program. Picked the client. If a client has two programs with me, both client cards show the same note, and editing it in one changes it in the other. Claude's reason for suggesting it was that an injury doesn't go away when a client starts a new block. I didn't give my own reason.
- **Shape.** Options: one free-text box, or dated entries added over time. Picked one free-text box with whatever I want in it, and no dates added to it automatically.
- **Saving.** Options: saves on its own with a "Saved" line under the box, or a Save button. Picked saving on its own. See the next entry for when it saves.
- **Who sees it.** Only the PT. I wrote "Only PT can see the program", which Claude read as the note, since that was the question. Not the client, not the client link, not the PT link, not another PT.

## 2026-11-08: Saves as you type, not when you click out

The option I agreed to said the note saves when I click out of the box. While building it, Claude found that closing the card with Esc or the ✕ straight after typing might never save, because the card is rebuilt or closed before the box loses focus. So it saves about 0.6s after I stop typing instead. Same idea (no Save button, a "Saving…"/"Saved" line under the box), just a different moment. Claude made this change without asking first and flagged it to me afterwards. Not confirmed by me yet.

## 2026-11-08: Confirmed: save after you stop typing

Follows on from the entry above, which said it wasn't confirmed yet. I confirmed it: "yes after you stop typing is good rather than clicking out bc you might stop typing, review hat you said for a second (then hopefully by the time you re over what you wrote it should say saved. instead of only when you click off the input." My reason is that you often stop typing and read back over what you wrote before moving on, and by the time you've done that it should already say "Saved". It shouldn't only save once you click out of the box. No code change.
