import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()

  // Clear all auth-related cookies
  const cookieNames = [
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'authjs.callback-url',
    '__Secure-authjs.callback-url',
    'authjs.csrf-token',
    '__Secure-authjs.csrf-token',
  ]

  for (const name of cookieNames) {
    cookieStore.delete(name)
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  return POST()
}
