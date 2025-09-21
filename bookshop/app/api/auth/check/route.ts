import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (checkAuth()) {
    return NextResponse.json({ authenticated: true })
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
