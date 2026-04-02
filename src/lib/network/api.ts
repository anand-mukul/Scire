import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { LoginCredentials, RegisterData, User, AuthTokens, SSOProvidersResponse, OAuthConnectionsResponse } from '@/types/auth';
import { Exam, ExamStatus, ExamSettings, VivaSession, Rubric, GradingDetail, ExamException, ExamExceptionListResponse, ExamExceptionBatchCreate, ExamExceptionApprove, ExamExceptionReject, VerifyEmailsResponse } from '@/types/backend';
import { AdminStats, AuditLog } from '@/types/admin';
import { getAccessToken, setAccessToken } from '@/lib/auth-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    console.error('NEXT_PUBLIC_API_URL environment variable is not set');
}

const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return '/api';
    }
    return API_URL || 'http://localhost:8000/api/v1';
};

export const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 30000,
});

const getAuthBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return '/api';
    }
    return API_URL || 'http://localhost:8000/api/v1';
};

export const authClient = axios.create({
    baseURL: getAuthBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: string | null) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// This ensures the token stored by AuthContext reaches the backend even when
// cookies are not available (cross-origin, mobile webviews, etc.).
apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

authClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && !config.url?.includes('/auth/refresh')) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/register') &&
            !originalRequest.url?.includes('/auth/me')
        ) {
            if (isRefreshing) {
                return new Promise<string | null>((resolve, reject) => {
                    failedQueue.push({ resolve: (val) => resolve(val || null), reject });
                }).then((token) => {
                    if (token) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data: refreshData } = await authClient.post<{ access_token?: string }>('/auth/refresh');
                // CRITICAL: Store the refreshed token in memory so WebSocket
                // and other non-cookie consumers can access it
                if (refreshData?.access_token) {
                    setAccessToken(refreshData.access_token);
                    originalRequest.headers.Authorization = `Bearer ${refreshData.access_token}`;
                }
                processQueue(null, refreshData?.access_token || null);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as Error);
                if (typeof window !== 'undefined') {
                    window.location.href = '/auth/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        const errorData = error.response?.data as { detail?: string; message?: string } | undefined;
        const errorMessage =
            errorData?.detail ||
            errorData?.message ||
            error.message ||
            'An unexpected error occurred';

        return Promise.reject(new Error(errorMessage));
    }
);

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                if (error instanceof Error && error.message.includes('401')) return false;
                if (error instanceof Error && error.message.includes('403')) return false;
                return failureCount < 2;
            },
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
        },
        mutations: {
            retry: false,
        },
    },
});

