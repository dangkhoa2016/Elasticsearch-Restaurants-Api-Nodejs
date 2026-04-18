const { Client } = require('@opensearch-project/opensearch');
const { config, mask_url_credentials } = require('./bootstrap');

const clientOptions = {
  node: config.elasticsearch_url,
  healthcheck: true,
  requestTimeout: config.opensearch_request_timeout
};

if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
  clientOptions.auth = {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  };
}

const client = new Client(clientOptions);

console.log('Debug client target', mask_url_credentials(config.elasticsearch_url));

// Try to call API
async function run() {
  const response = await client.info();
  console.log(response);
}

run().catch(console.error);

