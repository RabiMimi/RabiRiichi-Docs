---
title: Base Pattern Unit Tests
sidebar_label: Base pattern tests
description: Testing hand decomposition and shanten with BaseTest.
---

# Base Pattern Unit Tests

A `BasePattern` takes 13 or 14 tiles and groups them into melds, feeding the
result to the [std patterns](../core/patterns-and-scoring.md) for yaku
recognition. It also computes shanten. `BaseTest` gives you two convenience
helpers — `Resolve` and `Shanten` — to test both jobs.

## Testing decomposition with `Resolve`

```csharp
[TestClass]
public class Base33332Test : BaseTest {
    protected override BasePattern V { get; set; } = new Base33332();

    [TestMethod]
    public void TestShun() {
        Assert.IsTrue(Resolve("122334sr5677p", "7p", "567p"));
        Assert.IsFalse(Resolve("122334s5567p", "7p", "567p"));
    }
}
```

Here we test sequence decomposition. The first hand is:

<Tiles notation="122334sr5677p+567p+7p" caption="Matches the 33332 shape → Resolve returns true" />

Because it fits `33332`, `Resolve` should return `true` — the shape was parsed
successfully. The second hand is:

<Tiles notation="122334s5567p+567p+7p" caption="Does not match 33332 → Resolve returns false" />

This one doesn't fit `33332`, so `Resolve` should return `false`.

### `Resolve` API

The first two arguments are required — the **hand** and the **winning tile**.
After that you may add any number of arguments for fixed melds (called melds or
concealed kans). Some examples:

```csharp
Assert.IsTrue(Resolve("2z", "2z", "1111s", "1111p", "1111m", "1111z"));
```

<Tiles notation="2z+x11xs+x11xp+x11xm+x11xz+2z" caption="Four concealed kans + a pair, winning on 2z" />

```csharp
Assert.IsTrue(Resolve("6666666666666z", "6z"));
```

<Tiles notation="6666666666666z+6z" caption="Thirteen 6z + winning 6z" />

## Testing shanten with `Shanten`

```csharp
[TestClass]
public class Base33332Test : BaseTest {
    protected override BasePattern V { get; set; } = new Base33332();

    [TestMethod]
    public void TestShanten1() {
        Assert.AreEqual(0, Shanten("2233445566778s", null));
        tiles.AssertEquals("258s");
    }

    [TestMethod]
    public void TestShanten2() {
        Assert.AreEqual(5, Shanten("25569m2589p5s357z", "3s", 5));
        tiles.AssertEquals("2569m25p357z");
    }
}
```

### `Shanten` API

`Shanten` takes almost the same arguments as `Resolve` (plus an optional maximum
shanten). It returns the shanten of the given hand and sets the `tiles` field. The
**second argument** changes what `tiles` means:

- If the second argument is `null` (13 tiles total), `tiles` = every tile that
  reduces shanten (the useful draws / 進張).
- If the second argument is non-null (14 tiles total), `tiles` = every discard
  that leaves shanten equal to the returned value.

So the two tests mean:

- <Tiles notation="2233445566778s" inline /> is already tenpai, waiting on
  <Tiles notation="258s" inline />.

- <Tiles notation="25569m2589p5s357z+3s" inline /> is 5-shanten; you can discard
  any of <Tiles notation="2569m25p357z" inline /> to stay at 5.

## When the hand is already complete

For 14 tiles that already form a winning hand, shanten is $-1$ and `tiles` is
empty:

```csharp
Assert.AreEqual(-1, Shanten("1s", "1s", 8, "222s", "345s", "111p", "111z"));
tiles.AssertEquals("");
```

Here the third argument `8` means "resolve up to 8 shanten at most".

:::note[The maxShanten argument]
In practice `maxShanten` optimizes computation. If you only need to know whether a
hand is at most 1-shanten, you can stop searching once shanten exceeds 1 rather
than computing the exact number.
:::

This example is:

<Tiles notation="1s+222s+345s+111p+111z+1s" caption="Already a winning hand (shanten = -1)" />

## Early termination

If the shanten is known to exceed the limit, `Shanten` returns `int.MaxValue` and
sets `tiles` to `null`:

```csharp
Assert.AreEqual(int.MaxValue, Shanten("25569m2589p5s357z", null, 5));
Assert.IsNull(tiles);
```

This example is:

<Tiles notation="25569m2589p5s357z" caption="Shanten exceeds 5 → search terminates early" />
