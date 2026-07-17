---
title: Tiles & Melds
sidebar_label: Tiles & melds
description: Tile, GameTile, MenLike, and Hand — the data structures a hand is made of.
---

# Tiles & Melds

This page covers the value and instance types that make up a hand:
`Tile` → `GameTile` → `MenLike` → `Hand`.

## `Tile` — a tile kind (value type)

`Core/Tile.cs` defines `struct Tile`, an 8-bit packed value type. It represents a
*kind* of tile (e.g. "5 pin"), not a specific physical tile on the table.

- **Packing:** bits 0–3 = number (1–9), bits 4–6 = suit, bit 7 = akadora flag.
- **Key statics:** `Tile.Empty` (the invalid/"back" tile) and `Tile.North`
  (used for nukidora).
- **Predicates:** `IsValid`, `IsEmpty`, `Is19Z` (terminal/honor), `IsZ`,
  `IsMPS`, `IsSangen` (dragon), `IsWind`.
- **Equality:** `==` compares the raw byte (so a red five differs from a normal
  five), while `IsSame` ignores the red-five bit — that's the usual "same kind"
  comparison.
- **Sequences:** `Prev` / `Next` give neighbours within a suit; `IsNext` /
  `IsPrev` test adjacency.
- **Dora:** `NextDora` maps a dora *indicator* to the actual dora tile, with the
  correct wrap-arounds (9→1 for suits, N→E for winds, Red→White for dragons).

`Tiles : List<Tile>` is a collection with the multi-tile string parser, a compact
`ToString()`, and meld classifiers (`IsKou`, `IsKan`, `IsShun`, `IsJan`). Handy
static sets include `Tiles.All` (the full 136-tile set with one red five per
suit — the default wall contents), `Tiles.T19Z`, and `Tiles.T19`.

See [Tile notation](./tile-notation.md) for the parsing grammar.

## `GameTile` — a physical tile instance

`Core/GameTile.cs` defines `GameTile`, a *trackable* physical tile that wraps a
`Tile` and carries per-instance metadata:

| Member | Meaning |
| --- | --- |
| `tile` | The underlying `Tile` kind. |
| `traceId` | A random id, unique within a round, that follows this physical tile. Reset when it re-enters the wall. |
| `player` / `playerId` | Current owner (set on discard/meld). |
| `discardInfo` | If discarded: who discarded it, why (`DiscardReason`), when, and on which `jun`. |
| `drawnJun` | The turn it was drawn into hand. Comparing `drawnJun` with a discard's `jun` distinguishes tedashi (手切り) from tsumogiri (摸切り). |
| `source` | Where it currently is (`Hand`, `Wall`, `Wanpai`, `Discard`, …). |
| `IsTsumo` | `discardInfo == null` — i.e. self-drawn / concealed. |

`traceId` is the stable handle clients and replays use to follow a specific tile
across events. `GameTile` also supports `Freeze()` (an internal `Refrigerator`)
to snapshot and restore its mutable fields for hypothetical evaluation — the
engine uses this while probing pattern/shanten alternatives without mutating game
state.

## `MenLike` — a meld / group

`Core/MenLike.cs` defines the abstract `MenLike` (a read-only, sorted collection
of `GameTile`s) and its concrete subtypes:

| Type | Shape | Example |
| --- | --- | --- |
| `Shun` | Sequence (順子) | <Tiles notation="456m" inline /> |
| `Kou` | Triplet (刻子) | <Tiles notation="555p" inline /> |
| `Kan` | Quad (槓) | <Tiles notation="7777s" inline /> |
| `Jantou` | The pair (雀頭) | <Tiles notation="22z" inline /> |
| `Musou` | A single tile (only used by Thirteen Orphans) | <Tiles notation="1m" inline /> |

Notable members:

- `Value` — a canonical id that ignores red fives (used to compare melds).
- `IsClose` — true when every tile is concealed/self-drawn (matters for scoring,
  e.g. a concealed triplet).
- `Kan.KanSource` — auto-detected: **ankan** (all closed), **kakan** (added to a
  pon), or **daiminkan** (called).
- `MenLike.From(...)` — a factory that builds the right subtype from tiles.

## `Hand` — one player's hand

`Core/Hand.cs` holds everything about a single player's hand during a round:

**Tiles**

- `freeTiles` — the concealed tiles (excluding melds).
- `pendingTile` — the just-drawn tile, if any.
- `called` — the list of melds (`MenLike`).
- `discarded` — the discard pond (牌河).
- `nukiDora` — pulled North tiles (拔北); +1 han each, not counted in hand size.

**State**

- `jun` — the hand's turn counter.
- Riichi: `riichiTile`, `riichi`, `wRiichi` (double riichi), `ippatsu`.
- `menzen` — closed-hand status.
- Agari: `agariTile`, `agari`.
- Furiten: `isTempFuriten`, `isRiichiFuriten`, `isDiscardFuriten`, combined
  `isFuriten`.
- `Tenpai` — the current waits (computed via the `PatternResolver` when the hand
  is at 13 tiles).
- `Count` — total tiles, where **a kan counts as 3**.

**Mutations** (used by event listeners, not usually by you directly):
`AddPending`, `Riichi`, `Play` (discard), `AddChii` / `AddPon` / `AddKan`,
`Kakan`, and `Nuki`.

:::info[Winning-tile grouping matters]
The same 14 tiles can often be grouped more than one way, and the grouping can
change the fu (and occasionally the yaku). That's why scoring enumerates
*all* decompositions and keeps the highest — see
[Patterns & scoring](./patterns-and-scoring.md).
:::
