import { PrismaClient } from '@prisma/client'
import { performanceMonitor } from './performance'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Add connection pool and timeout configuration
  transactionOptions: {
    maxWait: 10000, // 10 seconds
    timeout: 10000, // 10 seconds
  }
})

// Add connection health check
async function checkConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Add query performance monitoring with connection retry
prisma.$use(async (params, next) => {
  const start = Date.now()

  try {
    const result = await next(params)
    const duration = Date.now() - start

    // Record query metrics
    performanceMonitor.recordQuery(
      `${params.model}.${params.action}`,
      duration,
      false // Not a cache hit
    )

    return result
  } catch (error) {
    const duration = Date.now() - start

    // Record failed query
    performanceMonitor.recordQuery(
      `${params.model}.${params.action}`,
      duration,
      false
    )

    // If it's a connection error, try to reconnect
    if (error instanceof Error && (
      error.message.includes('Transaction not found') ||
      error.message.includes('Connection') ||
      error.message.includes('timeout')
    )) {
      console.log('Connection error detected, checking database health...')
      const isConnected = await checkConnection()
      if (!isConnected) {
        console.error('Database connection lost, please check your connection')
      }
    }

    throw error
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
