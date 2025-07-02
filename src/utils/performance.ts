// Utilidades de rendimiento

// Cache con TTL (Time To Live)
export class CacheWithTTL<T> {
  private cache: Map<string, { value: T; expiry: number }>;
  private ttlMs: number;
  
  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttlMs = ttlMs;
  } // 5 minutos por defecto
  
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs
    });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Función para throttle
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - (now - lastCall));
    }
  };
}

// Batch updates para reducir re-renders
export function batchUpdates(
  updates: Array<() => void>,
  callback?: () => void
): void {
  Promise.resolve().then(() => {
    updates.forEach(update => update());
    callback?.();
  });
}