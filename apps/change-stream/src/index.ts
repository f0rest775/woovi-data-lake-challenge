import { connectDatabase } from './database';
import { createTables } from '@data-lake/clickhouse';
import { createChangeStreamPipeline } from './pipeline';

async function startChangeStreamPipeline(): Promise<void> {
  let retryCount = 0;
  const maxRetries = 5;
  const baseRetryDelay = 5000;

  const runPipeline = async (): Promise<void> => {
    try {
      console.log('Starting change stream pipeline.');
      
      await createChangeStreamPipeline({
        collection: 'transactions',
        transformOptions: {
          batchSize: 1000,
          flushTimeout: 2000
        }
      });
      
    } catch (error) {
      retryCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Pipeline failed (attempt ${retryCount}):`, errorMessage);
      
      if (retryCount <= maxRetries) {
        const retryDelay = baseRetryDelay * Math.pow(2, retryCount - 1);
        console.log(`Retrying in ${retryDelay}ms`);
        
        setTimeout(() => {
          runPipeline().catch(console.error);
        }, retryDelay);
      } else {
        console.error('Maximum retry attempts reached. Pipeline stopped.');
        process.exit(1);
      }
    }
  };

  await runPipeline();
}

(async () => {
  try {
    await connectDatabase();
    await createTables();

    await startChangeStreamPipeline();
    
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
})();