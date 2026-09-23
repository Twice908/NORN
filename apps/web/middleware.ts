import { auth } from '@/auth'
import { NextResponse, type NextMiddleware } from 'next/server'

const middleware = auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up')
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
}) as unknown as NextMiddleware

export default middleware

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up'],
}
