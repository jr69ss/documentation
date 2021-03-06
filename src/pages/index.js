import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const features = [
  {
    title: 'Download Free Beta',
    titleHref: 'https://www.elastiflow.com/getbeta',
    imageUrl: 'img/cloud-computing.svg',
    description: (
      <>
        Install our new ElastiFlow v5 Unified Flow Collector and see the power of an extremely scalable network visualization solution.
      </>
    ),
  },
  {
    title: 'Install Guide (Docker)',
    titleHref: 'https://elastiflow.github.io/documentation/docs/install',
    imageUrl: 'img/computer.svg',
    description: (
      <>
        Get the Docker Installation Guide including a detailed view of all configuration options available in the Unified Flow Collector.
      </>
    ),
  },
  {
    title: 'ElastiFlow Website',
    titleHref: 'https://www.elastiflow.com',
    imageUrl: 'img/world-wide-web.svg',
    description: (
      <>
        Learn more about ElastiFlow and the Unified Flow Collector on our Website. Schedule an introductory call or review our subscription plans.
      </>
    ),
  },
];

function Feature({imageUrl, title, titleHref, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={clsx('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>
        <a href={titleHref}>{title}</a>
      </h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout
      title={`Documentation: ${siteConfig.title}`}
      description="Documentation and Developer Blogs around ElastiFlow's Unified Flow Collector<head />">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/')}>
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
