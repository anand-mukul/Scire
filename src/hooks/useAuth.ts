"use client";

import { useEffect, useState } from "react";
// import { parseCookies } from "nookies";

export function useAuth() {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Try getting from localStorage first (common pattern)
        let foundToken = localStorage.getItem("accessToken");

        // Fallback to cookie
        if (!foundToken) {
            const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
            if (match) foundToken = match[2];
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(foundToken);
        setIsLoading(false);
    }, []);

    return { token, isLoading };
}
