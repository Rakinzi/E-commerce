import redis from '../config/redis.js';
import logger from './logger.js';

export class CacheHelper {
  
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  static async del(key: string | string[]): Promise<boolean> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      await redis.del(...keys);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  static async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      await redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  static async increment(key: string, amount: number = 1): Promise<number | null> {
    try {
      return await redis.incrby(key, amount);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  }

  static async decrement(key: string, amount: number = 1): Promise<number | null> {
    try {
      return await redis.decrby(key, amount);
    } catch (error) {
      logger.error('Cache decrement error:', error);
      return null;
    }
  }

  static async getPattern(pattern: string): Promise<string[]> {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      logger.error('Cache get pattern error:', error);
      return [];
    }
  }

  static async deletePattern(pattern: string): Promise<boolean> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Hash operations
  static async hget(key: string, field: string): Promise<string | null> {
    try {
      return await redis.hget(key, field);
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  }

  static async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await redis.hset(key, field, value);
      return true;
    } catch (error) {
      logger.error('Cache hset error:', error);
      return false;
    }
  }

  static async hdel(key: string, field: string | string[]): Promise<boolean> {
    try {
      const fields = Array.isArray(field) ? field : [field];
      await redis.hdel(key, ...fields);
      return true;
    } catch (error) {
      logger.error('Cache hdel error:', error);
      return false;
    }
  }

  static async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      const result = await redis.hgetall(key);
      return Object.keys(result).length > 0 ? result : null;
    } catch (error) {
      logger.error('Cache hgetall error:', error);
      return null;
    }
  }

  // List operations
  static async lpush(key: string, value: string | string[]): Promise<boolean> {
    try {
      const values = Array.isArray(value) ? value : [value];
      await redis.lpush(key, ...values);
      return true;
    } catch (error) {
      logger.error('Cache lpush error:', error);
      return false;
    }
  }

  static async rpush(key: string, value: string | string[]): Promise<boolean> {
    try {
      const values = Array.isArray(value) ? value : [value];
      await redis.rpush(key, ...values);
      return true;
    } catch (error) {
      logger.error('Cache rpush error:', error);
      return false;
    }
  }

  static async lpop(key: string): Promise<string | null> {
    try {
      return await redis.lpop(key);
    } catch (error) {
      logger.error('Cache lpop error:', error);
      return null;
    }
  }

  static async rpop(key: string): Promise<string | null> {
    try {
      return await redis.rpop(key);
    } catch (error) {
      logger.error('Cache rpop error:', error);
      return null;
    }
  }

  static async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await redis.lrange(key, start, stop);
    } catch (error) {
      logger.error('Cache lrange error:', error);
      return [];
    }
  }

  // Set operations
  static async sadd(key: string, member: string | string[]): Promise<boolean> {
    try {
      const members = Array.isArray(member) ? member : [member];
      await redis.sadd(key, ...members);
      return true;
    } catch (error) {
      logger.error('Cache sadd error:', error);
      return false;
    }
  }

  static async srem(key: string, member: string | string[]): Promise<boolean> {
    try {
      const members = Array.isArray(member) ? member : [member];
      await redis.srem(key, ...members);
      return true;
    } catch (error) {
      logger.error('Cache srem error:', error);
      return false;
    }
  }

  static async smembers(key: string): Promise<string[]> {
    try {
      return await redis.smembers(key);
    } catch (error) {
      logger.error('Cache smembers error:', error);
      return [];
    }
  }

  static async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error('Cache sismember error:', error);
      return false;
    }
  }

  // Utility methods
  static async flushAll(): Promise<boolean> {
    try {
      await redis.flushall();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }

  static async getStats(): Promise<Record<string, any> | null> {
    try {
      const info = await redis.info();
      return { info };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }
}