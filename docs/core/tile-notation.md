---
title: Tile Notation
sidebar_label: Tile notation
description: The compact string grammar for tiles, hands, and melds — and how these docs render them as images.
---

# Tile Notation

RabiRiichi uses a compact ASCII notation for tiles and hands. It's what
`Tile`/`Tiles` parse from strings, what the test suite is written in, and what
these docs use to render real tile images.

## Single tiles

A tile is **a number 1–9 followed by a suit letter**:

| Suit letter | Meaning | Example | Renders |
| --- | --- | --- | --- |
| `m` | man (万 / characters) | `1m` | <Tiles notation="1m" inline /> |
| `p` | pin (筒 / circles) | `5p` | <Tiles notation="5p" inline /> |
| `s` | sou (索 / bamboo) | `9s` | <Tiles notation="9s" inline /> |
| `z` | honor (字) | `1z` | <Tiles notation="1z" inline /> |

Honor tiles (`z`) are numbered **1–7**: `1z`–`4z` are the winds
East / South / West / North, and `5z`–`7z` are the dragons White / Green / Red.

<Tiles notation="1234567z" caption="1z–7z: East, South, West, North, White, Green, Red" />

### Red fives (akadora)

A red five is written with a leading `r`, or with the digit `0`. So `r5p`, `0p`
both mean "red 5 pin":

<Tiles notation="r5p 0s 0m" caption="Red 5-pin, red 5-sou, red 5-man" />

## Multiple tiles

Consecutive digits share the next suit letter, so a whole suit collapses nicely:

```text
123m     →  1m 2m 3m
11222333s → two 1s, three 2s, three 3s
```

<Tiles notation="123m456p789s11z" caption="123m456p789s11z" />

You can freely mix suits by repeating the pattern (`digits + suit`), and add a
red five anywhere with `r` or `0`:

<Tiles notation="11222333s22456m" caption="A closed iipeikou shape: 11222333s + 22m + 456m" />

## Melds and the winning tile (docs helper)

When showing an example hand, the docs' `<Tiles>` helper accepts extra
**segments separated by `+`**. The convention (mirroring the test builders) is:

```text
<hand> + <meld> + <meld> ... + <winning tile>
```

- **Called (open) meld** — prefix the claimed tile with `-`. The `-` marks the
  rotated tile taken from another player's discard.

  <Tiles notation="11222333s22+-456m+4s" caption="A meld 456m called from another player (the 4m is rotated); winning on 4s" />

- **Concealed kan (ankan)** — bracket the visible pair with `x` for the two
  face-down back tiles: `x11xs`.

  <Tiles notation="2z+x11xs+x11xp+x11xm+x11xz+2z" caption="Four concealed kans plus a pair wait" />

- **Winning tile** — the final segment is the tile the hand completes on.

  <Tiles notation="123s123s456m22m+23s+4s" caption="Winning on 4s" />

:::note[These segments are a docs convenience]
The `+`-separated meld/winning-tile layout is how the **image service** and the
test builders present a hand. The engine's own `Tile(string)` / `Tiles(string)`
parsers handle a single group of tiles (the digit/suit/`r`/`0` rules above); the
richer `+` layout is assembled by helpers like `StdTestBuilder`
(see [Yaku unit tests](../testing/yaku-unit-test.md)).
:::

## Rendering tiles in the docs

These docs ship a global `<Tiles>` MDX component (no import needed) backed by a
tile-image service. Pass it a `notation`, and optionally a `caption` or
`inline`:

```mdx
<Tiles notation="123m456p789s11z" />

<Tiles notation="11222333s22456m+4s" caption="Iipeikou, winning on 4s" />

An inline tile like <Tiles notation="0p" inline /> sits in a sentence.
```

renders as:

<Tiles notation="123m456p789s11z" />

<Tiles notation="11222333s22456m+4s" caption="Iipeikou, winning on 4s" />

An inline tile like <Tiles notation="0p" inline /> sits in a sentence.

:::tip[Authoring]
Because the images come from notation, you never have to add or manage tile art
in this repo — just write the notation and the correct hand appears.
:::

## Grammar reference (engine parser)

From `Core/Tile.cs` and `Core/Extensions.cs`:

- **Suit letters** map case-insensitively: `m→M`, `p→P`, `s→S`, `z→Z`; anything
  else is invalid and throws.
- **A single tile** is exactly `<digit><suit>`, optionally prefixed with `r`.
  Digit `0` is shorthand for a red 5 (`Num = 5`, `Akadora = true`).
- **A tile list** accumulates digits until a suit letter assigns the suit to all
  pending digits; an `r` flags the following digit as a red five.
- Internally a `Tile` is a single packed byte: bits 0–3 the number, bits 4–6 the
  suit, bit 7 the akadora flag. `IsSame` compares two tiles ignoring the red-five
  bit, which is the usual "same tile kind" test.

See [Tiles & melds](./tiles-and-melds.md) for the full `Tile` / `Tiles` API.
