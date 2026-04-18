const debug = require('debug')('elasticsearch-restaurants-api-nodejs:routes->home');
const fs = require('fs');
const path = require('path');

const faviconIco = fs.readFileSync(path.join(__dirname, '../imgs/favicon.ico'));
const faviconPng = fs.readFileSync(path.join(__dirname, '../imgs/favicon.png'));

async function routes(fastify, options) {

  fastify.get('/', async (request, reply) => {
    debug(`Get home at [${new Date()}]`);
    return { message: 'Welcome to Elasticsearch Restaurants Api Nodejs.' };
  });

  fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  fastify.get('/ready', async (request, reply) => {
    try {
      await fastify.opensearch.ping();
      return { status: 'ready' };
    } catch (error) {
      debug('Readiness check failed', error);
      if (request.log && typeof request.log.error === 'function')
        request.log.error({ err: error, requestId: request.id }, 'Readiness check failed');
      return fastify.sendError(reply, 503, 'OPENSEARCH_NOT_READY', 'OpenSearch is not ready.');
    }
  });

  fastify.get('/favicon.ico', async (request, reply) => {
    reply.type('image/x-icon');
    reply.send(faviconIco);
  });

  fastify.get('/favicon.png', async (request, reply) => {
    reply.type('image/png');
    reply.send(faviconPng);
  });

};

module.exports = routes;
