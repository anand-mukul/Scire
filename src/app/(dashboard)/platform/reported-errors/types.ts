export interface ErrorReport {
    id: string;
    status: string; // 'new' | 'investigating' | 'resolved' | 'ignored'
    urgency: string; // 'low' | 'medium' | 'high' | 'critical'
    error_message: string;
    reporter_name?: string;
    reporter_email?: string;
    tenant_name?: string;
    created_at: string;
    browser_info?: { browser: string;[key: string]: any };
    url?: string;
    user_description?: string;
    steps_to_reproduce?: string;
    stack_trace?: string;
}
