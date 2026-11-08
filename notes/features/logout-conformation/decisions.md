# logout conformation: decisions

## 2026-11-07: Ask before logging out

What came up: tapping Log out by accident logs you straight out and getting back in is annoying.
Options: leave it, or ask "are you sure" first.
Picked: ask first.
Why (my words): "ATM if you fatfinger or accidentally click logout it is annoying to get back in so a conformation fits well here."

## 2026-11-08: PT gets the same popup

What came up: Log out is on the client Settings page and in the PT sidebar. Only the client was clearly on a phone where fat fingers happen.
Options: client only, or both.
Picked: both, same popup.
Why: not given yet.

## 2026-11-08: Custom popup, not the browser's confirm()

What came up: how the popup should look.
Options: the browser's built-in `confirm()` (simplest, but looks out of place and can't be styled), or a custom popup in the mono style (Claude's recommendation).
Picked: custom popup, with a smooth in animation and a blurred background.
Why: not given yet.

## 2026-11-08: Lock background scrolling while the popup is open

What came up: asked for in passing with the popup.
Picked: page behind the popup can't scroll while it's open.
Why: not given yet.

## 2026-11-08: Reasons for the three decisions above

The three entries above were written before I'd said why, so they say "not given yet". Here are the reasons, in my words.

- PT gets the same popup: "there is no scenario where you need to log out really quickly even on desktop so it feels better to ask first before you make someone log back in."
- Custom popup, not confirm(): "the built in popup drages the user out of the experinece of the app and has worse design than our custom one."
- Lock background scrolling (and blur it): "in my expereince it feels weird when you can interact with something that is not in focus unless multitasking on purpose - forces user to pay attention and focus on the pop up which is also why we blur the bg"
