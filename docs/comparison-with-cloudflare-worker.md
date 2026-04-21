# Comparison: Elasticsearch-Restaurants-Api-Nodejs vs Elasticsearch-Restaurants-Api-Cloudflare-Worker

> 🌐 Language / Ngôn ngữ: **English** | [Tiếng Việt](comparison-with-cloudflare-worker.vi.md)

> **Source of truth for logic:**
> [`github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Nodejs`](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Nodejs)

> **Target runtime / port:**
> [`github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker`](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker)

---

## Overview

The Cloudflare Worker project is an intentional **ESM port** of this Node.js application. It preserves all business logic, function names, variable names, error codes, and the API contract, while replacing the infrastructure layer to run on the Cloudflare Workers runtime.

Most comments in the Worker source explicitly reference the corresponding file in this project, for example:

```
// Mirrors build_server() from app/index.js in the Node.js version.
// Mirrors app/routes/home.js from the Node.js version.
```

Infrastructure differences (not business logic):

| Component | This project (Node.js) | Cloudflare Worker |
|---|---|---|
| HTTP framework | Fastify | Hono |
| Module system | CommonJS (`require`) | ESM (`import/export`) |
| OpenSearch client | `@opensearch-project/opensearch` | Custom fetch-based client |
| Config source | `process.env` at module load time | `env` object passed into `get_runtime_config(env)` |
| Logging | `debug` + Fastify/Pino built-in logger | `console.debug` |
| Body parsing | `@fastify/formbody` + `qs.parse` | Custom `parse_form_body()` using `URLSearchParams` |
| Schema validation | Fastify AJV schema (`searchSchema`) | Manual `validate_search_body()` |
| Rate limiting | `@fastify/rate-limit` | Cloudflare native `RateLimiter` binding |
| Security headers | `@fastify/helmet` | `security_headers_middleware` |

---

## File Mapping

| Node.js (`app/`) | Cloudflare Worker (`src/`) | Similarity |
|---|---|---|
| `index.js` → `build_server()` | `index.js` → `build_app()` | ~90% |
| `routes/home.js` | `routes/home.js` | ~85% |
| `routes/elasticsearch.js` (search) | `routes/search.js` | ~90% |
| `routes/elasticsearch.js` (doc) | `routes/document.js` | ~95% |
| `routes/errors.js` | `lib/errors.js` | ~95% |
| `config/runtime.js` | `config/env.js` | ~90% |
| `services/helper.js` | `services/helper.js` | ~95% |
| `services/response_formatter.js` | `services/response_formatter.js` | ~100% |
| `services/elasticsearch_client.js` | `services/opensearch.js` | Completely different (custom fetch) |
| `services/logger.js` | `lib/logger.js` | Different (Fastify plugin vs Hono middleware) |

---

## File-by-File Breakdown

### `services/response_formatter.js` — Identical

All 4 functions are identical line-by-line:

| Function | Notes |
|---|---|
| `normalize_total(total, fallback)` | Identical |
| `format_search_item(hit)` | Identical |
| `format_search_response(body, { index, limit, offset })` | Identical |
| `format_document_response(body)` | Identical |

Only the export syntax differs: `module.exports = { ... }` → `export { ... }`.

---

### `services/helper.js` — ~95% identical

All geo-coordinate handling functions were copied verbatim:

| Function | Notes |
|---|---|
| `to_coordinate_number(value)` | Identical |
| `to_elasticsearch_point(point)` | Identical |
| `is_location_empty(point, force_convert)` | Identical |
| `is_empty_pos(pos)` | Identical |
| `is_latitude(num)` | Identical |
| `is_longitude(num)` | Identical |
| `normalize_distance(distance, radius)` | Identical |
| `param_by_circle(distance, location)` | Identical |
| `param_by_rectangle(top_left, bottom_right)` | Identical |
| `get_geo_search_params(body[, default_index])` | Minor difference: Worker accepts an extra `default_index` parameter instead of reading from a global config |

---

### `config/runtime.js` vs `config/env.js` — ~90% identical

Parser helper functions are identical:
- `parse_boolean(value, defaultValue)`
- `parse_integer(value, defaultValue)`
- `parse_csv(value)`
- `is_local_origin(origin)`

Config keys present in both:

| Key | Node.js | Cloudflare Worker |
|---|---|---|
| `elasticsearch_url` | `process.env.ELASTICSEARCH_URL` | `env.ELASTICSEARCH_URL` |
| `default_index` | `process.env.DEFAULT_INDEX \|\| 'restaurants'` | `env.DEFAULT_INDEX \|\| 'restaurants'` |
| `allowed_origins` | `parse_csv(process.env.ALLOWED_ORIGINS)` | `parse_csv(env.ALLOWED_ORIGINS)` |
| `allow_debug_sleep` | `parse_boolean(process.env.ALLOW_DEBUG_SLEEP, ...)` | `parse_boolean(env.ALLOW_DEBUG_SLEEP, ...)` |
| `debug_sleep_header` | `process.env.DEBUG_SLEEP_HEADER \|\| 'x-debug-sleep-token'` | `env.DEBUG_SLEEP_HEADER \|\| 'x-debug-sleep-token'` |
| `debug_sleep_secret` | `process.env.DEBUG_SLEEP_SECRET \|\| ''` | `env.DEBUG_SLEEP_SECRET \|\| ''` |
| `max_debug_sleep_ms` | `parse_integer(process.env.MAX_DEBUG_SLEEP_MS, 5000)` | `parse_integer(env.MAX_DEBUG_SLEEP_MS, 5000)` |
| `is_origin_allowed(origin)` | Same method | Same method |

