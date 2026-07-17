---
title: Transport & Protocol
sidebar_label: Transport & protocol
description: The Protobuf-over-WebSocket protocol, message envelopes, and reliability.
---

# Transport & Protocol

All client/server traffic is Protobuf, framed over a single WebSocket. The wire
types come from the shared `Protos` submodule (`Protos/Server/**`), compiled at
build time into `RabiRiichi.Server.Generated.*`.

## Endpoints

`WebSockets/WebSocketController.cs` exposes two WebSocket endpoints under `/ws`:

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `GET /ws/public` | none | Anonymous requests: server info, create user, **fetch replay**. |
| `GET /ws/connect` | token handshake | The authenticated per-user session (rooms, gameplay). Uses WebSocket compression. |

`/ws/connect` begins with `HandleSignIn`: the first message **must** be a
`ClientRequest.SignIn` carrying an access token (15s timeout). On success the
controller wires the user's durable `Connection`, performs a version `HandShake`,
then broadcasts room state and re-syncs any in-progress game to the (re)connecting
user.

The `WebSocketAdapter` (`WebSockets/WebSocketAdapter.cs`) makes a raw socket look
like a gRPC bidirectional stream (`IAsyncStreamReader` / `IServerStreamWriter`),
which is why the same connection code could serve gRPC too. Inbound frames are
capped at 4 KB; only binary frames are parsed.

## Message envelopes

`Protos/Server/Rpc/Game.proto` defines the outer envelopes:

```protobuf
message ClientMessageDto {
  int32 id = 1;          // monotonic per connection
  int32 respond_to = 2;  // correlates to a server request
  oneof msg { ClientRequest client_request = 3; ClientMsg client_msg = 4; }
}

message ServerMessageDto {
  int32 id = 1;
  int32 respond_to = 2;  // = the client request id it answers
  oneof msg {
    ServerResponse server_resp = 3;  // request/response payloads
    ServerMsg      server_msg  = 4;  // server-initiated pushes
    EventMsg       event       = 6;  // engine game events
  }
}
```

There are two message *families*:

### Request / response (`Protos/Server/Rpc/Request.proto`)

`ClientRequest` is a `oneof` of requests; `ServerResponse` a `oneof` of replies:

| ClientRequest | Handled where | ServerResponse |
| --- | --- | --- |
| `get_info` | public | `get_info` |
| `create_user` | public/private | `create_user` (id + JWT) |
| `get_replay {game_id}` | public | `replay` (`GameLogMsg`) |
| `sign_in {access_token}` | handshake | `user_info` |
| `create_room {GameConfigMsg}` | private | `room_state` |
| `join_room {room_id}` | private | `room_state` |
| `add_ai {AiType}` | private (owner) | `room_state` |
| `remove_room_player {id}` | private (owner) | `room_state` |
| `get_my_info` | private | `user_info` |

Errors come back as `server_error {status, message}`. The `respond_to` field lets
the client match a response to its request.

### Server pushes (`Protos/Server/Messages/Message.proto`)

`ServerMsg` (server → client) and `ClientMsg` (client → server) carry the ongoing
game/session traffic:

- `ServerMsg`: `heart_beat_msg`, `room_state_msg`, `version_check_msg`,
  `inquiry` (`ServerInquiryMsg`), `chat_msg`.
- `ClientMsg`: `heart_beat_msg`, `inquiry_msg` (`{index, response}`),
  `room_update_msg` (`{UserStatus}` — ready/cancel/leave), `version_check_msg`,
  `chat_msg`.

Engine **game events** are delivered in the dedicated `ServerMessageDto.event`
field as `EventMsg` (the engine's own event proto).

## The RPC-over-WebSocket pattern

`Connections/ProtoUtils.cs` is the envelope factory:

- `CreateServerResponse<T>` maps a concrete payload to the `ServerResponse` oneof.
- `CreateServerMsg<T>` maps a push payload to the `ServerMsg` oneof.
- `CreateDto` tries the push mapping, falling back to the response mapping.

End to end:

1. Client → `ClientMessageDto { id, client_request }`.
2. Server dispatches on the `RoomTaskQueue`; the reply is wrapped with
   `respond_to = id`.
3. **Server-initiated requests** (version handshake, inquiries) are sent as their
   own `ServerMessageWrapper` with a fresh `id`; the server awaits the client's
   `ClientMessageDto.respond_to` via a `TaskCompletionSource` (`WaitResponse`,
   with a timeout).
4. Pushes (events, room state, chat) use `respond_to = 0`.

## Reliability & ordering

The connection layer (`Connections/Connection.cs`,
`Connections/RabiStreamingContext.cs`) provides at-least-once, in-order delivery:

- Every outbound server message is retained in `Connection.serverMsgs` keyed by
  id, so a reconnecting client can request retransmission.
- A two-way **heartbeat** (`TwoWayHeartBeatMsg`, always id `-1`) exchanges each
  side's `max_id` plus up to 16 `requesting_ids`, driving retransmission of gaps.
  The connection closes if no heartbeat arrives within 30s.
- The streaming context delivers client messages **strictly in id order**
  (buffering out-of-order arrivals) and detects gaps.

## The engine bridge — `ServerActionCenter`

`Connections/ServerActionCenter.cs` implements the engine's `IActionCenter`:

- `OnEvent(seat, ev)` → serializes the event **for that seat**
  (`Game.SerializeProto<EventMsg>(ev, seat)`, applying privacy filtering) and
  queues it to the player's connection.
- `OnInquiry(inquiry)` → registers the inquiry, sends each player's
  `SinglePlayerInquiryMsg` (with a timeout), and collects responses; on
  reconnect, `SyncInquiryTo(seat)` re-sends the pending inquiry.

It also captures [replays](./replays.md) from the god-view event stream.
