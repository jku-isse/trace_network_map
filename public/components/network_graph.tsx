import React, {useEffect, useRef } from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import { EuiTitle } from '@elastic/eui';
import { Result } from './filter_form';
import Cytoscape from 'cytoscape';
import Dagre from 'cytoscape-dagre';
import CytoscapeComponent from 'react-cytoscapejs';

Cytoscape.use(Dagre);

interface Node {
  data: {
    id: string;
    label: string;
  };
}
interface Edge {
  data: {
    source: string;
    target: string;
    label: string;
  };
}
interface NetworkGraphProps {
  results: Result[];
}

export const NetworkGraph = ({ results }: NetworkGraphProps) => {
  const layoutOptions = { name: 'dagre' };
  let cyRef = useRef(null);

  useEffect(() => {
    if (cyRef) {
      const layout = cyRef.layout(layoutOptions);
      layout.run();
    }
  }, [results]);

  const nodes: Node[] = [];
  results.forEach(result => {
    const source = result._source;
    const label = source.remoteEndpoint ? source.remoteEndpoint.serviceName : source.localEndpoint.serviceName + ' ' + source.name;
    nodes.push({ data: { id: source.id, label }});
  });

  const edges: Edge[] = [];
  results.forEach(result => {
    results.forEach(parentCandidate => {
      if (result._source.parentId === parentCandidate._source.id) {
        edges.push({ data: { source: parentCandidate._source.id, target: result._source.id, label: 'parent' } });
      }
    });
  });

  const elements: (Node|Edge)[] = nodes.concat(edges); // TODO type quirks

  return (
    <>
      <EuiTitle>
        <h2>
          <FormattedMessage
            id="traceNetworkMap.graphHeader"
            defaultMessage="Network graph"
          />
        </h2>
      </EuiTitle>
      <CytoscapeComponent
        elements={elements}
        layout={layoutOptions}
        cy={cy => { cyRef = cy; }}
        style={{ width: '800px', height: '600px', border: '1px solid black'} } />
    </>
  );
};
