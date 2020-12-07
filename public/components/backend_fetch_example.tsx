import React, { useState, useEffect } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { EuiText } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { CoreStart } from '../../../../src/core/public';

interface BackendFetchExampleProps {
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
}

export const BackendFetchExample = ({http, notifications}: BackendFetchExampleProps) => {
  const [timestamp, setTimestamp] = useState<string | undefined>();

  useEffect(() => {
    const fetchTimestamp = async () => {
      // Use the core http service to make a response to the server API.
      http.get('/api/trace_network_map/example').then((res) => {
        setTimestamp(res.time);
        // Use the core notifications service to display a success message.
        notifications.toasts.addSuccess(
          i18n.translate('traceNetworkMap.dataUpdated', {
            defaultMessage: 'Date loaded',
          })
        );
      });
    }
    fetchTimestamp();
  }, []);

  return (
    <EuiText>
      <p>
        {
          timestamp
            ? <FormattedMessage
              id="traceNetworkMap.timestampText"
              defaultMessage="Date: {time}"
              values={{ time: timestamp }}
            />
            : <FormattedMessage
              id="traceNetworkMap.loadingText"
              defaultMessage="Loading..."
            />
        }
      </p>
    </EuiText>
  );
};