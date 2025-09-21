import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/authors/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!checkAuth()) {
        return createUnauthorizedResponse()
    }

    try {
        const authorId = parseInt(params.id)
        if (isNaN(authorId)) {
            return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 })
        }

        const author = await prisma.author.findUnique({
            where: { id: authorId },
            include: {
                _count: { select: { books: true } }
            }
        })

        if (!author) {
            return NextResponse.json({ error: 'Author not found' }, { status: 404 })
        }

        return NextResponse.json({ author })
    } catch (error) {
        console.error('Error fetching author:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/authors/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!checkAuth()) {
        return createUnauthorizedResponse()
    }

    try {
        const authorId = parseInt(params.id)
        if (isNaN(authorId)) {
            return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 })
        }

        const { name } = await request.json()
        if (!name || String(name).trim() === '') {
            return NextResponse.json({ error: 'Author name is required' }, { status: 400 })
        }

        const updated = await prisma.author.update({
            where: { id: authorId },
            data: { name: String(name).trim() }
        })

        return NextResponse.json({ author: updated, message: 'Author updated successfully' }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
        console.error('Error updating author:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/authors/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!checkAuth()) {
        return createUnauthorizedResponse()
    }

    try {
        const authorId = parseInt(params.id)
        if (isNaN(authorId)) {
            return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 })
        }

        // Prevent deleting if author has books
        const hasBooks = await prisma.book.findFirst({ where: { authorId: authorId }, select: { id: true } })
        if (hasBooks) {
            return NextResponse.json(
                { error: 'Cannot delete author with existing books. Please remove all books first.' },
                { status: 400 }
            )
        }

        await prisma.author.delete({ where: { id: authorId } })
        return NextResponse.json({ message: 'Author deleted successfully' }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
        console.error('Error deleting author:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


