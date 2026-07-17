---
title: Run the Server
sidebar_label: Run the server
description: Start a local RabiRiichi game server and connect a client to it.
---

# Run the Server

This gets a game server running on your machine and a client connected to it.
First complete [Install from scratch](./install-from-scratch.md) (you need the
.NET 9 SDK and the `RabiRiichi` checkout with submodules initialized).

## Start it

```bash
# from the RabiRiichi checkout
dotnet run --project RabiRiichi.Server/RabiRiichi.Server.csproj
```

In the default **Development** environment the server listens on
**`http://localhost:5150`**, which exposes the WebSocket endpoints:

- `ws://localhost:5150/ws/public` — anonymous requests (info, create user, fetch
  replay)
- `ws://localhost:5150/ws/connect` — the authenticated game session

Development mode also seeds the RNG deterministically (seed `0`), so local games
are reproducible.

## Connect a client

You have two easy options:

1. **Run the web client locally** and choose the built-in **Local
   (localhost:5150)** server preset. This is the recommended path because it
   avoids browser security restrictions — see
   [Host the web client](./host-the-web-client.md).
2. **Use the official web client** and add a custom server address.

   :::warning[HTTPS → ws:// is blocked]
   The official client is served over HTTPS and browsers won't let an HTTPS page
   open an insecure `ws://` socket. So `ws://localhost:5150` won't work from
   `https://riichi.rabimimi.com`. Run the client locally over HTTP, or put your
   server behind TLS (`wss://`).
   :::

Once connected, pick a nickname and you're in the Lobby — see
[Play online → step by step](./play-online.md#step-by-step) for the room flow
(it's identical regardless of which server you're on).

## Configuration

The server reads a few environment variables. All are optional for local play:

| Variable | Default | Meaning |
| --- | --- | --- |
| `JWT_SECRET` | dev value in `launchSettings.json` | HMAC key for signing auth tokens. **Set a strong value in production.** |
| `ASPNETCORE_URLS` | `http://localhost:5150` (Dev) | Which address/port to bind. |
| `RABIRIICHI_GAME_SAVE_DIR` | unset | Directory to store replays. Unset ⇒ replays disabled. |
| `RABIRIICHI_GAME_SAVE_TTL` | unset | Replay retention in seconds; enables hourly cleanup. Unset ⇒ keep forever. |

Example — run on all interfaces, port 5000, with replays enabled:

```bash
ASPNETCORE_URLS="http://0.0.0.0:5000" \
RABIRIICHI_GAME_SAVE_DIR="./saves" \
JWT_SECRET="$(openssl rand -hex 32)" \
dotnet run --project RabiRiichi.Server/RabiRiichi.Server.csproj
```

Clients would then connect to `ws://<your-host>:5000`.

## Play against bots only

You don't need other people: create a room and use **Add AI** to fill the empty
seats. The server auto-readies bots, so the game starts as soon as the room is
full. There are two AI types — a dummy (always default) and a rule-based bot. See
[AI agents](../server/ai-agents.md).

## Next steps

- Full configuration reference: [Server → Running the server](../server/running.md).
- Deploy a public instance: [Deploy to production](./deploy-to-production.md).
- How the protocol works: [Server → Transport & protocol](../server/transport.md).
