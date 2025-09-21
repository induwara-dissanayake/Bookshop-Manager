import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET /api/customers - Get all customers
export async function GET(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search
      ? {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { contact: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { registrationNo: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
      : {}

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          orders: {
            select: {
              id: true,
              status: true,
            },
          },
          loans: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.customer.count({ where }),
    ])

    const response = NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

    // Cache for 5 minutes for non-search queries, 1 minute for search queries
    const cacheTime = search ? 60 : 300
    response.headers.set('Cache-Control', `public, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`)

    return response
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { name, contact, registrationNo } = await request.json()

    if (!name || !contact || !registrationNo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if registration number already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        registrationNo: registrationNo.trim(),
      },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Registration number already exists' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        contact: contact.trim(),
        registrationNo: registrationNo.trim(),
        date: new Date(),
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
