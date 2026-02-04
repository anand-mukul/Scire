/**
 * Secure Token Storage Module
 * 
 * This module provides a singleton for storing the access token in memory.
 * Unlike localStorage, memory storage is NOT accessible to XSS attacks.
 * 
 * Usage:
 * - setAccessToken(token) - called by AuthContext after login/refresh
 * - getAccessToken() - called by WebSocket client and other services
 * - clearAccessToken() - called on logout
 */

let accessToken: string | null = null;

/**
 * Store access token in memory
 */
export function setAccessToken(token: string | null): void {
    accessToken = token;
}

/**
 * Get the current access token from memory
 */
export function getAccessToken(): string | null {
    return accessToken;
}

/**
 * Clear the access token from memory
 */
export function clearAccessToken(): void {
    accessToken = null;
}

/**
 * Check if a valid token exists
 */
export function hasAccessToken(): boolean {
    return accessToken !== null && accessToken.length > 0;
}
