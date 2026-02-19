import { TableRow, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TableSkeletonProps {
    rows?: number
    columns?: number
    columnWidths?: string[]
}

export function TableSkeleton({
    rows = 5,
    columns = 5,
    columnWidths = []
}: TableSkeletonProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: columns }).map((_, j) => (
                        <TableCell key={j}>
                            <Skeleton
                                className={cn(
                                    "h-4",
                                    columnWidths[j] || "w-full"
                                )}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    )
}
