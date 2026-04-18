const debug = require('debug')('elasticsearch-restaurants-api-nodejs:routes->elasticsearch');

const config = require('../config/runtime');
const {
  format_search_response,
  format_document_response
} = require('../services/response_formatter');

const {
  default_index, get_geo_search_params
} = require('../services/helper');

const DEFAULT_SEARCH_LIMIT = 80;
const DEFAULT_SEARCH_OFFSET = 0;

const pointSchema = {
  anyOf: [
    { type: 'string' },
    {
      type: 'object',
      additionalProperties: true,
      properties: {
        lat: { anyOf: [{ type: 'string' }, { type: 'number' }] },
        lon: { anyOf: [{ type: 'string' }, { type: 'number' }] },
        lng: { anyOf: [{ type: 'string' }, { type: 'number' }] },
        latitude: { anyOf: [{ type: 'string' }, { type: 'number' }] },
        longitude: { anyOf: [{ type: 'string' }, { type: 'number' }] }
      }
    }
  ]
};

const distanceSchema = {
  anyOf: [
    { type: 'string', minLength: 1 },
    { type: 'number', exclusiveMinimum: 0 }
  ]
};

const searchSchema = {
  type: 'object',
  required: ['type'],
  additionalProperties: false,
  properties: {
    index: { type: 'string' },
    type: { type: 'string', enum: ['circle', 'rectangle'] },
    location: pointSchema,
    distance: distanceSchema,
    radius: distanceSchema,
    top_left: pointSchema,
    bottom_right: pointSchema,
    sleep: {
      anyOf: [
        { type: 'string', pattern: '^[0-9]+$' },
        { type: 'integer', minimum: 0 }
      ]
    },
  },
  allOf: [
    {
      if: {
        properties: {
          type: { const: 'circle' }
        }
      },
      then: {
        required: ['location'],
        anyOf: [
          { required: ['distance'] },
          { required: ['radius'] }
        ]
      }
    },
    {
      if: {
        properties: {
          type: { const: 'rectangle' }
        }
      },
      then: {
        required: ['top_left', 'bottom_right']
      }
    }
  ]
};

const docSchema = {
  params: {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: { type: 'string', minLength: 1 }
    }
  },
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      index: { type: 'string' },
      _source: {
        anyOf: [
          { type: 'boolean' },
          { type: 'string' }
        ]
      }
    }
  }
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parse_sleep_ms(value) {
  if (value === undefined || value === null || value === '')
    return 0;

  const parsed = typeof value === 'number'
    ? value
    : Number.parseInt(String(value), 10);

  return Number.isFinite(parsed) ? parsed : 0;
}

function can_use_debug_sleep(request) {
  if (!config.allow_debug_sleep)
    return false;

  if (!config.debug_sleep_secret)
    return !config.is_production_like;

  return request.headers[config.debug_sleep_header] === config.debug_sleep_secret;
}

function send_error(fastify, reply, statusCode, code, message) {
  if (typeof fastify.sendError === 'function')
    return fastify.sendError(reply, statusCode, code, message);

  return reply.code(statusCode).send({ error: message, code });
}

async function routes(fastify, options) {
  const elastic = fastify.opensearch;
  // debug('elastic', elastic, fastify, options);

  const schema = {
    body: searchSchema,
  }

  fastify.post('/search', { schema }, async (request, reply) => {
    var { index, query, sleep } = get_geo_search_params(request.body);
    debug('/search query', JSON.stringify(query));

    if (query.error)
      return send_error(fastify, reply, query.statusCode || 400, query.code || 'INVALID_SEARCH_QUERY', query.error);

    if (request.body.radius !== undefined && request.body.distance === undefined) {
      debug('Deprecated radius field used for /search');
      if (request.log && typeof request.log.warn === 'function')
        request.log.warn({ requestId: request.id }, 'Deprecated radius field used; prefer distance');
    }

    const sleep_ms = parse_sleep_ms(sleep);

    if (sleep_ms > config.max_debug_sleep_ms)
      return send_error(fastify, reply, 400, 'DEBUG_SLEEP_LIMIT_EXCEEDED', `Sleep must be less than or equal to ${config.max_debug_sleep_ms}ms.`);

    if (sleep_ms > 0) {
      if (!can_use_debug_sleep(request)) {
        debug('Rejected debug sleep request', { requestId: request.id, sleep_ms });
        if (request.log && typeof request.log.warn === 'function')
          request.log.warn({ requestId: request.id, sleepMs: sleep_ms }, 'Rejected debug sleep request');
        return send_error(fastify, reply, 403, 'DEBUG_SLEEP_NOT_ALLOWED', 'Debug sleep is not allowed for this request.');
      }

      debug('Applying debug sleep', { requestId: request.id, sleep_ms });
      if (request.log && typeof request.log.info === 'function')
        request.log.info({ requestId: request.id, sleepMs: sleep_ms }, 'Applying debug sleep');
      await timeout(sleep_ms);
    }

    // demo only 80 results
    var { body } = await elastic.search({
      index,
      body: { query, size: DEFAULT_SEARCH_LIMIT }
    });

    return format_search_response(body, {
      index,
      limit: DEFAULT_SEARCH_LIMIT,
      offset: DEFAULT_SEARCH_OFFSET
    });
  });

  fastify.get('/doc/:id', { schema: docSchema }, async function(request, reply) {
    var { index = default_index, _source = true } = request.query;

    var { id } = request.params;
    const { body } = await elastic.get({
      index,
      id,
      _source
    });

    return format_document_response(body);
  });

};

module.exports = routes;
