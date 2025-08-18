import { RedisMemoryServer } from 'redis-memory-server';

let redisServer: RedisMemoryServer;

export async function setupRedis() {
  redisServer = new RedisMemoryServer();
  const host = await redisServer.getHost();
  const port = await redisServer.getPort();


  jest.doMock('@data-lake/redis', () => {
    const { createClient } = require('redis');
    const client = createClient({
      socket: { host, port }
    });
    

    client.connect();

    return {
      redis: {
        get: (key: string) => client.get(key),
        set: (key: string, value: string, ...args: any[]) => {
          if (args.length >= 2 && args[0] === 'EX') {
            return client.setEx(key, args[1], value);
          }
          return client.set(key, value);
        },
        del: (key: string) => client.del(key),
      }
    };
  });

  return { host, port };
}

export async function teardownRedis() {
  if (redisServer) {
    await redisServer.stop();
  }
}