const { Client } = require('@elastic/elasticsearch');
const host = process.env['ELASTICSEARCH_URL'] || 'http://localhost:9201';
var indexName = process.env['defaultIndex'] || "restaurants2";

var client = new Client({ node: host });
const debug = require('debug')('elasticsearch-restaurants-api-nodejs:client');

client.on('request', (err, result) => {
  if (err)
    debug('[Error request]', err);
  else {
    const { body, meta, headers } = result;
    debug('[request]', body, meta, headers);
  }
});
/*
client.on('deserialization', (err, result) => {
  // console.log(err, result);
  debug('[deserialization]', result);
});
*/
client.on('response', (err, result) => {
  if (err)
    debug('[Error response]', err);
  else {
    const { body, meta, headers } = result;
    debug('[response]', body, meta, headers);
  }
});

module.exports = { indexName, client };
