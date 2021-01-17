import {Kind, Result, ResultSource} from "./components/filter_form";

export interface NodeData {
  id: string;
  serviceName: string;
  hidden: boolean;
  kind?: Kind;
  parentId?: string;
  data: {
    operations?: Array<ResultSource>,
    client?: ResultSource,
    server?: ResultSource,
    trace?: ResultSource,
  };
}

const collapsedServices = ['redis', 'mysql', 's3'];

export function nodesFromResults(page: string, results: Result[]): NodeData[] {
  let nodeList: Array<NodeData> = [{
    id: page,
    serviceName: 'page',
    hidden: false,
    data: {},
  }].concat(
    results.map(result => {
      const source = result._source;
      const node: NodeData = {
        id: source.id,
        serviceName: source.remoteEndpoint ? source.remoteEndpoint.serviceName : source.localEndpoint.serviceName,
        parentId: 'parentId' in source ? source.parentId : page,
        data: { trace: source },
        hidden: false,
      };
      if (source.kind != null) {
        node.kind = source.kind;
      }
      return node;
    })
  );

  const removeNodeIds = new Map<string, boolean>();
  const serviceNodeMap = new Map<string, NodeData>();

  const clientNodeMap = new Map<string, NodeData>();
  nodeList
    .filter(node => node.kind === Kind.Client)
    .forEach(node => clientNodeMap.set(node.id, node));

  nodeList.forEach(node => {
    if (node.parentId != null && node.kind === Kind.Server) {
      const clientNode = clientNodeMap.get(node.parentId);
      if (clientNode) {
        node.parentId = clientNode.parentId;
        node.data = {
          client: clientNode.data?.trace,
          server: node.data?.trace
        };
        removeNodeIds.set(clientNode.id, true);
      }
    }
    if (node.parentId != null && collapsedServices.find(name => name === node.serviceName)) {
      const serviceNodeId = getServiceNodeId(node);
      const serviceNode = serviceNodeMap.get(serviceNodeId);
      if (serviceNode) {
        if (node.data && node.data.trace && serviceNode.data && serviceNode.data.operations) {
          serviceNode.data.operations.push(node.data.trace);
        }
      } else {
        serviceNodeMap.set(serviceNodeId, {
          id: serviceNodeId,
          serviceName: node.serviceName,
          parentId: node.parentId,
          data: {operations: node.data && node.data.trace ? [node.data.trace] : []},
          hidden: false,
        })
      }
      node.parentId = serviceNodeId;
      node.hidden = true;
    }
  });

  return nodeList.filter(node => !removeNodeIds.has(node.id)).concat([...serviceNodeMap.values()]);
}

function getServiceNodeId(node: NodeData): string {
  return [node.serviceName, node.parentId].join('-');
}
