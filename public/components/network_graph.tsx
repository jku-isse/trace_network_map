import React, {useEffect, useRef, useState} from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import {EuiText, EuiTitle } from '@elastic/eui';
import { Result } from './filter_form';
import Cytoscape, {Core, EdgeDefinition, NodeDefinition, StylesheetStyle} from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
// @ts-ignore no need to define types because the layout is only used by cytoscape
import Dagre from 'cytoscape-dagre';
import {render} from "../graph/svg_node";
import {useWindowSize} from "../hooks/window_size";
import {getServiceNodeId, NodeData, nodesFromResults} from "../node_list";

Cytoscape.use(Dagre);

interface NetworkGraphProps {
  page: string,
  results: Result[];
}

export const NetworkGraph = ({ results, page }: NetworkGraphProps) => {
  const layoutOptions = { name: 'dagre' };

  const cyRef = useRef<Core>();

  const [selectedNodeData, setSelectedNodeData] = useState<string>();

  const windowSize = useWindowSize();

  const nodeDataElements = nodesFromResults(page, results);
  const nodeDataMap = new Map<string, NodeData>();
  nodeDataElements.forEach(node => {
    nodeDataMap.set(node.id, node);
    node.hiddenChildren?.forEach(child => { nodeDataMap.set(child.id, child); });
  });

  function onNodeTap(event: Cytoscape.EventObject) {
    const nodeData = nodeDataMap.get(event.target.id());
    if (nodeData) {
      if (nodeData.data) {
        setSelectedNodeData(JSON.stringify(nodeData.data, undefined, 4));
      }
      if (nodeData.hiddenChildren) {
        if (nodeData.expanded) {
          nodeData.hiddenChildren.forEach(child => {
            if (cyRef.current) {
              cyRef.current.remove(cyRef.current?.getElementById(child.id));
            }
          });
          nodeData.expanded = false;
        } else {
          nodeData.hiddenChildren.forEach(child => {
            const node = render(child.serviceName, child.title);
            if (cyRef.current) {
              cyRef.current.add({
                data: {id: child.id, label: ''},
                style: {
                  'background-image': node.dataImage,
                  width: node.width,
                  height: node.height,
                }
              })
              cyRef.current.add({data: {source: getServiceNodeId(nodeData), target: child.id}});
            }
          });
          nodeData.expanded = true;
        }
        if (cyRef.current) {
          const layout = cyRef.current.layout(layoutOptions);
          layout.run();
        }
      }
    }
  }

  useEffect(() => {
    if (cyRef.current) {
      const layout = cyRef.current.layout(layoutOptions);
      layout.run();

      cyRef.current.on('tap', 'node', onNodeTap);
    }

    return () => {
      setSelectedNodeData('');
      cyRef.current?.removeListener('tap', 'node');
    };
  }, [page, results]);

  const nodes: NodeDefinition[] = nodeDataElements.map(element => {
    const node = render(element.serviceName, element.title);
    return {
      data: { id: element.id, label: '' },
      style: {
        'background-image': node.dataImage,
        width: node.width,
        height: node.height,
      }
    };
  });

  const edges: EdgeDefinition[] = [];
  nodeDataElements.filter(element => 'parentId' in element).forEach(element => {
    nodeDataElements.forEach(parentCandidate => {
      if (element.parentId === parentCandidate.id) {
        edges.push({ data: {source: parentCandidate.id, target: element.id}});
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
        style={{
          width: Math.min(windowSize.width - 100, 1500) + 'px',
          height: '600px',
          border: '1px solid black'
        }}
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
