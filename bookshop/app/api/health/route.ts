import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        // Test basic connection
        await prisma.$queryRaw`SELECT 1`

        // Test a simple query
        const bookCount = await prisma.book.count()
        const authorCount = await prisma.author.count()
        const customerCount = await prisma.customer.count()
        const orderCount = await prisma.order.count()

        return NextResponse.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            counts: {
                books: bookCount,
                authors: authorCount,
                customers: customerCount,
                orders: orderCount
            }
        })
    } catch (error) {
        console.error('Health check failed:', error)
        return NextResponse.json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}

