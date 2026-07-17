---
title: The Wall
sidebar_label: The wall
description: Live wall, dead wall, dora/ura indicators, rinshan draws, and nukidora sizing.
---

# The Wall

`Core/Wall.cs` manages all the tiles not in players' hands: the live wall, the
dead wall (王牌), dora/ura indicators, and the rinshan (replacement) tiles.

## Layout

```text
                           ┌─────────── dead wall (王牌) ───────────┐
live wall (draw from here) │  dora indicators │ ura indicators │ rinshan │
◀──────────────────────────┘                                            
```

Key fields:

| Field | Meaning |
| --- | --- |
| `remaining` | The live wall; tiles are drawn from the end. |
| `rinshan` | Replacement tiles for kans/nukidora. |
| `doras` / `uradoras` | The dora and ura-dora indicator stacks. |
| `revealedDoraCount` / `revealedUradoraCount` | How many of each are face-up. |
| `initialWall` | A flattened, physical 136-tile layout for rendering/replay. |
| `NumRemaining` | Live tiles left to draw, accounting for the reserved dead wall. |
| `IsHaitei` | `NumRemaining <= 0` — the exhaustive-draw boundary. |

Constants: `NUM_DORA = 5`, `NUM_RINSHAN = 4`.

## Lifecycle and draws

- `Reset()` — called at the start of each hand. It rebuilds the wall from
  `config.initialTiles` (each becomes a fresh `GameTile` with a new trace id),
  shuffles with the game RNG, then pops the rinshan, dora, and ura stacks and
  builds `initialWall`.
- `Draw()` / `Draw(count)` — draw from the live wall (`source = Wall`).
- `DrawRinshan()` — draw a replacement tile (`source = Wanpai`).
- `RevealDora(isKan)` — flip the next dora and/or ura indicator, according to the
  `DoraOption` flags in effect (initial vs. kan timing); returns the new
  indicator.
- `CountDora(tile)` / `CountUradora(tile)` — how many han a tile earns from the
  currently revealed indicators.

## The `initialWall` layout

`BuildInitialWall()` produces a single flat list in **draw order** (first tile
drawn first), with the dead wall at the tail: the dora/ura indicators interleaved
into stacks, followed by the rinshan tiles paired up. This is what clients render
in the "initial wall" viewer and what god-view [replays](../server/replays.md)
carry so the whole wall can be shown.

:::info[Replay tip]
`initialWall` is a *static* per-round snapshot. If you rebuild client state from a
mid-round sync, carry the existing `initialWall` forward — a sync snapshot does
not re-send it.
:::

## Nukidora and dead-wall sizing

When `DoraOption.Nukidora` is enabled, each North that can be pulled needs its own
replacement tile, so the rinshan is enlarged:

```text
rinshanSize = NUM_RINSHAN + (number of North tiles in config.initialTiles)
```

This way kans and nukidora share one enlarged dead wall, and each nuki reduces
`NumRemaining` by exactly one. See the
[Actions & inquiries](./actions-and-inquiries.md) page for how nuki is offered,
and the engine's `dev/event-flow.md` for the full nukidora event flow.

## Scripted manipulation (tests & effects)

For scenario tests and "search-the-wall" style effects, `Wall` exposes a rich set
of manipulation methods: `Remove`, `FindInHidden`, `Insert`/`Replace` (live wall,
first/last), and `PlaceDora` / `PlaceUradora` / `PlaceRinshan` (plus their
`Replace…` variants). These let a test pin exact tiles into the wall or dead wall
before or during a game — see [Scenario tests](../testing/scenario-test.md).
