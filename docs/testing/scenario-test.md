---
title: Scenario Tests
sidebar_label: Scenario tests
description: Drive a real game through the event bus and assert on the events it produces.
---

# Scenario Tests

Unit tests check a single pattern in isolation. **Scenario tests** exercise the
whole engine: they set up a realistic game, run it through the
[event bus](../core/events.md), script player inputs, and assert on the events
that come out. Use them when behavior spans multiple events — claims, riichi
timing, abortive draws, chankan, dealer rotation, scoring transfers.

## The idea

A scenario test wires up a game with a **test action center** that lets you:

- observe the stream of events the engine emits,
- wait until a player is being asked to act,
- respond on that player's behalf (or take the default),
- and pin the wall/dead wall so a specific situation is reproducible.

Because the game and the test run concurrently (the engine releases its lock while
waiting for input), you generally *wait* for the game to reach a decision point
rather than forcing state synchronously.

:::warning[Don't force synchronously]

The game and test run in parallel. Avoid resolving inquiries "immediately" unless
you've confirmed the game is actually waiting for a player — otherwise you'll race
the engine.

:::

## Determinism

Give the config a fixed `seed` so shuffles are reproducible:

```csharp
var config = new GameConfig {
    playerCount = 4,
    actionCenter = actionCenter,
    seed = 1145141919810ul,
};
```

To pin *exact* tiles (rather than relying on the seed), use the
[`Wall` manipulation methods](../core/wall.md#scripted-manipulation-tests--effects)
during setup — e.g. `wall.InsertFirst(tile)` to control the next draw, or
`wall.PlaceDora(i, tile)` to fix a dora indicator.

## A full-game smoke test

The simplest scenario just plays a whole game to the end and asserts it
terminated. This is the shape of `RabiRiichi.Tests/Scenario/Full/FullGame.cs`:

```csharp
[TestMethod, Timeout(60 * 1000)]
public async Task RunFullGame() {
    int playerCount = 4;
    var actionCenter = new ScenarioActionCenter(playerCount);
    var config = new GameConfig {
        playerCount = playerCount,
        actionCenter = actionCenter,
        seed = 1145141919810ul,
    };
    var game = new Game(config);
    var random = new RabiRand(config.seed.Value);

    // Run the game in the background; report faults back to the test harness.
    var runToEnd = game.Start().ContinueWith(e => {
        if (e.IsFaulted) actionCenter.ForceFail(e.Exception);
        else actionCenter.ForceCancel();
    });

    // Drive it: whenever a player is asked to act, answer.
    while (!runToEnd.IsCompleted) {
        try {
            var inquiry = await actionCenter.NextInquiry;
            foreach (var pi in inquiry.inquiry.playerInquiries) {
                if (pi.actions.Count == 0) continue;
                // Prefer winning; otherwise pick a random legal action.
                int choice = pi.actions.FindIndex(a => a is AgariAction);
                if (choice == -1) choice = random.Next(pi.actions.Count);
                // ... build an InquiryResponse for the chosen action ...
            }
            inquiry.AssertAutoFinish();
        } catch (OperationCanceledException) {
            break;
        }
    }

    Assert.AreEqual(GamePhase.Finished, game.info.phase);
}
```

The real test also builds the `InquiryResponse` per action type (`PlayTileAction`,
choice actions, confirm actions) and records a `GameLogMsg` it can dump for
inspection.

## Waiting, responding, and asserting

The test action center exposes primitives to synchronize with the running game:

- **`NextInquiry`** — a task that completes when the engine opens a new inquiry
  (i.e. some player must act). Await it, inspect `playerInquiries`, and respond via
  `inquiry.OnResponse(new InquiryResponse(seat, index, jsonResponse))`.
- **Event assertions** — subscribe to the event bus (or inspect the captured log)
  to assert that the expected events fired (e.g. a `RiichiEvent`, a
  `ClaimTileEvent`, an `EndGameRyuukyokuEvent`, or a specific score transfer).
- **Termination** — the harness signals completion/cancellation so the driving
  loop exits cleanly; assert `game.info.phase == GamePhase.Finished` at the end.

## What to test at the scenario level

- **Claim priority** — ron over pon over chii; multi-ron (head-jump vs. multiple
  winners).
- **Riichi timing** — the stick is committed on the discard, and ippatsu is
  cleared by an intervening call.
- **Kan / chankan** — a robbed kan produces an `AgariEvent`; an unrobbed kan draws
  a rinshan and (for kan) reveals a new dora.
- **Nukidora** — pulling North draws a rinshan, doesn't reveal a dora, and can be
  robbed as 搶拔北.
- **Abortive draws** — the five `RyuukyokuTrigger` conditions.
- **Exhaustive draw** — tenpai/noten payments and nagashi mangan.
- **Dealer rotation & match end** — renchan policies and the end-game conditions.

For the exact events involved in each of these, see
[The event system](../core/events.md).

:::tip[Reference tests]
Browse `RabiRiichi.Tests/Scenario/` in the engine repo for worked examples:
`Tests/Agari.cs`, `Tests/Riichi.cs`, `Tests/Kan.cs`, `Tests/GameTerminate.cs`,
`Tests/EndGameRyuukyoku.cs`, and the `Full/FullGame.cs` smoke test.
:::
