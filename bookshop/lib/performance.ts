// Performance monitoring and optimization utilities

interface QueryMetrics {
    query: string
    duration: number
    timestamp: number
    cacheHit?: boolean
}

class PerformanceMonitor {
    private metrics: QueryMetrics[] = []
    private maxMetrics = 1000 // Keep only last 1000 queries

    recordQuery(query: string, duration: number, cacheHit = false) {
        this.metrics.push({
            query,
            duration,
            timestamp: Date.now(),
            cacheHit
        })

        // Keep only recent metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics)
        }
    }

    getSlowQueries(threshold = 1000): QueryMetrics[] {
        return this.metrics
            .filter(m => m.duration > threshold)
            .sort((a, b) => b.duration - a.duration)
    }

    getCacheHitRate(): number {
        const total = this.metrics.length
        if (total === 0) return 0

        const hits = this.metrics.filter(m => m.cacheHit).length
        return (hits / total) * 100
    }

    getAverageQueryTime(): number {
        if (this.metrics.length === 0) return 0

        const total = this.metrics.reduce((sum, m) => sum + m.duration, 0)
        return total / this.metrics.length
    }

    getStats() {
        return {
            totalQueries: this.metrics.length,
            averageQueryTime: this.getAverageQueryTime(),
            cacheHitRate: this.getCacheHitRate(),
            slowQueries: this.getSlowQueries().length
        }
    }

    clear() {
        this.metrics = []
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Query optimization utilities
export const queryOptimizer = {
    // Add select only needed fields
    selectFields: (fields: string[]) => {
        return fields.reduce((acc, field) => {
            acc[field] = true
            return acc
        }, {} as Record<string, boolean>)
    },

    // Common optimized selects for different entities
    bookListSelect: {
        id: true,
        name: true,
        authorName: true,
        isbn: true,
        price: true,
        qty: true,
        author: {
            select: {
                id: true,
                name: true
            }
        }
    },

    customerListSelect: {
        id: true,
        name: true,
        contact: true,
        registrationNo: true,
        date: true,
        _count: {
            select: {
                orders: true
            }
        }
    },

    orderListSelect: {
        id: true,
        customerId: true,
        customerName: true,
        orderDate: true,
        returnDate: true,
        status: true,
        customer: {
            select: {
                id: true,
                name: true,
                contact: true
            }
        }
    }
}

// Database connection optimization
export const dbOptimizer = {
    // Connection pool configuration
    connectionConfig: {
        connectionLimit: 10,
        acquireTimeoutMillis: 30000,
        timeout: 30000,
        idleTimeoutMillis: 30000
    },

    // Query timeout configuration
    queryTimeout: 30000, // 30 seconds
}
