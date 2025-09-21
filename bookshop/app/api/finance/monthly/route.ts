import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/finance/monthly - Get monthly payment data
export async function GET(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get start and end dates for the year
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    // Fetch all payments for the year
    const yearlyPayments = await prisma.payment.findMany({
      where: {
        returnDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        returnDate: true,
        amount: true,
        orderId: true,
        customerId: true
      }
    })

    // Group by month
    const monthlyData: { [key: number]: { totalPayments: number, orderCount: number, customers: Set<number> } } = {}

    yearlyPayments.forEach(payment => {
      const month = payment.returnDate.getMonth() + 1 // 1-12
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          totalPayments: 0,
          orderCount: 0,
          customers: new Set()
        }
      }
      
      monthlyData[month].totalPayments += payment.amount
      monthlyData[month].orderCount += 1
      monthlyData[month].customers.add(payment.customerId)
    })

    // Transform to array
    const payments = Object.keys(monthlyData).map(monthStr => {
      const month = parseInt(monthStr)
      const data = monthlyData[month]
      
      return {
        month,
        year,
        totalPayments: data.totalPayments,
        orderCount: data.orderCount,
        customerCount: data.customers.size
      }
    }).sort((a, b) => a.month - b.month)

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Error fetching monthly finance data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
