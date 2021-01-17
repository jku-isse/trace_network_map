import { i18n } from '@kbn/i18n';
import {NodeData} from "../node_list";

type SvgNode = {
  dataImage: string,
  width: number,
  height: number,
}

const unknown = i18n.translate('traceNetworkMap.unknown', {defaultMessage: 'unknown'});

export function render(node: NodeData): SvgNode {
  const serviceName = getServiceName(node);
  const name = getName(node);
  const result = getResult(node);

  const width = Math.max(serviceName.length, name.length, (result ? result.length : 0)) > 20 ? 300 : 200;
  const height = result ? 70 : 60;

  const resultNodeStr = result ? `<text x="10" y="60" class="info">${result}</text>` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style>
        .info { fill: grey; font: bold 10px sans-serif; }
        .name { fill: white; font: normal 16px sans-serif; }
      </style>

      <text x="10" y="20" class="info">${serviceName}</text>
      <text x="10" y="40" class="name">${name}</text>
      ${resultNodeStr}
    </svg>`;

  return {
    dataImage: 'data:image/svg+xml;base64,' + btoa(svg),
    width,
    height,
  };
}

function getServiceName(node: NodeData): string {
  if (node.data.trace?.remoteEndpoint?.serviceName === 's3') {
    return node.data.trace.name;
  } else if (
    node.data.trace?.remoteEndpoint?.serviceName === 'mysql'
    || node.data.trace?.remoteEndpoint?.serviceName === 'redis'
  ) {
    return node.data.trace.name;
  } else {
    return node.serviceName;
  }
}

function getName(node: NodeData): string {
  if (node.data.trace?.remoteEndpoint?.serviceName === 's3') {
    return node.data.trace.tags.name || node.data.trace.tags.key || unknown;
  } else if (node.data.trace?.remoteEndpoint?.serviceName === 'mysql') {
    return node.data.trace.tags.table || unknown;
  } else if (node.data.trace?.remoteEndpoint?.serviceName === 'redis') {
    return node.data.trace.tags.hash || unknown;
  } else if (node.data.client?.localEndpoint?.serviceName === 'web-frontend') {
    return node.data.client.name.toUpperCase() + ' ' + node.data.client.tags['http.path'];
  } else if (node.data.operations) {
    const operationsLength = node.data.operations.length;
    return operationsLength + ' ' + (
      operationsLength === 1
        ? i18n.translate('traceNetworkMap.operation', {defaultMessage: 'operation'})
        : i18n.translate('traceNetworkMap.operations', {defaultMessage: 'operations'})
    );
  } else {
    return node.id;
  }
}

function getResult(node: NodeData): string|null {
  if (node.data.trace?.remoteEndpoint?.serviceName === 's3') {
    if (node.data.trace.tags['result.exists']) {
      return toBool(node.data.trace.tags['result.exists'])
        ? i18n.translate('traceNetworkMap.yes', {defaultMessage: 'yes'})
        : i18n.translate('traceNetworkMap.no', {defaultMessage: 'no'})
    } else if (node.data.trace.tags['result.count']) {
      const count = node.data.trace.tags['result.count'];
      return count + ' ' + (
        count === '1'
          ? i18n.translate('traceNetworkMap.object', {defaultMessage: 'object'})
          : i18n.translate('traceNetworkMap.objects', {defaultMessage: 'objects'})
      );
    } else {
      return null;
    }
  } else if (node.data.trace?.remoteEndpoint?.serviceName === 'mysql') {
    const count = node.data.trace.tags['result.count'];
    return count + ' ' + (
      count === '1'
        ? i18n.translate('traceNetworkMap.row', {defaultMessage: 'row'})
        : i18n.translate('traceNetworkMap.rows', {defaultMessage: 'rows'})
    );
  } else if (node.data.trace?.remoteEndpoint?.serviceName === 'redis') {
    if (node.data.trace.tags['result.exists']) {
      return toBool(node.data.trace.tags['result.exists'])
        ? i18n.translate('traceNetworkMap.yes', {defaultMessage: 'yes'})
        : i18n.translate('traceNetworkMap.no', {defaultMessage: 'no'})
    } else if (node.data.trace.tags['result.success']) {
      return toBool(node.data.trace.tags['result.success'])
        ? i18n.translate('traceNetworkMap.successful', {defaultMessage: 'successful'})
        : i18n.translate('traceNetworkMap.notSuccessful', {defaultMessage: 'not successful'})
    } else {
      return null;
    }
  } else if (node.data.client?.localEndpoint?.serviceName === 'web-frontend') {
    return i18n.translate('traceNetworkMap.status', {defaultMessage: 'status'})
      + ' '
      + node.data.client.tags['http.status_code'] || unknown;
  } else {
    return null;
  }
}

function toBool(value: string) {
  return !!parseInt(value, 10);
}

