const { Client } = require('@elastic/elasticsearch');
const host = process.env['ELASTICSEARCH_URL'] || 'http://localhost:9200';
const index_name = process.env['defaultIndex'] || 'restaurants';

const client = new Client({ node: host });
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
