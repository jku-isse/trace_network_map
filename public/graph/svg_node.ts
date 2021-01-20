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
  const duration = getDuration(node);

  const width = Math.max(serviceName.length, name.length, (result ? result.text.length : 0)) > 20 ? 300 : 200;
  const height = result || duration ? 70 : 60;

  const resultNodeStr = result ? `<text x="10" y="60" class="info ${result.className}">${result.text}</text>` : '';
  const durationNodeStr = duration ? `<text x="${width - 40}" y="60" class="duration">${duration}</text>` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style>
        .info { fill: lightblue; font: bold 10px sans-serif; }
        .duration { fill: lightgrey; font: 10px sans-serif; }
        .name { fill: white; font: normal 16px sans-serif; }
        .info.success { fill: lightgreen; }
        .info.error { fill: lightcoral; }
      </style>

      <text x="10" y="20" class="info">${serviceName}</text>
      <text x="10" y="40" class="name">${name}</text>
      ${resultNodeStr}
      ${durationNodeStr}
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

function getResult(node: NodeData): {className: string, text: string}|null {
  if (node.data.trace?.remoteEndpoint?.serviceName === 's3') {
    if (node.data.trace.tags['result.exists']) {
      return toBool(node.data.trace.tags['result.exists'])
        ? { className: 'success', text: i18n.translate('traceNetworkMap.yes', {defaultMessage: 'yes'}) }
        : { className: 'error', text: i18n.translate('traceNetworkMap.no', {defaultMessage: 'no'}) }
    } else if (node.data.trace.tags['result.count']) {
      const count = node.data.trace.tags['result.count'];
      const text = count + ' ' + (
        count === '1'
          ? i18n.translate('traceNetworkMap.object', {defaultMessage: 'object'})
          : i18n.translate('traceNetworkMap.objects', {defaultMessage: 'objects'})
      );
      return {text, className: count === '0' ? 'error' : 'success'};
    } else {
      return null;
    }
  } else if (node.data.trace?.remoteEndpoint?.serviceName === 'mysql') {
    const count = node.data.trace.tags['result.count'];
    const text = count + ' ' + (
      count === '1'
        ? i18n.translate('traceNetworkMap.row', {defaultMessage: 'row'})
        : i18n.translate('traceNetworkMap.rows', {defaultMessage: 'rows'})
    );
    return {text, className: count === '0' ? 'error' : 'success'};
  } else if (node.data.trace?.remoteEndpoint?.serviceName === 'redis') {
    if (node.data.trace.tags['result.exists']) {
      if (toBool(node.data.trace.tags['result.exists'])) {
        return {text: i18n.translate('traceNetworkMap.yes', {defaultMessage: 'yes'}), className: 'success'};
      } else {
        return {text: i18n.translate('traceNetworkMap.no', {defaultMessage: 'no'}), className: 'error'};
      }
    } else if (node.data.trace.tags['result.success']) {
      if (toBool(node.data.trace.tags['result.success'])) {
        return {text: i18n.translate('traceNetworkMap.successful', {defaultMessage: 'successful'}), className: 'success'};
      } else {
        return {text: i18n.translate('traceNetworkMap.notSuccessful', {defaultMessage: 'not successful'}), className: 'error'};
      }
    } else {
      return null;
    }
  } else if (node.data.client?.localEndpoint?.serviceName === 'web-frontend') {
    const status = node.data.client.tags['http.status_code'];
    const text = i18n.translate('traceNetworkMap.status', {defaultMessage: 'status'}) + ' ' + (status || unknown);
    const className = (status && Number.parseInt(status, 10) < 400) ? 'success' : 'error';
    return {text, className};
  } else {
    return null;
  }
}

function getDuration(node: NodeData): string|null {
  if (node.data.trace?.duration) {
    return toTimeStr(Number.parseInt(node.data.trace.duration, 10));
  } else if (node.data.server?.duration) {
    return toTimeStr(Number.parseInt(node.data.server.duration, 10));
  } else if (node.data.operations) {
    let duration = 0;
    node.data.operations.forEach(operation => {
      if (operation.duration) {
        duration = duration + Number.parseInt(operation.duration, 10);
      }
    });
    return toTimeStr(duration);
  } else {
    return null;
  }
}

function toTimeStr(value: number): string {
  return value > 1000000 ? Math.round(value / 1000000) + 's' : Math.round(value / 1000) + 'ms';
}

function toBool(value: string) {
  return !!parseInt(value, 10);
}

