# RabiRiichi-Docs

Documentation for [RabiRiichi](https://github.com/RabiMimi/RabiRiichi) — the
riichi mahjong engine and its server — built with
[Docusaurus](https://docusaurus.io/).

Live site: https://riichi-docs.rabimimi.com/

## Local development

Requires Node.js 20+ (22 recommended; see `.nvmrc`). This repo pins a project-local
public npm registry via `.npmrc`.

```bash
npm install       # install dependencies
npm start         # dev server with hot reload at http://localhost:3000
npm run build     # production build into ./build
npm run serve     # preview the production build locally
npm run typecheck # type-check the TS config/components
```

> If bare `npm` isn't on your PATH, prefix the commands with `corepack`
> (e.g. `corepack npm install`).

## Structure

```
docs/
  intro.md            # landing page (served at /)
  core/               # Core engine docs
  server/             # Server docs
  testing/            # Testing guides
src/
  components/Tiles/   # <Tiles> — renders mahjong hands from tile notation
  theme/MDXComponents.tsx  # registers <Tiles> globally for all .md/.mdx
docusaurus.config.ts  # site config (nav, footer, mermaid, prism)
sidebars.ts           # the three sidebars (core / server / testing)
static/               # copied verbatim into build/ (incl. _headers)
```

### Rendering tiles

Docs render real mahjong hands from **tile notation** using the global `<Tiles>`
component — no import needed:

```mdx
<Tiles notation="123m456p789s11z" />
<Tiles notation="11222333s22456m+4s" caption="Iipeikou, winning on 4s" />
An inline tile like <Tiles notation="0p" inline /> sits in a sentence.
```

The images come from a tile-rendering service (`https://mj.ero.fyi`), so no tile
art is stored in this repo. The full notation grammar is documented at
`docs/core/tile-notation.md`.

### Diagrams

Architecture and flow diagrams use Mermaid via fenced ` ```mermaid ` blocks
(enabled by `@docusaurus/theme-mermaid`).

## Deploying to Cloudflare Pages

The site is a fully static build (output in `build/`), which Cloudflare Pages
serves directly.

### Option A — Git integration (recommended)

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to
   Git**, and select the `RabiRiichi-Docs` repo.
3. Set the build settings:
   - **Framework preset:** Docusaurus (or "None").
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
   - **Root directory:** `/` (repo root)
4. Environment variables:
   - `NODE_VERSION` = `22` (also pinned via `.nvmrc`).
5. Save & deploy. Every push to the production branch triggers a build; pull
   requests get preview deployments automatically.
6. (Optional) Add the custom domain `riichi-docs.rabimimi.com` under the project's
   **Custom domains** tab.

### Option B — Direct upload with Wrangler

Build locally and upload the static output:

```bash
npm install
npm run build
npx wrangler pages deploy build --project-name=rabiriichi-docs
```

The first run creates the project if it doesn't exist. Requires a Cloudflare
account (`npx wrangler login`).

### Notes

- `static/_headers` sets long-lived immutable caching for the fingerprinted
  `/assets/*` files; Cloudflare Pages honors it automatically.
- `onBrokenLinks` is set to `throw`, so the build fails on any broken internal
  link — a broken deploy can't ship.
- No server-side runtime is needed; this is 100% static hosting.
