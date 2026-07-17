import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Explicit sidebars — one per top-level area (User guide, Core engine, Server,
 * Testing). The site intro (`intro.md`) is served at `/` and is not part of any
 * sidebar. Ordering is manual so the reading path is deliberate.
 */
const sidebars: SidebarsConfig = {
  guideSidebar: [
    'guide/overview',
    'guide/play-online',
    'guide/install-from-scratch',
    'guide/run-the-server',
    'guide/host-the-web-client',
    'guide/deploy-to-production',
  ],
  coreSidebar: [
    'core/overview',
    'core/tile-notation',
    'core/tiles-and-melds',
    'core/game-and-players',
    'core/wall',
    'core/configuration',
    'core/events',
    'core/actions-and-inquiries',
    'core/patterns-and-scoring',
  ],
  serverSidebar: [
    'server/overview',
    'server/transport',
    'server/rooms-and-users',
    'server/replays',
    'server/auth',
    'server/ai-agents',
    'server/running',
  ],
  testingSidebar: [
    'testing/overview',
    'testing/base-pattern-unit-test',
    'testing/yaku-unit-test',
    'testing/scenario-test',
  ],
};

export default sidebars;
