# Elasticsearch Restaurants API (Node.js + Fastify + OpenSearch)

## About

This project is a small demo API for geo-searching restaurants with Fastify and OpenSearch.

The codebase now includes:

- Fastify runtime config with environment-driven security and logging.
- Debug-friendly `sleep` support guarded by env/header checks.
- Structured logging for staging/production while keeping `debug` namespaces for development.
- Health and readiness endpoints.
- A backward-compatible search response contract that still preserves raw OpenSearch fields.

## Requirements

- Node.js 20+
- Yarn 1.x
- An OpenSearch or Elasticsearch-compatible endpoint

## Environment variables

Start from `.env.sample` and adjust these values:

- `ELASTICSEARCH_URL`: full OpenSearch endpoint.
- `DEFAULT_INDEX`: default index name, defaults to `restaurants`.
- `ALLOWED_ORIGINS`: comma-separated allowlist for CORS.
- `ALLOW_DEBUG_SLEEP`: set to `true` only when you intentionally want delayed debug requests.
- `DEBUG_SLEEP_HEADER` and `DEBUG_SLEEP_SECRET`: optional guard for debug sleep in shared environments.
- `ENABLE_STRUCTURED_LOGGING`: set to `true` for Pino/Fastify logs.

## Run locally

Install dependencies:

```bash
yarn install
```

Run in development:

```bash
yarn dev
```

Run in production mode:

```bash
yarn start
```

Run checks:

```bash
yarn lint
yarn test
```

## Endpoints

### `GET /health`

Returns process health:

```json
{ "status": "ok" }
```

### `GET /ready`

Checks whether the app can reach OpenSearch:

```json
{ "status": "ready" }
```

### `POST /search`

Supported search payloads:

Circle search:

```json
{
	"type": "circle",
	"location": "-37.852,144.993165",
	"distance": "200m"
}
```

Rectangle search:

```json
{
	"type": "rectangle",
	"top_left": { "lat": -37.8, "lon": 144.9 },
	"bottom_right": { "lat": -38, "lon": 145 }
}
```

Response contract:

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
			"source": {}
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

Notes:

- Existing consumers that read `hits.hits`, `took`, or `_shards` still work.
- New consumers can rely on `items`, `total`, and `pageInfo`.

### `GET /doc/:id`

Returns the raw OpenSearch document metadata plus a normalized `item` field:

```json
{
	"_id": "restaurant-1",
	"_index": "restaurants",
	"_source": {},
	"found": true,
	"item": {
		"id": "restaurant-1",
		"index": "restaurants",
		"source": {},
		"found": true
	}
}
```

## Debug sleep

The API still supports `sleep` on `/search` for debugging, but it is gated.

Typical safe setup for a shared environment:

- `ALLOW_DEBUG_SLEEP=true`
- `DEBUG_SLEEP_HEADER=x-debug-sleep-token`
- `DEBUG_SLEEP_SECRET=<your-secret>`

Then send a request with:

- header `x-debug-sleep-token: <your-secret>`
- payload field `sleep`, for example `1000`

If the guard is not satisfied, the request returns `403`.

## Manual scripts

The repository still contains utilities in `app/manual/` for import/debug workflows.

Current improvements:

- Shared bootstrap for `.env.local` loading.
- Default index and URL now reuse runtime config.
- Debug scripts no longer fall back to `admin/admin` credentials.
- Logged URLs mask embedded credentials.

## CI

GitHub Actions is configured to run:

- `yarn lint`
- `yarn test`

on pushes and pull requests.