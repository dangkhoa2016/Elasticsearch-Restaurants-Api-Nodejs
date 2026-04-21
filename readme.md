# Elasticsearch Restaurants API (Node.js + Fastify + OpenSearch)

> 🌐 Language / Ngôn ngữ: **English** | [Tiếng Việt](readme.vi.md)

## About

A geo-search API for restaurants built with [Fastify](https://fastify.dev/) and an OpenSearch/Elasticsearch-compatible backend.

This API serves as the **backend** for [Elasticsearch-Restaurants-Map-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Map-UI) — a map-based UI that displays restaurant locations using the geo-search endpoints provided by this project.

A Cloudflare Worker port of this project is available at [Elasticsearch-Restaurants-Api-Cloudflare-Worker](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker).

See the detailed source code similarity analysis between the two projects: [English](docs/comparison-with-cloudflare-worker.md) | [Tiếng Việt](docs/comparison-with-cloudflare-worker.vi.md)

For a list of top locations with the most restaurants (useful for testing geo-search): [English](docs/list-top-location-for-test.md) | [Tiếng Việt](docs/list-top-location-for-test.vi.md)

**Features:**

- Geo-search by circle (centre + distance) or rectangle (bounding box).
- Fetch any document by ID.
- Environment-driven runtime config — no hardcoded values.
- Structured JSON logging (Pino via Fastify) for production; `debug` namespaces for development.
- Per-IP rate limiting via `@fastify/rate-limit`.
- Security headers via `@fastify/helmet`.
- CORS allowlist via `@fastify/cors`.
- Debug sleep support on `/search`, gated by env and an optional secret header.
- Health (`/health`) and readiness (`/ready`) endpoints.
- Backward-compatible response contract — raw OpenSearch fields are preserved alongside normalised `items` and `pageInfo`.

## Technologies Used

| Category | Technology |
|---|---|
| Runtime | [Node.js](https://nodejs.org/) 20+ |
| Web framework | [Fastify](https://fastify.dev/) 5.x |
| OpenSearch client | [@opensearch-project/opensearch](https://github.com/opensearch-project/opensearch-js) |
| OpenSearch plugin | [@fastify/opensearch](https://github.com/fastify/fastify-opensearch) |
| CORS | [@fastify/cors](https://github.com/fastify/fastify-cors) |
| Security headers | [@fastify/helmet](https://github.com/fastify/fastify-helmet) |
| Rate limiting | [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit) |
| Form body parsing | [@fastify/formbody](https://github.com/fastify/fastify-formbody) |
| Structured logging | [Pino](https://getpino.io/) (built into Fastify) |
| Debug logging | [debug](https://github.com/debug-js/debug) |
| Environment loading | [dotenv](https://github.com/motdotla/dotenv) |
| Dev auto-reload | [nodemon](https://nodemon.io/) |
| Linting | [ESLint](https://eslint.org/) 10.x |
| Testing | Node.js built-in `node:test` runner |

## Requirements

- Node.js 20+
- Yarn 1.x (or npm)
- An OpenSearch or Elasticsearch-compatible endpoint

## Directory structure

```text
Elasticsearch-Restaurants-Api-Nodejs/
  readme.md
  package.json
  .env.sample              ← template for environment variables
  .env.local               ← local overrides, git-ignored
  bin/
    www                    ← server entrypoint, reads .env.local in dev
  app/
    index.js               ← Fastify factory build_server()
    config/
      runtime.js           ← parse + validate all env vars
    routes/
      home.js              ← GET /, /health, /ready, /favicon.*
      elasticsearch.js     ← POST /search, GET /doc/:id
      errors.js            ← 404 handler
    services/
      elasticsearch_client.js  ← OpenSearch client singleton
      helper.js            ← geo-search query builder
      response_formatter.js    ← normalise search + document responses
      logger.js            ← request/response logging Fastify plugin
    manual/                ← standalone import/debug scripts
  test/
    app.test.js            ← integration tests (5 tests)
    helper.test.js         ← unit tests (3 tests)
```

## Environment variables

Copy `.env.sample` to `.env.local` and adjust the values:

```bash
cp .env.sample .env.local
```

| Variable | Required | Default | Description |
| --- | :---: | --- | --- |
| `ELASTICSEARCH_URL` | ✅ | — | OpenSearch/Elasticsearch endpoint. Required in `staging`/`production`. Defaults to `http://localhost:9200` in development. |
| `DEFAULT_INDEX` | | `restaurants` | Index used when a request does not specify one. |
| `PORT` | | `8080` | Port the server listens on. |
| `HOST` | | `0.0.0.0` | Host/interface the server binds to. |
| `ALLOWED_ORIGINS` | | `""` (empty) | Comma-separated CORS allowlist, e.g. `https://app.example.com`. In development, all `localhost` origins are allowed when empty. |
| `ALLOW_DEBUG_SLEEP` | | `true` in dev, `false` in production | Enables the `sleep` field on `POST /search`. Keep `false` in production. |
| `DEBUG_SLEEP_HEADER` | | `x-debug-sleep-token` | Header name checked when `DEBUG_SLEEP_SECRET` is set. |
| `DEBUG_SLEEP_SECRET` | | `""` (empty) | When set, the `DEBUG_SLEEP_HEADER` must match this value to use debug sleep. |
| `MAX_DEBUG_SLEEP_MS` | | `5000` | Maximum sleep duration in milliseconds. |
| `REQUEST_BODY_LIMIT` | | `1048576` (1 MB) | Maximum request body size in bytes. |
| `REQUEST_TIMEOUT_MS` | | `30000` | Fastify request timeout in milliseconds. |
| `OPENSEARCH_REQUEST_TIMEOUT_MS` | | `30000` | OpenSearch client request timeout in milliseconds. |
| `RATE_LIMIT_MAX` | | `100` | Maximum requests per time window per IP. |
| `RATE_LIMIT_WINDOW` | | `1 minute` | Rate limit time window. |
| `LOG_LEVEL` | | `debug` in dev, `info` in production | Minimum Fastify/Pino log level. |
| `ENABLE_STRUCTURED_LOGGING` | | `true` | Enable Pino JSON logging. Set to `false` for plain output during local development. |
| `NODE_ENV` | | `development` | Operating mode. `production` and `staging` enforce CORS and disable debug sleep by default. |

> **Note:** `.env.local` is listed in `.gitignore` — never commit it. `.env.sample` is the file committed to the repo (no sensitive values).

## Run locally

Install dependencies:

```bash
yarn install
```

Run in development mode (with `nodemon` auto-reload and `DEBUG` namespaces):

```bash
yarn dev
```

Run in production mode:

```bash
yarn start
```

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `yarn dev` | `DEBUG=elasticsearch-restaurants-api-nodejs* nodemon bin/www` | Development server with auto-reload. |
| `yarn start` | `node bin/www` | Production server. |
| `yarn lint` | `eslint .` | Run ESLint. |
| `yarn test` | `node --test test/*.test.js` | Run all tests. |
| `yarn check` | `yarn lint && yarn test` | Lint then test. |

## API

### `GET /`

```json
{ "message": "Welcome to Elasticsearch Restaurants Api Nodejs." }
```

### `GET /health`

Returns process health. Always `200` while the process is running.

```json
{ "status": "ok" }
```

### `GET /ready`

Checks connectivity to OpenSearch. Returns `200` on success, `503` if the ping fails.

```json
{ "status": "ready" }
```

### `POST /search`

Search for restaurants by location. Request body must be `application/json` or `application/x-www-form-urlencoded`. The `type` field is required.

**Circle search** — finds documents within a radius of a point:

```json
{
  "type": "circle",
  "location": "-37.852,144.993165",
  "distance": "200m"
}
```

`location` accepts a `"lat,lon"` string, a `{ lat, lon }` object, or a `[lat, lon]` array. `radius` is accepted as a deprecated alias for `distance`.

**Rectangle search** — finds documents within a bounding box:

```json
{
  "type": "rectangle",
  "top_left": { "lat": -37.8, "lon": 144.9 },
  "bottom_right": { "lat": -38, "lon": 145 }
}
```

**Optional fields:**

| Field | Description |
| --- | --- |
| `index` | Override the default OpenSearch index. |
| `sleep` | Debug only — delay the response for this many milliseconds (see Debug sleep). |

**Response:**

```json
{
  "took": 3,
  "hits": {
    "total": { "value": 1, "relation": "eq" },
    "hits": []
  },
  "_shards": { "total": 1, "successful": 1, "failed": 0 },
  "index": "restaurants",
  "total": 1,
  "returned": 1,
  "items": [
    {
      "id": "restaurant-1",
      "index": "restaurants",
      "score": 1,
      "source": { "name": "Mesa Verde" },
      "sort": [],
      "fields": {}
    }
  ],
  "pageInfo": {
    "limit": 80,
    "offset": 0,
    "returned": 1,
    "total": 1,
    "hasMore": false
  }
}
```

Existing consumers reading `hits.hits`, `took`, or `_shards` continue to work. New consumers should use `items`, `total`, and `pageInfo`.

**Validation error:**

```json
{
  "error": "Invalid request payload.",
  "code": "VALIDATION_ERROR",
  "details": [
    { "instancePath": "", "keyword": "required", "message": "must have required property 'distance'" }
  ]
}
```

### `GET /doc/:id`

Fetch a document by ID. Optional query parameters: `index` (string) and `_source` (boolean or string).

```json
{
  "_id": "restaurant-1",
  "_index": "restaurants",
  "_source": { "name": "Mesa Verde" },
  "found": true,
  "item": {
    "id": "restaurant-1",
    "index": "restaurants",
    "source": { "name": "Mesa Verde" },
    "found": true
  }
}
```

### Error response shape

All errors follow a consistent JSON contract:

```json
{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE" }
```

Common error codes:

| Code | Status | Description |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request body failed schema validation. |
| `INVALID_SEARCH_QUERY` | 400 | Geo-search parameters could not be parsed. |
| `DEBUG_SLEEP_LIMIT_EXCEEDED` | 400 | `sleep` value exceeds `MAX_DEBUG_SLEEP_MS`. |
| `DEBUG_SLEEP_NOT_ALLOWED` | 403 | Debug sleep is not permitted for this request. |
| `OPENSEARCH_NOT_READY` | 503 | OpenSearch ping failed on `/ready`. |
| `ROUTE_NOT_FOUND` | 404 | No route matched the request path. |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error. |

## Debug sleep

The `sleep` field on `POST /search` delays the response by the given number of milliseconds. It is designed for testing timeouts and loading states on the client.

Access is gated:

- When `ALLOW_DEBUG_SLEEP=false` (the production default), the field is silently ignored and the request continues normally.
- When `ALLOW_DEBUG_SLEEP=true` and `DEBUG_SLEEP_SECRET` is not set, any request from a non-production environment may use it.
- When `ALLOW_DEBUG_SLEEP=true` and `DEBUG_SLEEP_SECRET` is set, the `DEBUG_SLEEP_HEADER` must be present and match the secret.

Recommended setup for a shared staging environment:

```
ALLOW_DEBUG_SLEEP=true
DEBUG_SLEEP_HEADER=x-debug-sleep-token
DEBUG_SLEEP_SECRET=change-me
MAX_DEBUG_SLEEP_MS=5000
```

Send the secret in the request header:

```bash
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -H "x-debug-sleep-token: change-me" \
  -d '{ "type": "circle", "location": "-37.852,144.993165", "distance": "200m", "sleep": 2000 }'
```

If the guard is not satisfied, the API returns `403 DEBUG_SLEEP_NOT_ALLOWED`.

## Tests

Run all tests:

```bash
yarn test
```

There are currently 8 tests across 2 files:

- `test/app.test.js` — integration tests using Fastify's injection API (5 tests):
  - `GET /health`, `GET /ready`, `POST /search` (validation + contract), `GET /doc/:id`
- `test/helper.test.js` — unit tests for the geo-search builder (3 tests):
  - Invalid coordinate handling, `radius` alias, missing distance error

## Manual scripts

`app/manual/` contains standalone Node.js scripts for dataset import and debugging. They share a bootstrap module that loads `.env.local` and reuses runtime config (no hardcoded credentials).

Scripts available:

| Script | Description |
| --- | --- |
| `bootstrap.js` | Shared `.env.local` loader used by all manual scripts. |
| `import.js` | Bulk-import restaurant data into OpenSearch. |
| `elasticsearch.js` | Low-level query examples. |
| `geo_search.js` | Test geo-search queries directly against OpenSearch. |
| `debug.js` | Debug helper for inspecting raw responses. |
| `client.js` | Standalone OpenSearch client setup. |

Run a script directly:

```bash
node app/manual/geo_search.js
```

## CI

GitHub Actions runs on every push and pull request to `main`:

```
yarn lint
yarn test
```

Workflow file: `.github/workflows/ci.yml`.

## Deploy

### Prerequisites

- A Node.js 20+ runtime environment.
- An accessible OpenSearch/Elasticsearch endpoint.
- All required environment variables set (see [Environment variables](#environment-variables)).

### Option 1 — Direct Node.js (VPS / bare metal)

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Nodejs.git
   cd Elasticsearch-Restaurants-Api-Nodejs
   yarn install --frozen-lockfile
   ```

2. Set environment variables. The recommended approach is to export them in your shell profile or use a process manager (see Option 2):

   ```bash
   export NODE_ENV=production
   export ELASTICSEARCH_URL=https://user:password@your-cluster.example.com
   export ALLOWED_ORIGINS=https://your-frontend.example.com
   export PORT=8080
   ```

3. Start the server:

   ```bash
   yarn start
   ```

### Option 2 — PM2 (recommended for long-running servers)

[PM2](https://pm2.keymetrics.io/) manages the process, restarts on crash, and handles log rotation.

1. Install PM2 globally:

   ```bash
   npm install -g pm2
   ```

2. Create an `ecosystem.config.js` file in the project root:

   ```js
   module.exports = {
     apps: [
       {
         name: 'restaurants-api',
         script: 'bin/www',
         instances: 1,
         exec_mode: 'fork',
         env_production: {
           NODE_ENV: 'production',
           PORT: 8080,
           ELASTICSEARCH_URL: 'https://user:password@your-cluster.example.com',
           ALLOWED_ORIGINS: 'https://your-frontend.example.com',
           ENABLE_STRUCTURED_LOGGING: 'true',
           LOG_LEVEL: 'info'
         }
       }
     ]
   };
   ```

3. Start the app with PM2:

   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save        # persist the process list across reboots
   pm2 startup     # configure PM2 to start on system boot
   ```

4. Useful PM2 commands:

   ```bash
   pm2 list                     # list running apps
   pm2 logs restaurants-api     # tail logs
   pm2 reload restaurants-api   # zero-downtime reload
   pm2 stop restaurants-api     # stop the app
   ```

### Option 3 — Docker

1. Create a `Dockerfile` in the project root:

   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package.json yarn.lock ./
   RUN yarn install --frozen-lockfile --production
   COPY . .
   EXPOSE 8080
   CMD ["node", "bin/www"]
   ```

2. Build and run:

   ```bash
   docker build -t restaurants-api .
   docker run -d \
     -p 8080:8080 \
     -e NODE_ENV=production \
     -e ELASTICSEARCH_URL=https://user:password@your-cluster.example.com \
     -e ALLOWED_ORIGINS=https://your-frontend.example.com \
     --name restaurants-api \
     restaurants-api
   ```

### Option 4 — PaaS (Railway, Render, Fly.io, Heroku)

Most PaaS platforms auto-detect a Node.js project and use the `start` script from `package.json`.

1. Connect your repository to the platform.
2. Set the required environment variables in the platform's dashboard:
   - `NODE_ENV=production`
   - `ELASTICSEARCH_URL`
   - `ALLOWED_ORIGINS`
   - Any other variables from the table above.
3. Deploy — the platform runs `yarn install` then `yarn start` automatically.

### Production checklist

- [ ] `NODE_ENV` is set to `production`.
- [ ] `ELASTICSEARCH_URL` points to a live cluster and does not use default localhost.
- [ ] `ALLOWED_ORIGINS` is restricted to your real frontend domain(s).
- [ ] `ALLOW_DEBUG_SLEEP` is `false` (or not set).
- [ ] `ENABLE_STRUCTURED_LOGGING` is `true`.
- [ ] `LOG_LEVEL` is `info` or `warn`.
- [ ] `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW` are tuned for your expected traffic.
- [ ] A reverse proxy (nginx, Caddy, Cloudflare) terminates TLS in front of the Node.js process.

## Related projects

| Project | Description |
| --- | --- |
| [Elasticsearch-Restaurants-Api-Cloudflare-Worker](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker) | Cloudflare Worker port of this API — same business logic, Hono framework, ESM, custom fetch-based OpenSearch client. |
| [Elasticsearch-Restaurants-Map-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Map-UI) | Map-based UI that consumes this API to display restaurant locations. |

## Other related projects by the author (not direct ports, but share the same dataset and similar goals):
| [Elasticsearch-Restaurants-Aggregations-Api-Nodejs](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Aggregations-Api-Nodejs) | Node.js API with aggregation support for the same restaurant dataset. |
| [Elasticsearch-Restaurants-Aggregations-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Aggregations-UI) | UI for the aggregations API — charts and filters. |
