import {NodeData, ResultSummary} from "../data";
import {ResultSource} from "../../components/filter_form";

export class Page implements NodeData {
  static readonly SERVICE_NAME = 'page';

  path: string;

  constructor(path: string) {
    this.path = path;
  }

  collect(results: ResultSource[]) {}

  getId(): string {
    return this.path;
  }

  getParentId(): string|null {
    return null;
  }

  getName(): string {
    return this.path;
  }

  getServiceName(): string {
    return Page.SERVICE_NAME;
  }

  getResultSummary(): ResultSummary|null {
    return null;
  }

  getDuration(): string|null {
    return null;
  }

  getZipkinLink(): string|null {
    return null;
  }

  getTraceData(): object {
    return {};
  }

  initiallyHidden(): boolean {
    return false;
  }
}
