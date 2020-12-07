import React from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { EuiTitle, EuiText } from '@elastic/eui';
import { Result } from './filter_form';

interface TraceListProps {
  results: Result[];
}

export const TraceList = ({ results }: TraceListProps) => {
  const formattedTraces = results.map(result =>
    result.fields.timestamp_millis[0] + ': '
    + result._source.localEndpoint.serviceName + ' '
    + (result._source.remoteEndpoint ? '->' + result._source.remoteEndpoint.serviceName + ' ' : '')
    + '"' + result._source.name + '" ('
    + result._source.duration + ')'
  );

  return (
    <>
      <EuiTitle>
        <h2>
          <FormattedMessage
            id="traceNetworkMap.listHeader"
            defaultMessage="Trace list"
          />
        </h2>
      </EuiTitle>
      <EuiText>
        {formattedTraces.map(trace => <p key={trace}>{trace}</p>)}
      </EuiText>
    </>
  );
};