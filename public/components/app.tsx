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
import CytoscapeComponent from 'react-cytoscapejs';

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
  const [elements, setElements] = useState<object[]>([]);

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
    setTraces(
      searchResponse
        .hits
        .hits
        .map(
          hit => `${hit.fields.timestamp_millis[0]}: ${hit._source.name} (${hit._source.duration})`
        )
    );

    // const elements = [
    //    { data: { id: 'one', label: 'Node 1' }, position: { x: 0, y: 0 } },
    //    { data: { id: 'two', label: 'Node 2' }, position: { x: 100, y: 0 } },
    //    { data: { source: 'one', target: 'two', label: 'Edge from Node1 to Node2' } }
    // ];
    const nodes: object[] = [];
    const edges: object[] = [];
    // console.log(searchResponse.hits.hits);
    searchResponse.hits.hits.forEach(hit => {
      nodes.push({ data: { id: hit._source.id, label: hit._source.name.toUpperCase() + (hit._source.tags && hit._source.tags["http.path"] ? ' ' + hit._source.tags["http.path"] : '') }});

      if (hit._source.parentId) {
        edges.push({ data: { source: hit._source.parentId, target: hit._source.id, label: 'parent' } });
      }
    });

    setElements(nodes.concat(edges.filter(edge => nodes.find(node => edge.data.source = node.data.id))));

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

  const layout = { name: 'breadthfirst' };

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
                  <EuiText>
                    <p>
                      <FormattedMessage
                        id="traceNetworkMap.content"
                        defaultMessage="Click Load to show all the traces in the first index."
                      />
                    </p>
                    <EuiButton type="primary" size="s" onClick={onClickHandler}>
                      <FormattedMessage id="traceNetworkMap.buttonText" defaultMessage="Load traces" />
                    </EuiButton>
                  </EuiText>
                  <EuiHorizontalRule />
                  {
                    timestamp &&
                      <EuiText>
                        <p>
                          <FormattedMessage
                            id="traceNetworkMap.timestampText"
                            defaultMessage="Timestamp: {time}"
                            values={{ time: timestamp }}
                          />
                        </p>
                      </EuiText>
                  }
                  {
                    elements.length > 0 &&
                      <>
                        <EuiTitle>
                          <h2>
                            <FormattedMessage
                              id="traceNetworkMap.graphHeader"
                              defaultMessage="Network graph"
                            />
                          </h2>
                        </EuiTitle>
                        <CytoscapeComponent elements={elements} layout={layout} style={{ width: '800px', height: '600px', border: '1px solid black'} } />
                      </>
                  }
                  {
                    traces.length > 0 &&
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
                        {traces.map(trace => <p key={trace}>{trace}</p>)}
                      </EuiText>
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
