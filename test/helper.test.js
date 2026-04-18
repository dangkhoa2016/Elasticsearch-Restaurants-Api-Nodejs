const test = require('node:test');
const assert = require('node:assert/strict');

const {
  get_geo_search_params,
  to_elasticsearch_point,
} = require('../app/services/helper');

test('to_elasticsearch_point returns null coordinates for invalid values', () => {
  assert.deepEqual(
    to_elasticsearch_point({ lat: 'abc', lon: 'xyz' }),
    { lat: null, lon: null }
  );
});

test('get_geo_search_params still supports radius as a fallback alias', () => {
  const { query } = get_geo_search_params({
    type: 'circle',
    location: '-37.852,144.993165',
    radius: '200m'
  });

  assert.deepEqual(query, {
    geo_distance: {
      distance: '200m',
      location: {
        lat: -37.852,
        lon: 144.993165
      }
    }
  });
});

test('get_geo_search_params returns an error when distance is missing', () => {
  const { query } = get_geo_search_params({
    type: 'circle',
    location: '-37.852,144.993165'
  });

  assert.equal(query.code, 'MISSING_DISTANCE');
  assert.equal(query.statusCode, 400);
});