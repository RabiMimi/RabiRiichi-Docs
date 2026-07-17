---
title: AI Agents
sidebar_label: AI agents
description: How bots occupy seats, and the rule-based strategy.
---

# AI Agents

Bots and humans are interchangeable seat occupants. Both implement
`IPlayerAgent`, so a room doesn't care which is which — that's what makes
mid-game AI substitution and bot-only rooms possible.

## The agent hierarchy

- **`IPlayerAgent`** (`Agents/IPlayerAgent.cs`) — the seat contract shared by
  `User` and every bot: identity/status/seat, `GetState`, `Transit`, `OnEvent`,
  `OnInquiry`.
- **`AIAgent`** (`Agents/AIAgent.cs`) — abstract base for bots. `OnEvent` is a
  no-op (bots are stateless and decide purely from the inquiry snapshot), and
  `OnInquiry` responds **on a background task** so it never re-enters the engine's
  processing lock, falling back to the default choice on error. Concrete bots
  implement `Decide`.
- **`DefaultAI`** (`AiType.Dummy`) — always picks the default option. It's also
  the agent that gets substituted into a seat when a human leaves mid-game.
- **`RuleBasedAI`** (`AiType.RuleBased`) — builds a `PublicGameView` and delegates
  to `RuleBasedStrategy.Decide`.

## Fair information — `PublicGameView`

`Agents/PublicGameView.cs` is a per-seat, read-only façade over the authoritative
`Game` that exposes **only public information**: the bot's own hand, everyone's
discards and melds, revealed dora, wall count, riichi/points/winds/round. It also
offers analysis helpers built on the engine's `PatternResolver`:
`EvaluateDiscard` (shanten + ukeire), `ShantenOf`, and visible/unseen tile counts.

This deliberately prevents a bot from reading hidden state (opponents' concealed
tiles, the wall order), so AI strategies play fair.

## The rule-based strategy

`Agents/RuleBasedStrategy.cs` is the (static, testable) decision logic. Its
priority order:

1. Win (ron/tsumo) when available.
2. Abortive draw (e.g. nine terminals) when clearly correct.
3. Declare riichi when the hand qualifies.
4. Self-turn kan / nukidora when beneficial.
5. Discard (scored by shanten/ukeire, dora and yakuhai value, and safety).
6. Reactive calls (chii/pon/daiminkan) when they advance a feasible yaku.
7. Acknowledge the next round; otherwise the default.

Discard scoring weighs progress (shanten and acceptance), tile value (dora,
yakuhai), and **safety** heuristics (genbutsu / suji against riichi). Responses
are encoded as an `InquiryResponse` carrying a JSON option index (`Choose`) or an
empty confirm (`"{}"`).

Because the strategy is a pure function of a `PublicGameView`, it's unit-testable
without spinning up a full server.

## Adding AIs to a room

AIs are added via the owner-only `add_ai { AiType }` request
(`RoomServiceImpl.AddAi`): the server validates the type, assigns a negative id,
adds the agent, and auto-readies it. `AiType.Dummy → DefaultAI` and
`AiType.RuleBased → RuleBasedAI`. Because `TryEndGame` auto-readies AIs, a room of
bots will keep starting new games on its own.
