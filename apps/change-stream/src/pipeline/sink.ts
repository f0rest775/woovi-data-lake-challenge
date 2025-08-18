import { Writable } from 'stream';
import { saveResumeToken } from '../state-manager';
import type { ClickHouseRow, SinkDependencies } from '../types';

interface RetryOptions {
  retries: number;
  minTimeout: number;
  factor: number;
}

async function simpleRetry<T>(
  fn: () => Promise<T>, 
  options: RetryOptions
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < options.retries) {
        const delay = options.minTimeout * Math.pow(options.factor, attempt);
        console.warn(`Falha na inserção, tentativa ${attempt + 1}. Erro: ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

export function createClickHouseSink(
  dependencies: SinkDependencies,
  collection: string
): Writable {
  const { clickhouseClient } = dependencies;
  
  return new Writable({
    objectMode: true,
    
    async write(
      batch: ClickHouseRow[], 
      _encoding: BufferEncoding, 
      callback: (error?: Error | null) => void
    ) {
      try {
        const lastResumeToken = batch[batch.length - 1]._resumeToken;
        
        if (!lastResumeToken) {
          callback(new Error('Batch missing resume token'));
          return;
        }

        const rowsToInsert = batch.map(({ _resumeToken, ...row }) => row);

        await simpleRetry(async () => {
          await clickhouseClient.insert({
            table: 'pix_analytics.transactions',
            values: rowsToInsert,
            format: 'JSONEachRow',
          });
        }, {
          retries: 3,
          minTimeout: 1000,
          factor: 2,
        });

        await saveResumeToken(collection, lastResumeToken);
        console.log(`Lote de ${batch.length} inserido com sucesso. Token salvo.`);
        
        callback();
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Falha crítica na inserção do lote após todas as tentativas.', errorMessage);
        
        callback(error instanceof Error ? error : new Error(errorMessage));
      }
    },

    destroy(error: Error | null, callback: (error?: Error | null) => void) {
      callback(error);
    }
  });
}