import React, { useState } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { EuiText } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { CoreStart } from 'kibana/public';
import useAsyncEffect from "use-async-effect";

interface BackendFetchExampleProps {
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
}

export const BackendFetchExample = ({http, notifications}: BackendFetchExampleProps) => {
  const [timestamp, setTimestamp] = useState<string | undefined>();

  useAsyncEffect(async () => {
    // Use the core http service to make a response to the server API.
    const res = await http.get('/api/trace_network_map/example');
    setTimestamp(res.time);
    // Use the core notifications service to display a success message.
    notifications.toasts.addSuccess(
      i18n.translate('traceNetworkMap.dataUpdated', {
        defaultMessage: 'Date loaded',
      })
    );
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
