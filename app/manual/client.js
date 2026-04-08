// const { Client } = require('@elastic/elasticsearch');
const { Client } = require('@opensearch-project/opensearch');

// const host = process.env['ELASTICSEARCH_URL'] || 'http://localhost:9200';
// const index_name = process.env['DEFAULT_INDEX'] || 'restaurants';
const {
  ELASTICSEARCH_URL: host = 'http://localhost:9200',
  DEFAULT_INDEX: index_name = 'restaurants'
} = process.env;
console.log('Elasticsearch Client Config', { host, index_name });
const client = new Client({ node: host, healthcheck: false });
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
