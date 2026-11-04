# REAL — Plush companion tag codes

Every REAL plush ships with a tag code. Entering it in the game (📱 **Pal** app → *Link a plush with its tag code*) adds that species as a floating companion that gives tips.

## Format

`REAL-XXXXXX`. It uses a 32-character alphabet with no 0, O, 1 or I, to avoid misreading.

| Position | Meaning |
|---|---|
| 1 | Species: A fox, B cat, C dog, D horse, E bird, F elephant, G lion, H cow, J dolphin |
| 2–5 | Serial number (32⁴ ≈ 1 million per species) |
| 6 | Weighted check digit (catches typos and swapped characters) |

Codes are verified on the device only. No account is needed and nothing is sent anywhere.

## Generating codes for production

```
node Tools/plush_codes.mjs fox 1000 1      # 1,000 fox codes starting at serial 1
node Tools/plush_codes.mjs dolphin 500 1   # 500 dolphin codes
```

Each line is one printable code. Keep serial ranges per production batch so codes never repeat.

## Limits

The check digit stops typos, but it is not a secret. Someone who knows the format can make a valid code. That is acceptable here because a companion is a cosmetic helper with no gameplay advantage. If codes ever unlock paid content, verify them on a server instead.
