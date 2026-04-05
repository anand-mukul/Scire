'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';

interface LogoProps {
    className?: string;
    textClassName?: string;
    iconClassName?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    showIcon?: boolean;
    href?: string;
    forceDefaultBranding?: boolean;
}

export const Logo = ({
    className,
    textClassName,
    iconClassName,
    size = 'md',
    showText = true,
    showIcon = true,
    href = '/',
    forceDefaultBranding = false
}: LogoProps) => {
    const tenant = useTenant();
    const logoSrc = (!forceDefaultBranding && tenant?.tenantLogoUrl) ? tenant.tenantLogoUrl : "/brand-logo.png";
    const displayName = (!forceDefaultBranding && tenant?.tenantName) ? tenant.tenantName : "Scire";

    const sizeMap = {
        sm: { icon: 28, container: 'rounded-lg', text: 'text-xl', gap: 'gap-1.5' },
        md: { icon: 36, container: 'rounded-xl', text: 'text-2xl', gap: 'gap-2' },
        lg: { icon: 44, container: 'rounded-xl', text: 'text-3xl', gap: 'gap-2.5' },
        xl: { icon: 56, container: 'rounded-2xl', text: 'text-4xl', gap: 'gap-3' },
    };

    const s = sizeMap[size];

    const Content = () => (
        <div className={cn('inline-flex items-center group', s.gap, className)}>
            {showIcon && (
                <div
                    className={cn(
                        'relative flex-shrink-0 group-hover:scale-105 transition-transform duration-300',
                        s.container,
                        iconClassName
                    )}
                    style={{ width: s.icon, height: s.icon }}
                >
                    <Image
                        src={logoSrc}
                        alt={displayName}
                        fill
                        priority
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            )}
            {showText && (
                <span
                    className={cn(
                        'font-bold tracking-tight group-hover:brightness-110 transition-all',
                        'bg-clip-text text-transparent bg-[image:var(--brand-gradient-text)]',
                        s.text,
                        textClassName
                    )}
                >
                    {displayName}
                </span>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="inline-block outline-none">
                <Content />
            </Link>
        );
    }

    return <Content />;
};
