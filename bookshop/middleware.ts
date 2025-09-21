import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the user is authenticated for protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const auth = request.cookies.get('auth')
    
    if (!auth || auth.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect to dashboard if already authenticated and trying to access login
  if (request.nextUrl.pathname === '/login') {
    const auth = request.cookies.get('auth')
    
    if (auth && auth.value === 'authenticated') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login'
  ]
}
