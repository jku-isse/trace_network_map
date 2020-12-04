import React, { useState } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage, I18nProvider } from '@kbn/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiButton,
  EuiHorizontalRule,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageHeader,
  EuiTitle,
  EuiText,
} from '@elastic/eui';

import { CoreStart } from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';
import { DataPublicPluginStart } from '../../../../src/plugins/data/public';

import { PLUGIN_ID, PLUGIN_NAME } from '../../common';

interface TraceNetworkMapAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
}

export const TraceNetworkMapApp = ({
  basename,
  notifications,
  http,
  navigation,
  data
}: TraceNetworkMapAppDeps) => {
  // Use React hooks to manage state.
  const [timestamp, setTimestamp] = useState<string | undefined>();
  const [traces, setTraces] = useState<string[]>([]);

  const onClickHandler = async () => {

    // load traces
    const indexPatternId = (await data.indexPatterns.getIds())[0];
    const indexPattern = await data.indexPatterns.get(indexPatternId);
    const searchSource = await data.search.searchSource.create();
    const searchResponse = await searchSource
      .setParent(undefined)
      .setField('index', indexPattern)
      // .setField('filter', filters)
      .fetch();
    // console.log(searchResponse.hits.hits);
    setTraces(
      searchResponse
        .hits
        .hits
        .map(
          hit => `${hit.fields.timestamp_millis[0]}: ${hit._source.name} (${hit._source.duration})`
        )
    );

    // Use the core http service to make a response to the server API.
    http.get('/api/trace_network_map/example').then((res) => {
      setTimestamp(res.time);
      // Use the core notifications service to display a success message.
      notifications.toasts.addSuccess(
        i18n.translate('traceNetworkMap.dataUpdated', {
          defaultMessage: 'Data updated',
        })
      );
    });
  };

  // Render the application DOM.
  // Note that `navigation.ui.TopNavMenu` is a stateful component exported on the `navigation` plugin's start contract.
  return (
    <Router basename={basename}>
      <I18nProvider>
        <>
          <navigation.ui.TopNavMenu
            appName={PLUGIN_ID}
            showSearchBar={true}
            useDefaultBehaviors={true}
          />
          <EuiPage restrictWidth="1000px">
            <EuiPageBody>
              <EuiPageHeader>
                <EuiTitle size="l">
                  <h1>
                    <FormattedMessage
                      id="traceNetworkMap.helloWorldText"
                      defaultMessage="{name}"
                      values={{ name: PLUGIN_NAME }}
                    />
                  </h1>
                </EuiTitle>
              </EuiPageHeader>
              <EuiPageContent>
                <EuiPageContentHeader>
                  <EuiTitle>
                    <h2>
                      <FormattedMessage
                        id="traceNetworkMap.congratulationsTitle"
                        defaultMessage="Congratulations, you have successfully created a new Kibana Plugin!"
                      />
                    </h2>
                  </EuiTitle>
                </EuiPageContentHeader>
                <EuiPageContentBody>
                  <EuiText>
                    <p>
                      <FormattedMessage
                        id="traceNetworkMap.content"
                        defaultMessage="Look through the generated code and check out the plugin development documentation."
                      />
                    </p>
                    <EuiHorizontalRule />
                    <p>
                      <FormattedMessage
                        id="traceNetworkMap.timestampText"
                        defaultMessage="Last timestamp: {time}"
                        values={{ time: timestamp ? timestamp : 'Unknown' }}
                      />
                    </p>
                    <EuiButton type="primary" size="s" onClick={onClickHandler}>
                      <FormattedMessage id="traceNetworkMap.buttonText" defaultMessage="Get data" />
                    </EuiButton>
                  </EuiText>
                  <EuiText>
                    {traces.map(trace => <p key={trace}>{trace}</p>)}
                  </EuiText>
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
