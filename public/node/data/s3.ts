import {i18n} from '@kbn/i18n';
import {NodeData, ResultSummary, toBool, toTimeStr} from "../data";
import {ResultSource} from "../../search/result";
import {Service} from "./service";

export class S3 implements NodeData {
  static readonly SERVICE_NAME = 's3';

  result: ResultSource;

  constructor(result: ResultSource) {
    this.result = result;
  }

  collect(results: ResultSource[]) {}

  getId(): string {
    return this.result.id;
  }

  getParentId(): string|null {
    return Service.id(this.result.parentId, S3.SERVICE_NAME);
  }

  getName(): string {
    const unknown = i18n.translate('traceNetworkMap.unknown', {defaultMessage: 'unknown'});
    return this.result.tags.name || this.result.tags.key || unknown;
  }

  getServiceName(): string {
    return this.result.name;
  }

  getResultSummary(): ResultSummary|null {
    if (this.result.tags['result.exists']) {
      return toBool(this.result.tags['result.exists'])
        ? { className: 'success', text: i18n.translate('traceNetworkMap.yes', {defaultMessage: 'yes'}) }
        : { className: 'error', text: i18n.translate('traceNetworkMap.no', {defaultMessage: 'no'}) }
    } else if (this.result.tags['result.count']) {
      const count = this.result.tags['result.count'];
      const text = count + ' ' + (
        count === '1'
          ? i18n.translate('traceNetworkMap.object', {defaultMessage: 'object'})
          : i18n.translate('traceNetworkMap.objects', {defaultMessage: 'objects'})
      );
      return {text, className: count === '0' ? 'error' : 'success'};
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
