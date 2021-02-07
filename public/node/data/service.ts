import {NodeData, ResultSummary, toTimeStr} from "../data";
import {i18n} from '@kbn/i18n';
import {ResultSource} from "../../search/result";
import {S3} from "./s3";
import {MySql} from "./mysql";
import {Redis} from "./redis";

export class Service implements NodeData {

  name: string;
  parentId: string;
  operations: ResultSource[];

  constructor(name: string, parentId: string) {
    this.name = name;
    this.parentId = parentId;
    this.operations = [];
  }

  collect(results: ResultSource[]) {
    this.operations = results.filter(result =>
      result.remoteEndpoint?.serviceName === this.name
      && result.parentId === this.parentId
    );
  }

  getId(): string {
    return Service.id(this.parentId, this.name);
  }

  getParentId(): string|null {
    return this.parentId;
  }

  getName(): string {
    const operationsLength = this.operations.length;
    return operationsLength + ' ' + (
      operationsLength === 1
        ? i18n.translate('traceNetworkMap.operation', {defaultMessage: 'operation'})
        : i18n.translate('traceNetworkMap.operations', {defaultMessage: 'operations'})
    );
  }

  getServiceName(): string {
    return this.name;
  }

  getResultSummary(): ResultSummary|null {
    return null;
  }

  getDuration(): string|null {
    let duration = 0;
    this.operations.forEach(operation => {
      if (operation.duration) {
        duration = duration + Number.parseInt(operation.duration, 10);
      }
    });
    return toTimeStr(duration);
  }

  getZipkinLink(): string|null {
    return null;
  }

  getTraceData(): object {
    return {operations: this.operations};
  }

  initiallyHidden(): boolean {
    return false;
  }

  static id(parentId: string, serviceName: string) {
    return parentId + '-' + serviceName;
  }

  static aggregates(serviceName: string) {
    return [S3.SERVICE_NAME, MySql.SERVICE_NAME, Redis.SERVICE_NAME].find(name => serviceName === name);
  }
}
