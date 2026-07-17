---
title: Game & Players
sidebar_label: Game & players
description: The Game root object, GameInfo state, and the Player/seat model.
---

# Game & Players

## `Game` — the root object

`Core/Game.cs` is the central object and the dependency-injection root. You create
one from a [`GameConfig`](./configuration.md) and it wires up everything else.

```csharp
var game = new Game(config);   // builds DI container, players, wall, setup
await game.Start(cancellationToken);
```

**What it owns (read-only fields):**

- `info` — the [`GameInfo`](#gameinfo--dynamic-state) (and `config => info.config`).
- `wall` — the [`Wall`](./wall.md).
- `eventBus` and `mainQueue` — the [event system](./events.md).
- `players` — the seat array.
- `protoGraph` — the serializer graph (used by `SerializeProto`).
- `onGodViewEvent` — an `Action<EventBase>` that fires once for **every** event
  before per-seat privacy filtering. The server uses it to capture god-view
  [replays](../server/replays.md).

**Construction** requires `config.actionCenter` to be set. It registers singletons
(itself, the RNG, config, event bus, wall, game info, `PatternResolver`, …), runs
`config.setup.Inject(...)` then `config.setup.Setup(...)` to register all patterns
and listeners, instantiates the players, and queues the bootstrap `InitGameEvent`.

**Useful members:**

| Member | Purpose |
| --- | --- |
| `Get<T>()` / `TryGet<T>(out T)` | Resolve a service from the DI container. |
| `Start(token)` | Run the main event queue to completion. |
| `GetPlayer(id)`, `Dealer`, `PlayersByRank` | Player lookups. |
| `NextPlayerId` / `PrevPlayerId` / `NextPlayer` / `PrevPlayer` | Seat navigation. |
| `Dist(lhsId, rhsId)` | Cyclic seat distance (used for seat winds and ron tie-breaks). |
| `IsYaku(tile)` | Whether a tile is a value tile (dragon or round wind). |
| `IsFirstJun` | True while everyone is still on their opening, closed, meld-free turn. |
| `SerializeProto<T>(obj, playerId)` | Serialize an object to proto from a seat's perspective. |
| `SyncGameStateToPlayer(id)`, `SendInquiry(...)`, `SendEvent(...)` | Communication hooks into the `IActionCenter`. |

`const int HAND_SIZE = 13`.

## `GameInfo` — dynamic state

`Core/GameInfo.cs` holds the state that changes as the match progresses:

- `phase` — `Pending` / `Running` / `Finished`.
- `round`, `dealer`, `honba`, `currentPlayer`, `riichiStick`.
- `gameId` — the id assigned by the server (`{yyyyMMddTHHmmss}-{roomId}`).
- `wind` — the prevailing/round wind, derived from `round`.
- `IsAllLast` — whether this is the final round.
- `timeStamp` / `eventId` — monotonic counters used to order discards/events.
- `Reset()` — clears per-round transients; `ToProto()` — serializes for clients.

## `Player` — a seat

`Core/Player.cs` represents one seat:

- `id`, `game`, and its `hand` ([`Hand`](./tiles-and-melds.md#hand--one-players-hand)).
- `points` — starts at `config.pointThreshold.initialPoints`.
- `Wind` — the seat wind, computed as the distance from the dealer
  (`Wind` enum is `E, S, W, N`).
- `IsDealer`, `SamePlayer(other)`, and seat-navigation helpers.
- `IsYaku(tile)` — value tile for *this* player (dragons, round wind, **or its own
  seat wind**).
- `Reset()` — gives the player a fresh `Hand` at the start of a round.

:::note[Seat winds vs. round wind]
`Game.IsYaku` only knows dragons and the round wind. Seat-wind value tiles are
player-specific, which is why `Player.IsYaku` additionally checks the player's own
`Wind`.
:::
