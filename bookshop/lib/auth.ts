import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export function checkAuth() {
  const cookieStore = cookies()
  const auth = cookieStore.get('auth')
  
  if (!auth || auth.value !== 'authenticated') {
    return false
  }
  
  return true
}

export function createUnauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}
