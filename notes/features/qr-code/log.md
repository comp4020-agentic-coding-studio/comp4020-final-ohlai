# QR code: log

Newest at the bottom.

## 2026-11-09 09:10 Start

I asked: "maybe add a qr code as well as the link for pts to invite their clients? This will also make it easier for markers to use the client side on their phones like intended."

Looked at how invites work now. Onboard client on the dashboard (`public/dash.html`) makes an invite and switches the popup to "Invite ready", which shows the `/join/<token>` link and an Email invite button. The link is only shown there, once. There is no QR code anywhere.

Making a QR code needs an encoder. The stack is Node built-ins and no dependencies (`docs/adr/0001-stack.md`), so how to build it is a choice for me to make. Stopped and asked before writing code.

## 2026-11-09 09:15 Building the encoder and the popup QR code

I said: "build our own encoder. there is a pretty optimised github one we can build off of here https://github.com/p2r3/ha.mr" and "yes show itvite ready popup the same as the regular link".

What didn't work: the agent couldn't read the ha.mr repo. The GitHub API, the web fetch and `git clone` all needed permission in this session and weren't approved. So nothing in `public/qr.js` comes from ha.mr. It was written from the QR standard (ISO/IEC 18004) instead. If I want ha.mr's approach (it's meant to be well optimised), that's still open.

What was built:
- `public/qr.js` (new): a QR encoder with no dependencies. Byte mode, error correction level M (still reads with about 15% of it damaged or covered), versions 1 to 10, so up to 213 bytes. An invite URL is about 60 bytes, which comes out as a 33 by 33 code. It throws on longer text rather than making a broken code. `qrSvg(url)` draws it as an SVG with the 4-module quiet zone scanners need.
- `public/dash.html`: the "Invite ready" popup shows the QR code above the link. The text now says "They can scan this with their phone, or you can email them the invite from your own email:".
- `public/style.css`: `.qr` is 200px, centred. It uses `--card` and `--ink` in light mode and swaps them in dark mode, so it's always dark on light (a white plate on the dark popup), because some phone cameras won't read a light-on-dark code.
- `spec/qr.test.ts` (new): checks the encoder's output against a saved grid from a reference encoder, and that it refuses text that's too long.

How it was checked:
- Compared the encoder against the Python library `segno`, installed into a temp folder only for this, not added to the app. That was 18 texts from 1 to 213 bytes, including non-ASCII, across versions 1 to 10, with all 8 masks forced, and every module matched.
- First mismatch: every grid differed. The data bytes matched but the last pad byte didn't (mine 236, segno 0). It turned out segno adds 8 padding zero bits when the data already ends on a byte boundary (`8 - (length % 8)` gives 8, not 0), which pushes one 0 byte in where the standard puts the 236/17 pad bytes. Both codes scan, but mine follows the standard. Patched that in the temp reference script only, and after that all fixed masks matched.
- When the mask is picked automatically, my encoder and segno sometimes pick different ones. The mask choice is a scoring step, and libraries score the "finder look-alike" rule a bit differently. Any of the 8 masks gives a valid code, so this doesn't matter for scanning.
- Reed-Solomon was checked on its own against the textbook "HELLO WORLD" 1-M example (196 35 39 119 235 215 231 226 93 23), and the GF(256) multiply against log tables for every pair.
- `pnpm check`: 22 tests pass.
- Headless Chrome at 1280x800, light and dark: signed up a PT, saved a program, clicked Onboard client, filled the form and clicked Create invite. The popup showed "Invite ready" with the QR code and link, and both clients were on the dashboard afterwards, so the invites reached the server. Also looked at the dashboard with the popup closed in dark mode, and it was fine.
- Not done: scanning it with a real phone camera. The module-for-module match with segno is the stand-in for that.

No `server.js` change, so no app restart was needed.
