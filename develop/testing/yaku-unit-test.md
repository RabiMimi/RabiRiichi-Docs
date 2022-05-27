---
title: 役种单元测试
description: 用各种牌型对单个役种进行测试
published: true
date: 2022-05-27T09:00:46.669Z
tags: dev, testing, yaku
editor: markdown
dateCreated: 2022-05-06T05:54:58.971Z
---

# 识别牌型

这是编写`StdPattern`测试的教程。

> `BasePattern`对牌进行分组以后传递给`StdPattern`，后者输出番数或符数计算结果。因此，`StdPattern`接收的输入中，所有牌已经分好组（例如33332），不需要关心分组方式。
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
}
```

首先，我们创建了一个一杯口牌型判定类的实例：
```cs
protected StdPattern V { get; set; } = new Iipeikou(null);
```
请根据该牌型构造函数的参数个数，传入对应个数的`null`。不必担心，这些参数在单元测试中用不到。实际运行中，依赖注入框架将会传入正确的参数。

接下来，`TestResolved()`方法测试了以下牌型：

![11222333s22456m+4s](https://mj.ero.fyi/11222333s22456m+4s)

该牌型符合一杯口，所以我们调用`Resolve(true)`来确认牌型判定类成功解析。接下来，我们确认解析成功后的输出为1番。

![11222333s22+456m+4s](https://mj.ero.fyi/11222333s22+456m+4s)

## 测试受门清状态影响的牌型

## 测试受和牌方式影响的牌型

## 测试受游戏配置影响的牌型

## 进阶：在测试中Mock游戏组件

# 得分修正

得分修正一般仅用于包牌计算，因此大部分役种都会采用默认实现（直接`return false`）而无需进行测试。

> 由于该测试应用范围较小，尚无针对性的便捷测试API，故需要进行手动创建和Assert。
欢迎提交Pull Request增强该部分功能。
{.is-info}