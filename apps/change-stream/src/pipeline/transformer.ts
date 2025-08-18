import { Transform } from 'stream';
import type { ChangeStreamDocument, ClickHouseRow, TransformOptions } from '../types';

function mapToClickHouseRow(event: ChangeStreamDocument): ClickHouseRow | null {
  const version = event.clusterTime.getHighBits() * 1000000 + Date.now() % 1000000;
  
  const baseRow: ClickHouseRow = { 
    _resumeToken: event._id,
    _version: version,
    is_deleted: 0
  };

  switch (event.operationType) {
    case 'insert':
    case 'update':
    case 'replace':
      const doc = event.fullDocument;
      return { 
        ...baseRow, 
        id: doc._id?.toString(),
        type: doc.type,
        amount: doc.amount,
        status: doc.status,
        created_at: new Date(doc.createdAt).toISOString().replace('T', ' ').replace('Z', ''),
        operation_type: 'insert',
        operation_timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        is_deleted: 0 
      };
    case 'delete':
      return { 
        ...baseRow, 
        id: event.documentKey?._id?.toString(),
        operation_type: 'delete',
        operation_timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        is_deleted: 1 
      };
    
    default:
      return null;
  }
}

export function createClickHouseTransformer(options: TransformOptions = {}): Transform {
  const batchSize = options.batchSize || 1000;
  const flushTimeout = options.flushTimeout || 2000;
  
  let batch: ClickHouseRow[] = [];
  let timeout: NodeJS.Timeout | null = null;

  const flushBatch = (stream: Transform): void => {
    if (batch.length > 0) {
      console.log(`Enviando um lote de ${batch.length} eventos.`);
      stream.push(batch);
      batch = [];
    }
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return new Transform({
    objectMode: true,
    
    transform(changeEvent: ChangeStreamDocument, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
      try {
        const clickhouseRow = mapToClickHouseRow(changeEvent);
        
        if (clickhouseRow) {
          batch.push(clickhouseRow);
        }

        if (batch.length >= batchSize) {
          flushBatch(this); 
        } else if (!timeout) {
          timeout = setTimeout(() => flushBatch(this), flushTimeout);
        }
        
        callback();
      } catch (error) {
        callback(error instanceof Error ? error : new Error(String(error)));
      }
    },
    
    flush(callback: (error?: Error | null) => void) {
      try {
        flushBatch(this);
        callback();
      } catch (error) {
        callback(error instanceof Error ? error : new Error(String(error)));
      }
    },

    destroy(error: Error | null, callback: (error?: Error | null) => void) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      callback(error);
    }
  });
}