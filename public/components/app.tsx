import React, { useState } from 'react';
import { FormattedMessage, I18nProvider } from '@kbn/i18n/react';
import { BrowserRouter as Router } from 'react-router-dom';

import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';

import { CoreStart } from 'kibana/public';
import { NavigationPublicPluginStart } from 'src/plugins/navigation/public';

import { DataPublicPluginStart } from 'src/plugins/data/public';

import { PLUGIN_ID, PLUGIN_NAME } from '../../common';

import { FilterForm, Result } from './filter_form';
import { NetworkGraph } from './network_graph';

interface TraceNetworkMapAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
}

export const TraceNetworkMapApp = ({
  basename,
  notifications,
  navigation,
  data
}: TraceNetworkMapAppDeps) => {
  const [results, setResults] = useState<Result[]>();
  const [page, setPage] = useState<string|null>();

  const onResultsLoaded = async (page: string, results: Result[]) => {
    setPage(page);
    setResults(results);
  };

  const params = new URLSearchParams(window.location.search);
  const enableTimeFilter = params.get('enableTimeFilter') !== 'false';

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
          <EuiPage restrictWidth="1600px">
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
                <EuiPageContentBody>
                  <FilterForm
                    data={data}
                    onResultsLoaded={onResultsLoaded}
                    enableTimeFilter={enableTimeFilter}
                    notifications={notifications} />
                  <EuiSpacer size="m" />
                  { results && page && <NetworkGraph results={results} page={page} /> }
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </>
      </I18nProvider>
    </Router>
  );
};
