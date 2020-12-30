import React, { useState } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { DataPublicPluginStart, Filter, IndexPattern, ISearchSource } from 'src/plugins/data/public';
import {
  EuiSelect,
  EuiText,
  EuiSelectOption,
  EuiFormRow,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import {actionFilter, actionTreeFilter} from "../search/filters";
import useAsyncEffect from "use-async-effect";

export interface Result {
  fields: {
    timestamp_millis: string[];
  }
  _source: {
    id:string;
    parentId:string;
    name:string;
    tags: { 'http.path': string|null };
    duration: string;
    localEndpoint: { serviceName: string; };
    remoteEndpoint: { serviceName: string; } | null;
  }
}

interface FilterFormProps {
  data: DataPublicPluginStart;
  onResultsLoaded: CallableFunction;
  enableTimeFilter?: boolean;
}

export const FilterForm = ({ data, onResultsLoaded, enableTimeFilter = true }: FilterFormProps) => {
  const [indexPatternOptions, setIndexPatternOptions] = useState<EuiSelectOption[]>([]);
  const [actionOptions, setActionOptions] = useState<EuiSelectOption[]>([]);
  const [indexPattern, setIndexPattern] = useState<IndexPattern>();
  const [searchSource, setSearchSource] = useState<ISearchSource>();

  let indexPatternId: string; // can't be state because it wouldn't receive the updates correctly

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
    filters.push(actionFilter());
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

    const actionOptions = searchResponse.hits.hits.map(hit => ({ value: hit._source.traceId, text: hit._source.name }));
    setActionOptions(actionOptions);

    if (actionOptions.length > 0) {
      await useAction(actionOptions[0].value, indexPattern);
    }
  }

  async function useAction(actionTraceId: string, indexPattern: IndexPattern) {
    const search = await loadedSearchSource();
    const searchResponse = await search
      .setParent(undefined)
      .setField('index', indexPattern)
      .setField('size', 100)
      .setField('filter', actionTreeFilter(actionTraceId))
      .fetch();

    onResultsLoaded(searchResponse.hits.hits);
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
      await useAction(event.target.value, indexPattern);
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
            defaultMessage="Select an index pattern and load the network graph for a specific action!"
          />
        </p>
      </EuiText>

      <EuiFormRow
        label={i18n.translate('traceNetworkMap.indexPatternLabel', {defaultMessage: 'Index pattern'})}>
        <EuiSelect
          options={indexPatternOptions}
          onChange={onIndexPatternChange}
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('traceNetworkMap.actionLabel', {defaultMessage: 'Action'})}>
        <EuiSelect
          options={actionOptions}
          onChange={onActionChange}
        />
      </EuiFormRow>
    </>
  );
};
