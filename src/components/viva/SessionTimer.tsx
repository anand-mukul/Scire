import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useSessionStore } from '@/lib/store/session-store';

export const SessionTimer = () => {
    const expiryTime = useSessionStore(state => state.expiryTime); // Need to add to store
    const [timeLeft, setTimeLeft] = useState<string>("--:--");
    const [isCritical, setIsCritical] = useState(false);

    useEffect(() => {
        if (!expiryTime) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(expiryTime).getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("00:00");
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            setIsCritical(distance < 60000); // Less than 1 minute

        }, 1000);

        return () => clearInterval(interval);
    }, [expiryTime]);

    if (!expiryTime) return null;

    return (
        <Badge variant={isCritical ? "destructive" : "secondary"} className="font-mono text-sm tracking-widest flex gap-2 items-center">
            <Clock className="w-3 h-3" />
            {timeLeft}
        </Badge>
    );
};
