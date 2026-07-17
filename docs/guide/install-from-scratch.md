---
title: Install from Scratch
sidebar_label: Install from scratch
description: From a clean machine to a buildable RabiRiichi server and web client.
---

# Install from Scratch

This walks you from a fresh machine to source you can build and run. If you only
want to play, you don't need any of this — see [Play online](./play-online.md).

## Prerequisites

Install these first:

| Tool | Version | For | Get it |
| --- | --- | --- | --- |
| **git** | any recent | cloning + submodules | https://git-scm.com/downloads |
| **.NET SDK** | 9.0 | the server / engine | https://dotnet.microsoft.com/download/dotnet/9.0 |
| **Node.js** | 20+ (22 recommended) | the web client | https://nodejs.org/ |

Verify:

```bash
git --version
dotnet --version     # should print 9.x
node --version       # should print v20+ (v22 recommended)
```

:::note[You don't need both]
The **server** needs only the .NET SDK. The **web client** needs only Node.js.
Install the toolchain(s) for the part(s) you plan to run.
:::

## Get the source

Both repos use a **git submodule** (`RabiRiichi-Proto`) for the shared Protobuf
definitions, so always initialize submodules after cloning.

### Server / engine

```bash
git clone https://github.com/RabiMimi/RabiRiichi.git
cd RabiRiichi
git submodule update --init --remote   # pull the shared protos
```

### Web client

```bash
git clone https://github.com/RabiMimi/RabiRiichi-Web.git
cd RabiRiichi-Web
git submodule update --init --remote   # pull the shared protos
```

## Build to verify

### Server

```bash
# from the RabiRiichi checkout
dotnet build RabiRiichi.Server/RabiRiichi.Server.csproj
```

A successful build means the engine, server, and protos all compiled. Next:
[Run the server](./run-the-server.md).

### Web client

```bash
# from the RabiRiichi-Web checkout
npm install
npm run proto:gen    # generate TS bindings from the proto submodule (required once)
npm run build        # type-check + production build into dist/
```

`proto:gen` writes generated TypeScript into `src/generated/` (git-ignored); run
it once after cloning before building or importing from it. Next:
[Host the web client](./host-the-web-client.md).

:::tip[Keeping the protos in sync]
If you pull changes later and something fails to compile, refresh the submodule:
`git submodule update --remote` (server) or `npm run proto:update && npm run
proto:gen` (web).
:::

## What's next

- [Run the server](./run-the-server.md) — start a local game server.
- [Host the web client](./host-the-web-client.md) — run the 3D client locally.
- [Deploy to production](./deploy-to-production.md) — put a server on the public
  internet.
