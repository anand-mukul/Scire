import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';

export function useStats() {
    return useQuery({
        queryKey: ['stats'],
        queryFn: api.analytics.getStats,
    });
}

export function useExams() {
    return useQuery({
        queryKey: ['exams'],
        queryFn: () => api.exams.list(),
    });
}

export function useSessions(filters?: { status?: string; exam_id?: string; exam_code?: string; review_status?: string; integrity_flag?: boolean; skip?: number; limit?: number }, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: ['sessions', filters],
        queryFn: () => api.sessions.list(filters),
        refetchInterval: options?.refetchInterval,
    });
}

export function useMySessions() {
    return useQuery({
        queryKey: ['my-sessions'],
        queryFn: () => api.sessions.list(),
    });
}

export function useReviewQueue(filters?: { exam_code?: string }) {
    return useQuery({
        queryKey: ['review-queue', filters],
        queryFn: () => api.reviewer.getQueue(filters),
    });
}

export function useLiveBehaviorSummary(sessionId: string, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: ['behavior-summary', sessionId],
        queryFn: () => api.sessions.behaviorSummary(sessionId),
        refetchInterval: options?.refetchInterval,
        enabled: !!sessionId && sessionId.length > 0,
    });
}

export function useLiveBehaviorTimeline(sessionId: string, limit?: number, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: ['behavior-timeline', sessionId, limit],
        queryFn: () => api.sessions.behaviorTimeline(sessionId, limit),
        refetchInterval: options?.refetchInterval,
        enabled: !!sessionId && sessionId.length > 0,
    });
}
