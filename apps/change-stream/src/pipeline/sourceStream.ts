import { Readable } from 'stream';
import { TransactionModel } from '@data-lake/mongodb';
import { getResumeToken } from '../state-manager';
import type { ChangeStreamDocument, SourceStreamOptions } from '../types';

export function createSourceStream(options: SourceStreamOptions): Readable {
  let changeStreamInstance: any = null;
  const { collection, resumeAfter } = options;

  return new Readable({
    objectMode: true,
    
    async read() {
      if (!changeStreamInstance) {
        try {
          const resumeToken = resumeAfter || await getResumeToken(collection);
          
          changeStreamInstance = TransactionModel.watch([], {
            fullDocument: 'updateLookup',
            ...(resumeToken && { resumeAfter: resumeToken }),
          });

          changeStreamInstance.on('change', (changeEvent: ChangeStreamDocument) => {
            this.push(changeEvent);
          });

          changeStreamInstance.on('error', (error: Error) => {
            this.emit('error', error);
          });

          changeStreamInstance.on('close', () => {
            this.push(null);
          });

        } catch (error) {
          this.emit('error', error);
        }
      }
    },

    destroy(error: Error | null, callback: (error?: Error | null) => void) {
      if (changeStreamInstance) {
        changeStreamInstance.close();
        changeStreamInstance = null;
      }
      callback(error);
    }
  });
}