export const api = {
    auth: {
        me: async (): Promise<User> => {
            const { data } = await authClient.get<User>('/auth/me');
            return data;
        },
        login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
            const { data } = await authClient.post<AuthTokens>('/auth/login', credentials);
            return data;
        },
        register: async (userData: RegisterData): Promise<User> => {
            const { data } = await authClient.post<User>('/auth/register', userData);
            return data;
        },
        refresh: async (): Promise<AuthTokens> => {
            const { data } = await authClient.post<AuthTokens>('/auth/refresh');
            return data;
        },
        logout: async (): Promise<{ message: string }> => {
            const { data } = await authClient.post<{ message: string }>('/auth/logout');
            return data;
        },
        changePassword: async (data: Record<string, unknown>) => {
            return authClient.post('/auth/change-password', data);
        },
        forgotPassword: async (email: string) => {
            return authClient.post('/auth/forgot-password', { email });
        },
        resetPassword: async (token: string, password: string) => {
            return authClient.post('/auth/reset-password', { token, new_password: password });
        },
        verifyEmail: async (token: string) => {
            const { data } = await authClient.post<{ message: string }>('/auth/verify-email', { token });
            return data;
        },
        resendVerification: async (email: string) => {
            const { data } = await authClient.post<{ message: string }>('/auth/resend-verification', { email });
            return data;
        },
        updateProfile: async (data: { full_name?: string; email?: string }) => {
            const { data: response } = await authClient.patch<User>('/auth/me', data);
            return response;
        },
    },

    sso: {
        getProviders: async (): Promise<SSOProvidersResponse> => {
            const { data } = await apiClient.get<SSOProvidersResponse>('/auth/sso/providers');
            return data;
        },
        /**
         * Returns the backend URL that initiates the OAuth flow.
         * When action === 'link', the backend will embed the current
         * user session into the CSRF state so the callback can link
         * the provider to the existing account instead of logging in.
         */
        getLoginUrl: (
            provider: 'google' | 'microsoft',
            action: 'login' | 'link' = 'login',
        ): string => {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const base = `${backendUrl}/auth/sso/${provider}/login`;
            return action === 'link' ? `${base}?action=link` : base;
        },
        /** Fetch all OAuth providers currently linked to the signed-in user. */
        getConnections: async (): Promise<OAuthConnectionsResponse> => {
            const { data } = await apiClient.get<OAuthConnectionsResponse>('/auth/sso/connections');
            return data;
        },
        /** Remove a linked OAuth provider from the signed-in user's account. */
        unlinkConnection: async (provider: 'google' | 'microsoft'): Promise<{ message: string }> => {
            const { data } = await apiClient.delete<{ message: string }>(`/auth/sso/connections/${provider}`);
            return data;
        },
    },

    exams: {
        join: async (code: string) => {
            const { data } = await apiClient.post<VivaSession>('/exams/join', { exam_code: code });
            return data;
        },
        create: async (data: { title: string; settings?: ExamSettings; max_attempts?: number; start_time?: string; end_time?: string; subject_id?: string; is_public?: boolean; auto_publish?: boolean }) => {
            const { data: response } = await apiClient.post<Exam>('/exams', data);
            return response;
        },
        list: async (params?: { exam_status?: ExamStatus; created_by?: string; skip?: number; limit?: number }) => {
            const { data } = await apiClient.get<Exam[]>('/exams', { params });
            return data;
        },
        get: async (id: string) => {
            const { data } = await apiClient.get<Exam>(`/exams/${id}`);
            return data;
        },
        update: async (id: string, data: { status?: ExamStatus; max_attempts?: number; title?: string; settings?: ExamSettings; subject_id?: string | null; is_public?: boolean; start_time?: string | null; end_time?: string | null; auto_publish?: boolean }) => {
            const { data: response } = await apiClient.patch<Exam>(`/exams/${id}`, data);
            return response;
        },
        delete: async (id: string) => {
            await apiClient.delete(`/exams/${id}`);
        },
        getRubrics: async (examId: string) => {
            const { data } = await apiClient.get<Rubric[]>(`/exams/${examId}/rubrics`);
            return data;
        },
        addRubric: async (examId: string, data: Record<string, unknown>) => {
            const { data: response } = await apiClient.post(`/exams/${examId}/rubrics`, data);
            return response;
        },
        deleteRubric: async (examId: string, rubricId: string) => {
            await apiClient.delete(`/exams/${examId}/rubrics/${rubricId}`);
        },
        deleteSyllabus: async (examId: string) => {
            await apiClient.delete(`/exams/${examId}/media/syllabus`);
        },
        getKnowledgeBase: async (examId: string) => {
            const { data } = await apiClient.get<Record<string, unknown>[]>(`/exams/${examId}/knowledge-base`);
            return data;
        },
        retryIngestion: async (examId: string) => {
            const { data } = await apiClient.post(`/exams/${examId}/media/retry-ingestion`);
            return data;
        },
    },

    sessions: {
        start: async (sessionId: string) => {
            const { data } = await apiClient.post(`/sessions/${sessionId}/start`);
            return data;
        },
        submitOnboarding: async (sessionId: string, snapshot: Blob, faceDescriptor?: number[]) => {
            const { data: presignData } = await apiClient.post<{ upload_url: string; file_url: string }>(
                `/sessions/${sessionId}/media/presign`,
                {
                    purpose: 'identity_snapshot',
                    content_type: 'image/png',
                    file_size: snapshot.size,
                }
            );

            await axios.put(presignData.upload_url, snapshot, {
                headers: {
                    'Content-Type': 'image/png',
                },
                timeout: 60000,
            });

            await apiClient.post(`/sessions/${sessionId}/media/confirm`, {
                purpose: 'identity_snapshot',
                file_url: presignData.file_url,
                ...(faceDescriptor && { face_descriptor: faceDescriptor })
            });

            const { data } = await apiClient.post(`/sessions/${sessionId}/onboarding`, {
                accepted: true
            });

            return data;
        },
        getStatus: async (sessionId: string) => {
            const { data } = await apiClient.get(`/sessions/${sessionId}`);
            return data;
        },
        list: async (params?: { status?: string; exam_id?: string; exam_code?: string; review_status?: string; integrity_flag?: boolean; skip?: number; limit?: number }) => {
            const { data } = await apiClient.get('/sessions', { params });
            return data;
        },
        end: async (sessionId: string) => {
            const { data } = await apiClient.post<VivaSession>(`/sessions/${sessionId}/end`);
            return data;
        },
        terminate: async (sessionId: string, reason: string) => {
            const { data } = await apiClient.post<VivaSession>(`/sessions/${sessionId}/terminate`, null, {
                params: { reason }
            });
            return data;
        },
        verifyResult: async (token: string) => {
            const { data } = await apiClient.get<VivaSession>(`/sessions/verify-result/${token}`);
            return data;
        },
        gradeOverride: async (sessionId: string, data: { final_score: number; confidence_score: number; reason: string }) => {
            const { data: response } = await apiClient.put(`/sessions/${sessionId}/grade`, data);
            return response;
        },
        assignReviewer: async (sessionId: string, reviewerId: string) => {
            const { data } = await apiClient.post(`/sessions/${sessionId}/assign`, { reviewer_id: reviewerId });
            return data;
        },
        sendReminder: async (sessionId: string) => {
            const { data } = await apiClient.post(`/sessions/${sessionId}/send-reminder`);
            return data;
        },
        behaviorSummary: async (sessionId: string) => {
            const { data } = await apiClient.get(`/anticheat/sessions/${sessionId}/behavior/summary`);
            return data;
        },
        behaviorTimeline: async (sessionId: string, limit: number = 100) => {
            const { data } = await apiClient.get(`/anticheat/sessions/${sessionId}/behavior/timeline`, { params: { limit } });
            return data;
        },
    },

    subjects: {
        getAll: async () => {
            const { data } = await apiClient.get<any[]>('/subjects');
            return data;
        }
    },

    analytics: {
        getStats: async () => {
            try {
                const { data } = await apiClient.get('/analytics/dashboard');
                return data;
            } catch {
                return null;
            }
        },
        getAdvancedStats: async (params?: { start_date?: string; end_date?: string; category?: string }) => {
            const { data } = await apiClient.get('/analytics/advanced', { params });
            return data;
        },
        exportReport: async (params?: { start_date?: string; end_date?: string; category?: string }) => {
            const { data } = await apiClient.get('/analytics/export', {
                params,
                responseType: 'blob'
            });
            return data;
        },
    },

    admin: {
        getStats: async (): Promise<AdminStats> => {
            const { data } = await apiClient.get<AdminStats>('/tenants/me/stats');
            return data;
        },
        listUsers: async (params?: { skip?: number; limit?: number; role?: string; is_active?: boolean }) => {
            const { data } = await apiClient.get('/tenants/me/users', { params });
            return data;
        },
        createUser: async (userData: { email: string; password: string; full_name: string; role?: string }) => {
            const { data } = await apiClient.post('/tenants/me/users', userData);
            return data;
        },
        updateUser: async (userId: string, userData: { role?: string; is_active?: boolean }) => {
            const { data } = await apiClient.patch(`/tenants/me/users/${userId}`, userData);
            return data;
        },
        getAuditLogs: async (params?: { skip?: number; limit?: number; user_id?: string; action?: string }): Promise<AuditLog[]> => {
            const { data } = await apiClient.get<AuditLog[]>('/tenants/me/audit-logs', { params });
            return data;
        },
        forceDeleteUser: async (userId: string) => {
            const { data } = await apiClient.delete(`/admin/force-delete/user/${userId}`);
            return data;
        },
        forceDeleteExam: async (examId: string) => {
            const { data } = await apiClient.delete(`/admin/force-delete/exam/${examId}`);
            return data;
        },
    },

    media: {
        presign: async (examId: string, purpose: 'syllabus_pdf' | 'identity_snapshot', contentType: string, fileSize: number) => {
            const { data } = await apiClient.post<{ upload_url: string; file_url: string }>(`/exams/${examId}/media/presign`, {
                purpose,
                content_type: contentType,
                file_size: fileSize,
            });
            return data;
        },
        confirm: async (examId: string, purpose: 'syllabus_pdf' | 'identity_snapshot', fileUrl: string) => {
            const { data } = await apiClient.post(`/exams/${examId}/media/confirm`, {
                purpose,
                file_url: fileUrl,
            });
            return data;
        },
        uploadFile: async (uploadUrl: string, file: File) => {
            await axios.put(uploadUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
                timeout: 60000,
            });
        }
    },

    grading: {
        getDetails: async (sessionId: string) => {
            const { data } = await apiClient.get<GradingDetail[]>(`/grading/sessions/${sessionId}/details`);
            return data;
        },
        getSummary: async (sessionId: string) => {
            const { data } = await apiClient.get(`/grading/sessions/${sessionId}/summary`);
            return data;
        },
        regrade: async (sessionId: string) => {
            const { data } = await apiClient.post(`/grading/sessions/${sessionId}/regrade`);
            return data;
        },
        submitReview: async (sessionId: string, data: { status: string; notes?: string; final_score_override?: number }) => {
            const { data: response } = await apiClient.post(`/grading/sessions/${sessionId}/review`, data);
            return response;
        }
    },

    reviewer: {
        getQueue: async (params?: { exam_code?: string }) => {
            const { data } = await apiClient.get('/sessions/reviewer/queue', {
                params: {
                    exam_code: params?.exam_code
                }
            });
            return data;
        }
    },

    tenant: {
        getCurrent: async () => {
            const { data } = await apiClient.get('/tenants/me');
            return data;
        },
        updateProfile: async (data: { name?: string; primary_color?: string }) => {
            const { data: response } = await apiClient.put('/tenants/me', data);
            return response;
        },
        getUsage: async () => {
            const { data } = await apiClient.get('/tenants/me/usage');
            return data;
        },
        listUsers: async (params?: { role?: string; is_active?: boolean; skip?: number; limit?: number }) => {
            const { data } = await apiClient.get('/tenants/me/users', { params });
            return data;
        },
        createUser: async (userData: { email: string; password: string; full_name: string; role?: string }) => {
            const { data } = await apiClient.post('/tenants/me/users', userData);
            return data;
        },
        updateUser: async (userId: string, data: { role?: string; is_active?: boolean }) => {
            const { data: response } = await apiClient.patch(`/tenants/me/users/${userId}`, data);
            return response;
        },
        getSettings: async (tenantId: string) => {
            const { data } = await apiClient.get(`/tenants/${tenantId}/settings`);
            return data;
        },
        updateSettings: async (tenantId: string, settings: Record<string, unknown>) => {
            const { data } = await apiClient.patch(`/tenants/${tenantId}/settings`, settings);
            return data;
        },
        uploadLogo: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await apiClient.post('/tenants/me/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        listDepartments: async (isActive?: boolean) => {
            const { data } = await apiClient.get('/tenants/me/departments', { params: { is_active: isActive } });
            return data;
        },
        createDepartment: async (deptData: { name: string; code: string; description?: string; head_user_id?: string }) => {
            const { data } = await apiClient.post('/tenants/me/departments', deptData);
            return data;
        },
        getDepartment: async (deptId: string) => {
            const { data } = await apiClient.get(`/tenants/me/departments/${deptId}`);
            return data;
        },
        updateDepartment: async (deptId: string, deptData: { name?: string; code?: string; description?: string; head_user_id?: string; is_active?: boolean }) => {
            const { data } = await apiClient.patch(`/tenants/me/departments/${deptId}`, deptData);
            return data;
        },
        listSubjects: async (departmentId?: string, isActive?: boolean) => {
            const { data } = await apiClient.get('/tenants/me/subjects', { params: { department_id: departmentId, is_active: isActive } });
            return data;
        },
        createSubject: async (subjectData: { name: string; code: string; description?: string; credits?: number; department_id: string }) => {
            const { data } = await apiClient.post('/tenants/me/subjects', subjectData);
            return data;
        },
        getSubject: async (subjectId: string) => {
            const { data } = await apiClient.get(`/tenants/me/subjects/${subjectId}`);
            return data;
        },
        updateSubject: async (subjectId: string, subjectData: { name?: string; code?: string; description?: string; credits?: number; department_id?: string; is_active?: boolean }) => {
            const { data } = await apiClient.patch(`/tenants/me/subjects/${subjectId}`, subjectData);
            return data;
        },
    },

    payments: {
        createOrder: async (data: { plan_id: string; billing_cycle?: 'MONTHLY' | 'YEARLY'; currency?: string; receipt?: string }) => {
            const { data: response } = await apiClient.post('/payments/order', data);
            return response;
        },
        verify: async (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const { data: response } = await apiClient.post('/payments/verify', data);
            return response;
        },
    },

    onboarding: {
        requestAccess: async (data: { name: string; email: string; slug: string; full_name: string; phone?: string; use_case?: string }) => {
            const { data: response } = await apiClient.post('/onboarding/request', data);
            return response;
        }
    },

    platform: {
        listTenants: async (params?: { status?: string; skip?: number; limit?: number }) => {
            if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
                return [
                    { id: '1', name: 'Acme Corp', slug: 'acme', status: 'ACTIVE', subscription_tier: 'ENTERPRISE', max_students: 5000 },
                    { id: '2', name: 'TechStart', slug: 'techstart', status: 'TRIAL', subscription_tier: 'STARTER', max_students: 50 },
                    { id: '3', name: 'EduGlobal', slug: 'eduglobal', status: 'ACTIVE', subscription_tier: 'PRO', max_students: 1000 },
                    { id: '4', name: 'University of Innovation', slug: 'uoi', status: 'ACTIVE', subscription_tier: 'ENTERPRISE', max_students: 10000 },
                    { id: '5', name: 'Startup Inc', slug: 'startup', status: 'SUSPENDED', subscription_tier: 'STARTER', max_students: 100 },
                ];
            }
            const { data } = await apiClient.get('/tenants', { params });
            return data;
        },
        createTenant: async (tenantData: {
            name: string;
            slug: string;
            domain?: string;
            subscription_tier: string;
            max_students?: number;
            max_exams_per_month?: number;
            trial_days?: number;
            provisioning_note?: string;
            override_limits?: boolean;
            admin_email?: string;
            admin_name?: string;
        }) => {
            const { data } = await apiClient.post('/tenants', tenantData);
            return data;
        },
        getTenant: async (tenantId: string) => {
            const { data } = await apiClient.get(`/tenants/${tenantId}`);
            return data;
        },
        updateTenant: async (tenantId: string, tenantData: { name?: string; domain?: string; status?: string; subscription_tier?: string; max_students?: number; max_exams_per_month?: number }) => {
            const { data } = await apiClient.patch(`/tenants/${tenantId}`, tenantData);
            return data;
        },
        provisionTenantAdmin: async (tenantId: string, adminData: { admin_email: string; admin_name: string }) => {
            const { data } = await apiClient.post(`/tenants/${tenantId}/admin`, adminData);
            return data;
        },
        getTenantAdmins: async (tenantId: string) => {
            const { data } = await apiClient.get<User[]>(`/tenants/${tenantId}/admins`);
            return data;
        },
        removeTenantAdmin: async (tenantId: string, adminId: string) => {
            const { data } = await apiClient.delete(`/tenants/${tenantId}/admins/${adminId}`);
            return data;
        },
        // Request Management
        listRequests: async (params?: { status?: string; skip?: number; limit?: number }) => {
            const { data } = await apiClient.get('/onboarding/admin/requests', { params });
            return data;
        },
        approveRequest: async (requestId: string) => {
            const { data } = await apiClient.post(`/onboarding/admin/requests/${requestId}/approve`);
            return data;
        },
        rejectRequest: async (requestId: string, reason?: string) => {
            const { data } = await apiClient.post(`/onboarding/admin/requests/${requestId}/reject`, { reason });
            return data;
        },
        // Stats & Analytics
        getStats: async () => {
            if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
                return {
                    total_users: 1250,
                    active_sessions: 42,
                    total_exams: 156,
                    avg_score: 78,
                    flagged_sessions: 3,
                    users_by_role: { INSTRUCTOR: 45, STUDENT: 1200, REVIEWER: 5 },
                    active_exams: 12,
                    completed_sessions: 850
                };
            }
            const { data } = await apiClient.get('/admin/stats');
            return data;
        },
        getAnalytics: async () => {
            if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
                return {
                    sessions_by_day: Array.from({ length: 30 }, (_, i) => ({
                        date: new Date(Date.now() - (29 - i) * 86400000).toISOString(),
                        count: Math.floor(Math.random() * 50) + 10
                    })),
                    exams_by_status: [
                        { status: 'PUBLISHED', count: 45 },
                        { status: 'DRAFT', count: 12 },
                        { status: 'ARCHIVED', count: 8 },
                        { status: 'ACTIVE', count: 5 }
                    ],
                    score_distribution: [
                        { range: '0-20', count: 5 },
                        { range: '21-40', count: 15 },
                        { range: '41-60', count: 45 },
                        { range: '61-80', count: 120 },
                        { range: '81-100', count: 80 }
                    ],
                    error_reports: { total: 12, new: 2, investigating: 5, resolved: 4, ignored: 1 }
                };
            }
            const { data } = await apiClient.get('/admin/analytics');
            return data;
        },
        // Audit Logs
        getAuditLogs: async (params?: { skip?: number; limit?: number; action?: string; user_id?: string; start_date?: string; end_date?: string }) => {
            const { data } = await apiClient.get('/admin/audit-logs', { params });
            return data;
        },
    },

    billing: {
        getPlans: async () => {
            const { data } = await apiClient.get('/billing/plans');
            return data;
        },
        getHistory: async (params?: { skip?: number; limit?: number }) => {
            const { data } = await apiClient.get('/billing/history', { params });
            return data;
        },
        downloadInvoice: (paymentId: string) => {
            window.open(`${getApiBaseUrl()}/billing/invoice/${paymentId}`, '_blank');
        },
    },

    notifications: {
        list: async (params?: { skip?: number; limit?: number; unread_only?: boolean }) => {
            const { data } = await apiClient.get('/notifications', { params });
            return data;
        },
        markRead: async (notificationId: string) => {
            const { data } = await apiClient.post(`/notifications/${notificationId}/read`);
            return data;
        },
        markAllRead: async () => {
            const { data } = await apiClient.post('/notifications/read-all');
            return data;
        },
    },

    notificationPreferences: {
        get: async () => {
            const { data } = await apiClient.get('/notifications/preferences');
            return data;
        },
        update: async (prefs: {
            channel_in_app?: boolean;
            channel_email?: boolean;
            channel_push?: boolean;
            quiet_hours_enabled?: boolean;
            quiet_hours_start?: string | null;
            quiet_hours_end?: string | null;
            quiet_hours_tz?: string;
            type_overrides?: Record<string, unknown>;
        }) => {
            const { data } = await apiClient.put('/notifications/preferences', prefs);
            return data;
        },
    },

    errorReports: {
        submit: async (payload: {
            error_message: string;
            stack_trace?: string;
            url?: string;
            user_description?: string;
            steps_to_reproduce?: string;
            urgency?: 'low' | 'medium' | 'high' | 'critical';
            browser_info?: Record<string, string>;
        }) => {
            const { data } = await apiClient.post<{ success: boolean; report_id: string; message: string }>(
                '/error-reports',
                payload
            );
            return data;
        },
        list: async (params?: { status?: string; urgency?: string; skip?: number; limit?: number }) => {
            const { data } = await apiClient.get('/error-reports/all', { params });
            return data;
        },
        updateStatus: async (reportId: string, newStatus: string) => {
            const { data } = await apiClient.patch(`/error-reports/${reportId}/status`, { status: newStatus });
            return data;
        },
    },



    // ────────────────── Practice Viva ──────────────────
    practice: {
        getStatus: async () => {
            const { data } = await apiClient.get('/practice/status');
            return data;
        },
        getPlans: async () => {
            const { data } = await apiClient.get('/practice/plans');
            return data;
        },
        subscribe: async (planId: string) => {
            const { data } = await apiClient.post('/practice/subscribe', { plan: planId });
            return data;
        },
        verifySubscription: async (payload: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
        }) => {
            const { data } = await apiClient.post('/practice/subscribe/verify', payload);
            return data;
        },
        createExam: async (payload: { title: string; instructions?: string; syllabus_url?: string }) => {
            const { data } = await apiClient.post('/practice/exams', payload);
            return data;
        },
        listExams: async (params?: { skip?: number; limit?: number }) => {
            const { data } = await apiClient.get('/practice/exams', { params });
            return data;
        },
        getExam: async (examId: string) => {
            const { data } = await apiClient.get(`/practice/exams/${examId}`);
            return data;
        },
        updateExam: async (examId: string, payload: { title?: string; instructions?: string }) => {
            const { data } = await apiClient.patch(`/practice/exams/${examId}`, payload);
            return data;
        },
        startSession: async (examId: string, paymentOrderId?: string) => {
            const { data } = await apiClient.post(`/practice/exams/${examId}/start`, {
                payment_order_id: paymentOrderId || null,
            });
            return data;
        },
        listSessions: async (params?: { skip?: number; limit?: number }) => {
            const { data } = await apiClient.get('/practice/sessions', { params });
            return data;
        },
        getReport: async (sessionId: string) => {
            const { data } = await apiClient.get(`/practice/sessions/${sessionId}/report`);
            return data;
        },
        createPaymentOrder: async () => {
            const { data } = await apiClient.post('/practice/payment/order');
            return data;
        },
        verifyPayment: async (payload: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
        }) => {
            const { data } = await apiClient.post('/practice/payment/verify', payload);
            return data;
        },
        deleteExam: async (examId: string) => {
            await apiClient.delete(`/practice/exams/${examId}`);
        },
        retryKb: async (examId: string) => {
            const { data } = await apiClient.post(`/practice/exams/${examId}/retry-kb`);
            return data;
        },
        presignSyllabus: async () => {
            const { data } = await apiClient.post<{ upload_url: string; file_url: string; expires_in: number }>('/practice/media/presign');
            return data;
        },
    },
    exceptions: {
        list: async (params?: { status?: string; exam_id?: string; skip?: number; limit?: number }) => {
            const { data } = await apiClient.get<ExamExceptionListResponse>('/exam-exceptions', { params });
            return data;
        },
        get: async (id: string) => {
            const { data } = await apiClient.get<ExamException>(`/exam-exceptions/${id}`);
            return data;
        },
        verify: async (emails: string[]) => {
            const { data } = await apiClient.post<VerifyEmailsResponse>('/exam-exceptions/verify', { emails });
            return data;
        },
        create: async (payload: ExamExceptionBatchCreate) => {
            const { data } = await apiClient.post<ExamException[]>('/exam-exceptions', payload);
            return data;
        },
        approve: async (id: string, payload?: ExamExceptionApprove) => {
            const { data } = await apiClient.post<ExamException>(`/exam-exceptions/${id}/approve`, payload || {});
            return data;
        },
        reject: async (id: string, payload: ExamExceptionReject) => {
            const { data } = await apiClient.post<ExamException>(`/exam-exceptions/${id}/reject`, payload);
            return data;
        }
    }
};
