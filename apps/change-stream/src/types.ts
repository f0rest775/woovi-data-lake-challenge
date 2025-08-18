export interface ResumeToken {
  _data: string;
}

export interface ChangeStreamDocument {
  _id: ResumeToken;
  operationType: 'insert' | 'update' | 'replace' | 'delete' | 'drop' | 'rename' | 'dropDatabase';
  clusterTime: {
    getHighBits(): number;
    getLowBits(): number;
  };
  fullDocument?: any;
  documentKey?: { _id: any };
  updateDescription?: any;
}

export interface ClickHouseRow {
  _resumeToken?: ResumeToken;
  _id?: string;
  id?: string;
  type?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  operation_type?: string;
  operation_timestamp?: string;
  _version: number;
  is_deleted: 0 | 1;
  [key: string]: any;
}

export interface TransformOptions {
  batchSize?: number;
  flushTimeout?: number;
}

export interface SinkDependencies {
  clickhouseClient: {
    insert(options: {
      table: string;
      values: any[];
      format: string;
    }): Promise<void>;
  };
  stateManager: {
    saveResumeToken(token: ResumeToken): Promise<void>;
  };
}

export interface SourceStreamOptions {
  collection: string;
  resumeAfter?: ResumeToken;
}