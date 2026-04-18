const config = require('../config/runtime');

const default_index = config.default_index;
const debug = require('debug')('elasticsearch-restaurants-api-nodejs:helper');

function to_coordinate_number(value) {
  if (is_empty_pos(value))
    return null;

  const parsed = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value).trim());

  return Number.isFinite(parsed) ? parsed : null;
}

function to_elasticsearch_point(point) {
  if (!point) return { lat: null, lon: null };

  var latitude;
  var longitude;

  if (typeof point === 'string') {
    [latitude, longitude] = point.split(',');
  } else if (Array.isArray(point))
    [latitude, longitude] = point;
  else {
    ({ lat: latitude, lon: longitude } = point);
    if (is_empty_pos(latitude))
      latitude = point.latitude;
    if (is_empty_pos(longitude))
      longitude = point.longitude || point.lng;
  }

  var lat = to_coordinate_number(latitude);
  var lon = to_coordinate_number(longitude);
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

function normalize_distance(distance, radius) {
  const value = is_empty_pos(distance) ? radius : distance;

  if (is_empty_pos(value))
    return null;

  return typeof value === 'string' ? value.trim() : value;
}

function get_geo_search_params(body = {}) {
  var {
    index = default_index,
    type = 'circle',
    location,
    distance,
    radius,
    top_left,
    bottom_right,
    sleep
  } = body;
  debug('get_geo_search_params input', { index, type, location, distance, radius, top_left, bottom_right, sleep });

  if (type.toLowerCase() === 'circle')
    return { index, query: param_by_circle(normalize_distance(distance, radius), to_elasticsearch_point(location)), sleep };

  if (type.toLowerCase() === 'rectangle')
    return { index, query: param_by_rectangle(to_elasticsearch_point(top_left), to_elasticsearch_point(bottom_right)), sleep };

  return {
    index,
    query: {
      error: 'Invalid search type.',
      code: 'INVALID_SEARCH_TYPE',
      statusCode: 400
    },
    sleep
  };
};

function param_by_rectangle(top_left, bottom_right) {
  if (is_location_empty(top_left))
    return { error: 'Missing top left point.', code: 'MISSING_TOP_LEFT_POINT', statusCode: 400 };
  if (is_location_empty(bottom_right))
    return { error: 'Missing bottom right point.', code: 'MISSING_BOTTOM_RIGHT_POINT', statusCode: 400 };

  return {
    "geo_bounding_box": {
      "location": {
        top_left, bottom_right
      }
    }
  };
};

const param_by_rectange = param_by_rectangle;

function param_by_circle(distance, location) {
  if (is_location_empty(location))
    return { error: 'Missing center point.', code: 'MISSING_CENTER_POINT', statusCode: 400 };

  if (is_empty_pos(distance))
    return { error: 'Missing distance.', code: 'MISSING_DISTANCE', statusCode: 400 };

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
  param_by_rectangle,
  param_by_rectange,
  param_by_circle,
  get_geo_search_params,
  default_index
};
