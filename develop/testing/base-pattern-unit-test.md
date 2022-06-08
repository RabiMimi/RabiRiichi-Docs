---
title: 底和单元测试
description: 测试解析分组方式和向听数
published: true
date: 2022-06-08T08:57:09.014Z
tags: dev, testing
editor: markdown
dateCreated: 2022-06-08T08:57:09.014Z
---

# 解析牌型和向听数
这是编写`BasePattern`测试的教程。
`BasePattern`接收13或14张牌，然后对其进行分组，以输入给`StdPattern`进行役种识别。同时，`BasePattern`也负责计算向听数。

## 解析牌型

`BaseTest`提供了便捷的方法来测试牌型解析：
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

### 测试向听数