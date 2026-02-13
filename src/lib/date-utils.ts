/**
 * Date formatting utilities for consistent timezone handling.
 * 
 * Backend stores all dates in UTC.
 * Frontend displays dates in user's local timezone.
 */

/**
 * Format a UTC date string to user's local timezone
 */
export function formatToLocalDate(utcDate: string | Date | undefined | null): string {
    if (!utcDate) return 'N/A';

    try {
        const date = new Date(utcDate);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'N/A';
    }
}

/**
 * Format a UTC date string to user's local time
 */
export function formatToLocalTime(utcDate: string | Date | undefined | null): string {
    if (!utcDate) return 'N/A';

    try {
        const date = new Date(utcDate);
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'N/A';
    }
}

/**
 * Format a UTC date string to user's local datetime
 */
export function formatToLocalDateTime(utcDate: string | Date | undefined | null): string {
    if (!utcDate) return 'N/A';

    try {
        const date = new Date(utcDate);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'N/A';
    }
}

/**
 * Format a UTC date string to relative time (e.g., "2 hours ago")
 */
export function formatToRelativeTime(utcDate: string | Date | undefined | null): string {
    if (!utcDate) return 'N/A';

    try {
        const date = new Date(utcDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return formatToLocalDate(utcDate);
    } catch {
        return 'N/A';
    }
}

/**
 * Calculate duration between two UTC dates in minutes
 */
export function calculateDurationMinutes(
    startDate: string | Date | undefined | null,
    endDate: string | Date | undefined | null
): number | null {
    if (!startDate || !endDate) return null;

    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.round((end.getTime() - start.getTime()) / 60000);
    } catch {
        return null;
    }
}

/**
 * Format duration in a human-readable format
 */
export function formatDuration(
    startDate: string | Date | undefined | null,
    endDate: string | Date | undefined | null
): string {
    const mins = calculateDurationMinutes(startDate, endDate);
    if (mins === null) return 'N/A';

    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0
        ? `${hours}h ${remainingMins}m`
        : `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Get the user's IANA timezone name (e.g., "Asia/Kolkata")
 */
export function getUserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
}

/**
 * Get a short timezone abbreviation (e.g., "IST", "EST")
 */
export function getTimezoneAbbreviation(): string {
    try {
        const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date());
        return parts.find(p => p.type === 'timeZoneName')?.value || 'UTC';
    } catch {
        return 'UTC';
    }
}

/**
 * Format a UTC date to local datetime WITH timezone label
 * e.g., "Feb 13, 2026, 4:00 PM IST"
 */
export function formatToLocalDateTimeWithTZ(utcDate: string | Date | undefined | null): string {
    if (!utcDate) return 'N/A';

    try {
        const date = new Date(utcDate);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
        });
    } catch {
        return 'N/A';
    }
}
