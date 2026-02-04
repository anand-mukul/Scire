/**
 * SECURITY NOTE: This middleware is a UX convenience layer ONLY.
 * It provides client-side routing based on verified backend tokens.
 * ALL authorization is enforced by backend APIs.
 * DO NOT rely on this middleware for security decisions.
 * 
 * This middleware calls the backend /auth/verify endpoint to:
 * - Validate JWT signature
 * - Check token expiration
 * - Verify tenant status
 * - Get user/role/tenant context for routing
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole, TenantStatus, VerifiedUser } from '@/types/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PUBLIC_PATHS = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/terms',
    '/privacy',
    '/about',
    '/contact',
    '/pricing',
    '/docs',
    '/blog',
    '/careers',
    '/security',
    '/cookies',
    '/case-studies',
    '/results/verify',
    '/tenant-suspended',
    '/tenant-not-found',
    '/unauthorized',
];

const BYPASS_PATHS = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
];

const ROLE_LANDING_PAGES: Record<UserRole, string> = {
    [UserRole.PLATFORM_ADMIN]: '/platform',
    [UserRole.ADMIN]: '/admin',
    [UserRole.INSTRUCTOR]: '/instructor',
    [UserRole.REVIEWER]: '/reviewer',
    [UserRole.STUDENT]: '/student',
};

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(path =>
        pathname === path ||
        pathname.startsWith(path + '/')
    );
}

function shouldBypass(pathname: string): boolean {
    return BYPASS_PATHS.some(path => pathname.startsWith(path));
}

/**
 * Verify token with backend server-side validation.
 * 
 * SECURITY: This replaces the unsafe Base64-only decoding.
 * The backend validates:
 * - JWT signature
 * - Token expiration
 * - User active status
 * - Tenant status
 */
async function verifyTokenWithBackend(accessToken: string): Promise<VerifiedUser | null> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/verify`, {
            method: 'GET',
            headers: {
                'Cookie': `access_token=${accessToken}`,
                'Authorization': `Bearer ${accessToken}`,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data as VerifiedUser;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (shouldBypass(pathname)) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('access_token')?.value;
    let verifiedUser: VerifiedUser | null = null;
    let userRole: UserRole | null = null;

    // Verify token with backend (server-side validation)
    if (accessToken) {
        verifiedUser = await verifyTokenWithBackend(accessToken);
        if (verifiedUser) {
            userRole = verifiedUser.role;
        }
    }

    const isAuthenticated = !!verifiedUser;

    // Handle public paths
    if (isPublicPath(pathname)) {
        // Issue 10: Block ALL /auth/* pages for authenticated users (except logout/verify)
        if (isAuthenticated && pathname.startsWith('/auth/')) {
            if (!pathname.includes('/logout') && !pathname.includes('/verify-email')) {
                const landingPage = ROLE_LANDING_PAGES[userRole!] || '/student';
                return NextResponse.redirect(new URL(landingPage, request.url));
            }
        }
        return NextResponse.next();
    }

    // Require authentication for all non-public paths
    if (!isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        // Issue 9: Preserve query parameters in redirect
        loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
        return NextResponse.redirect(loginUrl);
    }


    // SECURITY: All checks below use verified token data only

    // Issue 6: Validate tenant early (before role checks)
    // Issue 7 & 13: Use TenantStatus enum, check all non-ACTIVE states
    if (verifiedUser?.tenant_status &&
        verifiedUser.tenant_status !== TenantStatus.ACTIVE &&
        userRole !== UserRole.PLATFORM_ADMIN) {
        return NextResponse.redirect(new URL('/tenant-suspended', request.url));
    }

    // Issue 8: Tenant ownership validated by backend /auth/verify

    // Role-based route protection (Issues 4, 5)
    if (pathname.startsWith('/platform')) {
        if (userRole !== UserRole.PLATFORM_ADMIN) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        return NextResponse.next();
    }

    if (pathname.startsWith('/admin')) {
        if (userRole !== UserRole.ADMIN) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        return NextResponse.next();
    }

    if (pathname.startsWith('/instructor')) {
        if (userRole !== UserRole.INSTRUCTOR && userRole !== UserRole.ADMIN) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        return NextResponse.next();
    }

    if (pathname.startsWith('/reviewer')) {
        if (userRole !== UserRole.REVIEWER && userRole !== UserRole.ADMIN) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        return NextResponse.next();
    }

    // Issue 4: Fix /student route authorization enforcement
    if (pathname.startsWith('/student')) {
        if (userRole !== UserRole.STUDENT &&
            userRole !== UserRole.ADMIN &&
            userRole !== UserRole.INSTRUCTOR) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        return NextResponse.next();
    }

    // Require tenant for all authenticated non-platform-admin users
    if (!verifiedUser?.tenant_id && userRole !== UserRole.PLATFORM_ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
