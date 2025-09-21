import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'
import { getCurrentLocalDate } from '@/lib/dateUtils'

// POST /api/orders/[id]/complete - Complete payment for selected books
export async function POST(
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

    const body = await request.json()
    const { selectedBooks, currentPayment } = body

    if (!selectedBooks || !Array.isArray(selectedBooks) || selectedBooks.length === 0) {
      return NextResponse.json(
        { error: 'No books selected' },
        { status: 400 }
      )
    }

    // Get order and customer details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get current date in local timezone
    const currentDate = getCurrentLocalDate()

    await prisma.$transaction(async (tx) => {
      // Update order details status for selected books
      await tx.orderDetail.updateMany({
        where: {
          orderId: orderId,
          bookId: { in: selectedBooks }
        },
        data: {
          status: 1
        }
      })

      // Update book quantities (return books to inventory)
      for (const bookId of selectedBooks) {
        // Update the Book qty field (simplified inventory system)
        await tx.book.update({
          where: { id: bookId },
          data: {
            qty: { increment: 1 }
          }
        })
      }

      // Check if all books are returned
      const remainingPendingBooks = await tx.orderDetail.count({
        where: {
          orderId: orderId,
          status: 0
        }
      })

      // If all books are returned, update order status
      if (remainingPendingBooks === 0) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 1,
            returnDate: currentDate
          }
        })
      }

      // Create or update payment record (accumulate payments for partial completions)
      await tx.payment.upsert({
        where: {
          orderId_customerId: {
            orderId: orderId,
            customerId: order.customerId
          }
        },
        update: {
          amount: { increment: currentPayment }, // Add to existing payment amount
          returnDate: currentDate
        },
        create: {
          orderId: orderId,
          customerId: order.customerId,
          customerName: order.customerName,
          amount: currentPayment,
          orderDate: order.orderDate,
          returnDate: currentDate
        }
      })
    })

    // Check final order status after transaction
    const remainingPending = await prisma.orderDetail.count({
      where: {
        orderId: orderId,
        status: 0
      }
    })

    const response = NextResponse.json({ 
      success: true,
      message: 'Payment completed successfully',
      remainingPendingBooks: remainingPending,
      completedBooks: selectedBooks,
      orderFullyCompleted: remainingPending === 0
    })

    // Prevent caching to ensure real-time updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Error completing payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
