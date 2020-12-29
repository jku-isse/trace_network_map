import React, { useState } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { DataPublicPluginStart, IndexPattern, ISearchSource } from '../../../../src/plugins/data/public';
import {
  EuiSelect,
  EuiText,
  EuiSelectOption,
  EuiFormRow,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import {actionFilter, actionTreeFilter} from "../filters";
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
}

export const FilterForm = ({ data, onResultsLoaded }: FilterFormProps) => {
  const [indexPatternOptions, setIndexPatternOptions] = useState<EuiSelectOption[]>([]);
  const [actionOptions, setActionOptions] = useState<EuiSelectOption[]>([]);
  const [indexPattern, setIndexPattern] = useState<IndexPattern>();
  const [searchSource, setSearchSource] = useState<ISearchSource>();

  async function loadedSearchSource(): Promise<ISearchSource> {
    if (searchSource) {
      return searchSource;
    } else {
      const source = await data.search.searchSource.create();
      setSearchSource(source);
      return source;
    }
  }

  useAsyncEffect(async () => {
    const ids = await data.indexPatterns.getIdsWithTitle();
    const options = ids.reverse().map(entry => ({ value: entry.id, text: entry.title }));
    setIndexPatternOptions(options);
  }, []);

  const onIndexPatternChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const indexPattern = await data.indexPatterns.get(event.target.value);
    setIndexPattern(indexPattern);

    const search = await loadedSearchSource();
    const searchResponse = await search
      .setParent(undefined)
      .setField('index', indexPattern)
      .setField('size', 100)
      .setField('filter', actionFilter())
      // .setField('fields', ['name', '', ...]) // TODO filter the needed fields
      .fetch();
    // see /home/noah/se-project/kibana/src/plugins/data/common/search/search_source/types.ts for a good overview of possible fields

    const actionOptions = searchResponse.hits.hits.map(hit => ({ value: hit._source.traceId, text: hit._source.name }));
    setActionOptions(actionOptions);
  };

  const onActionChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (indexPattern) {
      const actionTraceId = event.target.value;
      const search = await loadedSearchSource();
      const searchResponse = await search
        .setParent(undefined)
        .setField('index', indexPattern)
        .setField('size', 100)
        .setField('filter', actionTreeFilter(actionTraceId))
        // .setField('fields', ['name', '', ...]) // TODO filter the needed fields
        .fetch();

      onResultsLoaded(searchResponse.hits.hits);
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
          hasNoInitialSelection
          options={indexPatternOptions}
          onChange={onIndexPatternChange}
        />
      </EuiFormRow>

      <EuiFormRow
        label={i18n.translate('traceNetworkMap.actionLabel', {defaultMessage: 'Action'})}>
        <EuiSelect
          hasNoInitialSelection
          options={actionOptions}
          onChange={onActionChange}
        />
      </EuiFormRow>
    </>
  );
};
