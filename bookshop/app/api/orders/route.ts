import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'
import { getCurrentLocalDate, addDays } from '@/lib/dateUtils'

// Helper function to create order with retry logic
async function createOrderWithRetry(customerId: number, customerName: string, books: any[], loan: number, orderDate: Date, returnDate: Date, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use a shorter timeout for the transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create the order first
        const newOrder = await tx.order.create({
          data: {
            customerId,
            customerName,
            orderDate,
            returnDate,
            status: 0, // Pending
          },
        })

        // Process books one by one to avoid long transactions
        for (const bookItem of books) {
          const bookId = typeof bookItem === 'object' ? bookItem.bookId : bookItem
          const quantity = typeof bookItem === 'object' ? bookItem.quantity : 1

          // Get book with current quantity
          const book = await tx.book.findUnique({
            where: { id: bookId },
          })

          if (!book) {
            throw new Error(`Book with ID ${bookId} not found`)
          }

          // Check availability
          if (book.qty < quantity) {
            throw new Error(`Book "${book.name}" has only ${book.qty} copies available, but ${quantity} requested`)
          }

          // Create order detail
          await tx.orderDetail.create({
            data: {
              orderId: newOrder.id,
              bookId,
              customerId,
              bookName: book.name,
              authorName: book.authorName,
              status: 0, // Pending
            },
          })

          // Update book quantity
          await tx.book.update({
            where: { id: bookId },
            data: { qty: book.qty - quantity },
          })
        }

        return newOrder
      }, {
        timeout: 10000, // 10 second timeout
        isolationLevel: 'ReadCommitted'
      })

      // Handle loan separately to avoid transaction timeout
      if (loan && loan > 0) {
        try {
          await prisma.loan.upsert({
            where: { customerId },
            update: { amount: { increment: loan } },
            create: { customerId, amount: loan },
          })
        } catch (loanError) {
          console.error('Loan update failed, but order was created:', loanError)
          // Don't fail the entire order if loan update fails
        }
      }

      return order
    } catch (error) {
      console.error(`Order creation attempt ${attempt} failed:`, error)

      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    let where: any = {}

    if (status !== null && status !== '') {
      where.status = parseInt(status || '0')
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { id: isNaN(parseInt(search)) ? undefined : parseInt(search) },
      ].filter(Boolean)
    }

    // Simplified query to avoid connection pool issues
    const orders = await prisma.order.findMany({
      where,
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
      },
      skip,
      take: limit,
      orderBy: { orderDate: 'desc' },
    })

    const total = await prisma.order.count({ where })

    // Transform the data to match what the frontend expects
    const transformedOrders = orders.map(order => ({
      id: order.id,
      quantity: order.orderDetails.length, // Number of different books
      totalAmount: order.orderDetails.reduce((sum, detail) =>
        sum + (detail.book?.price || 0), 0
      ),
      status: getStatusText(order.status),
      orderDate: order.orderDate.toISOString(),
      returnDate: order.returnDate?.toISOString(),
      customer: {
        name: order.customer.name,
        email: order.customer.contact // Using contact as email placeholder
      },
      book: {
        title: order.orderDetails[0]?.book?.name || 'Multiple Books',
        price: order.orderDetails[0]?.book?.price || 0
      }
    }))

    const response = NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

    // Prevent caching to ensure real-time updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getStatusText(status: number): string {
  switch (status) {
    case 0: return 'PENDING'
    case 1: return 'CONFIRMED'
    case 2: return 'SHIPPED'
    case 3: return 'DELIVERED'
    case 4: return 'CANCELLED'
    default: return 'PENDING'
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { customerId, books, loan, returnDays = 14 } = await request.json()

    if (!customerId || !books || !Array.isArray(books) || books.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid books array' },
        { status: 400 }
      )
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Calculate return date using local timezone utilities
    const orderDate = getCurrentLocalDate()
    const returnDate = addDays(orderDate, returnDays)

    // Create order with timeout and retry logic
    const order = await createOrderWithRetry(customerId, customer.name, books, loan, orderDate, returnDate)

    // Fetch the complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order!.id },
      include: {
        customer: true,
        orderDetails: {
          include: {
            book: true,
          },
        },
      },
    })

    return NextResponse.json(completeOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
