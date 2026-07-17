---
title: Configuration
sidebar_label: Configuration
description: GameConfig, the rule option enums, point thresholds, and the pluggable ruleset.
---

# Configuration

`Core/Config/GameConfig.cs` is the single source of truth for every rule tunable.
You build one, optionally validate it, and hand it to `new Game(config)`.

```csharp
var config = new GameConfig {
  playerCount = 4,
  totalRound = 2,               // 1 = East only ("tonpuusen"), 2 = East+South ("hanchan")
  minHan = 1,                   // minimum yaku han required to win (番縛り)
  actionCenter = myActionCenter,
  seed = 1145141919810ul,       // optional deterministic seed
};
config.Validate();              // throws InvalidGameConfigException on bad values
var game = new Game(config);
```

## Core fields

| Field | Default | Meaning |
| --- | --- | --- |
| `playerCount` | 2 | 2–4 players. |
| `totalRound` | 1 | 1 = East-only, 2 = East+South. |
| `minHan` | 1 | Minimum han that counts as yaku to declare a win. |
| `initialTiles` | `Tiles.All` | The tile set shuffled into the wall (one red five per suit by default). |
| `pointThreshold` | see below | Point-related constants. |
| `nextRoundAckTimeout` | 30s | How long to wait for players to acknowledge the next round. |
| `gameplayActionTimeout` | 20s | Per-decision timeout during play. |
| `actionCenter` | — | Required: your `IActionCenter` implementation. |
| `seed` | null | RNG seed; null = time-based (non-deterministic). |
| `setup` | `RiichiSetup` | The pluggable ruleset (patterns + listeners). |
| `AllowedYakus` | all | The std patterns permitted, filtered by the setup. |

`Validate()` enforces sane ranges (player count 2–4, rounds 1–2, minHan 1–13,
timeouts 5–3600s, enough tiles for the wall including the nukidora reservation,
and valid point ranges) and throws a typed `InvalidGameConfigException` carrying
an error type and parameters (the server maps these to i18n keys for clients).

## `PointThreshold`

`Core/Config/PointThreshold.cs`:

| Field | Default | Meaning |
| --- | --- | --- |
| `initialPoints` | 25000 | Each player's starting score. |
| `riichiPoints` | 1000 | Riichi stick cost. |
| `honbaPoints` | 300 | Points per honba counter. |
| `finishPoints` | 30000 | Threshold used by some end-game policies. |
| `ryuukyokuPoints` | `[1000, 1500]` | Noten penalty (single / multiple tenpai split). |
| `validPointsRange` | `[0, 1000000]` | The floor/ceiling for "points out of range" busting. |

`ArePointsValid(points)` checks the range; it's used by the busting and
points-deduction policies.

## Rule option enums

All of these live in `Core/Config/Enums.cs`. Most are `[Flags]`.

- **`AgariOption`** — win rules: `Kuitan` (open tanyao), `Pao` (責任払い),
  `NagashiMangan`, `FirstWinner` (head-jump / atama-hane).
- **`DoraOption`** — which dora exist and *when* they flip: `InitialDora`,
  `InitialUradora`, `KanDora`, `KanUradora`, the `InstantRevealAfter…` (Ankan /
  Kakan / Daiminkan) timing flags, and `Nukidora`.
- **`ScoringOption`** — limits: `KiriageMangan`, `Yakuman`, `MultipleYakuman`,
  `KazoeYakuman`; **omitting `Yakuman` yields aotenjou** (uncapped scoring).
- **`RyuukyokuTrigger`** — which abortive draws are enabled: `SuufonRenda`,
  `KyuushuKyuuhai`, `SuuchaRiichi`, `Sanchahou`, `SuukanSanra`.
- **`RenchanPolicy`** — dealer-repeat rules: `DealerWin`, `DealerTenpai`,
  `EndGameRyuukyoku`, `MidGameRyuukyoku`.
- **`EndGamePolicy`** — when the match ends: `PointsOutOfRange`,
  `InstantPointsOutOfRange`, `DealerTenpai`, `DealerAgari`, `ExtendedRound`.
- **`RiichiPolicy`** — riichi legality: `SufficientPoints`, `ValidPoints`,
  `SufficientTiles`.
- **`KuikaePolicy`** — swap-calling ban: `Genbutsu`, `Suji`, `All`.
- **`PointsDeductionPolicy`** — how effect/skill costs are allowed to spend
  points (used by `SkillPointsUpdater`): `AlwaysAllow`, `SufficientPoints`,
  `ValidPoints`, `AlwaysBlock`.

Each has a `Default` value representing standard riichi rules; you flip individual
flags to customize.

## The pluggable ruleset

`GameConfig.setup` is a `BaseSetup` (`Core/Setup/`). It's a two-phase extension
point:

1. **`Inject(game, services)`** — registers action resolvers and all patterns
   (walking their constructor dependencies) into the DI container.
2. **`Setup(provider)`** — populates the `PatternResolver` with the base/std
   patterns and registers every event listener into the `EventBus`.

`RiichiSetup` is the standard ruleset. It registers:

- **Base patterns** — `Base33332` (standard 4 melds + pair), `Base72`
  (chiitoitsu), `Base13_1` (kokushi).
- **Standard patterns** — every yaku (1-han through yakuman), the fu calculators
  (`Fu33332` / `Fu72` / `Fu13_1`), and bonus patterns (`Dora`, `Uradora`,
  `Akadora`, `NukiDora`).
- **Resolvers** — chii, pon, kan (+ chankan / chan-ankan / nuki-chankan), ron,
  tsumo, riichi, ryuukyoku, tenhou, nukidora.

### Customizing the rules

Because the ruleset is just a class, you can subclass it to add or restrict yaku.
The server does exactly this: `DynamicRiichiSetup` filters the standard patterns
down to a per-room allow-list (`GameConfig.AllowedYakus`), so a room can, say,
disable a joke yaku or run a reduced rule set. To add a brand-new yaku you'd
implement a `StdPattern` and register it in a custom setup — see
[Patterns & scoring](./patterns-and-scoring.md) and
[Yaku unit tests](../testing/yaku-unit-test.md).
