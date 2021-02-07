import {i18n} from '@kbn/i18n';
import {NodeData, ResultSummary, toTimeStr} from "../data";
import {ResultSource} from "../../components/filter_form";
import {Service} from "./service";

export class MySql implements NodeData {
  static readonly SERVICE_NAME = 'mysql';

  result: ResultSource;

  constructor(result: ResultSource) {
    this.result = result;
  }

  collect(results: ResultSource[]) {}

  getId(): string {
    return this.result.id;
  }

  getParentId(): string|null {
    return Service.id(this.result.parentId, MySql.SERVICE_NAME);
  }

  getName(): string {
    const unknown = i18n.translate('traceNetworkMap.unknown', {defaultMessage: 'unknown'});
    return this.result.tags.table || unknown;
  }

  getServiceName(): string {
    return this.result.name;
  }

  getResultSummary(): ResultSummary|null {
    const count = this.result.tags['result.count'];
    const text = count + ' ' + (
      count === '1'
        ? i18n.translate('traceNetworkMap.row', {defaultMessage: 'row'})
        : i18n.translate('traceNetworkMap.rows', {defaultMessage: 'rows'})
    );
    return count ? {text, className: count === '0' ? 'error' : 'success'} : null;
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
