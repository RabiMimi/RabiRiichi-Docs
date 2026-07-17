---
title: Host the Web Client
sidebar_label: Host the web client
description: Run the 3D RabiRiichi web client locally or serve your own build.
---

# Host the Web Client

Run the [RabiRiichi-Web](https://github.com/RabiMimi/RabiRiichi-Web) client
yourself — handy for local development, for connecting to a `ws://localhost`
server without browser security issues, or for self-hosting your own front end.

First complete [Install from scratch](./install-from-scratch.md) (Node.js 20+ and
the `RabiRiichi-Web` checkout with submodules initialized).

## One-time setup

```bash
# from the RabiRiichi-Web checkout
npm install
npm run proto:gen    # generate TS bindings from the proto submodule
```

`proto:gen` populates `src/generated/` (git-ignored). Run it once after cloning,
and again whenever the protos change.

## Development server (hot reload)

```bash
npm run dev
```

Vite serves the client at `http://localhost:5173` (it prints the exact URL).
Because it's served over plain **HTTP**, it can connect to a local **`ws://`**
server — so this is the recommended way to play against a
[server you're running locally](./run-the-server.md).

On the connect screen, pick the **Local (localhost:5150)** preset (or any custom
`ws://`/`wss://` address), enter a nickname, and connect.

## Production build

```bash
npm run build      # type-check + bundle into dist/
npm run preview    # preview the built site locally
```

`dist/` is a fully static site — host it on any static host (Cloudflare Pages,
Netlify, GitHub Pages, nginx, etc.). No server-side runtime is required for the
client itself.

:::warning[Serve over HTTPS to reach wss:// servers]
If you host the client over **HTTPS**, browsers will only allow **secure
`wss://`** WebSocket connections. Make sure the server you connect to is reachable
over `wss://` (i.e. behind TLS). A plain `ws://` server is only reachable from a
client served over `http://` (like `npm run dev`).
:::

## Choosing which server the client talks to

The server address is **not** compiled into the client — it's selected at connect
time. The client ships three presets (Rabimimi production, Rabimimi Dev, and Local
`localhost:5150`) and lets users add and save **custom** `ws://`/`wss://`
addresses in their browser.

If you're self-hosting and want your own default presets, edit
`src/config/servers.ts` in the web repo before building:

```ts
export const DEFAULT_SERVERS: DefaultServer[] = [
  { id: 'mine', nameKey: 'connect.officialServer', url: 'wss://your-domain' },
  { id: 'local', nameKey: 'connect.localServer', url: 'ws://localhost:5150' },
];
```

## Useful scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload. |
| `npm run build` | Type-check + production build into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run proto:update` | Update the proto git submodule. |
| `npm run proto:gen` | Regenerate TS bindings from the protos. |
| `npm run lint` / `npm run typecheck` | Lint / type-check. |

See the web repo's `README.md` and `TESTING.md` for local multiplayer testing and
the offline replay viewer.
