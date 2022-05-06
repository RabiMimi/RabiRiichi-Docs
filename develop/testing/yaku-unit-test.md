---
title: 役种单元测试
description: 用各种牌型对单个役种进行测试
published: true
date: 2022-05-06T05:54:58.971Z
tags: dev, testing, yaku
editor: markdown
dateCreated: 2022-05-06T05:54:58.971Z
---

# 役种单元测试

## 识别牌型

### 牌型测试基础

### 测试受门清状态影响的牌型

### 测试受和牌方式影响的牌型

### 测试受游戏配置影响的牌型

### 进阶：在测试中Mock游戏组件

## 得分修正

得分修正一般仅用于包牌计算，因此大部分役种都会采用默认实现（直接`return false`）而无需进行测试。

> 由于该测试应用范围较小，尚无针对性的便捷测试API，故需要进行手动创建和Assert。
欢迎提交Pull Request增强该部分功能。
{.is-info}