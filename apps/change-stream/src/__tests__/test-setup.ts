import {redisMock} from 'ioredis-mock';

let redisServer: InstanceType<typeof redisMock>;

export async function setupRedis() {
  redisServer = new redisMock();
  jest.doMock('@data-lake/redis', () => {
    return {
      redis: redisServer
    };
  });
}

export async function teardownRedis() {
  if (redisServer) {
    redisServer.disconnect();
  }
}