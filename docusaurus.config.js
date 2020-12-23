module.exports = {
  title: 'ElastiFlow',
  tagline: 'Documentation & Guides',
  url: 'https://elastiflow.github.io',
  baseUrl: '/documentation/',
  organizationName: 'elastiflow',
  projectName: 'documentation',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  themeConfig: {
    navbar: {
      title: '',
      logo: {
        alt: 'ElastiFLow Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo_dark.svg',
      },
      items: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        // {to: 'blog', label: 'Blog', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: 'docs/',
            },
            {
              label: 'Install',
              to: 'docs/install/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'ElastiFlow',
              href: 'https://www.elastiflow.com/',
            },
            {
              label: 'Slack',
              href: 'https://elastiflowcommunity.slack.com',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/elastiflow',
            },
            {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/company/elastiflow%E2%84%A2/',
            }
          ],
        },
        {
          title: 'Contact',
          items: [
            {
              label: 'Support',
              to: 'mailto:support@elastiflow.com',
            },
            // {
            //   label: 'Blog',
            //   to: 'blog',
            // },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ElastiFlow.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/elastiflow/documentation/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/elastiflow/documentation/tree/main/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
