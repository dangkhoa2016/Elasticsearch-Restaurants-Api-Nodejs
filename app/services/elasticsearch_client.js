// const { Client } = require('@elastic/elasticsearch');
const { Client } = require('@opensearch-project/opensearch');

const config = require('../config/runtime');
const debug = require('debug')('elasticsearch-restaurants-api-nodejs:client');

function summarize_request(result) {
  const params = result && result.request && result.request.params
    ? result.request.params
    : result && result.meta && result.meta.request && result.meta.request.params
      ? result.meta.request.params
      : null;

  if (!params)
    return result;

  return {
    method: params.method,
    path: params.path,
    querystring: params.querystring,
    body: params.body,
    timeout: params.timeout,
  };
}

function summarize_response(result) {
  const meta = result && result.meta ? result.meta : {};

  return {
    statusCode: meta.statusCode,
    attempts: meta.attempts,
    aborted: meta.aborted,
    took: result && result.body ? result.body.took : undefined,
  };
}

const client = new Client({
  node: config.elasticsearch_url,
  healthcheck: false,
  requestTimeout: config.opensearch_request_timeout
});

client.on('request', (err, result) => {
  if (err)
    debug('[Error request]', err);
  else
    debug('[request]', summarize_request(result));
});

client.on('response', (err, result) => {
  if (err)
    debug('[Error response]', err);
  else
    debug('[response]', summarize_response(result));
});

module.exports = client;
