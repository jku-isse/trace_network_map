import React, { useState } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { DataPublicPluginStart, Filter, IndexPattern, ISearchSource } from 'src/plugins/data/public';
import {
  EuiSelect,
  EuiText,
  EuiSelectOption,
  EuiFormRow,
  EuiSpacer,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import {rootTraceFilter, traceIdFilter} from "../search/filters";
import useAsyncEffect from "use-async-effect";
import {CoreStart, Toast} from "kibana/public";

interface FilterFormProps {
  data: DataPublicPluginStart;
  onResultsLoaded: CallableFunction;
  enableTimeFilter?: boolean;
  notifications: CoreStart['notifications'];
}

let toasts: Array<Toast> = [];

export const FilterForm = ({ data, onResultsLoaded, notifications, enableTimeFilter = true }: FilterFormProps) => {
  const [indexPatternOptions, setIndexPatternOptions] = useState<EuiSelectOption[]>([]);
  const [pageOptions, setPageOptions] = useState<EuiSelectOption[]>([]);
  const [indexPattern, setIndexPattern] = useState<IndexPattern>();
  const [searchSource, setSearchSource] = useState<ISearchSource>();

  let indexPatternId: string; // can't be state because it wouldn't receive the updates correctly

  function eatToasts() {
    toasts.forEach(toast => { notifications.toasts.remove(toast); });
    toasts = [];
  }

  async function loadedSearchSource(): Promise<ISearchSource> {
    if (searchSource) {
      return searchSource;
    } else {
      const source = await data.search.searchSource.create();
      setSearchSource(source);
      return source;
    }
  }

  async function useIndexPattern(patternId: string) {
    indexPatternId = patternId;

    const indexPattern = await data.indexPatterns.get(patternId);
    setIndexPattern(indexPattern);

    const filters: Filter[] = data.query.filterManager.getGlobalFilters();
    filters.push(rootTraceFilter());
    if (enableTimeFilter) {
      const timeFilter = data.query.timefilter.timefilter.createFilter(indexPattern) as Filter;
      filters.push(timeFilter);
    }

    const search = await loadedSearchSource();
    const searchResponse = await search
      .setParent(undefined)
      .setField('index', indexPattern)
      .setField('size', 100)
      .setField('filter', filters)
      .fetch();

    if (searchResponse.hits.total > 0) {
      const pageOptionMap = new Map();
      searchResponse.hits.hits.forEach(hit => {
        if (('tags' in hit._source) && ('page' in hit._source.tags)) {
          const page = hit._source.tags.page;
          if (pageOptionMap.has(page)) {
            pageOptionMap.get(page).push(hit._source.traceId);
          } else {
            pageOptionMap.set(page, [ hit._source.traceId ]);
          }
        }
      });

      const pageOptions = [...pageOptionMap.keys()]
        .sort()
        .map(key => ({ value: pageOptionMap.get(key).join(','), text: key}));

      setPageOptions(pageOptions);

      await usePage(pageOptions[0].text, pageOptions[0].value.split(','), indexPattern);
    } else {
      eatToasts();
      toasts.push(
        notifications.toasts.addDanger(
          i18n.translate(
            'traceNetworkMap.foundTraces',
            {defaultMessage: 'The selected index pattern contains no traces with \'page\' tag that match the given time filter.'}
          )
        )
      );
      onResultsLoaded(null, []);
      setPageOptions([]);
    }
  }

  async function usePage(page: string, actionTraceIds: Array<string>, indexPattern: IndexPattern) {
    const search = await loadedSearchSource();
    const searchResponse = await search
      .setParent(undefined)
      .setField('index', indexPattern)
      .setField('size', 100)
      .setField('filter', traceIdFilter(actionTraceIds))
      .fetch();

    const results = searchResponse.hits.hits;

    eatToasts();
    toasts.push(
      notifications.toasts.addSuccess(
        i18n.translate(
          'traceNetworkMap.foundTraces',
          {defaultMessage: 'Found {count} traces for page {page}.', values: {count: results.length, page}}
        )
      )
    );

    onResultsLoaded(page, results);
  }

  useAsyncEffect(async () => {
    const ids = await data.indexPatterns.getIdsWithTitle();
    const options = ids.reverse().map(entry => ({ value: entry.id, text: entry.title }));
    setIndexPatternOptions(options);

    if (options.length > 0) {
      await useIndexPattern(options[0].value);
    }

    if (enableTimeFilter) {
      // subscribe to various events to reload the actions based on the current time filter
      data.query.timefilter.timefilter.getFetch$().subscribe(onTimeFilterFetchRequest); // fired after regular timespan selection
      data.query.timefilter.timefilter.getAutoRefreshFetch$().subscribe(onTimeFilterFetchRequest); // fired after every auto refresh (calendar icon)
      data.query.timefilter.timefilter.getTimeUpdate$().subscribe(onTimeFilterFetchRequest); // fired after quick selection (calendar icon)
    }
  }, [enableTimeFilter]);

  const onTimeFilterFetchRequest = async () => {
    if (indexPatternId) {
      await useIndexPattern(indexPatternId); // also uses the selected time filter
    }
  }

  const onIndexPatternChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    await useIndexPattern(event.target.value);
  };

  const onActionChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (indexPattern) {
      await usePage(
        event.target.options[event.target.selectedIndex].innerHTML,
        event.target.value.split(','),
        indexPattern
      );
    } else {
      console.error("No indexPattern");
    }
  };

  return (
    <>
      <EuiText>
        <p>
          <FormattedMessage
            id="traceNetworkMap.content"
            defaultMessage="Select an index pattern which contains page-traces and load the service map for a specific page!"
          />
        </p>
      </EuiText>

      <EuiSpacer size="m" />

      <EuiFormRow
        label={i18n.translate('traceNetworkMap.indexPatternLabel', {defaultMessage: 'Index pattern'})}>
        <EuiSelect
          options={indexPatternOptions}
          onChange={onIndexPatternChange}
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      {
        pageOptions.length > 0 && (
          <EuiFormRow
            label={i18n.translate('traceNetworkMap.pageLabel', {defaultMessage: 'Page'})}>
            <EuiSelect
              options={pageOptions}
              onChange={onActionChange}
            />
          </EuiFormRow>
        )
      }
    </>
  );
};
