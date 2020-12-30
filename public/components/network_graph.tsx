import React, {useEffect, useRef, useState} from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import {EuiText, EuiTitle } from '@elastic/eui';
import { Result } from './filter_form';
import Cytoscape, {Core, EdgeDefinition, NodeDefinition, StylesheetStyle} from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
// @ts-ignore no need to define types because the layout is only used by cytoscape
import Dagre from 'cytoscape-dagre';
import {render} from "../graph/svg_node";

Cytoscape.use(Dagre);

interface NetworkGraphProps {
  results: Result[];
}

export const NetworkGraph = ({ results }: NetworkGraphProps) => {
  const layoutOptions = { name: 'dagre' };
  const cyRef = useRef<Core>();

  const nodeData = new Map();
  const [selectedNodeData, setSelectedNodeData] = useState<string>();

  useEffect(() => {
    if (cyRef.current) {
      const layout = cyRef.current.layout(layoutOptions);
      layout.run();

      cyRef.current.on('tap', 'node', (event) => {
        setSelectedNodeData(nodeData.get(event.target.id()));
      });
    }

    return () => {
      setSelectedNodeData('');
      if (cyRef.current) {
        cyRef.current.removeListener('tap', 'node');
      }
    };
  }, [results]);

  const nodes: NodeDefinition[] = [];
  results.forEach(result => {
    const source = result._source;
    const serviceName = source.remoteEndpoint ? source.remoteEndpoint.serviceName : source.localEndpoint.serviceName;
    const node = render(serviceName, source.name);
    nodes.push({
      data: { id: source.id, label: '' },
      style: {
        'background-image': node.dataImage,
        width: node.width,
        height: node.height,
      }
    });

    nodeData.set(source.id, JSON.stringify(source, undefined, 4));
  });

  const edges: EdgeDefinition[] = [];
  results.forEach(result => {
    results.forEach(parentCandidate => {
      if (result._source.parentId === parentCandidate._source.id) {
        edges.push({ data: {source: parentCandidate._source.id, target: result._source.id}});
      }
    });
  });

  const styles: StylesheetStyle[] = [
    {
      selector: 'node',
      style: {
        shape: 'round-rectangle',
        'background-color': '#33362F',
      }
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#425368',
      }
    }
  ];

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
        elements={[...nodes, ...edges]}
        layout={layoutOptions}
        cy={(cy: Core) => { cyRef.current = cy; }}
        style={{ width: '800px', height: '600px', border: '1px solid black' }}
        stylesheet={styles}
      />
      <EuiTitle>
        <h2>
          <FormattedMessage
            id="traceNetworkMap.selectedNodeDataHeader"
            defaultMessage="Selected node data"
          />
        </h2>
      </EuiTitle>
      <EuiText>
        <pre>{selectedNodeData}</pre>
      </EuiText>
    </>
  );
};
