import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { DataPublicPluginStart } from '../../../../src/plugins/data/public';
import {
  EuiButton,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSelectOption,
} from '@elastic/eui';

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
  const [indexId, setIndexId] = useState<string>('');

  useEffect(() => {
    const fetchOptions = async () => {
      const ids = await data.indexPatterns.getIdsWithTitle();
      const options = ids.reverse().map(entry => ({ value: entry.id, text: entry.title }));
      setIndexPatternOptions(options);
      setIndexId(options[0].value);
    }
    fetchOptions();
  }, []);

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setIndexId(event.target.value);
  };

  const onButtonClick = async () => {
    const indexPattern = await data.indexPatterns.get(indexId);
    const searchSource = await data.search.searchSource.create();
    const searchResponse = await searchSource
      .setParent(undefined)
      .setField('index', indexPattern)
      .setField('size', 100)
      // .setField('filter', filters)
      .fetch();

    console.log(searchResponse);

    onResultsLoaded(searchResponse.hits.hits);
  };

  return (
    <>
      <EuiText>
        <p>
          <FormattedMessage
            id="traceNetworkMap.content"
            defaultMessage="Select an index pattern and load the traces!"
          />
        </p>
      </EuiText>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiSelect
            options={indexPatternOptions}
            onChange={onChange}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiButton type="primary" size="s" onClick={onButtonClick}>
            <FormattedMessage id="traceNetworkMap.buttonText" defaultMessage="Load traces" />
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};