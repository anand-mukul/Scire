'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Shield, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformRequestsPage() {
    const queryClient = useQueryClient();

    // Fetch Requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['platform-requests'],
        queryFn: () => api.platform.listRequests(),
    });

    const approveMutation = useMutation({
        mutationFn: api.platform.approveRequest,
        onSuccess: (data: any) => {
            toast.success(`Request approved! Tenant created: ${data.tenant_id}`);
            queryClient.invalidateQueries({ queryKey: ['platform-requests'] });
        },
        onError: (err: any) => toast.error(err.message || 'Approval failed')
    });

    const rejectMutation = useMutation({
        mutationFn: api.platform.rejectRequest,
        onSuccess: () => {
            toast.success('Request rejected.');
            queryClient.invalidateQueries({ queryKey: ['platform-requests'] });
        },
        onError: (err: any) => toast.error(err.message || 'Rejection failed')
    });

    return (
        <div className="container py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Access Requests</h1>
                <p className="mt-1 text-muted-foreground">
                    Review and approve incoming organization sign-up requests.
                </p>
            </div>

            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription>Organizations waiting for approval.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : !requests?.length ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No pending requests.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((req: any) => (
                                <div key={req.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg bg-card/60 border border-border gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{req.name}</h3>
                                            <Badge variant={req.status === 'pending' ? 'outline' : 'secondary'} className="capitalize">
                                                {req.status}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col text-sm text-muted-foreground gap-1">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> {req.full_name} ({req.email})
                                            </div>
                                            <div className="flex items-center gap-2 font-mono text-xs">
                                                Slug: {req.slug}
                                            </div>
                                            {req.use_case && (
                                                <p className="pt-2 italic">"{req.use_case}"</p>
                                            )}
                                        </div>
                                    </div>

                                    {req.status === 'pending' && (
                                        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-500/20 hover:bg-red-500/10 hover:text-red-500 w-full md:w-auto"
                                                onClick={() => rejectMutation.mutate(req.id)}
                                                disabled={rejectMutation.isPending || approveMutation.isPending}
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
                                                onClick={() => approveMutation.mutate(req.id)}
                                                disabled={rejectMutation.isPending || approveMutation.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                {approveMutation.isPending ? 'Approving...' : 'Approve & Create'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
