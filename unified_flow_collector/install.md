# Installation of the ElastiFlow Unified Flow Collector

The ElastiFlow Unified Flow Collector receives, decodes, transforms, normalizes, translates and enriches network flow records sent from network devices and applications using IPFIX, Netflow and sFlow. The resulting records can be sent to various data platforms including Elasticsearch, Splunk and Apache Kafka.

> The `v5.0.0-beta.1` release only includes support for Elasticsearch. Additional platflorms will be added for the GA release.

## Installation Using Docker and docker-compose

> The `v5.0.0-beta.1` release is distributed only as a docker container. Additional deployment options will be available for the GA release.

A Docker container for the ElastiFlow Unified Flow Collector is available on [Docker Hub](https://hub.docker.com/r/elastiflow/flow-collector). [docker-compose](https://docs.docker.com/compose/) is a good way to run the container. It allows for the various environment variables, used to configure the collector, to be easily managed in one place without having to enter them on the command line.

### docker-compose.yml

The following `docker-compose.yml` file provides an example with common settings that will likely need to be configured to process flow records and send them to Elasticsearch.

```yaml
version: '3'

services:
  elastiflow-ufc:
    image: elastiflow/flow-collector:v5.0.0-beta.1
    container_name: 'elastiflow-ufc'
    restart: 'unless-stopped'
    network_mode: 'host'
    volumes:
      - /etc/elastiflow/maxmind:/etc/elastiflow/maxmind
    environment:
      UNICOLLD_SERVER_UDP_PORT: 9995

      # The size of the queue of where UDP PDUs wait for the decoder.
      # Recommendation: 4096 x the number of cores used for decoding.
      UNICOLLD_SERVER_UDP_PACKET_STREAM_MAX_SIZE: 4096

      # The number of decoder workers.
      # Recommendation: 2 x the number of cores used for decoding.
      UNICOLLD_DECODER_POOL_SIZE: 2

      # none, exporter, all
      UNICOLLD_DECODER_ENRICH_DNS_RESOLVE_IPS: 'all'

      UNICOLLD_DECODER_ENRICH_SNMP_ENABLE: 'true'
      UNICOLLD_DECODER_ENRICH_SNMP_COMMUNITY: 'public'

      # none, riskiq, maxmind (riskiq will be implemented in beta 2)
      UNICOLLD_DECODER_ENRICH_ASN_LOOKUP: 'maxmind'

      # none, riskiq, maxmind (riskiq will be implemented in beta 2)
      UNICOLLD_DECODER_ENRICH_GEOIP_LOOKUP: 'maxmind'

      # The size of the output queue.
      # Recommendation: 12 x the value of UNICOLLD_SERVER_UDP_PACKET_STREAM_MAX_SIZE.
      UNICOLLD_RECORD_STREAM_MAX_SIZE: 49152

      # The Elasticsearch Output

      UNICOLLD_OUTPUT_ELASTICSEARCH_ENABLE: 'true'
      # The number of Elasticsearch output workers
      # Recommendation: 1 x the number of cores used for decoding.
      UNICOLLD_OUTPUT_ELASTICSEARCH_POOL_SIZE: 1

      # start, end, export, collect
      UNICOLLD_OUTPUT_ELASTICSEARCH_TIMESTAMP_SOURCE: 'end'

      UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_OVERWRITE: 'true'

      # A comma separated list of Elasticsearch nodes to use. DO NOT include "http://" or "https://"
      UNICOLLD_OUTPUT_ELASTICSEARCH_ADDRESSES: '127.0.0.1:9200'
      UNICOLLD_OUTPUT_ELASTICSEARCH_USERNAME: 'elastic'
      UNICOLLD_OUTPUT_ELASTICSEARCH_PASSWORD: 'changeme'

      UNICOLLD_OUTPUT_ELASTICSEARCH_TLS_ENABLED: 'false'
      UNICOLLD_OUTPUT_ELASTICSEARCH_TLS_SKIP_VERIFICATION: 'true'
      UNICOLLD_OUTPUT_ELASTICSEARCH_TLS_CA_CERT_FILEPATH: ''

      UNICOLLD_OUTPUT_ELASTICSEARCH_RETRY_ENABLE: 'true'
      UNICOLLD_OUTPUT_ELASTICSEARCH_RETRY_ON_TIMEOUT_ENABLE: 'true'

      # NOTE: The following settings configure the index template sent to Elasticsearch. They do not change any existing indices.
      # The number of shards.
      # Recommendation: 2 x the number of Elastic data nodes to which data will be indexed.
      UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_SHARDS: 2
      # The number of replicas. For a multi-node cluster set this to 1 or higher for redundancy. Otherwise set to zero.
      UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_REPLICAS: 0
      UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_REFRESH_INTERVAL: '15s'
      UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_CODEC: 'best_compression'
```

#### image

The name of the current released image is `elastiflow/flow-collector:v5.0.0-beta.1`.

#### restart

`restart` is set to `unless-stopped` so that the collector will restart automatically if it fails for some reason.

#### network_mode

There is a old issue with Docker that persists still, where an inbound packet's source IP address is not persisted across the Docker bridge interface. This is not an issue for sFlow as the exporter's IP is extracted from the `agent_address` in the sFlow header. However for Netflow and IPFIX the source IP from the IP header is all that is available to determine which device sent the records. The Docker bridge messes this up.

To work around this issue `network_mode` must be set to `host`.

> NOTE! On macOS Docker containers do not run natively on the operating system. They actually run in a behind the scenes linux VM. In the case `host` networking would be the network stack of the VM and not of macOS itself. This means the `bridged` mode networking must be used and the necessary port mapping defined. Because of the source IP issues mentioned above, you will not be able to do much on macOS other than basic testing.

#### volumes

There are a few scenarios where it is necessary to make files on the host file system available to the collector.

In the example above, `/etc/elastiflow/maxmind` on the host's filesystem is mapped into the same path within the container. After downloading the `GeoLite2-City` and `GeoLite2-ASN` maxmind databases from the Maxmind website, they can be placed at this location on the host's filesystem and will be able to be accessed by the collector within the container.

> NOTE! It is also possible to build a new container, adding additional files as needed. This may the best choice if running the container in a dynamically orchestrated environment (e.g. running in Kubernetes). However for an instance dedicated to a specific host, using bind mounted volumes can be very convenient.

#### environment variables

The ElastiFlow Unified Flow Collector is configured using environment variables. The settings above provide an example configuration that represents the most likely settings to consider and modify when deploying the collector.

For a complete reference of all configuration options please refer to the Configuration Environment Variable Reference below.

#### Running the Container

After completing configuration of the collector in the `docker-compose.yml` file, you can start the container using one of the following commands...

From within the same path as the `docker-compose.yml` file:

```text
docker-compose up -d
```

From a path different from the location of the `docker-compose.yml` file:

```text
docker-compose -f /PATH/TO/docker-compose.yml up -d
```

To view the logs written by the container run:

```text
docker logs -f NAME_OF_CONTAINER
```

To stop the container run:

```text
docker-compose down
```

or:

```text
docker-compose -f /PATH/TO/docker-compose.yml down
```

## Maxmind Databases

To use the Maxmind databases for GeoIP and ASN enrichment you will need to download the databases. Due to changes in privacy law in California, Maxmind no longer makes its GeoLite2 databases available for download without [registering on their website](https://dev.maxmind.com/geoip/geoip2/geolite2/). Once you have registered and downloaded the database, you can make them available to the ElastiFlow Unified Collector for enrichment of public IP addresses.

## Configuration Environment Variable Reference

### UDP Server Settings

The ElastiFlow Unified Flow Collector receives network flow records over UDP.

#### `UNICOLLD_SERVER_UDP_IP`

- Valid Values
  - `0.0.0.0` or any valid IP address to which the UCP socket can be bound.
- Default
  - `0.0.0.0` (listen on all interfaces)

#### `UNICOLLD_SERVER_UDP_PORT`

- Valid Values
  - Any valid port number. Common values include:
    - `2055`: the standard port for Netflow
    - `4739`: the standard port for IPFIX
    - `6343`: the standard port for sFlow
    - `9995-9998`: commonly use port numbers
- Default
  - `2055`

#### `UNICOLLD_SERVER_UDP_PACKET_STREAM_MAX_SIZE`

Received UDP PDUs are queued prior to being processed by an available decoder. This value specifies the size of the queue as a quantity of PDUs.

- Default
  - `4096` times the number of configured cores (`UNICOLLD_DECODER_POOL_SIZE`).

> The default value for the `v5.0.0-beta.1` release is `4096`. It should be manually set to `4096 * UNICOLLD_DECODER_POOL_SIZE`

### Flow Decoder Settings

#### `UNICOLLD_DECODER_POOL_SIZE`

Specifies the number of concurrent decoder workers.

- Valid Values
  - Any number up to the limit allowed by the applied license.
- Default
  - The number of licensed cores.

> The `v5.0.0-beta.1` release does not limit the number of cores.

#### `UNICOLLD_DECODER_IPFIX_ENABLE`

Set to `true` to enable decoding of IPFIX records.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_NETFLOW5_ENABLE`

Set to `true` to enable decoding of Netflow v5 records.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_NETFLOW9_ENABLE`

Set to `true` to enable decoding of Netflow v9 records.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_SFLOW5_ENABLE`

Set to `true` to enable decoding of sFlow v5 records.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_SFLOW_FLOWS_ENABLE`

Set to `true` to enable decoding of sFlow `flow_sample` and `flow_sample_expanded` records.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_SFLOW_FLOWS_KEEP_SAMPLES`

When set to `true`, the packet data from an sFlow `sampled_header` record will be stored in `l2.section.sample` as a hex-encoded string.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_DECODER_SFLOW_COUNTERS_ENABLE`

Set to `true` to enable decoding of sFlow `counters_sample` and `counters_sample_expanded` records.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_LEVEL`

Sets the level of processing applied to received records.

> NOTE! While changing this setting to a value other than `enrich` will reduce the size of each record, it will also prevent some features from working as intended. Better results may be achieved by disabling individual enrichment options.

- Valid Values
  - `enrich` - All enabled processing will be applied.
  - `translate` - Raw values will be translated, but all enrichment features will be disabled.
- Default
  - `enrich`

#### `UNICOLLD_DECODER_TRANSLATE_KEEP_IDS`

Specifies which identifier values will be included in the final dataset.

- Valid Values
  - `none` - All identifiers are removed from the final dataset.
  - `default` - Most identifiers are removed from the final dataset. However some identifiers which are required for common use-cases (e.g. raw protocol port values) are included.
  - `all` - All identifiers are included in the final dataset.
- Default
  - `default`

#### `UNICOLLD_DECODER_ENRICH_KEEP_CPU_TICKS`

For telemetry sources which provide CPU usage as timeticks, utilization percentages will be calculated. If this setting is set `false` the timetick values will be removed from the final dataset. If `true` they will be kept, in addition to the utilization values.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_DECODER_ENRICH_DNS_RESOLVE_IPS`

This setting enables DNS reverse lookups of IP addresses found in the received flow records.

- Valid Values
  - `none` - All DNS reverse lookups are disabled.
  - `exporter` - Only the IP from which the flow record was received is resolved.
  - `all` - DNS reverse lookups are enabled for all IP addresses.
- Default
  - `none`

#### `UNICOLLD_DECODER_ENRICH_DNS_CACHE_SIZE`

The ElastiFlow Unified Flow Collector will cache the result of DNS reverse lookups, including failures. This reduces the overall number of DNS queries, and increases throughput.

This setting specifies the maximum number of IPs which will be held in the cache.

- Default
  - `524288`

#### `UNICOLLD_DECODER_ENRICH_NETIF_GET_ATTRS`

Flow records generally include the index of ingress and egress interfaces by which the network traffic traversed the exporting device. The ElastiFlow Unified Flow Collector will attempt to determine the names, and additional attributes, of these interfaces as learned from Netflow v9 or IPFIX option records, or determined by polling the exporting device using SNMP.

Setting this value to `false` will disable the enrichment of records with interface atributes.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_ENRICH_NETIF_CACHE_SIZE`

Interface attributes, learned from either option data or SNMP, will be cached to reduce possible SNMP polls and improve performance.

This setting specifies the maximum number of interfaces which will be held in the cache.

- Default
  - `262144`

#### `UNICOLLD_DECODER_ENRICH_SNMP_ENABLE`

If the enrichment with network interface attributes is enabled (`UNICOLLD_DECODER_ENRICH_NETIF_GET_ATTRS` is `true`), this setting determined whether SNMP polls will be used to gather these attributes.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_DECODER_ENRICH_SNMP_PORT`

If SNMP polling of attributes is enabled (`UNICOLLD_DECODER_ENRICH_SNMP_ENABLE` is `true`), this setting specifies the UDP port that is used for such polls.

- Default
  - `161` (the default SNMP port number)

#### `UNICOLLD_DECODER_ENRICH_SNMP_VERSION`

If SNMP polling of attributes is enabled (`UNICOLLD_DECODER_ENRICH_SNMP_ENABLE` is `true`), this setting specifies the SNMP version that is used for such polls.

> NOTE! All network devices which may be polled MUST support this version of SNMP.

- Valid Values
  - `1` - use SNMPv1
  - `2` - use SNMPv2c
- Default
  - `2`

#### `UNICOLLD_DECODER_ENRICH_SNMP_COMMUNITY`

If SNMP polling of attributes is enabled (`UNICOLLD_DECODER_ENRICH_SNMP_ENABLE` is `true`), this setting specifies the SNMP community string that is used for such polls.

> NOTE! All network devices which may be polled MUST be configured to all visibility of collected attributes using this community. It may be necessary to specify a _view_ associated with this community. The documentation for your devices should contain the necessary information that you will need for determining the correct configuration steps.

- Default
  - `public`

#### `UNICOLLD_DECODER_ENRICH_SNMP_TIMEOUT`

If SNMP polling of attributes is enabled (`UNICOLLD_DECODER_ENRICH_SNMP_ENABLE` is `true`), this setting specifies the number of seconds to wait for the polled device to respond.

- Default
  - `2`

#### `UNICOLLD_DECODER_ENRICH_SNMP_RETRIES`

If SNMP polling of attributes is enabled (`UNICOLLD_DECODER_ENRICH_SNMP_ENABLE` is `true`), this setting specifies the number of retries to attempt after the initial poll has timed out or otherwise fail. The timeout period will be doubled for each retry.

- Default
  - `1`

#### `UNICOLLD_DECODER_ENRICH_APP_CACHE_SIZE`

The ElastiFlow Unified Flow Collector will cache application attribues learned from option data. This setting specifies the maximum number of device specific application IDs which will be held in the cache.

- Default
  - `262144`

#### `UNICOLLD_DECODER_ENRICH_ASN_LOOKUP`

The ElastiFlow Unified Flow Collector will attempt to determine attributes associated with the autonomous system to which a public IP address belongs. This setting determines whether this feature is enabled and the source of the attribute data.

- Valid Values
  - `none` - Disables enrichment with autonomous system attributes.
  - `riskiq` - Use autonomous system attributes from RiskIQ's ElastiFlow-specific enrichment API to enrich flow records.
  - `maxmind` - Use autonomous system attributes from Maxmind's `GeoLite2-ASN` or `GeoIP2-ISP` databases.
- Default
  - `none`

#### `UNICOLLD_DECODER_ENRICH_ASN_PREF`

If enrichment with autonomous system attributes is enabled (`UNICOLLD_DECODER_ENRICH_ASN_LOOKUP` is not `none`), but the autonomous system is already indicated directly in the flow record data, this setting specifies which source is prefered. If the preferred source is not available for a given record, the decoder will fall-back to the alternate option.

- Valid Values
  - `lookup` - prefer the autonomous system determined by lookup.
  - `flow` - prefer the autonomous system indicated directly in the flow record data.
- Default
  - `lookup`

#### `UNICOLLD_DECODER_ENRICH_ASN_CACHE_SIZE`

If enrichment with autonomous system attributes is enabled (`UNICOLLD_DECODER_ENRICH_ASN_LOOKUP` is not `none`), attributes determined by lookup will be cached to improve performance. This setting specifies the maximum number of IP address for which attributes will be held in the cache.

- Default
  - `262144`

#### `UNICOLLD_DECODER_ENRICH_ASN_MAXMIND_ASN_PATH`

If enrichment with autonomous system attributes is enabled using lookups in a Maxmind database (`UNICOLLD_DECODER_ENRICH_ASN_LOOKUP` is `maxmind`), this setting specifies the path to the Maxmind database.

- Default
  - `/etc/elastiflow/maxmind/GeoLite2-ASN.mmdb`

#### `UNICOLLD_DECODER_ENRICH_GEOIP_LOOKUP`

The ElastiFlow Unified Flow Collector will attempt to determine GeoIP attributes associated with a public IP address. This setting determines whether this feature is enabled and the source of the attribute data.

- Valid Values
  - `none` - Disables enrichment with GeoIP attributes.
  - `riskiq` - Use GeoIP attributes from RiskIQ's ElastiFlow-specific enrichment API to enrich flow records.
  - `maxmind` - Use GeoIP attributes from Maxmind's `GeoLite2-City` or `GeoIP2-City` databases.
- Default
  - `none`

#### `UNICOLLD_DECODER_ENRICH_GEOIP_JOIN_RESULTS`

Some features require that related values from separate fields are stored as an array in a single field. These "joins" are enabled when this setting is `true`.

> NOTE! If records are being output to Elasticsearch this setting should be set to `true`.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_ENRICH_GEOIP_CACHE_SIZE`

If enrichment with GeoIP attributes is enabled (`UNICOLLD_DECODER_ENRICH_GEOIP_LOOKUP` is not `none`), attributes determined by lookup will be cached to improve performance. This setting specifies the maximum number of IP address for which attributes will be held in the cache.

- Default
  - `262144`

#### `UNICOLLD_DECODER_ENRICH_GEOIP_MAXMIND_CITY_PATH`

If enrichment with GeoIP attributes is enabled using lookups in a Maxmind database (`UNICOLLD_DECODER_ENRICH_GEOIP_LOOKUP` is `maxmind`), this setting specifies the path to the Maxmind database.

- Default
  - `/etc/elastiflow/maxmind/GeoLite2-City.mmdb`

#### `UNICOLLD_DECODER_ENRICH_GEOIP_MAXMIND_VALUES`

If enrichment with GeoIP attributes is enabled using lookups in a Maxmind database (`UNICOLLD_DECODER_ENRICH_GEOIP_LOOKUP` is `maxmind`), this setting specifies the GeoIP attributes from the Maxmind database to be included in the resulting record.

- Valid Values
  - `city`, `continent`, `continent_code`, `country`, `country_code`, `location`, `timezone`
- Default
  - `city,country,country_code,location,timezone`

#### `UNICOLLD_DECODER_ENRICH_GEOIP_MAXMIND_LANG`

If enrichment with GeoIP attributes is enabled using lookups in a Maxmind database (`UNICOLLD_DECODER_ENRICH_GEOIP_LOOKUP` is `maxmind`), this setting specifies the language which should be used for any language-specifc values.

- Valid Values
  - `de` - German
  - `en` - English
  - `es` - Spanish
  - `fr` - French
  - `ja` - Japanese
  - `pt-BR` - Brazilian Portuguese
  - `ru` - Russian
  - `zh-CN` - Simplified Chinese
- Default
  - `en`

#### `UNICOLLD_DECODER_ENRICH_COMMUNITYID_ENABLE`

Specifies whether flow records should be enriched with a Community ID value.

> For more information on community IDs see [https://github.com/corelight/community-id-spec](https://github.com/corelight/community-id-spec).

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_ENRICH_COMMUNITYID_SEED`

A 16-bit value used as the seed for determining the Community ID of a flow record.

- Default
  - `0`

#### `UNICOLLD_DECODER_ENRICH_CONVERSATIONID_ENABLE`

Specifies whether flow records should be enriched with a Conversation ID value. This value is similar to a community ID (see... UNICOLLD_DECODER_ENRICH_COMMUNITYID_ENABLE). However rather than being based on the src/dst relationship of two endpoints, it is based on the client/server perspective. While two related unidirectional flows, e.g. an HTTP request and the corresponding HTTP response, will have different community IDs. Both of these flows will have the same conversation ID. This provides greater flexibility when exploring a complex flow dataset.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_DECODER_ENRICH_CONVERSATIONID_SEED`

A 16-bit value used as the seed for determining the Conversation ID of a flow record.

- Default
  - `0`

#### `UNICOLLD_DECODER_DURATION_PRECISION`

The desired precision of duration-related values. Values received at a different precision than specified will be converted to the desired precision.

- Valid Values
  - `sec` - seconds
  - `ds` - deciseconds
  - `cs` - centiseconds
  - `ms` - millseconds
  - `us` - microseconds
  - `ns` - nanoseconds
- Default
  - `ms`

> For most data sources this should millseconds (`ms`)

#### `UNICOLLD_DECODER_TIMESTAMP_PRECISION`

The desired precision of timestamp values. Values received at a different precision than specified will be converted to the desired precision.

- Valid Values
  - `sec` - seconds
  - `ds` - deciseconds
  - `cs` - centiseconds
  - `ms` - millseconds
  - `us` - microseconds
  - `ns` - nanoseconds
- Default
  - `ms`

> For most data stores, e.g. Elasticsearch, this should millseconds (`ms`)

#### `UNICOLLD_DECODER_PERCENT_NORM`

The desired representation of percentages. Values received with a different representation than specified will be converted to the desired representation.

- Valid Values
  - `1` - values will be based on a scale of 0-1.
  - `100` - values will be based on a scale of 0-100.
- Default
  - `100`

#### `UNICOLLD_RECORD_STREAM_MAX_SIZE`

Processed records are queued prior to being processed by an available output instance. This value specifies the size of the queue as a quantity of records. As a single PDU typically contains multiple flow records, this value will typically be a multiple of `UNICOLLD_SERVER_UDP_PACKET_STREAM_MAX_SIZE`.

- Recommended
  - `12 * UNICOLLD_SERVER_UDP_PACKET_STREAM_MAX_SIZE`
- Default
  - `49152`

> The default value for the `v5.0.0-beta.1` release is `49152`. It modified a value of `12 * UNICOLLD_SERVER_UDP_PACKET_STREAM_MAX_SIZE` is a good starting point.

### stdout Output

#### `UNICOLLD_OUTPUT_STDOUT_ENABLE`

Specifies whether the `stdout` output is enabled.

> NOTE! At anything more than a few flow records per second the data will scroll too fast to be useful. For this reason the `stdout` output should be used primarily for manual testing.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_OUTPUT_STDOUT_FORMAT`

- Valid Values
  - `json` - Output as a single JSON-formatted record per line.
  - `json_pretty` - Output each record as a "pretty" formatted JSON document.
- Default
  - `json_pretty`

### Elasticsearch Output

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_ENABLE`

Specifies whether the Elasticsearch output is enabled.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_ECS_ENABLE`

Specifies whether the data will be sent using Elastic Common Schema (ECS).

- Valid Values
  - `true`, `false`
- Default
  - `false`

> The `v5.0.0-beta.1` release does not yet include ECS support. It is planned for `v5.0.0-beta.2`.

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_POOL_SIZE`

The number of Elasticsearch output workers.

- Default
  - `1` times the number of configured cores (`UNICOLLD_DECODER_POOL_SIZE`).

> The default value for the `v5.0.0-beta.1` release is `1`. It should be manually set to HALF of `UNICOLLD_DECODER_POOL_SIZE`.

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_BATCH_DEADLINE`

The maximum time, in milliseconds, to wait for a batch of records to fill before being sent to the Elasticsearch bulk API.

- Default
  - `1000`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_BATCH_MAX_BYTES`

The maximum size, in bytes, for a batch of records being sent to the Elasticsearch bulk API.

- Default
  - `8388608`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_TIMESTAMP_SOURCE`

Determines the timestamp source to be used to set the `@timestamp` field. Usually `end` would be the best setting. However, in the case of poorly behaving or misconfigured devices, `collect` may be the better option.

- Valid Values
  - `start` - Use the timestamp from `flow.start.timestamp`. The flow start time indicated in the flow.
  - `end` - Use the timestamp from `flow.end.timestamp`. The flow end time (or last reported time).
  - `export` - Use the timestamp from `flow.export.timestamp`. The time from the flow record header.
  - `collect` - Use the timestamp from `flow.collect.timestamp`. The time that the collector processed the flow record.
- Default
  - `end`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_PERIOD`

- Valid Values
  - `daily` - New indices will be created each day. The format of the time period suffix will be `-yyyy.MM.dd`.
  - `weekly` - New indices will be created each week. The format of the time period suffix will be `-yyyy.'w'ww`.
  - `monthly` - New indices will be created each month. The format of the time period suffix will be `-yyyy.MM`.
  - `ilm` - Index Lifecycle Management will be used to handle the creation and deletion of indices.
- Default
  - `daily`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_SUFFIX`

It can sometimes be useful to have separate indices for different environments, locations or other organizational unit. This settings allow you to specify a suffix that will be added to the index for such purposes.

- Default
  - `''`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_ENABLE`

Specifies whether the output should attempt to add the required index template to Elasticsearch.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_OVERWRITE`

If the output is configured to add the index template to Elasticsearch (`UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_ENABLE` is `true`), this setting determines whether the index template should be overwritten if it already exists.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_ADDRESSES`

This setting specifies the Elasticsearch servers to which the output should connect. It is a comma-separated list of Elasticsearch nodes, including port number.

> WARNING! Do **NOT** include `http://` or `https://` in the provided value. TLS communications is enabled/disabled using `UNICOLLD_OUTPUT_ELASTICSEARCH_TLS_ENABLED`.

- Default
  - `127.0.0.1:9200`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_USERNAME`

The username to use when connecting to Elasticsearch.

- Default
  - `elastic`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_PASSWORD`

The password to use when connecting to Elasticsearch.

- Default
  - `changeme`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_CLOUD_ID`

The URI for the Elastic Cloud endpoint to which the output should connect. If set, this value overrides `UNICOLLD_OUTPUT_ELASTICSEARCH_ADDRESSES`.

- Default
  - `''`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_API_KEY`

The base64-encoded token to use for authorization. If set, this value overrides `UNICOLLD_OUTPUT_ELASTICSEARCH_USERNAME` and `UNICOLLD_OUTPUT_ELASTICSEARCH_PASSWORD`.

- Default
  - `''`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_TLS_ENABLED`

This setting is used to enable/disable TLS connections to Elasticsearch.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_TLS_SKIP_VERIFICATION`

This setting is used to enable/disable TLS verification of the Elasticsearch server to which the output is attempting to connect.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_TLS_CA_CERT_FILEPATH`

The path to the Certificate Authority (CA) certificate to use for verification of the Elasticsearch server to which the output is attempting to connect.

- Default
  - `''`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_RETRY_ENABLE`

Specifies whether to retry connecting to Elasticsearch after a connection has failed.

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_RETRY_ON_TIMEOUT_ENABLE`

Specifies whether to retry bulk indexing requests which have timed-out.

- Valid Values
  - `true`, `false`
- Default
  - `false`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_MAX_RETRIES`

Specifies the number of times to retry bulk indexing requests which have timed-out.

- Default
  - `3`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_RETRY_BACKOFF`

If set, this value specifies the quantity of milliseconds that the output should "backoff" prior to retrying a failed bulk request.

- Default
  - `1000`

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_SHARDS`

The number of shards with which the index should be created. As a general rule, additional shards increases ingest performance, assuming there are sufficient data nodes across which the shards can be distributed.

- Recommended
  - `2` times the number of Elasticsearch data nodes to which data will be indexed.
- Default
  - `2`

> NOTE: This setting configures the index template sent to Elasticsearch. It does NOT change any existing indices.

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_REPLICAS`

The number of replicas that should be created for each shard. If using a multi-node cluster and data redundancy is desired, this value must be at least `1`.

In general, additional replicas will increase query performance, assuming there are sufficient data nodes across which the replicas can be distributed.

- Recommended
  - `1` times the number of Elasticsearch data nodes to which data will be indexed.
- Default
  - `1`

> NOTE: This setting configures the index template sent to Elasticsearch. It does NOT change any existing indices.

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_REFRESH_INTERVAL`

Specifies the period for the refresh interval. The refresh interval is the time window in which newly ingested documents are added to a segment, prior to the segment being added to the index. Only after the refresh interval has ended and the segment has been added to the index do the documents become searchable.

- Recommended
  - `5s` - If the data needs to become available for queries more quickly. However shorter refresh intervals will negatively impact ingest performance.
  - `30s` - (or longer) If maximizing ingest performance is the highest priority. Longer refresh intervals negatively impact the real-time accessibility of new records.
  - `10s` or `15s` - This is a reasonable compromise between ingest performance and data accessibility for most network traffic analytics use-cases.
- Default
  - `10s`

> NOTE: This setting configures the index template sent to Elasticsearch. It does NOT change any existing indices.

#### `UNICOLLD_OUTPUT_ELASTICSEARCH_INDEX_TEMPLATE_CODEC`

The setting determines the level of compression used for stored values.

- Valid Values
  - `default` - Stored values are compressed using LZ4.
  - `best_compression` - Stored values are compressed using DEFLATE. This reduces disk capacity requirements with the trade-off of slightly higher CPU utilization.
- Default
  - `best_compression`

> NOTE: This setting configures the index template sent to Elasticsearch. It does NOT change any existing indices.

### RiskIQ Output

> Flow records can be sent to RiskIQ for additional analysis. MORE details coming in `v5.0.0-beta.2`. For now these setting can be ignored.

#### `UNICOLLD_OUTPUT_RISKIQ_ENABLE`

- Valid Values
  - `true`, `false`
- Default
  - `true`

#### `UNICOLLD_OUTPUT_RISKIQ_HOST`

> WARNING! Do NOT change this value unless directed by ElastiFlow support.

- Default
  - `flow.riskiq.net`

#### `UNICOLLD_OUTPUT_RISKIQ_PORT`

> WARNING! Do NOT change this value unless directed by ElastiFlow support.

- Default
  - `20000`

#### `UNICOLLD_OUTPUT_RISKIQ_CUSTOMER_UUID`

- Default
  - `''`

#### `UNICOLLD_OUTPUT_RISKIQ_CUSTOMER_ENCRYPTION_KEY`

- Default
  - `''`
