import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
    description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
            <div className="p-6 rounded-full bg-neutral-900 border border-neutral-800">
                <Construction className="w-12 h-12 text-neutral-500" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-neutral-200">{title}</h1>
                {description && (
                    <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
