import {Result, ResultSource} from "../components/filter_form";
import {S3} from "./data/s3";
import {MySql} from "./data/mysql";
import {Redis} from "./data/redis";
import {Api} from "./data/api";
import {Service} from "./data/service";
import {Page} from "./data/page";

export interface ResultSummary {
  className: string,
  text: string,
}

export interface NodeData {
  collect(results: ResultSource[]): void;
  getId(): string;
  getParentId(): string|null;
  getName(): string;
  getServiceName(): string;
  getResultSummary(): ResultSummary|null;
  getDuration(): string|null;
  getZipkinLink(): string|null;
  getTraceData(): object;
  initiallyHidden(): boolean;
}

export function nodeDataFromResults(page: string, results: Result[]): NodeData[] {
  const resultSources = results.map(result => result._source);
  const nodes: NodeData[] = [
    new Page(page),
    ...getServiceNodes(resultSources),
    ...resultSources.flatMap(resultSource => getTraceNodes(resultSource))
  ];
  nodes.forEach(node => {
    node.collect(resultSources);
  });
  return nodes;
}

export function toTimeStr(value: number): string {
  return value > 1000000 ? Math.round(value / 1000000) + 's' : Math.round(value / 1000) + 'ms';
}

export function toBool(value: string) {
  return !!parseInt(value, 10);
}

function getServiceNodes(results: ResultSource[]): IterableIterator<NodeData> {
  const serviceTraceMap = new Map<string, NodeData>();
  results.forEach(result => {
    const serviceName = result.remoteEndpoint?.serviceName;
    if (serviceName !== undefined && !serviceTraceMap.has(serviceName) && Service.aggregates(serviceName)) {
      serviceTraceMap.set(Service.id(result.parentId, serviceName), new Service(serviceName, result.parentId));
    }
  });
  return serviceTraceMap.values();
}

function getTraceNodes(result: ResultSource): NodeData[] {
  let nodeData: NodeData|null = null;
  if (result.remoteEndpoint?.serviceName === S3.SERVICE_NAME) {
    nodeData = new S3(result);
  } else if (result.remoteEndpoint?.serviceName === MySql.SERVICE_NAME) {
    nodeData = new MySql(result);
  } else if (result.remoteEndpoint?.serviceName === Redis.SERVICE_NAME) {
    nodeData = new Redis(result);
  } else if (result.localEndpoint?.serviceName === Api.SERVICE_NAME) {
    nodeData = new Api(result);
  }
  return !!nodeData ? [nodeData] : [];
}
