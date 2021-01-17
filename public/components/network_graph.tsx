import React, {useEffect, useRef, useState} from 'react';
import { FormattedMessage } from '@kbn/i18n/react';
import {EuiButtonGroup, EuiFormRow, EuiLink, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { Result } from './filter_form';
import Cytoscape, {Core, EdgeDefinition, NodeDefinition, StylesheetStyle} from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
// @ts-ignore: no need to define types because the layout is only used by cytoscape
import Dagre from 'cytoscape-dagre';
import {render} from "../graph/svg_node";
import {useWindowSize} from "../hooks/window_size";
import {NodeData, nodesFromResults} from "../node_list";
import { i18n } from '@kbn/i18n';

Cytoscape.use(Dagre);

interface NetworkGraphProps {
  page: string,
  results: Result[];
}

export const NetworkGraph = ({ results, page }: NetworkGraphProps) => {
  const layoutOptions = { name: 'dagre', rankDir: 'TB' /* 'LR' */, animate: true };

  const cyRef = useRef<Core>();

  const [selectedNodeData, setSelectedNodeData] = useState<NodeData|null>();
  const [selectedNode, setSelectedNode] = useState<Cytoscape.NodeSingular|null>();
  const [childrenVisibilityOption, setChildrenVisibilityOption] = useState<string|null>();

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

  function getChildren(node: Cytoscape.NodeSingular): Cytoscape.CollectionReturnValue {
    return node.connectedEdges().targets().filter(
      (child: Cytoscape.NodeSingular) => !child.anySame(node)
    );
  }

  function childrenVisible(node: Cytoscape.NodeSingular) {
    const children = getChildren(node);
    return children.length > 0 && children[0].style('display') === 'none';
  }

  function showChildren(node: Cytoscape.NodeSingular) {
    const children = getChildren(node);
    children.style('display', 'element');
    layout();
  }

  function hideSuccessors(node: Cytoscape.NodeSingular) {
    node.successors().targets().style('display', 'none');
    layout();
  }

  function getZipkinLink(id: string) {
    return 'http://127.0.0.1:9411/zipkin/traces/' + id;
  }

  function onNodeTap(event: Cytoscape.EventObject) {
    const tappedNode = event.target;

    const nodeData = nodeDataMap.get(tappedNode.id());
    if (nodeData?.data) {
      setSelectedNode(tappedNode);
      setSelectedNodeData(nodeData);
      setChildrenVisibilityOption(childrenVisible(tappedNode) ? 'childrenHidden' : 'childrenVisible');
    }

    if (event.originalEvent.altKey) {
      if (childrenVisible(tappedNode)) {
        showChildren(tappedNode);
        setChildrenVisibilityOption('childrenVisible');
      } else {
        hideSuccessors(tappedNode);
        setChildrenVisibilityOption('childrenHidden');
      }
    }
  }

  function onChildVisibilityChange(optionId: string) {
    if (selectedNode) {
      if (optionId === 'childrenVisible') {
        showChildren(selectedNode);
      } else {
        hideSuccessors(selectedNode);
      }
      setChildrenVisibilityOption(optionId);
    }
  }

  useEffect(() => {
    layout();
    cyRef.current?.on('tap', 'node', onNodeTap);

    return () => {
      setSelectedNode(null);
      setSelectedNodeData(null);
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

  const toggleButtons = [
    {
      id: `childrenVisible`,
      label: i18n.translate('traceNetworkMap.visible', {defaultMessage: 'visible'}),
    },
    {
      id: `childrenHidden`,
      label: i18n.translate('traceNetworkMap.visible', {defaultMessage: 'hidden'}),
    },
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
      {
        selectedNode && selectedNodeData && (
          <>
            <EuiSpacer />
            <EuiTitle>
              <h2>
                <FormattedMessage
                  id="traceNetworkMap.selectedNodeDataHeader"
                  defaultMessage="Selected node"
                />
              </h2>
            </EuiTitle>
            <EuiSpacer size="m" />
            {
              getChildren(selectedNode).length > 0 && (
                <EuiFormRow
                  label={i18n.translate('traceNetworkMap.children', {defaultMessage: 'Children'})}>
                  <EuiButtonGroup
                    options={toggleButtons}
                    idSelected={childrenVisibilityOption || 'childrenVisible'}
                    onChange={(id) => onChildVisibilityChange(id)}
                  />
                </EuiFormRow>
              )
            }
            <EuiSpacer size="m" />
              {
                selectedNodeData.data.client && (
                  <>
                    <p>
                      <EuiLink href={getZipkinLink(selectedNodeData.data.client.id)} external>
                      <FormattedMessage id="traceNetworkMap.traceServerTimeline" defaultMessage="Zipkin timeline" />
                      </EuiLink>
                    </p>
                    <EuiSpacer size="m" />
                </>
              )
            }
            <p>
              <FormattedMessage
                id="traceNetworkMap.traceData"
                defaultMessage="Trace data"
              />
            </p>
            <EuiSpacer size="s" />
            <EuiText>
              <pre>{JSON.stringify(selectedNodeData.data, undefined, 4)}</pre>
            </EuiText>
          </>
        )
      }
    </>
  );
};
