import {i18n} from '@kbn/i18n';
import {NodeData, ResultSummary, toBool, toTimeStr} from "../data";
import {ResultSource} from "../../search/result";
import {Service} from "./service";

export class Redis implements NodeData {
  static readonly SERVICE_NAME = 'redis';

  result: ResultSource;

  constructor(result: ResultSource) {
    this.result = result;
  }

  collect(results: ResultSource[]) {}

  getId(): string {
    return this.result.id;
  }

  getParentId(): string|null {
    return Service.id(this.result.parentId, Redis.SERVICE_NAME);
  }

  getName(): string {
    const unknown = i18n.translate('traceNetworkMap.unknown', {defaultMessage: 'unknown'});
    return this.result.tags.hash || unknown;
  }

  getServiceName(): string {
    return this.result.name;
  }

  getResultSummary(): ResultSummary|null {
    if (this.result.tags['result.exists']) {
      if (toBool(this.result.tags['result.exists'])) {
        return {text: i18n.translate('traceNetworkMap.yes', {defaultMessage: 'yes'}), className: 'success'};
      } else {
        return {text: i18n.translate('traceNetworkMap.no', {defaultMessage: 'no'}), className: 'error'};
      }
    } else if (this.result.tags['result.success']) {
      if (toBool(this.result.tags['result.success'])) {
        return {text: i18n.translate('traceNetworkMap.successful', {defaultMessage: 'successful'}), className: 'success'};
      } else {
        return {text: i18n.translate('traceNetworkMap.notSuccessful', {defaultMessage: 'not successful'}), className: 'error'};
      }
    } else {
      return null;
    }
  }

  getDuration(): string|null {
    return toTimeStr(Number.parseInt(this.result.duration, 10));
  }

  getZipkinLink(): string|null {
    return null;
  }

  getTraceData(): object {
    return this.result;
  }

  initiallyHidden(): boolean {
    return true;
  }
}
