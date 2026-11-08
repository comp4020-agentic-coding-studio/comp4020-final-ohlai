# update emojis to real icons: decisions

## 2026-11-08: drawn icons instead of emojis for camera and chat

- What came up: the chat photo button (📷) and the floating chat button (💬) were emojis.
- Options: keep the emojis, add an icon library, or draw inline SVGs.
- Picked: drawn icons instead of emojis (my ask). Inline SVG with `currentColor`, the same way `public/nav.js` does its icons, so no dependency and the colours follow the theme.

## 2026-11-08: messages icon from my reference, solid camera

- What came up: I didn't like the outlined icons from the first pass (see the entry above).
- Picked: the messages icon is a solid bubble with two lines cut out, copied from a screenshot I sent. The camera is solid too, not outlined.
- Also asked for: centre the icons in their buttons and fix the back arrow, which looked off centre. The back arrow is now an SVG as well, on every page that has one.

## 2026-11-08: rounder camera

- What came up: the solid camera looked sharp next to the soft message bubble.
- Picked: round out the camera (rounded body, curved top bump) to match the bubble's style. My ask.
