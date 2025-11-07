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

// Cache key generators with better granularity
export const cacheKeys = {
  metrics: () => 'dashboard:metrics',
  customers: (filter?: string) => filter ? `customers:${filter}` : 'customers:all',
  customerHealth: (customerId: string) => `customer:${customerId}:health`,
  alerts: (status?: string) => status ? `alerts:${status}` : 'alerts:all',
  churnPrediction: (customerId?: string, segment?: string, riskLevel?: string, limit?: number) => {
    return `churn-prediction:customer:${customerId || 'all'}:segment:${segment || 'all'}:risk:${riskLevel || 'all'}:limit:${limit || 100}`;
  },
  anomalyDetection: () => 'anomaly-detection:recent',
  successTracking: (tutorId?: string, subject?: string, segment?: string) => {
    return `success-tracking:tutor:${tutorId || 'all'}:subject:${subject || 'all'}:segment:${segment || 'all'}`;
  },
  supplyDemand: (type: 'historical' | 'predict', timeRange?: string) => {
    return `supply-demand:${type}${timeRange ? `:${timeRange}` : ''}`;
  },
  forecast: (subject: string, hour: string) => `forecast:${subject}:${hour}`,
  recommendations: (customerId?: string) => customerId ? `recommendations:${customerId}` : 'recommendations:active',
} as const;

// Cache warming utilities
export async function warmCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.METRICS
): Promise<T> {
  if (!redis) {
    return await fetchFn();
  }

  try {
    // Try to get from cache first
    const cached = await getCached<T>(key);
    if (cached) return cached;

    // Fetch and cache
    const data = await fetchFn();
    await setCache(key, data, ttl);
    return data;
  } catch (error) {
    console.error('Cache warming error:', error);
    return await fetchFn();
  }
}

// Batch cache operations
export async function setMultiple<T>(
  entries: Array<{ key: string; value: T; ttl?: number }>,
  defaultTtl: number = CACHE_TTL.METRICS
): Promise<void> {
  if (!redis) return;

  try {
    const pipeline = redis.pipeline();
    entries.forEach(({ key, value, ttl }) => {
      pipeline.setex(key, ttl || defaultTtl, JSON.stringify(value));
    });
    await pipeline.exec();
  } catch (error) {
    console.error('Redis batch SET error:', error);
  }
}

export async function getMultiple<T>(keys: string[]): Promise<Map<string, T>> {
  if (!redis) return new Map();

  try {
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();

    const resultMap = new Map<string, T>();
    results.forEach((result, index) => {
      if (result) {
        resultMap.set(keys[index], result as T);
      }
    });
    return resultMap;
  } catch (error) {
    console.error('Redis batch GET error:', error);
    return new Map();
  }
}
