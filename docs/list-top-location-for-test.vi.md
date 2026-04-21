# Tìm Các Khu Vực Có Nhiều Nhà Hàng Nhất (Phục Vụ Kiểm Thử)

> 🌐 Language / Ngôn ngữ: [English](list-top-location-for-test.md) | **Tiếng Việt**

## Tổng Quan

Khi kiểm thử các endpoint tìm kiếm theo địa lý (tìm theo hình tròn hoặc hình chữ nhật), bạn cần những tọa độ thực tế có đảm bảo trả về kết quả. Tài liệu này hướng dẫn cách dùng Kibana Dev Tools để xác định **10 khu vực địa lý** có mật độ nhà hàng cao nhất trong tập dữ liệu.

Hữu ích trong các trường hợp:
- Nhanh chóng chọn cặp `lat`/`lon` làm tâm cho tìm kiếm hình tròn.
- Xác nhận API trả về số lượng kết quả hợp lý mà không cần đoán mò tọa độ.
- Tái hiện các kịch bản kiểm thử nhất quán trên nhiều môi trường khác nhau.

---

## Cách Hoạt Động

Câu truy vấn sử dụng hai aggregation của Elasticsearch:

| Aggregation | Mục đích |
|---|---|
| `geohash_grid` | Chia bản đồ thế giới thành lưới ô vuông; gom các document vào từng ô theo geohash. `precision: 5` cho mỗi ô kích thước khoảng 4,9 km × 4,9 km. Kết quả được sắp xếp theo `doc_count` (nhiều nhà hàng nhất lên đầu). |
| `geo_centroid` (sub-aggregation) | Tính tọa độ trung tâm địa lý của tất cả nhà hàng trong mỗi ô — đây chính là tọa độ sẵn sàng dùng để kiểm thử. |

Đặt `"size": 0` ở cấp ngoài cùng nghĩa là không trả về document nào, chỉ trả về kết quả aggregation, giúp response nhỏ gọn.

---

## Các Bước Thực Hiện

1. Mở **Kibana → Dev Tools** (hoặc bất kỳ console Dev Tools nào của OpenSearch Dashboards).
2. Dán câu truy vấn bên dưới và nhấn **Run** (▶).
3. Đọc mảng `aggregations.large_grid.buckets` trong kết quả trả về.
4. Sao chép giá trị `center_point.location.lat` và `center_point.location.lon` từ bất kỳ bucket nào.
5. Sử dụng các tọa độ đó làm tham số `location` trong request tìm kiếm hình tròn.

---

## Câu Truy Vấn

```json
GET /restaurants/_search
{
  "size": 0,
  "query": {
    "match_all": {}
  },
  "aggs": {
    "large_grid": {
      "geohash_grid": {
        "field": "location",
        "precision": 5,
        "size": 10
      },
      "aggs": {
        "center_point": {
          "geo_centroid": {
            "field": "location"
          }
        }
      }
    }
  }
}
```

### Các Tham Số Truy Vấn

| Tham số | Giá trị | Mô tả |
|---|---|---|
| `field` | `"location"` | Trường geo-point trong index `restaurants`. |
| `precision` | `5` | Mức độ chính xác của geohash. Level 5 ≈ 4,9 km × 4,9 km mỗi ô. Tăng lên `6` (1,2 km × 0,6 km) để chi tiết hơn. |
| `size` (aggs) | `10` | Số bucket hàng đầu cần trả về. Tăng giá trị để lấy thêm địa điểm ứng viên. |

---

## Kết Quả Mẫu

```json
{
  "took": 1,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 2089,
      "relation": "eq"
    },
    "max_score": null,
    "hits": []
  },
  "aggregations": {
    "large_grid": {
      "buckets": [
        {
          "key": "r1r0f",
          "doc_count": 227,
          "center_point": {
            "location": {
              "lat": -37.81610180227915,
              "lon": 144.9616378878904
            },
            "count": 227
          }
        },
        {
          "key": "r3gx2",
          "doc_count": 138,
          "center_point": {
            "location": {
              "lat": -33.86736619033162,
              "lon": 151.20428711621335
            },
            "count": 138
          }
        },
        {
          "key": "r1r0g",
          "doc_count": 96,
          "center_point": {
            "location": {
              "lat": -37.81191290108836,
              "lon": 144.9908443383174
            },
            "count": 96
          }
        },
        {
          "key": "r1r0e",
          "doc_count": 93,
          "center_point": {
            "location": {
              "lat": -37.85249049159428,
              "lon": 144.99338839143033
            },
            "count": 93
          }
        },
        {
          "key": "r3gx0",
          "doc_count": 58,
          "center_point": {
            "location": {
              "lat": -33.89462289785774,
              "lon": 151.19509453804972
            },
            "count": 58
          }
        },
        {
          "key": "r7hgd",
          "doc_count": 53,
          "center_point": {
            "location": {
              "lat": -27.475895955543614,
              "lon": 153.02839119127898
            },
            "count": 53
          }
        },
        {
          "key": "r7hgf",
          "doc_count": 49,
          "center_point": {
            "location": {
              "lat": -27.454404826656138,
              "lon": 153.03771918316428
            },
            "count": 49
          }
        },
        {
          "key": "r7j0e",
          "doc_count": 38,
          "center_point": {
            "location": {
              "lat": -28.0152605955587,
              "lon": 153.42902799529074
            },
            "count": 38
          }
        },
        {
          "key": "r1r15",
          "doc_count": 33,
          "center_point": {
            "location": {
              "lat": -37.773700944063336,
              "lon": 144.99372796748173
            },
            "count": 33
          }
        },
        {
          "key": "r3dp3",
          "doc_count": 29,
          "center_point": {
            "location": {
              "lat": -35.27715396312676,
              "lon": 149.1304916140206
            },
            "count": 29
          }
        }
      ]
    }
  }
}
```

