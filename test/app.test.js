const test = require('node:test');
const assert = require('node:assert/strict');

const { build_server } = require('../app/index');

function create_mock_client() {
  return {
    async ping() {
      return true;
    },
    async search() {
      return {
        body: {
          took: 3,
          timed_out: false,
          _shards: { total: 1, successful: 1, failed: 0 },
          hits: {
            total: { value: 1, relation: 'eq' },
            hits: [
              {
                _id: 'restaurant-1',
                _index: 'restaurants',
                _score: 1,
                _source: {
                  name: 'Mesa Verde'
                }
              }
            ]
          }
        }
      };
    },
    async get() {
      return {
        body: {
          _id: 'restaurant-1',
          _index: 'restaurants',
          _source: {
            name: 'Mesa Verde'
          },
          found: true
        }
      };
    }
  };
}

test('GET /health returns ok', async (t) => {
  const app = build_server({ opensearchClient: create_mock_client() });
  t.after(() => app.close());

  const response = await app.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ok' });
});

test('GET /ready returns ready when the client ping succeeds', async (t) => {
  const app = build_server({ opensearchClient: create_mock_client() });
  t.after(() => app.close());

  const response = await app.inject({ method: 'GET', url: '/ready' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: 'ready' });
});

test('POST /search returns a validation error for an incomplete circle query', async (t) => {
  const app = build_server({ opensearchClient: create_mock_client() });
  t.after(() => app.close());

  const response = await app.inject({
    method: 'POST',
    url: '/search',
    payload: {
      type: 'circle',
      location: '-37.852,144.993165'
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().code, 'VALIDATION_ERROR');
});

test('POST /search returns the normalized contract while keeping raw OpenSearch fields', async (t) => {
  const app = build_server({ opensearchClient: create_mock_client() });
  t.after(() => app.close());

  const response = await app.inject({
    method: 'POST',
    url: '/search',
    payload: {
      type: 'circle',
      location: '-37.852,144.993165',
      distance: '200m'
    }
  });

  assert.equal(response.statusCode, 200);

  const json = response.json();
  assert.equal(json.total, 1);
  assert.equal(json.pageInfo.limit, 80);
  assert.equal(json.pageInfo.hasMore, false);
  assert.equal(json.items[0].id, 'restaurant-1');
  assert.equal(json.items[0].source.name, 'Mesa Verde');
  assert.equal(json.hits.total.value, 1);
  assert.equal(json.hits.hits[0]._id, 'restaurant-1');
});

test('GET /doc/:id returns a normalized item alongside raw fields', async (t) => {
  const app = build_server({ opensearchClient: create_mock_client() });
  t.after(() => app.close());

  const response = await app.inject({ method: 'GET', url: '/doc/restaurant-1' });

  assert.equal(response.statusCode, 200);

  const json = response.json();
  assert.equal(json._id, 'restaurant-1');
  assert.equal(json.item.id, 'restaurant-1');
  assert.equal(json.item.source.name, 'Mesa Verde');
  assert.equal(json.found, true);
});