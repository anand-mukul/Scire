'use client';

import React from 'react';

export const EvaluationPhase = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-1000">
            <p className="text-muted-foreground text-lg tracking-widest uppercase">
                Processing Response
            </p>
            {/* The Orb handles the main visuals, this provides context */}
        </div>
    );
};
