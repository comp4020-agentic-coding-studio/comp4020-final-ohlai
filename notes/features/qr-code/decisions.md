# QR code: decisions

## 2026-11-09 How the QR code is made

- What came up: a QR code needs an encoder, and the app has no dependencies on purpose (`docs/adr/0001-stack.md`).
- Options: (1) write our own encoder in `public/qr.js`; (2) vendor a small MIT library like `qrcode-generator`, which needs a new ADR; (3) an online QR image service, a one-liner that sends every invite token to a third party.
- Picked: our own encoder. I said "build our own encoder. there is a pretty optimised github one we can build off of here https://github.com/p2r3/ha.mr".
- Why: it keeps the no-dependency stack and keeps the invite token in the browser. Option 3 was ruled out because anyone with an invite token can sign up as that client.
- No ADR, since it adds no dependency and doesn't change the architecture.

## 2026-11-09 Where the QR code shows

- What came up: whether it shows only in the "Invite ready" popup, or also on the client's card so the PT can bring it up again later.
- Options: (A) only in the popup, the same place as the link; (B) also on the client card, which means the server sending the invite token back to the PT later.
- Picked: A. I said "yes show itvite ready popup the same as the regular link".
- Why: it goes where the link already is. B would change what the server returns.

## 2026-11-09 QR code colours in dark mode (agent's call, small)

- The QR code is always dark squares on a light plate, so in dark mode it sits on a white square. Some phone camera apps can't read a light-on-dark code. It still only uses the theme tokens (swapped in dark), no hex values.
