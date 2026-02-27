/**
 * Unit Tests for Cache Service
 */

import { CacheService, CACHE_TTL, CACHE_PREFIXES } from '../../../src/services/cache.service';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    sadd: jest.fn(),
    expire: jest.fn(),
    smembers: jest.fn(),
    incr: jest.fn(),
    flushdb: jest.fn(),
    dbsize: jest.fn(),
    info: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      sadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }),
  }));
});

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedis: any;

  beforeEach(() => {
    const Redis = require('ioredis');
    mockRedis = new Redis();
    cacheService = new CacheService(mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed value from cache', async () => {
      const testData = { id: '123', name: 'Test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheService.get('test-key');

      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with TTL', async () => {
      const testData = { id: '123', name: 'Test' };
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheService.set('test-key', testData, CACHE_TTL.MEDIUM);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        CACHE_TTL.MEDIUM,
        JSON.stringify(testData)
      );
    });

    it('should use default TTL when not specified', async () => {
      const testData = { id: '123' };
      mockRedis.setex.mockResolvedValue('OK');

      await cacheService.set('test-key', testData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        CACHE_TTL.MEDIUM,
        JSON.stringify(testData)
      );
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await cacheService.delete('test-key');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { id: '123', name: 'Cached' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const fetcher = jest.fn().mockResolvedValue({ id: '123', name: 'Fresh' });
      const result = await cacheService.getOrSet('test-key', fetcher);

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not in cache', async () => {
      const freshData = { id: '123', name: 'Fresh' };
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      const fetcher = jest.fn().mockResolvedValue(freshData);
      const result = await cacheService.getOrSet('test-key', fetcher, CACHE_TTL.SHORT);

      expect(result).toEqual(freshData);
      expect(fetcher).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        CACHE_TTL.SHORT,
        JSON.stringify(freshData)
      );
    });
  });

  describe('deletePattern', () => {
    it('should delete all keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedis.del.mockResolvedValue(3);

      const result = await cacheService.deletePattern('test:*');

      expect(result).toBe(3);
      expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should return 0 when no keys match', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await cacheService.deletePattern('test:*');

      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidateTag', () => {
    it('should delete all keys with tag', async () => {
      mockRedis.smembers.mockResolvedValue(['key1', 'key2']);
      mockRedis.del.mockResolvedValue(2);

      const result = await cacheService.invalidateTag('customers');

      expect(result).toBe(2);
      expect(mockRedis.smembers).toHaveBeenCalledWith('tag:customers');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
    });
  });

  describe('increment', () => {
    it('should increment counter', async () => {
      mockRedis.incr.mockResolvedValue(5);

      const result = await cacheService.increment('counter-key');

      expect(result).toBe(5);
      expect(mockRedis.incr).toHaveBeenCalledWith('counter-key');
    });

    it('should set TTL on first increment', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      await cacheService.increment('counter-key', 60);

      expect(mockRedis.expire).toHaveBeenCalledWith('counter-key', 60);
    });
  });
});
