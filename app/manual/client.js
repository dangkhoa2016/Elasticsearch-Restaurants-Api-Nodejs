// const { Client } = require('@elastic/elasticsearch');
const { Client } = require('@opensearch-project/opensearch');

const { config, mask_url_credentials } = require('./bootstrap');

const host = config.elasticsearch_url;
const index_name = config.default_index;

console.log('Elasticsearch Client Config', { host: mask_url_credentials(host), index_name });

const client = new Client({
  node: host,
  healthcheck: false,
  requestTimeout: config.opensearch_request_timeout
});
const debug = require('debug')('elasticsearch-restaurants-api-nodejs:->manual->client');

client.on('request', (err, result) => {
  if (err)
    debug('[Error request]', err);
  else {
    const { body, meta, headers } = result;
    debug('[request]', body, meta, headers);
  }
});

client.on('response', (err, result) => {
  if (err)
    debug('[Error response]', err);
  else {
    const { body, meta, headers } = result;
    debug('[response]', body, meta, headers);
  }
});

module.exports = { index_name, client };
