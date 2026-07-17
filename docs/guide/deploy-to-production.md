---
title: Deploy to Production
sidebar_label: Deploy to production
description: Host a public RabiRiichi server with the systemd deploy script, plus TLS and the web client.
---

# Deploy to Production

To run a public server, the engine repo ships a `deploy.sh` that installs a
prebuilt release as a hardened **systemd** service on a Linux host. This is how
the official servers are run.

## What the script does

`dev/deploy.sh` (in the [`RabiRiichi`](https://github.com/RabiMimi/RabiRiichi)
repo):

- Installs the **.NET 9 ASP.NET runtime** automatically if it's missing.
- Downloads a **release** asset (`RabiRiichi.Server-<tag>.zip`) from GitHub
  Releases and unpacks it to the install dir.
- Creates a dedicated OS user, writes an environment file, and installs a
  hardened systemd unit (auto-restart, `NoNewPrivileges`, `ProtectSystem`, etc.).
- Generates a random `JWT_SECRET` on first install and **retains it** on
  subsequent upgrades.

Requirements on the target host: `bash`, `curl`, `unzip`, `systemctl` (systemd),
and root / sudo.

## Deploy

```bash
# on the target Linux server, from a RabiRiichi checkout (or just the script)
sudo ./dev/deploy.sh
```

That installs the **latest** release with defaults:

| Setting | Default |
| --- | --- |
| Service user | `riichi` |
| Install dir | `/opt/rabiriichi` |
| Bind address | `http://0.0.0.0:5000` |
| Env file | `/etc/rabiriichi/environment` |
| Service name | `rabiriichi` (systemd) |

### Common options

```bash
sudo ./dev/deploy.sh \
  --port "http://0.0.0.0:5000" \
  --tag  "v0.1.3" \
  --dir  "/opt/rabiriichi" \
  --user "riichi" \
  --jwt-key "$(openssl rand -base64 48)" \
  --env-file ./my.env
```

| Option | Meaning |
| --- | --- |
| `-p, --port` | `ASPNETCORE_URLS` value (bind address/port). |
| `-t, --tag` | Release tag to deploy (default `latest`). |
| `-d, --dir` | Install directory. |
| `-u, --user` | OS user to run the service. |
| `-k, --jwt-key` | JWT secret (auto-generated & retained if omitted). |
| `-e, --env-file` | Extra `key=value` env file merged into the service environment. |
| `--undeploy` | Stop and completely remove the service, user, and files. |

Use `--env-file` to enable [replays](../server/replays.md) or override any
`appsettings.json` value, e.g.:

```bash
# my.env
RABIRIICHI_GAME_SAVE_DIR=/var/lib/rabiriichi/saves
RABIRIICHI_GAME_SAVE_TTL=604800
Logging__LogLevel__Default=Warning
```

## Manage the service

```bash
systemctl status rabiriichi
journalctl -u rabiriichi -f        # follow logs
systemctl restart rabiriichi
sudo ./dev/deploy.sh --tag v0.1.4  # upgrade (keeps the existing JWT_SECRET)
sudo ./dev/deploy.sh --undeploy    # remove everything
```

## Put it behind TLS (recommended)

The service listens on plain HTTP (e.g. `:5000`). For public play you'll want a
reverse proxy that terminates TLS and upgrades WebSockets, so clients can reach it
at **`wss://your-domain`** — required for any client served over HTTPS (see the
[mixed-content note](./play-online.md#connecting-a-client-to-a-different-server)).

Example nginx server block:

```nginx
server {
    listen 443 ssl;
    server_name riichi-server.example.com;

    ssl_certificate     /etc/letsencrypt/live/riichi-server.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/riichi-server.example.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;   # WebSocket upgrade
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_read_timeout 3600s;                       # long-lived game sockets
    }
}
```

Clients then connect to `wss://riichi-server.example.com`.

:::warning[Set a strong JWT secret]
In production always use a strong, secret `JWT_SECRET` (the script generates one by
default and retains it across upgrades). Anyone who knows it can forge tokens.
See [Authentication](../server/auth.md).
:::

## Deploy the web client too (optional)

The client is a static site, so host it anywhere. Build it and point users at your
server:

```bash
# in RabiRiichi-Web
npm install && npm run proto:gen && npm run build   # → dist/
```

Serve `dist/` over **HTTPS** (Cloudflare Pages, Netlify, nginx, …). To make your
server the default choice, edit `src/config/servers.ts` before building — see
[Host the web client](./host-the-web-client.md#choosing-which-server-the-client-talks-to).

## Checklist

- [ ] .NET 9 runtime present (the script installs it if not).
- [ ] `deploy.sh` run; `systemctl status rabiriichi` is active.
- [ ] Strong `JWT_SECRET` set.
- [ ] TLS reverse proxy in front, reachable at `wss://…`.
- [ ] (Optional) replays enabled via `RABIRIICHI_GAME_SAVE_DIR`.
- [ ] (Optional) web client built and hosted, pointed at your server.
