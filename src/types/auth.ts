// Auth type definitions matching backend schemas
// Must stay in sync with: app/core/constants.py and app/schemas/auth_schema.py

/**
 * User roles in the system (matches backend UserRole enum).
 * Values must be UPPERCASE to match backend.
 */
export enum UserRole {
    PLATFORM_ADMIN = 'PLATFORM_ADMIN', // Cross-tenant platform operations (super admin)
    ADMIN = 'ADMIN',                   // Tenant-scoped administrative operations
    INSTRUCTOR = 'INSTRUCTOR',         // Creates and manages exams within tenant
    REVIEWER = 'REVIEWER',             // Reviews flagged sessions within tenant
    STUDENT = 'STUDENT',               // Takes exams within tenant
}

/**
 * Tenant lifecycle status (matches backend TenantStatus enum).
 */
export enum TenantStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    TRIAL = 'TRIAL',
    CHURNED = 'CHURNED',
}

/**
 * Tenant settings from backend TenantSettingsSchema.
 */
export interface TenantSettings {
    viva?: {
        max_duration_minutes?: number;
        min_duration_minutes?: number;
        allow_pause?: boolean;
        allow_retry?: boolean;
        retry_cooldown_hours?: number;
    };
    ai?: {
        strictness?: number;
        model?: string;
        temperature?: number;
        enable_rag?: boolean;
        context_window_size?: number;
    };
    grading?: {
        pass_threshold?: number;
        auto_grade_enabled?: boolean;
        require_manual_review_if_flagged?: boolean;
        grade_rounding?: 'nearest_half' | 'nearest_int' | 'none';
    };
    proctoring?: {
        face_verification_enabled?: boolean;
        voice_verification_enabled?: boolean;
        tab_switch_limit?: number;
        auto_terminate_on_violation?: boolean;
    };
    exceptions?: {
        instructor_self_approve_window_days?: number;
        auto_approve_enabled?: boolean;
        auto_approve_delay_hours?: number;
    };
    compliance?: {
        gdpr_mode?: boolean;
        anonymize_after_days?: number;
        retain_transcripts?: boolean;
        data_residency?: string;
    };
    additional_domains?: string[]; // Allowed email domains for auto-join
    allow_guests?: boolean;        // Allow public access to exams
}

/**
 * User object with multi-tenant context.
 * Matches backend UserResponse + tenant fields from JWT claims.
 */
/**
 * Subscription tiers (matches backend SubscriptionPlan enum).
 */
export enum SubscriptionTier {
    STARTER = 'STARTER',
    PRO = 'PRO',
    ENTERPRISE = 'ENTERPRISE',
}

/**
 * User object with multi-tenant context.
 * Matches backend UserResponse + tenant fields from JWT claims.
 */
export interface User {
    id: string;
    email: string;
    role: UserRole;
    full_name: string;
    is_active: boolean;
    is_anonymized: boolean;
    // Tenant context from JWT claims
    tenant_id: string;
    tenant_slug: string;
    tenant_name?: string;
    tenant_status?: TenantStatus;
    tenant_logo_url?: string;
    tenant_primary_color?: string;
    subscription_tier?: SubscriptionTier | string;
    created_at: string;
    updated_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<User>;
    register: (data: RegisterData) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refetch: () => Promise<User | null>;
}

/**
 * SSO Provider configuration from backend.
 * Matches backend /api/v1/auth/sso/providers response.
 */
export interface SSOProvider {
    id: 'google' | 'microsoft';
    name: string;
    login_url: string;
}

export interface SSOProvidersResponse {
    providers: SSOProvider[];
    sso_enabled: boolean;
}

/**
 * A single linked OAuth provider connection.
 * Matches backend OAuthConnectionOut schema.
 */
export interface OAuthConnection {
    provider: 'google' | 'microsoft';
    provider_email: string | null;
    connected_at: string; // ISO-8601
}

export interface OAuthConnectionsResponse {
    connections: OAuthConnection[];
}

/**
 * Verified user context returned from /auth/verify endpoint.
 * Used by frontend middleware for secure routing decisions.
 */
export interface VerifiedUser {
    id: string;
    email: string;
    role: UserRole;
    full_name: string;
    is_active: boolean;
    tenant_id?: string;
    tenant_slug?: string;
    tenant_name?: string;
    tenant_status?: TenantStatus;
    subscription_tier?: SubscriptionTier | string;
}
