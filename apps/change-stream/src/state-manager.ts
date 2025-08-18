import { redis } from '@data-lake/redis';
import type { ResumeToken } from './types';

const KEY_PREFIX = 'change-stream:resume-token';
const BACKUP_KEY_PREFIX = 'change-stream:resume-token:backup';

const getKey = (collection: string) => `${KEY_PREFIX}:${collection}`;
const getBackupKey = (collection: string) => `${BACKUP_KEY_PREFIX}:${collection}`;

export async function saveResumeToken(collection: string, token: ResumeToken): Promise<void> {
  const key = getKey(collection);
  const backupKey = getBackupKey(collection);
  
  try {
    const currentToken = await redis.get(key);
    if (currentToken) {
      await redis.set(backupKey, currentToken, 'EX', 3600);
    }
    
    const tokenData = {
      token,
      timestamp: new Date().toISOString(),
      collection
    };
    
    await redis.set(key, JSON.stringify(tokenData));
    
  } catch (error) {
    throw new Error(`Failed to save resume token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getResumeToken(collection: string): Promise<ResumeToken | null> {
  const key = getKey(collection);
  
  try {
    const tokenData = await redis.get(key);
    if (!tokenData) return null;
    
    const parsed = JSON.parse(tokenData);
    
    if (!parsed.token || parsed.collection !== collection) {
      console.warn(`Invalid or mismatched resume token for collection ${collection}`);
      return null;
    }
    
    return parsed.token;
    
  } catch (error) {
    console.error('Error retrieving resume token:', error);
    return getBackupToken(collection);
  }
}

export async function getBackupToken(collection: string): Promise<ResumeToken | null> {
  try {
    const backupKey = getBackupKey(collection);
    const backupData = await redis.get(backupKey);
    
    if (backupData) {
      const parsed = JSON.parse(backupData);
      console.warn('Using backup resume token due to primary token failure');
      return parsed.token || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function cleanupTokens(collection: string): Promise<void> {
  const key = getKey(collection);
  const backupKey = getBackupKey(collection);
  
  try {
    await Promise.all([
      redis.del(key),
      redis.del(backupKey)
    ]);
  } catch (error) {
    console.error('Error during token cleanup:', error);
  }
}