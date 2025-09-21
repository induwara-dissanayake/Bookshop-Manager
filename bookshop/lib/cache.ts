// Simple in-memory cache utility
interface CacheItem<T> {
    data: T
    timestamp: number
    ttl: number
}

class MemoryCache {
    private cache = new Map<string, CacheItem<any>>()
    private hitCount = 0
    private missCount = 0

    set<T>(key: string, data: T, ttlSeconds: number = 300): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000
        })
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key)

        if (!item) {
            this.missCount++
            return null
        }

        // Check if expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key)
            this.missCount++
            return null
        }

        this.hitCount++
        return item.data
    }

    delete(key: string): void {
        this.cache.delete(key)
    }

    clear(): void {
        this.cache.clear()
    }

    // Clear cache entries that match a pattern
    clearPattern(pattern: string): void {
        const regex = new RegExp(pattern)
        const keys = Array.from(this.cache.keys())
        for (const key of keys) {
            if (regex.test(key)) {
                this.cache.delete(key)
            }
        }
    }

    // Get cache statistics
    getStats() {
        const total = this.hitCount + this.missCount
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            hits: this.hitCount,
            misses: this.missCount,
            hitRate: total > 0 ? (this.hitCount / total) * 100 : 0
        }
    }
}

// Export singleton instance
export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
    books: (page: number, limit: number, search?: string) =>
        `books:${page}:${limit}:${search || 'all'}`,
    book: (id: number) => `book:${id}`,
    customers: (page: number, limit: number, search?: string) =>
        `customers:${page}:${limit}:${search || 'all'}`,
    customer: (id: number) => `customer:${id}`,
    orders: (page: number, limit: number, search?: string, status?: string) =>
        `orders:${page}:${limit}:${search || 'all'}:${status || 'all'}`,
    order: (id: number) => `order:${id}`,
    authors: (search?: string) => `authors:${search || 'all'}`,
}
