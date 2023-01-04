const default_index = 'restaurants';
const debug = require('debug')('elasticsearch-restaurants-api-nodejs:helper');

function to_elasticsearch_point(point) {
  if (!point) return { lat: null, lon: null };

  if (typeof point === 'string') {
    var [lat, lon] = point.split(",");
  } else if (Array.isArray(point))
    var [lat, lon] = point;
  else {
    var { lat, lon } = point;
    if (is_empty_pos(lat))
      lat = point.latitude;
    if (is_empty_pos(lon))
      lon = point.longitude || point.lng;
  }

  lat = parseFloat(lat.toString().trim()) || 0;
  lon = parseFloat(lon.toString().trim()) || 0;
  if (!is_latitude(lat))
    lat = null;
  if (!is_longitude(lon))
    lon = null;
  return { lat, lon };
};

function is_location_empty(point, force_convert = false) {
  if (force_convert)
    point = to_elasticsearch_point(point);
  return !point || is_empty_pos(point.lat) || is_empty_pos(point.lon);
};

function is_empty_pos(pos) {
  return pos === null || pos === '' || pos === undefined;
}

const is_latitude = num => isFinite(num) && Math.abs(num) <= 90;

const is_longitude = num => isFinite(num) && Math.abs(num) <= 180;

function get_geo_search_params(body) {
  var { index = default_index, type = 'circle', location, distance, top_left, bottom_right, sleep } = body;
  if (type.toLowerCase() === 'circle')
    return { index, query: param_by_circle(distance, to_elasticsearch_point(location)), sleep };
  else
    return { index, query: param_by_rectange(to_elasticsearch_point(top_left), to_elasticsearch_point(bottom_right)), sleep };
};

function param_by_rectange(top_left, bottom_right) {
  if (is_location_empty(top_left))
    return { error: `Missing top left point.` };
  if (is_location_empty(bottom_right))
    return { error: `Missing bottom right point.` };

  return {
    "geo_bounding_box": {
      "location": {
        top_left, bottom_right
      }
    }
  };
};

function param_by_circle(distance, location) {
  if (is_location_empty(location))
    return { error: `Missing center point.` };

  return {
    "geo_distance": {
      distance,
      location
    }
  };
};

module.exports = {
  to_elasticsearch_point,
  is_location_empty,
  param_by_rectange,
  param_by_circle,
  get_geo_search_params,
  default_index
};
