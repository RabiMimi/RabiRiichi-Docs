---
title: 役种单元测试
description: 用各种牌型对单个役种进行测试
published: true
date: 2022-06-08T08:33:38.123Z
tags: dev, testing, yaku
editor: markdown
dateCreated: 2022-05-06T05:54:58.971Z
---

# 识别牌型

这是编写`StdPattern`测试的教程。

`BasePattern`对牌进行分组以后传递给`StdPattern`，后者输出番数或符数计算结果。因此，`StdPattern`接收的输入中，所有牌已经分好组（例如33332），不需要关心分组方式。

> 相同的牌可能因为分组方式不同产生不同的计算结果。
{.is-warning}


## 牌型测试基础

让我们从测试一个一杯口牌型开始：

```cs
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

首先，我们创建了一个一杯口牌型判定类的实例：
```cs
protected StdPattern V { get; set; } = new Iipeikou(null);
```
请根据该牌型构造函数的参数个数，传入对应个数的`null`。不必担心，这些参数在单元测试中用不到。实际运行中，依赖注入框架将会传入正确的参数。

接下来，`TestResolved()`方法测试了以下牌型：

![11222333s22456m+4s](https://mj.ero.fyi/11222333s22456m+4s)

该牌型符合一杯口，所以我们调用`Resolve(true)`来确认牌型判定类成功解析。然后，我们确认解析成功后的输出为1番，并且没有多余输出。

相反，如果要测试不满足要求的牌型，则需要调用`Resolve(false)`，不需要测试番数计算结果：
```cs
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

![11222333s22+-456m+4s](https://mj.ero.fyi/11222333s22+-456m+4s)

`AddCalled("456m", 0)`指定了一个副露的面子，0说明下标为0的牌（即4m）来自别的玩家弃牌。因此，这个牌型不是门清，不满足一杯口。

### AddFree

增加一组手牌里的牌。

### AddCalled

增加一组副露或暗杠。可以指定副露牌的下标，下标-1代表无副露（暗杠）。

### AddAgari

和了牌所在的组可能会影响牌型判定，因此需要使用该方法添加。

### Resolve

使用`Resolve(true)`来测试符合要求的牌型，或`Resolve(false)`来测试不符合要求的牌型。

### ExpectScoring

在成功解析后，检查计算结果是否包含给定的番数或符数。

### NoMore

确认除了已经测试过的番数/符数，没有输出多余的结果。

### ForceMenzen

强制指定门清状态。

> 默认情况下将通过副露情况计算是否门清，因此一般没有必要手动指定。
{.is-info}

## 测试受游戏配置影响的牌型

可以通过`WithConfig`方法来修改游戏配置以测试特殊牌型。例如，以下代码测试了在无食断时不能在非门清状态下达成断幺九：
```cs
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

## 进阶：在测试中Mock游戏组件

# 得分修正

得分修正一般仅用于包牌计算，因此大部分役种都会采用默认实现（直接`return false`）而无需进行测试。

> 由于该测试应用范围较小，尚无针对性的便捷测试API，故需要进行手动创建和Assert。
欢迎提交Pull Request增强该部分功能。
{.is-info}