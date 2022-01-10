const { Client } = require('@elastic/elasticsearch');
var client = new Client({ node: 'http://localhost:9200' });
var debug = require('debug')('es-log');

(async () => {
  client.on('request', (err, result) => {
    const { meta: { request, connection } } = result;
    debug('request', err, request, connection);
  });
  client.on('deserialization', (err, result) => {
    // console.log(err, result);
    debug('deserialization', err, result);
  });
  client.on('response', (err, result) => {
    // console.log(err, result);
    debug('response', err, result);
  });

  var index = 'restaurants2';
  try {
    var query = param_by_circle("200m", { "lat": -37.852, "lon": 144.993165 });
    // var query = param_by_rectange({ "lat": -37.80, "lon": 144.90 }, { "lat": -38, "lon": 145 });
    var { body } = await client.search({
      index,
      body: { query }
    });
    console.log(body);
  } catch (ex) {
    console.log(ex);
  }
})();

function param_by_rectange(top_left, bottom_right) {
  return {
    "geo_bounding_box": {
      "location": {
        top_left, bottom_right
      }
    }
  };
};

function param_by_circle(distance, location) {
  return {
    "geo_distance": {
      distance,
      location
    }
  };
}
