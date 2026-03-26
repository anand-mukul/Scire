export enum ExamStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED'
}

export enum KBStatus {
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    FAILED = 'FAILED'
}

export enum SessionStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    TERMINATED = 'TERMINATED',
    ABANDONED = 'ABANDONED'
}

export enum ReviewStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    FLAGGED = 'FLAGGED',
    UNDER_REVIEW = 'UNDER_REVIEW',
    REJECTED = 'REJECTED'
}

export enum TranscriptSpeaker {
    ASSISTANT = 'ASSISTANT',
    STUDENT = 'STUDENT',
    SYSTEM = 'SYSTEM'
}

export enum TenantStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    TRIAL = 'TRIAL',
    CHURNED = 'CHURNED'
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    is_anonymized: boolean;
    created_at: string;
    updated_at: string;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    status: TenantStatus;
    subscription_tier: string;
    max_students?: number;
    max_exams_per_month?: number;
    trial_ends_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Rubric {
    id: string;
    exam_id: string;
    criterion: string;
    weight: string;
    constraints?: Record<string, unknown>;
    is_mandatory: boolean;
    order_index: number;
}

export interface ExamSettings {
    duration_minutes: number;
    strict_mode: boolean;
    number_of_questions?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Exam {
    id: string;
    title: string;
    created_by: string;
    status: ExamStatus;
    exam_code: string;
    settings?: ExamSettings;
    syllabus_url?: string;
    kb_status?: KBStatus | null;
    max_attempts: number;
    subject_id?: string;
    is_public: boolean;
    auto_publish: boolean;
    start_time?: string;
    end_time?: string;
    created_at: string;
    updated_at: string;
    candidates_count?: number;
}

export interface VivaSession {
    id: string;
    exam_id: string;
    student_id: string;
    attempt_number: number;
    status: SessionStatus;
    onboarding_accepted: boolean;
    snapshot_url?: string;
    result_token?: string;
    final_score?: number;
    confidence_score?: number;
    integrity_flag: boolean;
    review_status: ReviewStatus;
    review_notes?: string;
    assigned_reviewer_id?: string;
    created_at: string;
    updated_at?: string;
    start_time?: string;
    end_time?: string;
    student?: User;
    exam?: Exam;
    transcripts?: Transcript[];
    integrity_report?: {
        flagged_count: number;
        total_snapshots: number;
        reasons: string[];
        is_clean: boolean;
    };
}

export interface Transcript {
    id: string;
    session_id: string;
    turn_index: number;
    speaker: TranscriptSpeaker;
    text_content: string;
    audio_url?: string;
    latency_ms?: number;
    is_final: boolean;
    created_at: string;
}

export interface GradingDetail {
    id: string;
    session_id: string;
    rubric_id: string;
    score_awarded: number;
    passed: boolean;
    ai_reasoning: string;
    confidence: number;
    evaluated_at: string;
    needs_human_review?: boolean;
}

export interface ReviewRequest {
    status: string;
    notes?: string;
    final_score_override?: number;
}

export interface Department {
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    description?: string;
    head_user_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Subject {
    id: string;
    tenant_id: string;
    department_id: string;
    name: string;
    code: string;
    description?: string;
    credits?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface Notification {
    id: string;
    type: string;
    priority: NotificationPriority;
    title: string;
    message: string | null;
    action_url: string | null;
    is_read: boolean;
    read_at: string | null;
    source_service: string | null;
    correlation_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    expires_at: string | null;
}

export interface NotificationListResponse {
    notifications: Notification[];
    unread_count: number;
    total: number;
}

export interface NotificationPreference {
    id: string;
    channel_in_app: boolean;
    channel_email: boolean;
    channel_push: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    quiet_hours_tz: string;
    type_overrides: Record<string, unknown>;
}

