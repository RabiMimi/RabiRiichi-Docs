---
title: Yaku Unit Tests
sidebar_label: Yaku tests
description: Testing a single StdPattern with the fluent StdTestBuilder.
---

# Yaku Unit Tests

This is the guide for testing a `StdPattern`. A base pattern groups the tiles and
hands them to a `StdPattern`, which outputs han/fu. So a `StdPattern` test receives
**already-grouped** tiles (e.g. as `33332`) and doesn't worry about grouping.

:::warning[Grouping can change the result]
The same tiles grouped differently can score differently — that's why you specify
the groups explicitly in these tests.
:::

## Basics

Let's test an iipeikou (一盃口) hand:

```csharp
[TestClass]
public class IipeikouTest {
    protected StdPattern V { get; set; } = new Iipeikou(null);

    [TestMethod]
    public void TestResolved() {
        new StdTestBuilder(V)
            .AddFree("123s")
            .AddFree("123s")
            .AddFree("456m")
            .AddFree("22m")
            .AddAgari("23s", "4s")
            .Resolve(true)
            .ExpectScoring(ScoringType.Han, 1)
            .NoMore();
    }
}
```

First we construct the yaku under test:

```csharp
protected StdPattern V { get; set; } = new Iipeikou(null);
```

Pass one `null` per constructor parameter. Don't worry — those arguments are
unused in unit tests; at runtime the DI container supplies the real values.

`TestResolved()` tests this hand:

<Tiles notation="11222333s22456m+4s" caption="Iipeikou, winning on 4s" />

It satisfies iipeikou, so we call `Resolve(true)` to confirm the pattern parses,
then assert the output is 1 han with `ExpectScoring(ScoringType.Han, 1)` and no
extra output via `NoMore()`.

## Hands that shouldn't match

To test a hand that shouldn't qualify, call `Resolve(false)` — you don't need to
check scoring:

```csharp
[TestMethod]
public void TestFailed() {
    new StdTestBuilder(V)
        .AddFree("123s")
        .AddFree("123s")
        .AddCalled("456m", 0)
        .AddFree("22m")
        .AddAgari("23s", "4s")
        .Resolve(false);
}
```

<Tiles notation="11222333s22+-456m+4s" caption="Open hand (456m called) → not iipeikou" />

`AddCalled("456m", 0)` specifies a called meld; the `0` says the tile at index `0`
(the 4m) came from another player's discard. That makes the hand open, so it fails
iipeikou (which requires a closed hand).

## `StdTestBuilder` API

| Method | Purpose |
| --- | --- |
| `AddFree(tiles)` | Add a group of concealed hand tiles. |
| `AddCalled(tiles, index)` | Add a called meld or ankan. `index` is the claimed tile's position; `-1` means concealed (ankan). |
| `AddAgari(group, winningTile)` | Add the group that contains the winning tile (its placement can affect the result, so it's specified explicitly). |
| `Resolve(true/false)` | Assert the pattern does / doesn't match. |
| `ExpectScoring(type, val)` | After a successful resolve, assert a han/fu output is present. |
| `NoMore()` | Assert there are no scoring outputs beyond those already checked. |
| `ForceMenzen(...)` | Force closed-hand status. |
| `WithConfig(cfg => …)` | Modify the game config to test rule-dependent yaku. |

`ForceMenzen` is rarely needed — menzen is inferred from the called melds by
default.

## Config-dependent yaku

Use `WithConfig` to change rules. For example, with open-tanyao disabled, an open
hand can't be tanyao:

```csharp
[TestMethod]
public void TestTanyaoFailed() {
    new StdTestBuilder(V)
        .WithConfig(config => config.agariOption &= ~AgariOption.Kuitan)
        .AddCalled("234s", 0)
        .AddFree("345p")
        .AddFree("456m")
        .AddFree("22m")
        .AddAgari("23s", "4s")
        .Resolve(false);
}
```

## Advanced: mocking game components

`StdTestBuilder` creates partially mocked game components. Yaku tests generally
don't need to touch them; if you do, check `RabiRiichiTests/Helper/RabiMock.cs` to
see what's mocked.

## Score corrections (pao)

Score corrections (`OnScoreTransfer`) are mainly used for pao (責任払い). Most yaku
use the default implementation (return `false`) and need no test for it. There
isn't a dedicated convenience API for this yet, so those cases require manual
construction and assertions — contributions welcome.
