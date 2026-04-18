const debug = require('debug')('elasticsearch-restaurants-api-nodejs:index');
const qs = require('qs');
const config = require('./config/runtime');
const defaultClient = require('./services/elasticsearch_client');

function build_server({ opensearchClient = defaultClient } = {}) {
  const client = typeof opensearchClient.close === 'function'
    ? opensearchClient
    : {
      ...opensearchClient,
      async close() {}
    };

  // CommonJs
  const server = require('fastify')({
    disableRequestLogging: true,
    logger: config.structured_logging_enabled ? { level: config.log_level } : false,
    bodyLimit: config.body_limit,
    requestTimeout: config.request_timeout
  });

  server.decorate('sendError', (reply, statusCode, code, message, details) => {
    const payload = { error: message, code };

    if (details)
      payload.details = details;

    reply.code(statusCode).send(payload);
  });

  server.decorate('exception', (request, reply, error) => {
    const statusCode = error && error.statusCode >= 400 ? error.statusCode : 500;
    const code = error && error.code ? error.code : statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR';
    const message = statusCode === 500 ? '500 Internal Server Error.' : error.message;

    return server.sendError(reply, statusCode, code, message);
  });

  server.setErrorHandler((error, request, reply) => {
    debug('Server Error', error);

    if (request.log && typeof request.log.error === 'function')
      request.log.error({ err: error, requestId: request.id }, 'Request failed');

    if (error.validation) {
      const details = error.validation.map(({ instancePath, keyword, message }) => ({
        instancePath,
        keyword,
        message
      }));

      return server.sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid request payload.', details);
    }

    return server.exception(request, reply, error);
  });

  server.register(require('@fastify/formbody'), { parser: str => qs.parse(str) });
  server.register(require('@fastify/helmet'));
  server.register(require('@fastify/rate-limit'), {
    max: config.rate_limit.max,
    timeWindow: config.rate_limit.time_window
  });

  server.register(require('@fastify/cors'), {
    origin: (origin, cb) => {
      if (config.is_origin_allowed(origin)) {
        cb(null, true);
        return;
      }

      cb(new Error('Origin not allowed'));
    }
  });

  server.register(require('@fastify/opensearch'), { client });
  server.register(require('./services/logger'));

  server.register(require('./routes/home'));
  server.register(require('./routes/elasticsearch'));
  server.register(require('./routes/errors'));

  return server;
}

const server = build_server();

module.exports = server;
module.exports.build_server = build_server;
