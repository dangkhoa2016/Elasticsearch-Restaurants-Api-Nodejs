# So sánh: Elasticsearch-Restaurants-Api-Nodejs vs Elasticsearch-Restaurants-Api-Cloudflare-Worker

> 🌐 Language / Ngôn ngữ: [English](comparison-with-cloudflare-worker.md) | **Tiếng Việt**

> **Nguồn tham chiếu cho logic:**
> [`github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Nodejs`](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Nodejs)

> **Runtime đích / bản port:**
> [`github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker`](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker)

---

## Tổng quan

Dự án Cloudflare Worker là **bản port ESM** có chủ đích từ ứng dụng Node.js này. Toàn bộ business logic, tên hàm, tên biến, error codes và API contract được giữ nguyên; chỉ tầng hạ tầng được thay thế để chạy trên Cloudflare Workers runtime.

Phần lớn các comment trong mã nguồn Worker đều ghi rõ file tương ứng trong dự án này, ví dụ:

```
// Mirrors build_server() from app/index.js in the Node.js version.
// Mirrors app/routes/home.js from the Node.js version.
```

Khác biệt hạ tầng (không phải business logic):

| Thành phần | Dự án này (Node.js) | Cloudflare Worker |
|---|---|---|
| HTTP framework | Fastify | Hono |
| Module system | CommonJS (`require`) | ESM (`import/export`) |
| OpenSearch client | `@opensearch-project/opensearch` | Custom fetch-based client |
| Nguồn config | `process.env` tại module load | `env` object truyền vào `get_runtime_config(env)` |
| Logging | `debug` + Fastify/Pino logger | `console.debug` |
| Parse body form | `@fastify/formbody` + `qs.parse` | Custom `parse_form_body()` dùng `URLSearchParams` |
| Validation schema | Fastify AJV schema (`searchSchema`) | Manual `validate_search_body()` |
| Rate limiting | `@fastify/rate-limit` | Cloudflare native `RateLimiter` binding |
| Security headers | `@fastify/helmet` | `security_headers_middleware` |

---

## Ánh xạ file

| Node.js (`app/`) | Cloudflare Worker (`src/`) | Mức độ tương đồng |
|---|---|---|
| `index.js` → `build_server()` | `index.js` → `build_app()` | ~90% |
| `routes/home.js` | `routes/home.js` | ~85% |
| `routes/elasticsearch.js` (search) | `routes/search.js` | ~90% |
| `routes/elasticsearch.js` (doc) | `routes/document.js` | ~95% |
| `routes/errors.js` | `lib/errors.js` | ~95% |
| `config/runtime.js` | `config/env.js` | ~90% |
| `services/helper.js` | `services/helper.js` | ~95% |
| `services/response_formatter.js` | `services/response_formatter.js` | ~100% |
| `services/elasticsearch_client.js` | `services/opensearch.js` | Khác hẳn (custom fetch) |
| `services/logger.js` | `lib/logger.js` | Khác (Fastify plugin vs Hono middleware) |

---

## Chi tiết từng file

### `services/response_formatter.js` — Giống hoàn toàn

Cả 4 hàm giống nhau từng dòng:

| Hàm | Ghi chú |
|---|---|
| `normalize_total(total, fallback)` | Giống hoàn toàn |
| `format_search_item(hit)` | Giống hoàn toàn |
| `format_search_response(body, { index, limit, offset })` | Giống hoàn toàn |
| `format_document_response(body)` | Giống hoàn toàn |

Chỉ khác phần export: `module.exports = { ... }` → `export { ... }`.

---

### `services/helper.js` — Giống ~95%

Tất cả hàm xử lý toạ độ địa lý được copy nguyên vẹn:

| Hàm | Ghi chú |
|---|---|
| `to_coordinate_number(value)` | Giống hoàn toàn |
| `to_elasticsearch_point(point)` | Giống hoàn toàn |
| `is_location_empty(point, force_convert)` | Giống hoàn toàn |
| `is_empty_pos(pos)` | Giống hoàn toàn |
| `is_latitude(num)` | Giống hoàn toàn |
| `is_longitude(num)` | Giống hoàn toàn |
| `normalize_distance(distance, radius)` | Giống hoàn toàn |
| `param_by_circle(distance, location)` | Giống hoàn toàn |
| `param_by_rectangle(top_left, bottom_right)` | Giống hoàn toàn |
| `get_geo_search_params(body[, default_index])` | Khác nhỏ: Worker nhận thêm tham số `default_index` thay vì đọc từ config global |

---

### `config/runtime.js` vs `config/env.js` — Giống ~90%

Các hàm helper parse giống hoàn toàn:
- `parse_boolean(value, defaultValue)`
- `parse_integer(value, defaultValue)`
- `parse_csv(value)`
- `is_local_origin(origin)`

Các config key có ở cả hai:

| Key | Node.js | Cloudflare Worker |
|---|---|---|
| `elasticsearch_url` | `process.env.ELASTICSEARCH_URL` | `env.ELASTICSEARCH_URL` |
| `default_index` | `process.env.DEFAULT_INDEX \|\| 'restaurants'` | `env.DEFAULT_INDEX \|\| 'restaurants'` |
| `allowed_origins` | `parse_csv(process.env.ALLOWED_ORIGINS)` | `parse_csv(env.ALLOWED_ORIGINS)` |
| `allow_debug_sleep` | `parse_boolean(process.env.ALLOW_DEBUG_SLEEP, ...)` | `parse_boolean(env.ALLOW_DEBUG_SLEEP, ...)` |
| `debug_sleep_header` | `process.env.DEBUG_SLEEP_HEADER \|\| 'x-debug-sleep-token'` | `env.DEBUG_SLEEP_HEADER \|\| 'x-debug-sleep-token'` |
| `debug_sleep_secret` | `process.env.DEBUG_SLEEP_SECRET \|\| ''` | `env.DEBUG_SLEEP_SECRET \|\| ''` |
| `max_debug_sleep_ms` | `parse_integer(process.env.MAX_DEBUG_SLEEP_MS, 5000)` | `parse_integer(env.MAX_DEBUG_SLEEP_MS, 5000)` |
| `is_origin_allowed(origin)` | Method giống nhau | Method giống nhau |

