class SimpleCache {
  private cache = new Map<string, { value: unknown; expires: number }>();

  set(key: string, value: unknown, ttlSeconds: number = 3600): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Auto-cleanup every hour
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.cache.forEach((item, key) => {
        if (now > item.expires) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.cache.delete(key));
    }, 3600000); // 1 hour
  }

  size(): number {
    return this.cache.size;
  }
}

export const cache = new SimpleCache();

// Start cleanup in server environment only
if (typeof window === 'undefined') {
  cache.startCleanup();
}