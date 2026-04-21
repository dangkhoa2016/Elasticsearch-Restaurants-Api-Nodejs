# Elasticsearch Restaurants API (Node.js + Fastify + OpenSearch)

> 🌐 Language / Ngôn ngữ: [English](readme.md) | **Tiếng Việt**

## Giới thiệu

API tìm kiếm nhà hàng theo vị trí địa lý, xây dựng bằng [Fastify](https://fastify.dev/) và backend tương thích OpenSearch/Elasticsearch.

API này đóng vai trò là **backend** cho [Elasticsearch-Restaurants-Map-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Map-UI) — UI dạng bản đồ hiển thị vị trí nhà hàng, sử dụng các endpoint geo-search của dự án này.

Bản port sang Cloudflare Worker của dự án này có tại [Elasticsearch-Restaurants-Api-Cloudflare-Worker](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker).

Xem phân tích chi tiết sự tương đồng giữa hai codebase: [English](docs/comparison-with-cloudflare-worker.md) | [Tiếng Việt](docs/comparison-with-cloudflare-worker.vi.md)

Danh sách các khu vực có nhiều nhà hàng nhất (hữu ích để kiểm thử geo-search): [English](docs/list-top-location-for-test.md) | [Tiếng Việt](docs/list-top-location-for-test.vi.md)

**Tính năng:**

- Tìm kiếm theo vị trí dạng hình tròn (tâm + bán kính) hoặc hình chữ nhật (bounding box).
- Lấy document theo ID.
- Cấu hình runtime hoàn toàn từ biến môi trường — không có giá trị hardcode.
- Structured JSON logging (Pino via Fastify) cho production; `debug` namespaces cho development.
- Rate limiting theo IP via `@fastify/rate-limit`.
- Security headers via `@fastify/helmet`.
- CORS allowlist via `@fastify/cors`.
- Hỗ trợ debug sleep trên `/search`, được bảo vệ bởi env và header secret tuỳ chọn.
- Endpoint health (`/health`) và readiness (`/ready`).
- Response contract tương thích ngược — các field gốc của OpenSearch được giữ nguyên bên cạnh `items` và `pageInfo` đã chuẩn hoá.

## Công nghệ sử dụng

| Hạng mục | Công nghệ |
|---|---|
| Runtime | [Node.js](https://nodejs.org/) 20+ |
| Web framework | [Fastify](https://fastify.dev/) 5.x |
| OpenSearch client | [@opensearch-project/opensearch](https://github.com/opensearch-project/opensearch-js) |
| Plugin OpenSearch | [@fastify/opensearch](https://github.com/fastify/fastify-opensearch) |
| CORS | [@fastify/cors](https://github.com/fastify/fastify-cors) |
| Security headers | [@fastify/helmet](https://github.com/fastify/fastify-helmet) |
| Rate limiting | [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit) |
| Phân tích form body | [@fastify/formbody](https://github.com/fastify/fastify-formbody) |
| Structured logging | [Pino](https://getpino.io/) (tích hợp sẵn trong Fastify) |
| Debug logging | [debug](https://github.com/debug-js/debug) |
| Load biến môi trường | [dotenv](https://github.com/motdotla/dotenv) |
| Tự reload khi dev | [nodemon](https://nodemon.io/) |
| Linting | [ESLint](https://eslint.org/) 10.x |
| Testing | Node.js built-in `node:test` runner |

## Yêu cầu

- Node.js 20+
- Yarn 1.x (hoặc npm)
- Một endpoint OpenSearch hoặc Elasticsearch-compatible

## Cấu trúc thư mục

```text
Elasticsearch-Restaurants-Api-Nodejs/
  readme.md
  package.json
  .env.sample              ← template biến môi trường
  .env.local               ← giá trị local, đã có trong .gitignore
  bin/
    www                    ← entrypoint server, đọc .env.local khi dev
  app/
    index.js               ← Fastify factory build_server()
    config/
      runtime.js           ← parse + validate toàn bộ env vars
    routes/
      home.js              ← GET /, /health, /ready, /favicon.*
      elasticsearch.js     ← POST /search, GET /doc/:id
      errors.js            ← 404 handler
    services/
      elasticsearch_client.js  ← OpenSearch client singleton
      helper.js            ← geo-search query builder
      response_formatter.js    ← chuẩn hoá response search + document
      logger.js            ← Fastify plugin logging request/response
    manual/                ← script import/debug độc lập
  test/
    app.test.js            ← integration tests (5 test)
    helper.test.js         ← unit tests (3 test)
```

## Biến môi trường

Copy `.env.sample` thành `.env.local` và chỉnh sửa giá trị:

```bash
cp .env.sample .env.local
```

| Biến | Bắt buộc | Mặc định | Mô tả |
| --- | :---: | --- | --- |
| `ELASTICSEARCH_URL` | ✅ | — | Endpoint OpenSearch/Elasticsearch. Bắt buộc ở `staging`/`production`. Mặc định `http://localhost:9200` khi dev. |
| `DEFAULT_INDEX` | | `restaurants` | Index dùng khi request không chỉ định. |
| `PORT` | | `8080` | Port server lắng nghe. |
| `HOST` | | `0.0.0.0` | Host/interface server bind vào. |
| `ALLOWED_ORIGINS` | | `""` (rỗng) | Danh sách CORS allowlist phân cách bằng dấu phẩy, ví dụ `https://app.example.com`. Khi dev và để rỗng, tất cả `localhost` được phép. |
| `ALLOW_DEBUG_SLEEP` | | `true` khi dev, `false` khi production | Bật field `sleep` trên `POST /search`. Luôn giữ `false` ở production. |
| `DEBUG_SLEEP_HEADER` | | `x-debug-sleep-token` | Tên header kiểm tra khi `DEBUG_SLEEP_SECRET` được đặt. |
| `DEBUG_SLEEP_SECRET` | | `""` (rỗng) | Khi đặt, `DEBUG_SLEEP_HEADER` phải khớp giá trị này để dùng debug sleep. |
| `MAX_DEBUG_SLEEP_MS` | | `5000` | Thời gian sleep tối đa (milliseconds). |
| `REQUEST_BODY_LIMIT` | | `1048576` (1 MB) | Kích thước body request tối đa (bytes). |
| `REQUEST_TIMEOUT_MS` | | `30000` | Timeout request của Fastify (milliseconds). |
| `OPENSEARCH_REQUEST_TIMEOUT_MS` | | `30000` | Timeout request của OpenSearch client (milliseconds). |
| `RATE_LIMIT_MAX` | | `100` | Số request tối đa mỗi time window theo IP. |
| `RATE_LIMIT_WINDOW` | | `1 minute` | Time window cho rate limit. |
| `LOG_LEVEL` | | `debug` khi dev, `info` khi production | Mức log tối thiểu của Fastify/Pino. |
| `ENABLE_STRUCTURED_LOGGING` | | `true` | Bật Pino JSON logging. Đặt `false` để xem log dạng plain text khi dev local. |
| `NODE_ENV` | | `development` | Chế độ vận hành. `production` và `staging` bật strict CORS và tắt debug sleep mặc định. |

> **Lưu ý:** `.env.local` đã có trong `.gitignore` — không bao giờ commit file này. `.env.sample` mới là file được commit vào repo (không có giá trị nhạy cảm).

## Chạy local

Cài dependency:

```bash
yarn install
```

Chạy ở chế độ development (với `nodemon` tự reload và `DEBUG` namespaces):

```bash
yarn dev
```

Chạy ở chế độ production:

```bash
yarn start
```

## Scripts

| Script | Lệnh | Mô tả |
| --- | --- | --- |
| `yarn dev` | `DEBUG=elasticsearch-restaurants-api-nodejs* nodemon bin/www` | Server development với tự động reload. |
| `yarn start` | `node bin/www` | Server production. |
| `yarn lint` | `eslint .` | Chạy ESLint. |
| `yarn test` | `node --test test/*.test.js` | Chạy toàn bộ test. |
| `yarn check` | `yarn lint && yarn test` | Lint rồi test. |

## API

### `GET /`

```json
{ "message": "Welcome to Elasticsearch Restaurants Api Nodejs." }
```

### `GET /health`

Kiểm tra trạng thái process. Luôn trả `200` khi process đang chạy.

```json
{ "status": "ok" }
```

### `GET /ready`

Kiểm tra kết nối tới OpenSearch. Trả `200` khi thành công, `503` nếu ping thất bại.

```json
{ "status": "ready" }
```

### `POST /search`

Tìm kiếm nhà hàng theo vị trí. Body phải là `application/json` hoặc `application/x-www-form-urlencoded`. Field `type` là bắt buộc.

**Circle search** — tìm document trong bán kính từ một điểm:

```json
{
  "type": "circle",
  "location": "-37.852,144.993165",
  "distance": "200m"
}
```

`location` chấp nhận chuỗi `"lat,lon"`, object `{ lat, lon }`, hoặc mảng `[lat, lon]`. `radius` được chấp nhận là alias deprecated của `distance`.

**Rectangle search** — tìm document trong bounding box:

```json
{
  "type": "rectangle",
  "top_left": { "lat": -37.8, "lon": 144.9 },
  "bottom_right": { "lat": -38, "lon": 145 }
}
```

**Field tuỳ chọn:**

| Field | Mô tả |
| --- | --- |
| `index` | Ghi đè index OpenSearch mặc định. |
| `sleep` | Chỉ dùng debug — delay response thêm số milliseconds này (xem Debug sleep). |

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

Consumer cũ đọc `hits.hits`, `took`, hoặc `_shards` vẫn hoạt động bình thường. Consumer mới nên dùng `items`, `total`, và `pageInfo`.

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

Lấy document theo ID. Query string tuỳ chọn: `index` (string) và `_source` (boolean hoặc string).

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

Tất cả lỗi đều theo cùng một JSON contract:

```json
{ "error": "Thông báo lỗi", "code": "MÃ_LỖI" }
```

Các error code phổ biến:

| Code | Status | Mô tả |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Body request không vượt được schema validation. |
| `INVALID_SEARCH_QUERY` | 400 | Không thể parse tham số geo-search. |
| `DEBUG_SLEEP_LIMIT_EXCEEDED` | 400 | Giá trị `sleep` vượt quá `MAX_DEBUG_SLEEP_MS`. |
| `DEBUG_SLEEP_NOT_ALLOWED` | 403 | Debug sleep không được phép cho request này. |
| `OPENSEARCH_NOT_READY` | 503 | OpenSearch ping thất bại tại `/ready`. |
| `ROUTE_NOT_FOUND` | 404 | Không tìm thấy route khớp với path. |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi server chưa được xử lý. |

## Debug sleep

Field `sleep` trên `POST /search` delay response thêm số milliseconds tương ứng. Được thiết kế để test timeout và loading state ở phía client.

Quyền truy cập được kiểm soát:

- Khi `ALLOW_DEBUG_SLEEP=false` (mặc định ở production), field bị bỏ qua và request tiếp tục bình thường.
- Khi `ALLOW_DEBUG_SLEEP=true` và `DEBUG_SLEEP_SECRET` không được đặt, bất kỳ request nào ở môi trường non-production đều có thể dùng.
- Khi `ALLOW_DEBUG_SLEEP=true` và `DEBUG_SLEEP_SECRET` được đặt, `DEBUG_SLEEP_HEADER` phải có mặt và khớp với secret.

Cấu hình khuyên dùng cho môi trường staging chung:

```
ALLOW_DEBUG_SLEEP=true
DEBUG_SLEEP_HEADER=x-debug-sleep-token
DEBUG_SLEEP_SECRET=change-me
MAX_DEBUG_SLEEP_MS=5000
```

Gửi secret trong request header:

```bash
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -H "x-debug-sleep-token: change-me" \
  -d '{ "type": "circle", "location": "-37.852,144.993165", "distance": "200m", "sleep": 2000 }'
```

Nếu điều kiện không được thoả mãn, API trả về `403 DEBUG_SLEEP_NOT_ALLOWED`.

## Tests

Chạy toàn bộ test:

```bash
yarn test
```

Hiện có 8 test trong 2 file:

- `test/app.test.js` — integration tests dùng Fastify injection API (5 test):
  - `GET /health`, `GET /ready`, `POST /search` (validation + contract), `GET /doc/:id`
- `test/helper.test.js` — unit tests cho geo-search builder (3 test):
  - Xử lý toạ độ không hợp lệ, alias `radius`, lỗi thiếu distance

## Manual scripts

`app/manual/` chứa các script Node.js độc lập dùng để import dataset và debug. Chúng dùng chung một bootstrap module để load `.env.local` và tái sử dụng runtime config (không có credentials hardcode).

Các script có sẵn:

| Script | Mô tả |
| --- | --- |
| `bootstrap.js` | Module load `.env.local` dùng chung cho tất cả script. |
| `import.js` | Import hàng loạt dữ liệu nhà hàng vào OpenSearch. |
| `elasticsearch.js` | Ví dụ query ở mức thấp. |
| `geo_search.js` | Test trực tiếp các query geo-search với OpenSearch. |
| `debug.js` | Debug helper để kiểm tra raw response. |
| `client.js` | Cấu hình OpenSearch client độc lập. |

Chạy script trực tiếp:

```bash
node app/manual/geo_search.js
```

## CI

GitHub Actions chạy trên mỗi push và pull request vào `main`:

```
yarn lint
yarn test
```

File workflow: `.github/workflows/ci.yml`.

## Deploy

### Điều kiện tiên quyết

- Môi trường Node.js 20+ đang chạy.
- Một endpoint OpenSearch/Elasticsearch có thể truy cập được.
- Đã đặt đầy đủ biến môi trường bắt buộc (xem [Biến môi trường](#biến-môi-trường)).

### Cách 1 — Node.js trực tiếp (VPS / bare metal)

1. Clone repo và cài dependency:

   ```bash
   git clone https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Nodejs.git
   cd Elasticsearch-Restaurants-Api-Nodejs
   yarn install --frozen-lockfile
   ```

2. Đặt biến môi trường. Cách khuyên dùng là export trong shell profile hoặc dùng process manager (xem Cách 2):

   ```bash
   export NODE_ENV=production
   export ELASTICSEARCH_URL=https://user:password@your-cluster.example.com
   export ALLOWED_ORIGINS=https://your-frontend.example.com
   export PORT=8080
   ```

3. Khởi động server:

   ```bash
   yarn start
   ```

### Cách 2 — PM2 (khuyên dùng cho server chạy liên tục)

[PM2](https://pm2.keymetrics.io/) quản lý process, tự restart khi crash và xử lý log rotation.

1. Cài PM2 global:

   ```bash
   npm install -g pm2
   ```

2. Tạo file `ecosystem.config.js` trong thư mục gốc:

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

3. Khởi động app với PM2:

   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save        # lưu danh sách process qua các lần reboot
   pm2 startup     # cấu hình PM2 tự khởi động khi hệ thống boot
   ```

4. Các lệnh PM2 hữu ích:

   ```bash
   pm2 list                     # liệt kê các app đang chạy
   pm2 logs restaurants-api     # xem log real-time
   pm2 reload restaurants-api   # reload không downtime
   pm2 stop restaurants-api     # dừng app
   ```

### Cách 3 — Docker

1. Tạo file `Dockerfile` trong thư mục gốc:

   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package.json yarn.lock ./
   RUN yarn install --frozen-lockfile --production
   COPY . .
   EXPOSE 8080
   CMD ["node", "bin/www"]
   ```

2. Build và chạy:

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

### Cách 4 — PaaS (Railway, Render, Fly.io, Heroku)

Hầu hết các nền tảng PaaS tự nhận diện dự án Node.js và dùng script `start` từ `package.json`.

1. Kết nối repo với nền tảng.
2. Đặt các biến môi trường bắt buộc trong dashboard của nền tảng:
   - `NODE_ENV=production`
   - `ELASTICSEARCH_URL`
   - `ALLOWED_ORIGINS`
   - Các biến khác từ bảng ở trên.
3. Deploy — nền tảng tự chạy `yarn install` rồi `yarn start`.

### Checklist trước khi production

- [ ] `NODE_ENV` được đặt thành `production`.
- [ ] `ELASTICSEARCH_URL` trỏ tới cluster thật, không dùng localhost mặc định.
- [ ] `ALLOWED_ORIGINS` chỉ chứa domain frontend thật.
- [ ] `ALLOW_DEBUG_SLEEP` là `false` (hoặc không đặt).
- [ ] `ENABLE_STRUCTURED_LOGGING` là `true`.
- [ ] `LOG_LEVEL` là `info` hoặc `warn`.
- [ ] `RATE_LIMIT_MAX` và `RATE_LIMIT_WINDOW` đã được điều chỉnh theo lưu lượng thực tế.
- [ ] Một reverse proxy (nginx, Caddy, Cloudflare) terminate TLS trước Node.js process.

## Dự án liên quan

| Dự án | Mô tả |
| --- | --- |
| [Elasticsearch-Restaurants-Api-Cloudflare-Worker](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Api-Cloudflare-Worker) | Bản port Cloudflare Worker của API này — cùng business logic, Hono framework, ESM, custom fetch-based OpenSearch client. |
| [Elasticsearch-Restaurants-Map-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Map-UI) | UI dạng bản đồ sử dụng API này để hiển thị vị trí nhà hàng. |

## Dự án liên quan khác của tác giả (không phải port trực tiếp, nhưng dùng chung dataset và mục tiêu tương tự):
| [Elasticsearch-Restaurants-Aggregations-Api-Nodejs](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Aggregations-Api-Nodejs) | Node.js API có hỗ trợ aggregation cho cùng tập dữ liệu nhà hàng. |
| [Elasticsearch-Restaurants-Aggregations-UI](https://github.com/dangkhoa2016/Elasticsearch-Restaurants-Aggregations-UI) | UI cho aggregations API — biểu đồ và bộ lọc. |
