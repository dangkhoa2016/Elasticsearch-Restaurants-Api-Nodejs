const test = require('node:test');
const assert = require('node:assert/strict');

const { build_server } = require('../app/index');

function create_mock_client() {
  return {
    async ping() {
      return true;
    },
    async search() {
      return { body: { hits: { hits: [] } } };
    },
    async get() {
      return { body: { _id: 'restaurant-1' } };
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