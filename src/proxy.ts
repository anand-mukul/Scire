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
    '/auth/callback',
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
    '/request-access',
];

const BYPASS_PATHS = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/recorder-processor.js',
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

async function verifyTokenWithBackend(accessToken: string): Promise<VerifiedUser | null> {
    try {
        const response = await fetch(`${BACKEND_URL}/auth/verify`, {
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

    if (accessToken) {
        verifiedUser = await verifyTokenWithBackend(accessToken);
        if (verifiedUser) {
            userRole = verifiedUser.role;
        }
    }

    const isAuthenticated = !!verifiedUser;

    if (isPublicPath(pathname)) {
        if (isAuthenticated && pathname.startsWith('/auth/')) {
            if (!pathname.includes('/logout') && !pathname.includes('/verify-email')) {
                const landingPage = ROLE_LANDING_PAGES[userRole!] || '/student';
                return NextResponse.redirect(new URL(landingPage, request.url));
            }
        }
        return NextResponse.next();
    }

    if (!isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
        return NextResponse.redirect(loginUrl);
    }

    // Suspended tenant check — allow admins to reach billing settings so they can pay to reactivate
    if (verifiedUser?.tenant_status &&
        !(verifiedUser.tenant_status === TenantStatus.ACTIVE || verifiedUser.tenant_status === TenantStatus.TRIAL) &&
        userRole !== UserRole.PLATFORM_ADMIN) {
        // Allow tenant admins to access billing/settings even when suspended
        const isBillingPath = pathname.startsWith('/admin/settings');
        if (!isBillingPath || userRole !== UserRole.ADMIN) {
            return NextResponse.redirect(new URL('/tenant-suspended', request.url));
        }
    }

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
        if (userRole !== UserRole.REVIEWER && userRole !== UserRole.ADMIN && userRole !== UserRole.INSTRUCTOR) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        return NextResponse.next();
    }

    if (pathname.startsWith('/student')) {
        if (userRole !== UserRole.STUDENT) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        return NextResponse.next();
    }

    if (!verifiedUser?.tenant_id && userRole !== UserRole.PLATFORM_ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|recorder-processor\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
