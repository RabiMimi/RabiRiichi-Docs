---
title: Replays
sidebar_label: Replays
description: God-view replay capture, persistence, fetching, and the log format.
---

# Replays

The server can record a full **god-view** log of every game — every tile
revealed, every inquiry — and serve it back later so a client can replay the hand
from any seat.

## How capture works

A live game serializes each event *per seat*, hiding opponents' tiles. Replays
need the opposite: everything visible. The engine exposes `Game.onGodViewEvent`,
which fires once for **every** event *before* per-seat privacy filtering.

`Connections/ServerActionCenter.cs` subscribes to it in `Room.TryStartGame`
(before `Start`, so nothing is missed) and records two kinds of entries into a
single god-view `GameLogMsg`:

- **`CaptureGodViewEvent(ev)`** — serializes the event with the sentinel
  `GOD_VIEW_PLAYER_ID` (fully revealed) and appends a `SingleLogMsg { Event = … }`.
- **`CaptureGodViewInquiry(inquiry)`** — serializes each player's inquiry from its
  own seat (so candidate tenpai waits are populated) and appends
  `SingleLogMsg { Inquiry = … }`. Called once per inquiry round from `OnInquiry`,
  so reconnect re-syncs don't duplicate it.

:::info[Why inquiries are recorded too]
Tenpai waits (`candidates[].tenpaiInfos`) live on **inquiries**, not events. If
only events were captured, a replay could not show the tenpai indicator. Both
kinds are interleaved into one stream so the replay client can reconstruct waits.
:::

## The log format

`Protos/Core/GameLog.proto`:

```protobuf
message SingleLogMsg { oneof msg { EventMsg event = 1; SinglePlayerInquiryMsg inquiry = 2; } }
message PlayerLogMsg { repeated SingleLogMsg logs = 1; }
message GameLogMsg {
  repeated PlayerLogMsg   player_logs        = 1; // god-view: a single stream in [0]
  GameConfigMsg           config             = 2;
  string                  game_id            = 3;
  int64                   created_at_unix_ms = 4;
  repeated GameLogPlayerMsg players          = 5; // id / nickname / seat / ai_type
}
```

The server writes **one** `PlayerLogMsg` at `player_logs[0]` interleaving god-view
events and per-seat inquiries, plus the config, game id, timestamp, and the player
roster.

## Persistence

`Services/ReplayStore.cs` and `ReplayOptions` control persistence, entirely via
environment variables:

| Env var | Effect |
| --- | --- |
| `RABIRIICHI_GAME_SAVE_DIR` | Directory for `.pb` files. **Unset/empty ⇒ replays disabled** (no capture, save, or fetch). |
| `RABIRIICHI_GAME_SAVE_TTL` | Positive integer seconds. Enables the cleanup service. **Unset/empty/≤0 ⇒ keep forever, no cleanup.** |

- `SaveReplay(gameId, log)` writes `{dir}/{gameId}.pb` (binary `GameLogMsg`) when
  the room's game task completes.
- `GetReplay(gameId)` reads and parses it back.
- **`IsValidGameId`** enforces `^[0-9A-Za-z-]+$` — a path-traversal guard. Game
  ids are `{yyyyMMddTHHmmss}-{roomId}`, which matches.

### TTL cleanup

`Services/ReplayCleanupService.cs` is a `BackgroundService` that is **only
registered when both a save dir and a positive TTL are set**. It runs hourly and
deletes any `*.pb` older than the TTL (by file modification time), tolerating
per-file errors.

## Fetching a replay

Fetching is a **public** request (no auth), handled in
`WebSocketController.HandlePublic`:

```protobuf
message GetReplayRequest { string game_id = 1; }   // ClientRequest.get_replay
// → ServerResponse.replay : GameLogMsg   (or a NotFound server_error)
```

The handler validates the id with `IsValidGameId`, returns the `GameLogMsg` if
present, or a `server_error` if missing / replays are disabled.

## Client playback (reference)

A client plays a replay by feeding the god-view event stream through the same
reducer it uses live — with two adjustments: all tiles render face-up, and
switching the viewed seat only re-points the view anchor (the data is already
fully revealed, so no re-fetch is needed). Because inquiries are recorded, the
client can match each discard's `traceId` to the inquiry's candidate
`tenpaiInfos` and show tenpai waits during playback.

:::tip[Rebuilding state mid-stream]
`Wall.initialWall` is a static per-round snapshot that a mid-round
`sync_game_state` event does **not** re-send. When a replay contains such a sync
(e.g. from a reconnect), carry the existing `initialWall` forward while hydrating
so the "initial wall" view doesn't go blank after stepping past the sync.
:::
