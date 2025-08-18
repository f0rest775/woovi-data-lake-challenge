import { pipeline as streamPipeline } from 'stream/promises';
import { clickHouseClient } from '@data-lake/clickhouse';
import { createSourceStream } from './sourceStream';
import { createClickHouseTransformer } from './transformer';
import { createClickHouseSink } from './sink';
import type { TransformOptions, SinkDependencies } from '../types';

interface PipelineOptions {
  collection: string;
  transformOptions?: TransformOptions;
  tableName?: string;
}

export async function createChangeStreamPipeline(options: PipelineOptions): Promise<void> {
  const { collection, transformOptions = {}, tableName = 'transactions' } = options;


  const defaultTransformOptions: TransformOptions = {
    batchSize: 1000,   
    flushTimeout: 2000, 
    ...transformOptions
  };


  const sinkDependencies: SinkDependencies = {
    clickhouseClient: {
      insert: async (insertOptions) => {
        await clickHouseClient.insert({
          ...insertOptions,
          table: tableName, 
          format: insertOptions.format as any
        });
      }
    },
    stateManager: {
      saveResumeToken: async (token) => {
        const { saveResumeToken } = await import('../state-manager');
        return saveResumeToken(collection, token);
      }
    }
  };

  try {
    await streamPipeline(
      createSourceStream({ collection }),
      createClickHouseTransformer(defaultTransformOptions),
      createClickHouseSink(sinkDependencies, collection)
    );
    
  } catch (error) {
    console.error('Pipeline failed:', error);
    throw error;
  }
}


export async function createMultiCollectionPipeline(
  collections: string[],
  globalOptions?: Omit<PipelineOptions, 'collection'>
): Promise<void> {
  const pipelines = collections.map(collection =>
    createChangeStreamPipeline({
      collection,
      ...globalOptions
    }).catch(error => {
      console.error(`Pipeline failed for collection ${collection}:`, error);
      throw new Error(`Pipeline failed for collection ${collection}: ${error.message}`);
    })
  );

  const results = await Promise.allSettled(pipelines);
  
  const failures = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map(result => result.reason);

  if (failures.length > 0) {
    throw new Error(`${failures.length} pipeline(s) failed: ${failures.map(f => f.message).join(', ')}`);
  }
}