import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/customers/[id]/history?search=
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    if (!checkAuth()) {
        return createUnauthorizedResponse()
    }

    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')?.trim() || ''

        const customerId = parseInt(params.id)
        if (isNaN(customerId)) {
            return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
        }

        const whereDetail: any = {
            customerId,
        }

        if (search) {
            whereDetail.OR = [
                { bookName: { contains: search, mode: 'insensitive' } },
                { authorName: { contains: search, mode: 'insensitive' } },
            ]
        }

        const history = await prisma.orderDetail.findMany({
            where: whereDetail,
            include: {
                order: true,
                book: true
            },
            orderBy: { orderId: 'desc' }
        })

        return NextResponse.json({ history })
    } catch (error) {
        console.error('Error fetching customer history:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


