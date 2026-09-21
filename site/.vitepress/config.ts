import { defineConfig } from 'vitepress';

// Working title until the library is named; it is the only place the name lives.
const NAME = 'Blueprint';

export default defineConfig({
  title: NAME,
  description: 'Full-stack features from a short description: a starter app, an entity generator and a model that drives it.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  themeConfig: {
    logo: '/logo.svg',
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Concepts', link: '/concepts/overview' },
      { text: 'Objects', link: '/objects/' },
      { text: 'Reference', link: '/reference/entity-spec' },
      { text: 'Internals', link: '/internals/pipeline' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'Your first feature', link: '/guide/first-feature' },
        ],
      },
      {
        text: 'Concepts',
        items: [
          { text: 'Overview', link: '/concepts/overview' },
          { text: 'The base app', link: '/concepts/base-app' },
          { text: 'Entity descriptions', link: '/concepts/entity-descriptions' },
          { text: 'Generated code', link: '/concepts/generated-code' },
          { text: 'Rules and hooks', link: '/concepts/rules-and-hooks' },
          { text: 'The model', link: '/concepts/the-model' },
        ],
      },
      {
        text: 'Objects',
        items: [
          { text: 'Overview', link: '/objects/' },
          { text: 'The meta folder', link: '/objects/meta' },
          { text: 'Page', link: '/objects/page' },
          { text: 'Layout', link: '/objects/layout' },
          { text: 'Table', link: '/objects/table' },
          { text: 'Form', link: '/objects/form' },
          { text: 'Panel', link: '/objects/panel' },
          { text: 'Field', link: '/objects/field' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Entity spec', link: '/reference/entity-spec' },
          { text: 'Field kinds', link: '/reference/field-kinds' },
          { text: 'List, form, filters', link: '/reference/list-form-filters' },
          { text: 'Actions', link: '/reference/actions' },
          { text: 'Hooks API', link: '/reference/hooks' },
          { text: 'CLI', link: '/reference/cli' },
          { text: 'File ownership', link: '/reference/file-ownership' },
        ],
      },
      {
        text: 'Internals',
        items: [
          { text: 'Generation pipeline', link: '/internals/pipeline' },
          { text: 'Regeneration and migrations', link: '/internals/regeneration' },
          { text: 'Testing strategy', link: '/internals/testing' },
          { text: 'Roadmap and limits', link: '/internals/roadmap' },
        ],
      },
    ],
    outline: [2, 3],
    editLink: { pattern: 'https://github.com/OWNER/REPO/edit/master/site/:path', text: 'Edit this page' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/OWNER/REPO' }],
    footer: { message: 'Released under the MIT License.' },
  },
});
