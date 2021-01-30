import React, {useEffect, useRef, useState} from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import {
  EuiSpacer,
  EuiTitle
} from '@elastic/eui';
import { Result } from './filter_form';
import Cytoscape, {Core, EdgeDefinition, NodeDefinition, NodeSingular, StylesheetStyle} from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
// @ts-ignore: no need to define types because the layout is only used by cytoscape
import Dagre from 'cytoscape-dagre';
import {render} from "../graph/svg_node";
import {useWindowSize} from "../hooks/window_size";
import {NodeData, nodesFromResults} from "../node_list";
import {Zoom} from "./graph/zoom";
import { NodeDetails } from './graph/node_details';

Cytoscape.use(Dagre);

interface GraphProps {
  page: string,
  results: Result[];
}

export const Graph = ({ results, page }: GraphProps) => {
  const layoutOptions = { name: 'dagre', rankDir: 'TB' /* 'LR' */, animate: true };

  const cyRef = useRef<Core>();

  const [selectedNodeData, setSelectedNodeData] = useState<NodeData>();
  const [selectedNode, setSelectedNode] = useState<Cytoscape.NodeSingular>();
  const [childrenVisible, setChildrenVisible] = useState<boolean>();

  const windowSize = useWindowSize();

  const nodeDataElements = nodesFromResults(page, results);
  const nodeDataMap = new Map<string, NodeData>();
  nodeDataElements.forEach(node => { nodeDataMap.set(node.id, node); });

  function layout() {
    if (cyRef.current) {
      const layout = cyRef.current.layout(layoutOptions);
      layout.run();
    }
  }

  function getChildren(node: NodeSingular): Cytoscape.CollectionReturnValue {
    return node.connectedEdges().targets().filter(
      (child: Cytoscape.NodeSingular) => !child.anySame(node)
    );
  }

  function areChildrenVisible(node: NodeSingular) {
    const children = getChildren(node);
    return children.length > 0 && children[0].style('display') !== 'none';
  }

  function showChildren(node: NodeSingular) {
    const children = getChildren(node);
    children.style('display', 'element');
    layout();
    setChildrenVisible(true);
  }

  function hideSuccessors(node: NodeSingular) {
    node.successors().targets().style('display', 'none');
    layout();
    setChildrenVisible(false);
  }

  function onNodeTap(event: Cytoscape.EventObject) {
    const tappedNode = event.target;
    const nodeChildrenAreVisible = areChildrenVisible(tappedNode);
    setChildrenVisible(nodeChildrenAreVisible);

    const nodeData = nodeDataMap.get(tappedNode.id());
    if (nodeData?.data) {
      setSelectedNode(tappedNode);
      setSelectedNodeData(nodeData);
    }

    if (event.originalEvent.altKey) {
      if (nodeChildrenAreVisible) {
        hideSuccessors(tappedNode);
      } else {
        showChildren(tappedNode);
      }
    }
  }

  function onChildVisibilityChange(visible: boolean) {
    if (selectedNode) {
      if (visible) {
        showChildren(selectedNode);
      } else {
        hideSuccessors(selectedNode);
      }
    }
  }

  useEffect(() => {
    layout();
    cyRef.current?.on('tap', 'node', onNodeTap);

    return () => {
      setSelectedNode(undefined);
      setSelectedNodeData(undefined);
      cyRef.current?.removeListener('tap', 'node');
    };
  }, [page, results]);

  const nodes: NodeDefinition[] = nodeDataElements.map(element => {
    const node = render(element);
    return {
      data: { id: element.id, label: '' },
      style: {
        'background-image': node.dataImage,
        width: node.width,
        height: node.height,
        display: element.hidden ? 'none' : 'element',
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
            defaultMessage="Service map"
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
      <EuiSpacer size="s" />
      <Zoom cyRef={cyRef} />
      {selectedNode && selectedNodeData && <>
        <EuiSpacer/>
        <NodeDetails
          data={selectedNodeData}
          hasChildren={getChildren(selectedNode).length > 0}
          childrenVisible={childrenVisible}
          onChildVisibilityChange={onChildVisibilityChange} />
        </>}
    </>
  );
};
