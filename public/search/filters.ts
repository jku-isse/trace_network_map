import { Filter } from 'src/plugins/data/public';

export function rootTraceFilter(): Filter {
  return {
    query: {
      exists: {
        field: 'parentId'
      }
    },
    meta: {
      negate: true,
      alias: null,
      disabled: false
    },
  };
}

export function traceIdFilter(traceIds: Array<string>): Filter {
  return {
    query: {
      bool: {
        should: traceIds.map(traceId => ({
          match_phrase: {
            traceId: traceId
          }
        }))
      }
    },
    meta: {
      negate: false,
      alias: null,
      disabled: false
    },
  };
}
