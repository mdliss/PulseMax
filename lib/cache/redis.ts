import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('Redis environment variables not set. Caching will be disabled.');
}

export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  METRICS: 30, // 30 seconds for real-time metrics
  CUSTOMERS: 900, // 15 minutes for customer data
  ALERTS: 60, // 1 minute for alerts
  FORECASTS: 3600, // 1 hour for forecasts
  RECOMMENDATIONS: 1800, // 30 minutes for recommendations
} as const;

// Helper functions for caching
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;

  try {
    const cached = await redis.get<T>(key);
    return cached;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.METRICS
): Promise<void> {
  if (!redis) return;

  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Redis SET error:', error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis DELETE error:', error);
  }
}

// Cache key generators
export const cacheKeys = {
  metrics: () => 'dashboard:metrics',
  customers: (filter?: string) => filter ? `customers:${filter}` : 'customers:all',
  customerHealth: (customerId: string) => `customer:${customerId}:health`,
  alerts: (status?: string) => status ? `alerts:${status}` : 'alerts:all',
  tutorPerformance: (tutorId?: string) => tutorId ? `tutor:${tutorId}:performance` : 'tutors:performance',
  forecast: (subject: string, hour: string) => `forecast:${subject}:${hour}`,
  recommendations: () => 'recommendations:active',
} as const;
