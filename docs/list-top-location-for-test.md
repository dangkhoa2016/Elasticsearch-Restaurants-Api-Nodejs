# Find Top Locations with the Most Restaurants (for Testing)

> 🌐 Language / Ngôn ngữ: **English** | [Tiếng Việt](list-top-location-for-test.vi.md)

## Overview

When testing the geo-search endpoints (circle or rectangle search), you need realistic coordinates that are guaranteed to return results. This guide shows how to use Kibana Dev Tools to identify the **top 10 geographic areas** that contain the highest concentration of restaurants in the dataset.

This is useful for:
- Quickly picking a `lat`/`lon` pair to use as the center of a circle search.
- Validating that the API returns a reasonable number of results without having to guess coordinates.
- Reproducing consistent test scenarios across environments.

---

## How It Works

The query uses two Elasticsearch aggregations:

| Aggregation | Purpose |
|---|---|
| `geohash_grid` | Divides the world map into a grid; groups documents into cells by their geohash. `precision: 5` gives cells roughly 4.9 km × 4.9 km in size. Results are sorted by `doc_count` (most restaurants first). |
| `geo_centroid` (sub-aggregation) | Computes the geographic centroid of all restaurant locations inside each cell — this becomes the ready-to-use test coordinate. |

Setting `"size": 0` at the top level means no raw documents are returned, only aggregation results, keeping the response small.

---

## Step-by-Step

1. Open **Kibana → Dev Tools** (or any OpenSearch Dashboards Dev Tools console).
2. Paste the query below and click **Run** (▶).
3. Read the `aggregations.large_grid.buckets` array in the response.
4. Copy the `center_point.location.lat` and `center_point.location.lon` values from any bucket.
5. Use those coordinates as the `location` parameter in a circle search request.

---

## Query

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

### Query Parameters

| Parameter | Value | Description |
|---|---|---|
| `field` | `"location"` | The geo-point field in the `restaurants` index. |
| `precision` | `5` | Geohash precision level. Level 5 ≈ 4.9 km × 4.9 km per cell. Increase to `6` (1.2 km × 0.6 km) for finer granularity. |
| `size` (aggs) | `10` | Number of top buckets to return. Increase to get more candidate locations. |

---

## Sample Response

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

## Top 10 Test Locations (Quick Reference)

Extracted from the sample response above. Total documents in index: **2,089**.

| # | Geohash | Latitude | Longitude | Count | Suburb / Area | Address (reference point) |
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

## How to Use These Coordinates in API Tests

### Circle search (geo_distance)

Use `lat`/`lon` from any row above as the center point. Adjust `distance` to control how many results to expect.

```bash
# Example: search near Melbourne CBD (row #1), radius 2 km
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "type": "circle",
    "location": { "lat": -37.81610, "lon": 144.96164 },
    "distance": "2km"
  }'
```

### Rectangle search (geo_bounding_box)

Derive a bounding box by offsetting the centroid by a small delta (e.g. ±0.05° ≈ 5 km).

```bash
# Example: bounding box around Sydney CBD (row #2)
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rectangle",
    "top_left":     { "lat": -33.817, "lon": 151.154 },
    "bottom_right": { "lat": -33.917, "lon": 151.254 }
  }'
```

---

## Tips

- **Increase `precision`** (e.g. `6` or `7`) to narrow down to street-level clusters. Useful when testing small radius searches (< 500 m).
- **Increase `size`** (e.g. `20` or `50`) in the aggregation to get more candidate areas for broader dataset coverage.
- **Combine with a `query` filter** (e.g. `term`, `match`) to find top locations for a specific cuisine or rating tier.
- The `doc_count` in each bucket is the total restaurants within that geohash cell — use it to estimate an expected result count before writing assertions.
