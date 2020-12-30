import React, { useState } from 'react';
import { FormattedMessage, I18nProvider } from '@kbn/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiHorizontalRule,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageHeader,
  EuiTitle,
} from '@elastic/eui';

import { CoreStart } from 'kibana/public';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';

import { DataPublicPluginStart } from 'src/plugins/data/public';

import { PLUGIN_ID, PLUGIN_NAME } from '../../common';

import { FilterForm, Result } from './filter_form';
import { NetworkGraph } from './network_graph';
import { TraceList } from './trace_list';
import { BackendFetchExample } from './backend_fetch_example';

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
  const [results, setResults] = useState<Result[]>();

  const onResultsLoaded = async (results: Result[]) => {
    setResults(results);
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
                      id="traceNetworkMap.title"
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
                        id="traceNetworkMap.subtitle"
                        defaultMessage="Interactive visualization for zipkin traces"
                      />
                    </h2>
                  </EuiTitle>
                </EuiPageContentHeader>
                <EuiPageContentBody>
                  <BackendFetchExample http={http} notifications={notifications} />
                  <FilterForm data={data} onResultsLoaded={onResultsLoaded} />
                  <EuiHorizontalRule />
                  {
                    results &&
                      <>
                        <NetworkGraph results={results} />
                        <TraceList results={results} />
                      </>
                  }
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
