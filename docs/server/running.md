---
title: Running the Server
sidebar_label: Running the server
description: Build, configure, and run RabiRiichi.Server locally.
---

# Running the Server

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/9.0).
- The shared proto submodule. After cloning the engine repo:

  ```bash
  git submodule update --init --remote
  ```

## Build & run

```bash
# from the repository root
dotnet build RabiRiichi.Server/RabiRiichi.Server.csproj
dotnet run   --project RabiRiichi.Server/RabiRiichi.Server.csproj
```

In Development the server listens on `http://localhost:5150` (see
`Properties/launchSettings.json`) and uses `ASPNETCORE_ENVIRONMENT=Development`,
which also seeds the RNG deterministically (seed `0`) for reproducible local runs.

The WebSocket endpoints are `ws://localhost:5150/ws/public` and
`ws://localhost:5150/ws/connect` — see [Transport & protocol](./transport.md).

## Configuration (environment variables)

| Variable | Required | Meaning |
| --- | --- | --- |
| `JWT_SECRET` | prod | HMAC key for signing auth tokens. See [Authentication](./auth.md). |
| `RABIRIICHI_GAME_SAVE_DIR` | no | Enable [replays](./replays.md); directory for `.pb` files. Unset ⇒ replays off. |
| `RABIRIICHI_GAME_SAVE_TTL` | no | Replay retention in seconds; enables hourly cleanup. Unset ⇒ keep forever. |

`appsettings.json` sets Kestrel to `Http1AndHttp2` (WebSockets ride HTTP/1.1;
HTTP/2 is available for the dormant gRPC path) and `AllowedHosts: "*"`. CORS is
open (`AllowAll`) for the WebSocket handshake.

## Tests

The engine and server share one test project:

```bash
dotnet test RabiRiichi.Tests/RabiRiichi.Tests.csproj
# filter to a subset:
dotnet test RabiRiichi.Tests/RabiRiichi.Tests.csproj --filter "FullyQualifiedName~ReplayStore"
```

See the [Testing guides](../testing/overview.md) for how to write engine tests.

## Per-room custom rules

`CreateRoomRequest` carries a `GameConfigMsg`, including an allowed-yaku list. The
server installs a `DynamicRiichiSetup` that filters the standard patterns down to
that allow-list, so each room can run a customized rule set. Invalid configs are
rejected with a typed error mapped to a client i18n key
(`RoomServiceImpl.MapToI18nKey`). See
[Configuration](../core/configuration.md#customizing-the-rules).
