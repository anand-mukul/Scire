import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for merging classes

interface LogoProps {
    className?: string;
    textClassName?: string;
    iconClassName?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    showIcon?: boolean;
    href?: string;
}

export const Logo = ({
    className,
    textClassName,
    iconClassName,
    size = 'md',
    showText = true,
    showIcon = true,
    href = '/'
}: LogoProps) => {
    // Size maps
    const sizeMap = {
        sm: {
            container: 'w-8 h-8 rounded-lg text-sm',
            text: 'text-xl',
        },
        md: {
            container: 'w-10 h-10 rounded-xl text-lg',
            text: 'text-2xl',
        },
        lg: {
            container: 'w-12 h-12 rounded-xl text-xl',
            text: 'text-3xl',
        },
        xl: {
            container: 'w-16 h-16 rounded-2xl text-2xl',
            text: 'text-4xl',
        },
    };

    const Content = () => (
        <div className={cn('inline-flex items-center gap-2 group', className)}>
            {showIcon && (
                <div
                    className={cn(
                        'bg-[image:var(--brand-gradient-bg)] flex items-center justify-center text-white font-bold shadow-[var(--brand-glow)] group-hover:scale-105 transition-transform duration-300',
                        sizeMap[size].container,
                        iconClassName
                    )}
                >
                    S
                </div>
            )}
            {showText && (
                <span
                    className={cn(
                        'font-bold bg-clip-text text-transparent bg-[image:var(--brand-gradient-text)] tracking-tight group-hover:brightness-110 transition-all',
                        sizeMap[size].text,
                        textClassName
                    )}
                >
                    Scire
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
