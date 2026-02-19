import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: {
        label: string
        onClick?: () => void
        href?: string
    }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Icon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
                {description}
            </p>
            {action && (
                action.href ? (
                    <Button asChild>
                        <Link href={action.href}>{action.label}</Link>
                    </Button>
                ) : (
                    <Button onClick={action.onClick}>
                        {action.label}
                    </Button>
                )
            )}
        </div>
    )
}