Keys present **only in Node.js** (Cloudflare manages these at the platform level):

| Key | Default | Reason absent in Worker |
|---|---|---|
| `host` | `0.0.0.0` | Cloudflare manages the bind address |
| `port` | `8080` | Cloudflare manages the port |
| `body_limit` | `1048576` (1 MB) | Cloudflare enforces its own request size limits |
| `request_timeout` | `30000` ms | Cloudflare enforces its own per-request timeout |
| `rate_limit.max` | `100` | Configured via `wrangler.jsonc` `ratelimits` binding |
| `rate_limit.time_window` | `1 minute` | Configured via `wrangler.jsonc` `ratelimits` binding |
| `structured_logging_enabled` | `true` | Worker always uses `console.*` |

---

### `POST /search` — ~90% identical

**Identical:**
- Constants `DEFAULT_SEARCH_LIMIT = 80`, `DEFAULT_SEARCH_OFFSET = 0`
- `parse_sleep_ms(value)` function — identical line-by-line
- `can_use_debug_sleep()` logic — same checks for `allow_debug_sleep`, `debug_sleep_secret`, `is_production_like`
- Error codes: `INVALID_SEARCH_QUERY`, `DEBUG_SLEEP_LIMIT_EXCEEDED`, `DEBUG_SLEEP_NOT_ALLOWED`
- `opensearch.search({ index, body: { query, size: 80 } })` call
- Deprecation warning for the `radius` field
- Returns `format_search_response(result, { index, limit, offset })`

**Differences:**

| Aspect | Node.js | Cloudflare Worker |
|---|---|---|
| Validation | Fastify AJV schema (`searchSchema`) — automatic | Manual `validate_search_body()` — Hono has no built-in schema validation |
| Form body parsing | `@fastify/formbody` + `qs.parse` | Custom `parse_form_body()` using `URLSearchParams` (supports one level of bracket notation) |
| Debug sleep header read | `request.headers[header]` | `c.req.header(header)` |

---

### `GET /doc/:id` — ~95% identical

Both implementations:
- Accept `id` as a URL parameter
- Accept `index` (default: `'restaurants'`) and `_source` (default: `true`) as query parameters
- Call `opensearch.get({ index, id, _source })`
- Return `format_document_response(body)`

---

### `GET /`, `GET /health`, `GET /ready` — ~85% identical

| Route | Identical response |
|---|---|
| `GET /` | `{ message: 'Welcome to Elasticsearch Restaurants Api Nodejs.' }` |
| `GET /health` | `{ status: 'ok' }` |
| `GET /ready` | `{ status: 'ready' }` or error `OPENSEARCH_NOT_READY` (503) |

Difference: This project additionally serves `GET /favicon.ico` and `GET /favicon.png`. The Worker omits these as they are irrelevant for a pure API.

---

### Error response shape — Identical

Both return:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": [...]
}
```

Node.js: `server.decorate('sendError', (reply, statusCode, code, message, details) => ...)`  
Worker: `send_error(c, statusCode, code, message, details)` in `src/lib/errors.js`

---

### Middleware pipeline — Same order

| Order | Node.js | Cloudflare Worker |
|---|---|---|
| 1 | `@fastify/opensearch` (inject client) | Middleware injects `config` + `opensearch` into context |
| 2 | `@fastify/helmet` | `security_headers_middleware` |
| 3 | `services/logger.js` Fastify plugin | `logger_middleware` |
| 4 | `@fastify/cors` | `cors_middleware` |
| 5 | `@fastify/rate-limit` | `create_rate_limit_middleware` |

---

### `services/logger.js` — Different implementation, same behaviour

Both log on every request/response with the same fields: `requestId`, `method`, `url`, `statusCode`, `durationMs`.

- **Node.js:** Fastify plugin using `addHook('onRequest')` + `addHook('onResponse')` + `process.hrtime.bigint()` for precise timing.
- **Worker:** Hono middleware using `performance.now()` and `c.req.header('x-request-id')` to generate / forward the request ID. Sets `X-Request-Id` on every response.

---

## Conclusion

The Cloudflare Worker is a **faithful port** of this Node.js project, sharing:
- API contract (endpoints, request/response shape, error codes)
- Business logic (geo search, document fetch, debug sleep)
- Configuration (env variable names, default values)
- Middleware order and security posture

All differences are confined to the infrastructure layer to ensure compatibility with the Cloudflare Workers runtime, and have no impact on behaviour from the perspective of an API consumer.
