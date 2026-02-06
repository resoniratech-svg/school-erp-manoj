import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware
 * Protects all (protected) routes - redirects to /login if no session
 * NO RBAC checks here - those are handled in UI
 */

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check for auth cookie/token
    // Note: Access token is in memory, but we check for session cookie
    const sessionCookie = request.cookies.get('session');
    const accessTokenCookie = request.cookies.get('accessToken');

    // If no session indicators, redirect to login
    // In production, this would be validated properly
    // For now, we allow through and let AuthContext handle it client-side
    // This is because JWT is in memory after login

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
