export enum Kind {
  Client = 'CLIENT',
  Server = 'SERVER',
}

export interface ResultSource {
  id:string;
  parentId:string;
  name:string;
  tags: {
    table?: string,
    hash?: string,
    name?: string,
    key?: string,
    page?: string,
    'http.path'?: string,
    'result.count'?: string,
    'result.exists'?: string,
    'result.success'?: string,
    'http.status_code'?: string,
  };
  duration: string;
  localEndpoint: { serviceName: string; };
  remoteEndpoint: { serviceName: string; } | null;
  kind?: Kind;
}

export interface Result {
  fields: { timestamp_millis: string[] };
  _source: ResultSource;
}
