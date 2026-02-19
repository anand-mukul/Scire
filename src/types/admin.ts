export interface AdminStats {
    total_users: number;
    users_by_role: Record<string, number>;
    active_sessions: number;
    flagged_sessions: number;
    total_exams: number;
    active_exams: number;
    completed_sessions: number;
    avg_score: number;
}

export interface AuditLog {
    id: string;
    action: string;
    user_id?: string;
    created_at: string;
    metadata?: Record<string, unknown>;
}
