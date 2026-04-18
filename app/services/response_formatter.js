function normalize_total(total, fallback = 0) {
  if (typeof total === 'number')
    return total;

  if (total && typeof total.value === 'number')
    return total.value;

  return fallback;
}

function format_search_item(hit = {}) {
  return {
    id: hit._id || null,
    index: hit._index || null,
    score: hit._score ?? null,
    source: hit._source || {},
    sort: Array.isArray(hit.sort) ? hit.sort : [],
    fields: hit.fields || {}
  };
}

function format_search_response(body = {}, { index, limit, offset }) {
  const hitsSection = body.hits || {};
  const hits = Array.isArray(hitsSection.hits) ? hitsSection.hits : [];
  const total = normalize_total(hitsSection.total, hits.length);
  const returned = hits.length;

  return {
    ...body,
    index,
    total,
    returned,
    items: hits.map(format_search_item),
    pageInfo: {
      limit,
      offset,
      returned,
      total,
      hasMore: offset + returned < total
    },
    hits: body.hits || {
      total: { value: total, relation: 'eq' },
      hits
    },
    _shards: body._shards || null
  };
}

function format_document_item(body = {}) {
  return {
    id: body._id || null,
    index: body._index || null,
    source: body._source || {},
    found: body.found !== false
  };
}

function format_document_response(body = {}) {
  return {
    ...body,
    found: body.found !== false,
    item: format_document_item(body)
  };
}

module.exports = {
  format_search_item,
  format_search_response,
  format_document_item,
  format_document_response,
};