Các key **chỉ có trong Node.js** (Cloudflare quản lý ở tầng platform):

| Key | Default | Lý do không có trong Worker |
|---|---|---|
| `host` | `0.0.0.0` | Cloudflare quản lý bind address |
| `port` | `8080` | Cloudflare quản lý port |
| `body_limit` | `1048576` (1 MB) | Cloudflare có giới hạn request size riêng |
| `request_timeout` | `30000` ms | Cloudflare có timeout riêng cho mỗi request |
| `rate_limit.max` | `100` | Cấu hình qua `wrangler.jsonc` `ratelimits` binding |
| `rate_limit.time_window` | `1 minute` | Cấu hình qua `wrangler.jsonc` `ratelimits` binding |
| `structured_logging_enabled` | `true` | Worker luôn dùng `console.*` |

---

### `POST /search` — Giống ~90%

**Giống nhau:**
- Hằng số `DEFAULT_SEARCH_LIMIT = 80`, `DEFAULT_SEARCH_OFFSET = 0`
- Hàm `parse_sleep_ms(value)` — giống từng dòng
- Logic `can_use_debug_sleep()` — cùng check `allow_debug_sleep`, `debug_sleep_secret`, `is_production_like`
- Error codes: `INVALID_SEARCH_QUERY`, `DEBUG_SLEEP_LIMIT_EXCEEDED`, `DEBUG_SLEEP_NOT_ALLOWED`
- Lời gọi `opensearch.search({ index, body: { query, size: 80 } })`
- Warning khi dùng deprecated field `radius`
- Trả về `format_search_response(result, { index, limit, offset })`

**Khác biệt:**

| Khía cạnh | Node.js | Cloudflare Worker |
|---|---|---|
| Validation | Fastify AJV schema (`searchSchema`) — tự động | Manual `validate_search_body()` — Hono không có built-in schema validation |
| Parse form body | `@fastify/formbody` + `qs.parse` | Custom `parse_form_body()` dùng `URLSearchParams` (hỗ trợ một cấp bracket notation) |
| Đọc debug sleep header | `request.headers[header]` | `c.req.header(header)` |

---

### `GET /doc/:id` — Giống ~95%

Cả hai đều:
- Nhận `id` từ URL parameter
- Nhận `index` (default: `'restaurants'`) và `_source` (default: `true`) từ query string
- Gọi `opensearch.get({ index, id, _source })`
- Trả về `format_document_response(body)`

---

### `GET /`, `GET /health`, `GET /ready` — Giống ~85%

| Route | Response giống nhau |
|---|---|
| `GET /` | `{ message: 'Welcome to Elasticsearch Restaurants Api Nodejs.' }` |
| `GET /health` | `{ status: 'ok' }` |
| `GET /ready` | `{ status: 'ready' }` hoặc lỗi `OPENSEARCH_NOT_READY` (503) |

Khác biệt: Dự án này còn serve `GET /favicon.ico` và `GET /favicon.png`. Worker bỏ qua vì không cần thiết cho một pure API.

---

### Error response shape — Giống hoàn toàn

Cả hai đều trả về:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": [...]
}
```

Node.js: `server.decorate('sendError', (reply, statusCode, code, message, details) => ...)`  
Worker: `send_error(c, statusCode, code, message, details)` trong `src/lib/errors.js`

---

### Middleware pipeline — Cùng thứ tự

| Thứ tự | Node.js | Cloudflare Worker |
|---|---|---|
| 1 | `@fastify/opensearch` (inject client) | Middleware inject `config` + `opensearch` vào context |
| 2 | `@fastify/helmet` | `security_headers_middleware` |
| 3 | `services/logger.js` Fastify plugin | `logger_middleware` |
| 4 | `@fastify/cors` | `cors_middleware` |
| 5 | `@fastify/rate-limit` | `create_rate_limit_middleware` |

---

### `services/logger.js` — Triển khai khác nhau, hành vi giống nhau

Cả hai đều log mỗi request/response với cùng các trường: `requestId`, `method`, `url`, `statusCode`, `durationMs`.

- **Node.js:** Fastify plugin dùng `addHook('onRequest')` + `addHook('onResponse')` + `process.hrtime.bigint()` để đo thời gian chính xác.
- **Worker:** Hono middleware dùng `performance.now()` và `c.req.header('x-request-id')` để sinh / forward request ID. Gắn `X-Request-Id` vào mỗi response.

---

## Kết luận

Cloudflare Worker là bản **port chính xác** của dự án Node.js này, cùng chia sẻ:
- API contract (endpoints, request/response shape, error codes)
- Business logic (geo search, document fetch, debug sleep)
- Cấu hình (tên biến env, giá trị default)
- Thứ tự middleware và security posture

Toàn bộ sự khác biệt nằm ở tầng hạ tầng để tương thích với môi trường Cloudflare Workers, không ảnh hưởng đến behaviour từ góc nhìn của API consumer.
