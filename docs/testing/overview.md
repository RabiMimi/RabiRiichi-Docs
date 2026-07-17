---
title: Testing Overview
sidebar_label: Overview
description: The three kinds of tests in RabiRiichi and when to use each.
---

# Testing Overview

All tests live in the `RabiRiichi.Tests` project. It isn't shipped, but it runs in
CI on every push / pull request to guard correctness and coverage.

Run the whole suite (or a filtered subset):

```bash
dotnet test RabiRiichi.Tests/RabiRiichi.Tests.csproj
dotnet test RabiRiichi.Tests/RabiRiichi.Tests.csproj --filter "FullyQualifiedName~Iipeikou"
```

There are three complementary kinds of tests, from most focused to most
end-to-end:

- **[Base pattern unit tests](./base-pattern-unit-test.md)** — test hand
  decomposition (grouping into melds) and shanten calculation for a `BasePattern`
  like `Base33332`.
- **[Yaku unit tests](./yaku-unit-test.md)** — test a single `StdPattern` (a yaku
  or fu rule) against many hand shapes using the fluent `StdTestBuilder`.
- **[Scenario tests](./scenario-test.md)** — set up a realistic game, drive it
  through the event bus, and assert on the events it produces.

Throughout these guides, hands are shown with the `<Tiles>` component from
[Tile notation](../core/tile-notation.md), so the example strings and their
rendered tiles always match.

:::tip[Where each fits]
Reach for a **base pattern** test when you touch grouping/shanten, a **yaku** test
when you add or change a scoring rule, and a **scenario** test when behavior spans
multiple events (claims, riichi timing, abortive draws, dealer rotation).
:::
