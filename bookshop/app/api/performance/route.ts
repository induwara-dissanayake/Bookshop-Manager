import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'
import { performanceMonitor } from '@/lib/performance'
import { cache } from '@/lib/cache'

// GET /api/performance - Get performance metrics
export async function GET(request: NextRequest) {
    if (!checkAuth()) {
        return createUnauthorizedResponse()
    }

    try {
        const { searchParams } = new URL(request.url)
        const includeSlowQueries = searchParams.get('includeSlowQueries') === 'true'
        const slowQueryThreshold = parseInt(searchParams.get('threshold') || '1000')

        const stats = performanceMonitor.getStats()
        const cacheStats = cache.getStats()

        const response = {
            database: {
                ...stats,
                slowQueries: includeSlowQueries ? performanceMonitor.getSlowQueries(slowQueryThreshold) : undefined
            },
            cache: {
                ...cacheStats
            },
            timestamp: new Date().toISOString()
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error fetching performance metrics:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/performance/clear - Clear performance metrics
export async function POST(request: NextRequest) {
    if (!checkAuth()) {
        return createUnauthorizedResponse()
    }

    try {
        const body = await request.json()
        const { clearCache = false, clearMetrics = false } = body

        if (clearMetrics) {
            performanceMonitor.clear()
        }

        if (clearCache) {
            cache.clear()
        }

        return NextResponse.json({
            message: 'Performance data cleared successfully',
            cleared: {
                metrics: clearMetrics,
                cache: clearCache
            }
        })
    } catch (error) {
        console.error('Error clearing performance data:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
