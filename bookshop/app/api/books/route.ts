import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'
import { cache, cacheKeys } from '@/lib/cache'
import { Prisma } from '@prisma/client'

// GET /api/books - Get all books with pagination and search
export async function GET(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Check cache first
    const cacheKey = cacheKeys.books(page, limit, search)
    const cachedData = cache.get(cacheKey)

    if (cachedData) {
      const response = NextResponse.json(cachedData)
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      return response
    }

    const skip = (page - 1) * limit

    const where = search
      ? {
        OR: [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { authorName: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { isbn: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
      : {}

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          author: true,
        },
        skip,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      prisma.book.count({ where }),
    ])

    const data = {
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    // Cache the result
    const cacheTime = search ? 60 : 300
    cache.set(cacheKey, data, cacheTime)

    // Prevent stale cache after writes elsewhere by disabling ISR for this fetch
    return NextResponse.json(data, { headers: { 'Cache-Control': `no-store, max-age=0` } })
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/books - Create a new book
export async function POST(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { name, authorId, isbn, price, qty } = await request.json()

    // Validate required fields
    if (!name || !authorId || !isbn || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get author name
    const author = await prisma.author.findUnique({
      where: { id: authorId },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }

    // Create book
    const book = await prisma.book.create({
      data: {
        name,
        authorId,
        authorName: author.name,
        isbn,
        price: parseInt(price),
        qty: parseInt(qty) || 0,
      },
      include: {
        author: true,
      },
    })

    // Invalidate books cache
    cache.clearPattern('^books:')

    const response = NextResponse.json(book, { status: 201 })

    // Invalidate cache for books list
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')

    return response
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
