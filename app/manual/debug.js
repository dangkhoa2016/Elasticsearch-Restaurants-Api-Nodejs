const path = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
}
const { Client } = require('@opensearch-project/opensearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    healthcheck: true,
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME || 'admin',
      password: process.env.ELASTICSEARCH_PASSWORD || 'admin'
    }
});

// Try to call API
async function run() {
  const response = await client.info();
  console.log(response);
}

run().catch(console.error);

