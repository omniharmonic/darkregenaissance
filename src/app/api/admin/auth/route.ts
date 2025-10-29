import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Check against environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log('Auth attempt:', { 
      hasPassword: !!password, 
      hasEnvPassword: !!adminPassword,
      env: process.env.NODE_ENV 
    });

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set!');
      return NextResponse.json({ 
        error: 'Admin password not configured in environment variables. Please add ADMIN_PASSWORD to Vercel.' 
      }, { status: 500 });
    }

    if (password !== adminPassword) {
      console.log('Password mismatch');
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    console.log('Auth successful');

    // Set secure cookie with expiration
    const cookieStore = cookies();
    const authToken = Buffer.from(`admin:${Date.now()}`).toString('base64');

    cookieStore.set('admin-auth', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if user is authenticated
    const cookieStore = cookies();
    const authCookie = cookieStore.get('admin-auth');

    if (authCookie) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clear the auth cookie
    const cookieStore = cookies();
    cookieStore.delete('admin-auth');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}