const debug = require('debug')('elasticsearch-restaurants-api-nodejs:routes->elasticsearch');

const {
  is_location_empty, default_index, get_geo_search_params
} = require('../services/helper');

const searchSchema = {
  type: 'object',
  required: ['type'],
  properties: {
    index: { type: 'string' },
    type: { type: 'string' },
    location: { type: ['string', 'object'] },
    radius: { type: ['string', 'number'] },
    top_left: { type: ['string', 'object'] },
    bottom_right: { type: ['string', 'object'] },
  },
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function routes(fastify, options) {
  const elastic = fastify.elastic;
  // debug('elastic', elastic, fastify, options);

  const schema = {
    body: searchSchema,
  }

  fastify.post('/search', { schema }, async (request, reply) => {
    var { index, query, sleep } = get_geo_search_params(request.body);
    debug('/search query', JSON.stringify(query));

    if (query.error)
      return query.error;

    //for test
    if (sleep)
      await timeout(5000);

    // demo only 80 results
    var { body } = await elastic.search({
      index,
      body: { query, size: 80 }
    });

    return body;
  });

  fastify.get('/doc/:id', async function(request, reply) {
    var { index = default_index, _source = true } = request.query;

    var { id } = request.params;
    const { body } = await elastic.get({
      index,
      id,
      _source
    });

    return body;
  });

};

module.exports = routes;
