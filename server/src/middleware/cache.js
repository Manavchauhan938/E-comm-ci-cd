import { env } from '../config/env.js';

/**
 * Simple in-memory TTL cache for product listing (swap for Redis in production).
 */
const store = new Map();

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function cacheSet(key, value, ttlMs = 30_000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function productListCache(req, res, next) {
  if (env.nodeEnv === 'test') return next();
  const key = `products:list:${req.originalUrl}`;
  const cached = cacheGet(key);
  if (cached) {
    return res.status(200).json(cached);
  }
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success) {
      cacheSet(key, body, 30_000);
    }
    return originalJson(body);
  };
  return next();
}
