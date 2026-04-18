const fp = require('fastify-plugin');
const debug = require('debug')('elasticsearch-restaurants-api-nodejs:logger');

module.exports = fp((server, opts, next) => {

  const now = () => process.hrtime.bigint();

  function duration_in_ms(startTime) {
    return Number((process.hrtime.bigint() - startTime) / 1000000n);
  }

  function info(log, payload, message) {
    if (log && typeof log.info === 'function')
      log.info(payload, message);
  }

  server.addHook('preHandler', function(req, reply, done) {
    if (req.body)
      debug({ info: 'parse body', id: req.id, body: req.body });

    done();
  });

  server.addHook('onRequest', (req, reply, done) => {
    reply.startTime = now();
    const payload = {
      requestId: req.id,
      method: req.method,
      url: req.raw.url
    };

    debug({ info: 'received request', ...payload });
    info(req.log, payload, 'Request received');

    done();
  });

  server.addHook('onResponse', (req, reply, done) => {
    const payload = {
      requestId: req.id,
      method: req.method,
      url: req.raw.url,
      statusCode: reply.raw.statusCode,
      durationMs: reply.startTime ? duration_in_ms(reply.startTime) : null,
    };

    debug({ info: 'response completed', ...payload });
    info(req.log, payload, 'Request completed');

    done();
  });

  next();
});
