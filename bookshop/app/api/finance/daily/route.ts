import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/finance/daily - Get daily payment data
export async function GET(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '1')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get start and end dates for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Fetch payment data grouped by date
    const dailyPayments = await prisma.payment.groupBy({
      by: ['returnDate'],
      where: {
        returnDate: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        orderId: true,
        customerId: true
      },
      orderBy: {
        returnDate: 'asc'
      }
    })

    // Transform the data
    const payments = dailyPayments.map(payment => ({
      date: payment.returnDate.toISOString().split('T')[0],
      totalPayments: payment._sum.amount || 0,
      orderCount: payment._count.orderId || 0,
      customerCount: payment._count.customerId || 0
    }))

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching daily finance data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
