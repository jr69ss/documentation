---
id: changelog
title: Changelog
---

# Changelog

Latest Version: v5.0.0-beta.2

## Release History

### v5.0.0-beta.2

#### Breaking Changes
- Environment variables for configuring unicolld have changed.
- Changes to Elasticsearch templates.

##### Migration Steps
- **What are the migration steps for environment variable configurations?**
- **Write up changes to template.**

#### Release Highlights
- TLS support on the Elasticsearch output.
- ElastiFlow's [documentation site](http://docs.elastiflow.com).
- Support for Elastic Common Schema (ECS).
- General bugs and performance updates.

#### New Features
- Adds support for TLS configuration of Elasticsearch output.
- Adds support for configuring the UDP server's kernel buffer size.
- Adds support for enabling the ECS output on the Elasticsearch output.
- Created ECS-based Kibana dashboards.

#### Updates
- Configuration changes for licensing and core allowances.

#### Fixes
- Populates *.host.name with IP when DNS disabled.
- Ensures all timestamps are normalized.
- Prevents error that occurred when the TCP header size is too small.
- Prevents record duplication issue.
