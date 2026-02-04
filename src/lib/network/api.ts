import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { LoginCredentials, RegisterData, User, AuthTokens, SSOProvidersResponse } from '@/types/auth';
import { Exam, ExamStatus, ExamSettings, VivaSession, Rubric, GradingDetail } from '@/types/backend';

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
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

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
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => apiClient(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await authClient.post('/auth/refresh');
                processQueue();
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
    },

    sso: {
        getProviders: async (): Promise<SSOProvidersResponse> => {
            const { data } = await apiClient.get<SSOProvidersResponse>('/auth/sso/providers');
            return data;
        },
        getLoginUrl: (provider: 'google' | 'microsoft'): string => {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            return `${backendUrl}/auth/sso/${provider}/login`;
        },
    },

    exams: {
        join: async (code: string) => {
            const { data } = await apiClient.post<VivaSession>('/exams/join', { exam_code: code });
            return data;
        },
        create: async (data: { title: string; settings?: ExamSettings; max_attempts?: number; start_time?: string; end_time?: string }) => {
            const { data: response } = await apiClient.post<Exam>('/exams', data);
            return response;
        },
        list: async () => {
            const { data } = await apiClient.get<Exam[]>('/exams');
            return data;
        },
        get: async (id: string) => {
            const { data } = await apiClient.get<Exam>(`/exams/${id}`);
            return data;
        },
        update: async (id: string, data: { status?: ExamStatus; max_attempts?: number; title?: string; settings?: ExamSettings }) => {
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
    },

    sessions: {
        start: async (sessionId: string) => {
            const { data } = await apiClient.post(`/sessions/${sessionId}/start`);
            return data;
        },
        submitOnboarding: async (sessionId: string, snapshot: Blob) => {
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
        list: async (params?: { student_id?: string; status?: string; exam_id?: string; exam_code?: string; review_status?: string; integrity_flag?: boolean }) => {
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
    },

    admin: {
        getStats: async () => {
            const { data } = await apiClient.get('/tenants/me/stats');
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
        getAuditLogs: async (params?: { skip?: number; limit?: number; user_id?: string; action?: string }) => {
            const { data } = await apiClient.get('/tenants/me/audit-logs', { params });
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
        submitReview: async (sessionId: string, data: { status: string; notes?: string; final_score_override?: number }) => {
            const { data: response } = await apiClient.post(`/grading/sessions/${sessionId}/review`, data);
            return response;
        }
    },

    reviewer: {
        getQueue: async (params?: { exam_code?: string; status?: string }) => {
            const { data } = await apiClient.get('/sessions', {
                params: {
                    review_status: params?.status || 'PENDING',
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
    },

    payments: {
        createOrder: async (data: { plan_id: string; currency?: string; receipt?: string; notes?: Record<string, unknown> }) => {
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
            const { data } = await apiClient.get('/tenants', { params });
            return data;
        },
        createTenant: async (tenantData: { name: string; slug: string; domain?: string; subscription_tier?: string; max_students?: number; max_exams_per_month?: number }) => {
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
        // Request Management
        listRequests: async (params?: { status?: string; skip?: number; limit?: number }) => {
            const { data } = await apiClient.get('/onboarding/admin/requests', { params });
            return data;
        },
        approveRequest: async (requestId: string) => {
            const { data } = await apiClient.post(`/onboarding/admin/requests/${requestId}/approve`);
            return data;
        },
        rejectRequest: async (requestId: string) => {
            const { data } = await apiClient.post(`/onboarding/admin/requests/${requestId}/reject`);
            return data;
        }
    },
};
