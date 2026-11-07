# toggles and nav bar: decisions

## 2026-11-07: theme switch fades instead of jumping

- **What came up:** switching Light/Dark in Settings felt jumpy.
- **Options:** fade all colours with CSS transitions while switching; or a whole-page crossfade with the View Transitions API.
- **Picked:** I asked for a smooth animation. Claude went with the CSS fade, only on during the switch, because it works in every browser and only touches colours.

## 2026-11-07: the bottom nav highlight slides between icons

- **What came up:** I wanted the nav to "slide smoothly between" like the theme toggle.
- **How:** the highlight slides to the tapped icon and the page changes 220ms later, once the slide is done. Claude's call on the 220ms wait (the pages are separate loads, so the slide has to finish before leaving). The System/Light/Dark toggle got the same sliding highlight.

## 2026-11-07: icon-only nav

- **What came up:** the nav felt too cluttered with the text.
- **Picked:** I said "just keep the icons". The words are gone from view but kept as `aria-label` and `title` so screen readers and hover still name each page.
- **Follow-on, Claude's call, not confirmed yet:** with no text the pill was shrunk to fit the icons (72px per icon) instead of stretching across the screen.
