import { Filter } from 'src/plugins/data/public';

export function actionFilter(): Filter {
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

export function actionTreeFilter(actionTraceId: string): Filter {
  return {
    query: {
      match_phrase: {
        traceId: actionTraceId
      }
    },
    meta: {
      negate: false,
      alias: null,
      disabled: false
    },
  };
}
