import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET /api/authors - Get all authors
export async function GET(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where = search
      ? {
        name: { contains: search, mode: Prisma.QueryMode.insensitive },
      }
      : {}

    const authors = await prisma.author.findMany({
      where,
      include: {
        _count: { select: { books: true } }
      },
      orderBy: { name: 'asc' },
    })

    const total = await prisma.author.count({ where })

    const response = NextResponse.json({ authors, total })

    // Cache authors for 10 minutes (they don't change often)
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')

    return response
  } catch (error) {
    console.error('Error fetching authors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/authors - Create a new author
export async function POST(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { name } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Author name is required' },
        { status: 400 }
      )
    }

    // Check if author already exists
    const existingAuthor = await prisma.author.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    })

    if (existingAuthor) {
      return NextResponse.json(
        { error: 'Author with this name already exists' },
        { status: 400 }
      )
    }

    const author = await prisma.author.create({
      data: {
        name: name.trim(),
        // Do NOT set id or author_id here; let the database autoincrement
      },
    })

    return NextResponse.json(author, { status: 201 })
  } catch (error) {
    console.error('Error creating author:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/authors - Delete an author
export async function DELETE(request: NextRequest) {
  if (!checkAuth()) {
    return createUnauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const authorId = searchParams.get('id')

    if (!authorId) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      )
    }

    const authorIdNum = parseInt(authorId)
    if (isNaN(authorIdNum)) {
      return NextResponse.json(
        { error: 'Invalid author ID' },
        { status: 400 }
      )
    }

    // Check if author exists
    const author = await prisma.author.findUnique({
      where: { id: authorIdNum },
      include: {
        books: true
      }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }

    // Check if author has books
    if (author.books.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete author with existing books. Please remove all books first.' },
        { status: 400 }
      )
    }

    // Delete author
    await prisma.author.delete({
      where: { id: authorIdNum }
    })

    return NextResponse.json({
      message: 'Author deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting author:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
