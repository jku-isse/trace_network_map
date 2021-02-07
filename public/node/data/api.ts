import {i18n} from '@kbn/i18n';
import {NodeData, ResultSummary, toTimeStr} from "../data";
import {Kind, ResultSource} from "../../search/result";

export class Api implements NodeData {
  static readonly SERVICE_NAME = 'api';

  serverResult: ResultSource;
  clientResult: ResultSource|undefined;

  constructor(serverResult: ResultSource) {
    this.serverResult = serverResult;
  }

  collect(results: ResultSource[]) {
    this.clientResult = results.find(result => result.kind === Kind.Client && result.id === this.serverResult.parentId);
  }

  getId(): string {
    return this.serverResult.id;
  }

  getParentId(): string|null {
    return this.clientResult?.tags.page || null;
  }

  getName(): string {
    return this.serverResult.name.toUpperCase() + ' ' + this.serverResult.tags['http.path'];
  }

  getServiceName(): string {
    return Api.SERVICE_NAME;
  }

  getResultSummary(): ResultSummary|null {
    const unknown = i18n.translate('traceNetworkMap.unknown', {defaultMessage: 'unknown'});
    const status = this.clientResult?.tags['http.status_code'];
    const text = i18n.translate('traceNetworkMap.status', {defaultMessage: 'status'}) + ' ' + (status || unknown);
    const className = (status && Number.parseInt(status, 10) < 400) ? 'success' : 'error';
    return {text, className};
  }

  getDuration(): string|null {
    return toTimeStr(Number.parseInt(this.serverResult.duration, 10));
  }

  getZipkinLink(): string|null {
    return this.clientResult ? 'http://127.0.0.1:9411/zipkin/traces/' + this.clientResult?.id : null;
  }

  getTraceData(): object {
    return {
      server: this.serverResult,
      client: this.clientResult,
    };
  }

  initiallyHidden(): boolean {
    return false;
  }
}
