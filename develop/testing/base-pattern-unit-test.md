---
title: 底和单元测试
description: 测试解析分组方式和向听数
published: true
date: 2022-06-08T09:29:39.285Z
tags: dev, testing
editor: markdown
dateCreated: 2022-06-08T08:57:09.014Z
---

这是编写`BasePattern`测试的教程。
`BasePattern`接收13或14张牌，然后对其进行分组，以输入给`StdPattern`进行役种识别。同时，`BasePattern`也负责计算向听数。

# 解析牌型

`BaseTest`提供了便捷的方法`Resolve`来测试牌型解析：
```cs
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
这个方法中，我们测试了顺子的解析。第一个牌型为：
![122334s5r677p+567p+7p](https://mj.ero.fyi/122334sr5677p+567p+7p)
由于该牌型符合33332，`Resolve`应当返回`true`，说明该牌型被成功解析。

相对的，第二个牌型为：
![122334s5567p+567p+7p](https://mj.ero.fyi/122334s5567p+567p+7p)
该牌型不符合33332，`Resolve`应当返回`false`，说明该牌型不满足要求。

## 测试API

### Resolve

该方法的前两个参数是必要的，分别表示手牌和和了牌。之后可以添加任意数量的参数，表示确定的面子（副露或暗杠）。下面是一些例子：
```cs
Assert.IsTrue(Resolve("2z", "2z", "1111s", "1111p", "1111m", "1111z"));
```
![2z+x11xs+x11xp+x11xm+x11xz+2z](https://mj.ero.fyi/2z+x11xs+x11xp+x11xm+x11xz+2z)

```cs
Assert.IsTrue(Resolve("6666666666666z", "6z"));
```
![6666666666666z+6z](https://mj.ero.fyi/6666666666666z+6z)

# 测试向听数

`BaseTest`提供了便捷的方法`Shanten`来测试向听数解析：
```cs
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

## 测试API

### Shanten

`Shanten`参数类型和`Resolve`基本相同（它有一个额外的参数设置最大向听数），不同之处在于它会返回给出的牌型的向听数，并依此设置`tiles`变量的值。`Shanten`的第二个参数将影响`tiles`内包含的牌的含义：
- 若`Shanten`的第二个参数为null（总共给出13张牌），`tiles`为所有能降低向听数的听牌。
- 若`Shanten`的第二个参数不为null（总共给出14张牌），`tiles`为所有可行的切牌，使得切牌后的向听数等于`Shanten`的返回值。

因此，这两个测试的含义分别为：
- ![2233445566778s](https://mj.ero.fyi/2233445566778s)
已听牌，听![258s](https://mj.ero.fyi/258s)

- ![25569m2589p5s357z+3s](https://mj.ero.fyi/25569m2589p5s357z+3s)
5向听，可切![2569m25p357z](https://mj.ero.fyi/2569m25p357z)

## 已经和牌的场合

在14张牌的情况下，若已和牌，则向听数为$-1$，且`tiles`将为空。例如：
```cs
Assert.AreEqual(-1, Shanten("1s", "1s", 8, "222s", "345s", "111p", "111z"));
tiles.AssertEquals("");
```
注意这里的第三个参数8表示最大解析到8向听。
> 实际使用中，该参数可以用于优化计算时间，例如只需要知道是否1向听的场合，在确定向听数$>1$以后就可以终止解析，而不需要获取实际的向听数。
{.is-info}

这个例子是：

- ![1s+222s+345s+111p+111z+1s](https://mj.ero.fyi/1s+222s+345s+111p+111z+1s)
已经和牌

## 中途终止解析

若已确定向听数超过上限，`Shanten`会返回`int.MaxValue`，同时将`tiles`设为`null`：
```cs
Assert.AreEqual(int.MaxValue, Shanten("25569m2589p5s357z", null, 5));
Assert.IsNull(tiles);
```
这个例子是：

- ![25569m2589p5s357z](https://mj.ero.fyi/25569m2589p5s357z)
向听数超过5，中途终止解析