---

## Top 10 Địa Điểm Kiểm Thử (Tra Cứu Nhanh)

Trích xuất từ kết quả mẫu ở trên. Tổng số document trong index: **2.089**.

| # | Geohash | Vĩ độ | Kinh độ | Số nhà hàng | Khu vực / Suburb | Địa chỉ tham chiếu |
|---|---|---|---|---|---|---|
| 1 | `r1r0f` | -37.81610 | 144.96164 | 227 | Melbourne CBD, VIC 3000 | 376–390 Collins St, Melbourne VIC 3000 |
| 2 | `r3gx2` | -33.86737 | 151.20429 | 138 | Sydney CBD, NSW 2000 | 309 Kent St, Sydney NSW 2000 |
| 3 | `r1r0g` | -37.81191 | 144.99084 | 96 | East Melbourne, VIC 3002 | 1227 Hoddle St, East Melbourne VIC 3002 |
| 4 | `r1r0e` | -37.85249 | 144.99339 | 93 | Windsor, VIC 3181 | 166 Chapel St, Windsor VIC 3181 |
| 5 | `r3gx0` | -33.89462 | 151.19509 | 58 | Eveleigh, NSW 2015 | 2 Locomotive St, Eveleigh NSW 2015 |
| 6 | `r7hgd` | -27.47590 | 153.02839 | 53 | Brisbane City, QLD 4000 | QUT A Block, Brisbane City QLD 4000 |
| 7 | `r7hgf` | -27.45440 | 153.03772 | 49 | Fortitude Valley, QLD 4006 | 14A Church St, Fortitude Valley QLD 4006 |
| 8 | `r7j0e` | -28.01526 | 153.42903 | 38 | Surfers Paradise, QLD 4217 | 2859 Gold Coast Hwy, Surfers Paradise QLD 4217 |
| 9 | `r1r15` | -37.77370 | 144.99373 | 33 | Northcote, VIC 3070 | 89 Westbourne Grove, Northcote VIC 3070 |
| 10 | `r3dp3` | -35.27715 | 149.13049 | 29 | Canberra, ACT 2601 | 68 Northbourne Ave, Canberra ACT 2601 |

---

## Cách Sử Dụng Các Tọa Độ Này Trong Kiểm Thử API

### Tìm kiếm hình tròn (geo_distance)

Dùng `lat`/`lon` từ bất kỳ dòng nào trong bảng trên làm tâm điểm. Điều chỉnh `distance` để kiểm soát số lượng kết quả mong đợi.

```bash
# Ví dụ: tìm kiếm gần Melbourne CBD (dòng #1), bán kính 2 km
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "type": "circle",
    "location": { "lat": -37.81610, "lon": 144.96164 },
    "distance": "2km"
  }'
```

### Tìm kiếm hình chữ nhật (geo_bounding_box)

Xác định bounding box bằng cách dịch chuyển tâm điểm một khoảng nhỏ (ví dụ: ±0,05° ≈ 5 km).

```bash
# Ví dụ: bounding box quanh Sydney CBD (dòng #2)
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rectangle",
    "top_left":     { "lat": -33.817, "lon": 151.154 },
    "bottom_right": { "lat": -33.917, "lon": 151.254 }
  }'
```

---

## Lưu Ý

- **Tăng `precision`** (ví dụ: `6` hoặc `7`) để thu hẹp xuống cụm đường phố. Hữu ích khi kiểm thử tìm kiếm bán kính nhỏ (< 500 m).
- **Tăng `size`** (ví dụ: `20` hoặc `50`) trong aggregation để lấy thêm khu vực ứng viên cho phạm vi kiểm thử rộng hơn.
- **Kết hợp với bộ lọc `query`** (ví dụ: `term`, `match`) để tìm các địa điểm hàng đầu theo loại ẩm thực hoặc mức đánh giá cụ thể.
- Giá trị `doc_count` trong mỗi bucket là tổng số nhà hàng trong ô geohash đó — dùng nó để ước tính số kết quả mong đợi trước khi viết assertion.
