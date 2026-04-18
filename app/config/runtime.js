function parse_boolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '')
    return defaultValue;

  if (typeof value === 'boolean')
    return value;

  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function parse_integer(value, defaultValue) {
  if (value === undefined || value === null || value === '')
    return defaultValue;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parse_csv(value) {
  if (!value)
    return [];

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function is_local_origin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
  } catch (error) {
    return false;
  }
}

const node_env = process.env.NODE_ENV || 'development';
const is_production_like = node_env === 'production' || node_env === 'staging';
const elasticsearch_url = process.env.ELASTICSEARCH_URL || (is_production_like ? '' : 'http://localhost:9200');

if (!elasticsearch_url)
  throw new Error('ELASTICSEARCH_URL is required in staging/production.');

const allowed_origins = parse_csv(process.env.ALLOWED_ORIGINS);

const config = {
  node_env,
  is_production_like,
  host: process.env.HOST || '0.0.0.0',
  port: parse_integer(process.env.PORT, 8080),
  elasticsearch_url,
  default_index: process.env.DEFAULT_INDEX || 'restaurants',
  body_limit: parse_integer(process.env.REQUEST_BODY_LIMIT, 1024 * 1024),
  request_timeout: parse_integer(process.env.REQUEST_TIMEOUT_MS, 30000),
  opensearch_request_timeout: parse_integer(process.env.OPENSEARCH_REQUEST_TIMEOUT_MS, 30000),
  allowed_origins,
  allow_debug_sleep: parse_boolean(process.env.ALLOW_DEBUG_SLEEP, !is_production_like),
  debug_sleep_header: (process.env.DEBUG_SLEEP_HEADER || 'x-debug-sleep-token').toLowerCase(),
  debug_sleep_secret: process.env.DEBUG_SLEEP_SECRET || '',
  max_debug_sleep_ms: parse_integer(process.env.MAX_DEBUG_SLEEP_MS, 5000),
  rate_limit: {
    max: parse_integer(process.env.RATE_LIMIT_MAX, 100),
    time_window: process.env.RATE_LIMIT_WINDOW || '1 minute'
  },
  log_level: process.env.LOG_LEVEL || (is_production_like ? 'info' : 'debug'),
  structured_logging_enabled: parse_boolean(process.env.ENABLE_STRUCTURED_LOGGING, true),
  is_origin_allowed(origin) {
    if (!origin)
      return true;

    if (allowed_origins.includes(origin))
      return true;

    if (!is_production_like && (allowed_origins.length === 0 || is_local_origin(origin)))
      return true;

    return false;
  }
};

module.exports = config;
