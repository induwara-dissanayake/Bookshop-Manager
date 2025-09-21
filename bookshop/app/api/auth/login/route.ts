import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Simple authentication check against environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'smartbookshop'
    const adminPassword = process.env.ADMIN_PASSWORD || 'thilan'

    if (username === adminUsername && password === adminPassword) {
      // Set authentication cookie
      const cookieStore = cookies()
      cookieStore.set('auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
