import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const GITHUB_ORG = 'RabiMimi';
const GITHUB_ENGINE_REPO = 'https://github.com/RabiMimi/RabiRiichi';
const GITHUB_WEB_REPO = 'https://github.com/RabiMimi/RabiRiichi-Web';
const GITHUB_PROTO_REPO = 'https://github.com/RabiMimi/RabiRiichi-Proto';
const GITHUB_DOCS_REPO = 'https://github.com/RabiMimi/RabiRiichi-Docs';

const config: Config = {
  title: 'RabiRiichi',
  tagline: 'A riichi mahjong engine for .NET, and the server that hosts it',
  favicon: 'img/favicon.png',

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: 'https://riichi-docs.rabimimi.com',
  baseUrl: '/',

  organizationName: GITHUB_ORG,
  projectName: 'RabiRiichi-Docs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Enable ```mermaid fenced code blocks for the architecture / flow diagrams.
  markdown: {
    mermaid: true,
    hooks: {
      // Fail the build on unresolved cross-doc links so a broken `.md` link
      // (which would render as a 404-producing literal href) can never ship.
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // Serve docs at the site root; there is no blog.
          editUrl: `${GITHUB_DOCS_REPO}/tree/main/`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'RabiRiichi',
      logo: {
        alt: 'RabiRiichi Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'User Guide',
        },
        {
          type: 'docSidebar',
          sidebarId: 'coreSidebar',
          position: 'left',
          label: 'Core Engine',
        },
        {
          type: 'docSidebar',
          sidebarId: 'serverSidebar',
          position: 'left',
          label: 'Server',
        },
        {
          type: 'docSidebar',
          sidebarId: 'testingSidebar',
          position: 'left',
          label: 'Testing',
        },
        {
          type: 'dropdown',
          label: 'GitHub',
          position: 'right',
          items: [
            { label: 'Engine + Server', href: GITHUB_ENGINE_REPO },
            { label: 'Web client', href: GITHUB_WEB_REPO },
            { label: 'Protos', href: GITHUB_PROTO_REPO },
            { label: 'Docs', href: GITHUB_DOCS_REPO },
          ],
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/' },
            { label: 'User Guide', to: '/guide/overview' },
            { label: 'Core Engine', to: '/core/overview' },
            { label: 'Server', to: '/server/overview' },
            { label: 'Testing', to: '/testing/overview' },
          ],
        },
        {
          title: 'Play',
          items: [
            { label: 'RabiRiichi (Production)', href: 'https://riichi.rabimimi.com' },
            { label: 'RabiRiichi (Development)', href: 'https://riichi-dev.rabimimi.com' },
          ],
        },
        {
          title: 'GitHub',
          items: [
            { label: 'Engine + Server', href: GITHUB_ENGINE_REPO },
            { label: 'Web client', href: GITHUB_WEB_REPO },
            { label: 'Protos', href: GITHUB_PROTO_REPO },
            { label: 'Docs', href: GITHUB_DOCS_REPO },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} RabiMimi. Built with Docusaurus. Licensed under AGPL v3.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['csharp', 'protobuf', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
