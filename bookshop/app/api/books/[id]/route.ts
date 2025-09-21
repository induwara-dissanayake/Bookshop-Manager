import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'
import { cache, cacheKeys } from '@/lib/cache'

// GET /api/books/[id] - Get a specific book
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const bookId = parseInt(params.id)

    // Check cache first
    const cacheKey = cacheKeys.book(bookId)
    const cachedBook = cache.get(cacheKey)

    if (cachedBook) {
      const response = NextResponse.json(cachedBook)
      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
      return response
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        author: true,
        orderDetails: {
          include: {
            order: true,
            customer: true,
          },
        },
      },
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Cache the book for 10 minutes
    cache.set(cacheKey, book, 600)

    const response = NextResponse.json(book)

    // Cache individual book for 10 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')

    return response
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/books/[id] - Update a book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { name, authorId, isbn, price, qty } = await request.json()
    const bookId = parseInt(params.id)

    // Get author name if authorId is provided
    let authorName: string | undefined
    if (authorId) {
      const author = await prisma.author.findUnique({
        where: { id: authorId },
      })

      if (!author) {
        return NextResponse.json(
          { error: 'Author not found' },
          { status: 404 }
        )
      }

      authorName = author.name
    }

    // Update book with simplified quantity system
    const book = await prisma.book.update({
      where: { id: bookId },
      data: {
        ...(name && { name }),
        ...(authorId && { authorId, authorName }),
        ...(isbn && { isbn }),
        ...(price && { price: parseInt(price) }),
        ...(qty !== undefined && { qty: parseInt(qty) }),
      },
      include: {
        author: true,
      },
    })

    // Invalidate caches
    cache.delete(cacheKeys.book(bookId))
    cache.clearPattern('^books:')

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/books/[id] - Delete a book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const bookId = parseInt(params.id)

    // Check if book has any active/pending order details (status 0 = pending)
    const activeOrderDetails = await prisma.orderDetail.findFirst({
      where: {
        bookId,
        status: 0 // Only check for pending orders
      },
    })

    if (activeOrderDetails) {
      return NextResponse.json(
        { error: 'Cannot delete book with pending orders. Please complete or cancel all pending orders first.' },
        { status: 400 }
      )
    }

    // Delete book and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete order details (even completed ones)
      await tx.orderDetail.deleteMany({
        where: { bookId },
      })

      // Finally delete book
      await tx.book.delete({
        where: { id: bookId },
      })
    })

    // Invalidate caches
    cache.delete(cacheKeys.book(bookId))
    cache.clearPattern('^books:')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
