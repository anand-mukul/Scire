import { cn } from "@/lib/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 rounded-xl group/bento hover:shadow-2xl transition duration-300 shadow-none bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/10 dark:hover:border-orange-500/20 relative overflow-hidden flex flex-col hover:-translate-y-1 transform-gpu",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100/50 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover/bento:opacity-100 transition duration-500" />

            <div className="relative z-20 h-full flex flex-col justify-end pointer-events-none">
                <div className="mt-auto p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent dark:from-black/90 dark:via-black/60 dark:to-transparent pt-24 pb-6 transition-all duration-300 group-hover/bento:pt-20">
                    <div className="pointer-events-auto flex flex-col items-start">
                        <div className="mb-4 p-2 w-fit rounded-lg bg-orange-500/10 backdrop-blur-md border border-orange-500/20 text-white shadow-sm group-hover/bento:bg-orange-500/20 group-hover/bento:scale-110 group-hover/bento:rotate-2 transition-all duration-300">
                            {icon}
                        </div>
                        <div className="font-sans font-bold text-lg text-white mb-1 tracking-tight leading-none drop-shadow-md group-hover/bento:text-orange-50 transition-colors">
                            {title}
                        </div>
                        <div className="font-sans font-normal text-xs text-neutral-300 tracking-tight leading-snug max-w-xs drop-shadow-sm group-hover/bento:text-white transition-colors duration-300">
                            {description}
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 z-10">
                {header}
            </div>
        </div>
    );
};
