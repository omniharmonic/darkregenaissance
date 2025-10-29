import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for the admin dashboard
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check for authentication
    const authCookie = request.cookies.get('admin-auth');

    // If no auth cookie and not on login page, redirect to login
    if (!authCookie && !request.nextUrl.pathname.startsWith('/admin/login')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // If has auth cookie but on login page, redirect to dashboard
    if (authCookie && request.nextUrl.pathname === '/admin/login') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Check API routes
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const authCookie = request.cookies.get('admin-auth');

    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};