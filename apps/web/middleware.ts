import { auth } from './auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthed = !!req.auth

  // Protect /dashboard/*
  if (pathname.startsWith('/dashboard') && !isAuthed) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect authed users away from auth pages
  if (pathname === '/login' && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Exclude /api/widget/* and /api/stripe/webhook from auth
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/api/experiments/:path*',
    '/api/stripe/checkout',
    '/api/cron/:path*',
  ],
}
