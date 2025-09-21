import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/orders/[id] - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const orderId = parseInt(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            contact: true
          }
        },
        orderDetails: {
          include: {
            book: {
              select: {
                id: true,
                name: true,
                price: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Calculate payment details based on day difference (inclusive counting)
    const pendingBooks = order.orderDetails.filter(detail => detail.status === 0)
    const currentDate = new Date()
    const orderDate = new Date(order.orderDate)
    const timeDiff = currentDate.getTime() - orderDate.getTime()
    const daysDiffExclusive = Math.floor(timeDiff / (1000 * 3600 * 24))
    const daysDiff = daysDiffExclusive + 1 // Include the order day as day 1

    let paymentPerBook: number
    if (daysDiff <= 14) {
      // First 2 weeks (1-14 days): Rs. 50 per book
      paymentPerBook = 50
    } else {
      // After 14 days: Rs. 50 base + Rs. 30 for each additional week
      // Days 15-21: 50 + 30 = 80
      // Days 22-28: 50 + 60 = 110  
      // Days 29-35: 50 + 90 = 140
      // And so on...
      const extraWeeks = Math.ceil((daysDiff - 14) / 7)
      paymentPerBook = 50 + (30 * extraWeeks)
    }

    const totalPayment = pendingBooks.length * paymentPerBook

    const transformedOrder = {
      id: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      orderDate: order.orderDate.toISOString(),
      returnDate: order.returnDate?.toISOString(),
      status: order.status,
      customer: order.customer,
      orderDetails: order.orderDetails.map(detail => ({
        bookId: detail.bookId,
        bookName: detail.bookName,
        authorName: detail.authorName,
        status: detail.status,
        book: detail.book
      })),
      totalPayment,
      currentPayment: 0
    }

    const response = NextResponse.json({ order: transformedOrder })

    // Prevent caching to ensure real-time updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
