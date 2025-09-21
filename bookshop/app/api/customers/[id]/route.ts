import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const customerId = parseInt(params.id)

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const response = NextResponse.json({ customer })

    // Cache individual customer for 10 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')

    return response
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const customerId = parseInt(params.id)

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, contact, registrationNo } = body

    // Validate required fields
    if (!name || !contact || !registrationNo) {
      return NextResponse.json(
        { error: 'Name, contact, and registration number are required' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        contact,
        registrationNo
      }
    })

    return NextResponse.json({
      customer: updatedCustomer,
      message: 'Customer updated successfully'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const customerId = parseInt(params.id)

    if (isNaN(customerId)) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if customer has any active/pending orders (status 0 = pending)
    const activeOrderCount = await prisma.order.count({
      where: {
        customerId: customerId,
        status: 0 // Only check for pending orders
      }
    })

    if (activeOrderCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with pending orders. Please complete or cancel all pending orders first.' },
        { status: 400 }
      )
    }

    // Delete customer and all related data in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Delete payments first (they reference orders)
        await tx.payment.deleteMany({
          where: { customerId }
        })

        // Delete order details
        await tx.orderDetail.deleteMany({
          where: { customerId }
        })

        // Delete orders (even completed ones)
        await tx.order.deleteMany({
          where: { customerId }
        })

        // Delete loans
        await tx.loan.deleteMany({
          where: { customerId }
        })

        // Finally delete customer
        await tx.customer.delete({
          where: { id: customerId }
        })
      })
    } catch (transactionError) {
      console.error('Transaction error:', transactionError)

      // If transaction fails, try individual deletions as fallback
      try {
        await prisma.payment.deleteMany({ where: { customerId } })
        await prisma.orderDetail.deleteMany({ where: { customerId } })
        await prisma.order.deleteMany({ where: { customerId } })
        await prisma.loan.deleteMany({ where: { customerId } })
        await prisma.customer.delete({ where: { id: customerId } })
      } catch (fallbackError) {
        console.error('Fallback deletion failed:', fallbackError)
        throw new Error('Failed to delete customer and related data')
      }
    }

    return NextResponse.json({
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
