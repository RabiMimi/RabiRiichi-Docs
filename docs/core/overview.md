---
title: Core Engine Overview
sidebar_label: Overview
description: The architecture of the headless RabiRiichi rules engine.
---

# Core Engine Overview

The Core engine (`RabiRiichi.csproj`, namespace `RabiRiichi.Core` and friends) is
a **headless, deterministic** implementation of riichi mahjong rules. It has no
networking and no rendering. You configure a game, tell it how players make
decisions, and it runs the hand to completion, emitting events along the way.

## Mental model

A running game is organized around a handful of collaborating pieces:

| Piece | Type | Responsibility |
| --- | --- | --- |
| Game | `Core/Game.cs` | The root object and DI container. Owns players, wall, info, the event bus, and the main queue. |
| Game info | `Core/GameInfo.cs` | Dynamic per-round state: round, dealer, honba, riichi sticks, current player, game id. |
| Players & hands | `Core/Player.cs`, `Core/Hand.cs` | Each seat's points, hand tiles, melds, discards, riichi/furiten/agari state. |
| Wall | `Core/Wall.cs` | The live wall, dead wall, dora/ura indicators, rinshan draws. |
| Config | `Core/Config/GameConfig.cs` | Every rule tunable and the pluggable rule "setup". |
| Events | `Events/**` | The FIFO event queue + priority-ordered listeners that drive the game. |
| Actions | `Actions/**` | How players are offered choices (inquiries) and respond. |
| Patterns | `Patterns/**` | Hand decomposition, yaku recognition, and scoring. |

## How a game runs

1. You construct a [`GameConfig`](./configuration.md) and set its
   `actionCenter` (an `IActionCenter` — your bridge for answering player
   inquiries).
2. `new Game(config)` builds a dependency-injection container, instantiates the
   players and wall, runs the pluggable **setup** (which registers all the yaku
   patterns and event listeners), and queues the bootstrap `InitGameEvent`.
3. `await game.Start()` pumps the [event queue](./events.md). Listeners handle
   each event and may queue more events. Whenever a player must choose, a
   `WaitPlayerActionEvent` presents an [inquiry](./actions-and-inquiries.md) and
   blocks the queue until the answer (or a timeout) arrives.
4. Wins and draws run the [scoring pipeline](./patterns-and-scoring.md), points
   move, the dealer rotates (or repeats), and either the next hand begins or the
   match ends.

The complete event graph is documented in [The event system](./events.md).

## Determinism and the DI container

`Game` is built on `Microsoft.Extensions.DependencyInjection`. During
construction it registers itself, the RNG, config, event bus, wall, game info,
the `PatternResolver`, and more as singletons, then calls the ruleset's `setup`
to register patterns and listeners. Anywhere in the engine you can resolve a
service with:

```csharp
var resolver = game.Get<PatternResolver>();
```

Shuffling uses a `RabiRand` seeded from `config.seed` (or the current time when
unset). **Providing a `seed` makes a game fully reproducible** — this is what the
[scenario tests](../testing/scenario-test.md) and simulations rely on.

## The pluggable ruleset (`BaseSetup` / `RiichiSetup`)

Rules aren't hard-coded into `Game`; they're assembled by a
[`BaseSetup`](./configuration.md#the-pluggable-ruleset). `GameConfig.setup`
defaults to `RiichiSetup`, which:

- registers the three **base patterns** (standard hand, seven pairs, thirteen
  orphans) and the full **standard pattern** list (every yaku, fu calculator, and
  bonus like dora),
- registers all **action resolvers** (who may chii/pon/kan/ron/riichi/…), and
- registers every **event listener** into the event bus.

Because it's just a class, you can subclass it to add, remove, or restrict yaku —
which is exactly how the server offers per-room custom rulesets.

## Where to go next

- [Tile notation](./tile-notation.md) — the compact string grammar used
  everywhere (and in these docs).
- [Tiles & melds](./tiles-and-melds.md) — `Tile`, `GameTile`, `Hand`, `MenLike`.
- [Game & players](./game-and-players.md) — `Game`, `GameInfo`, `Player`.
- [The wall](./wall.md) — dead-wall layout, dora, rinshan, nukidora.
- [Configuration](./configuration.md) — every rule option.
- [The event system](./events.md) — the heart of the engine.
- [Actions & inquiries](./actions-and-inquiries.md) — player decisions.
- [Patterns & scoring](./patterns-and-scoring.md) — yaku and points.
