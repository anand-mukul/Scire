'use client';

import React from 'react';
import { useSessionStore, DialogueState, ConnectionState } from '@/lib/store/session-store';
import {
    Wifi, WifiOff, Mic, MicOff, Shield, ShieldAlert, ShieldCheck,
    ChevronLeft, ChevronRight, Activity, Signal, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Compact status indicator ───────────────────────────────────
const StatusDot = ({ status, label }: { status: 'ok' | 'warn' | 'error' | 'off'; label: string }) => {
    const colors = {
        ok: 'bg-emerald-400 shadow-emerald-400/50',
        warn: 'bg-amber-400 shadow-amber-400/50',
        error: 'bg-rose-500 shadow-rose-500/50 animate-pulse',
        off: 'bg-neutral-600',
    };
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn('w-2 h-2 rounded-full shadow-sm', colors[status])} />
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
};

// ─── Metric row ─────────────────────────────────────────────────
interface MetricRowProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    status?: 'ok' | 'warn' | 'error' | 'off';
    tooltip?: string;
}

const MetricRow = ({ icon, label, value, status, tooltip }: MetricRowProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="flex items-center gap-2 py-1.5 px-1 rounded-md hover:bg-white/[0.03] transition-colors cursor-default">
                <span className="text-muted-foreground/60 shrink-0">{icon}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium flex-1 truncate">{label}</span>
                <span className="text-xs font-mono text-foreground/80 tabular-nums">{value}</span>
                {status && <StatusDot status={status} label={tooltip || label} />}
            </div>
        </TooltipTrigger>
        {tooltip && (
            <TooltipContent side="right" className="text-xs max-w-[200px]">
                <p>{tooltip}</p>
            </TooltipContent>
        )}
    </Tooltip>
);

// ─── Connection status helper ───────────────────────────────────
function getConnectionInfo(state: ConnectionState): { label: string; status: 'ok' | 'warn' | 'error' | 'off'; icon: React.ReactNode } {
    switch (state) {
        case 'CONNECTED':
            return { label: 'Connected', status: 'ok', icon: <Wifi className="w-3.5 h-3.5 text-emerald-400" /> };
        case 'CONNECTING':
            return { label: 'Connecting', status: 'warn', icon: <Signal className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> };
        case 'RECONNECTING':
            return { label: 'Reconnecting', status: 'warn', icon: <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> };
        case 'FAILED':
            return { label: 'Failed', status: 'error', icon: <WifiOff className="w-3.5 h-3.5 text-rose-500" /> };
        case 'DISCONNECTED':
            return { label: 'Offline', status: 'error', icon: <WifiOff className="w-3.5 h-3.5 text-rose-500" /> };
        default:
            return { label: 'Idle', status: 'off', icon: <Signal className="w-3.5 h-3.5 text-neutral-500" /> };
    }
}

// ─── Integrity shield status ────────────────────────────────────
function getShieldInfo(strikes: number, maxStrikes: number): { label: string; status: 'ok' | 'warn' | 'error'; icon: React.ReactNode } {
    if (strikes === 0) {
        return { label: 'No violations', status: 'ok', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> };
    }
    if (strikes < maxStrikes) {
        return { label: `${strikes}/${maxStrikes} strikes`, status: 'warn', icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> };
    }
    return { label: 'Critical', status: 'error', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> };
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export const StudentToolbar: React.FC = () => {
    const [collapsed, setCollapsed] = React.useState(false);

    const connectionState = useSessionStore(s => s.connectionState);
    const isMicActive = useSessionStore(s => s.isMicActive);
    const isMicUnmuted = useSessionStore(s => s.isMicUnmuted);
    const fsmState = useSessionStore(s => s.fsmState);
    const questionsAsked = useSessionStore(s => s.questionsAsked);
    const examSettings = useSessionStore(s => s.examSettings);
    const violation = useSessionStore(s => s.violation);
    const userVolume = useSessionStore(s => s.userVolume);

    // Don't show during auth, end, or terminated states
    if ([DialogueState.AUTH, DialogueState.END, DialogueState.TERMINATED].includes(fsmState)) {
        return null;
    }

    const conn = getConnectionInfo(connectionState);
    const shield = getShieldInfo(violation.strikes, violation.maxStrikes);
    const totalQuestions = examSettings?.number_of_questions || 0;

    const micStatus: 'ok' | 'warn' | 'off' = isMicUnmuted ? 'ok' : isMicActive ? 'warn' : 'off';
    const micLabel = isMicUnmuted ? 'Live' : isMicActive ? 'Muted' : 'Off';

    // Volume bar width (0-100%)
    const volumePercent = Math.round(userVolume * 100);

    return (
        <div
            className={cn(
                'fixed left-3 top-1/2 -translate-y-1/2 z-[70] transition-all duration-300 ease-out',
                collapsed ? 'w-10' : 'w-44'
            )}
        >
            <div className={cn(
                'relative rounded-2xl border border-white/[0.06] shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300',
                'bg-black/70 backdrop-blur-2xl backdrop-saturate-150'
            )}>
                {/* Glass refraction line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
                    aria-label={collapsed ? 'Expand toolbar' : 'Collapse toolbar'}
                >
                    {collapsed ? (
                        <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                    ) : (
                        <ChevronLeft className="w-3 h-3 text-muted-foreground/60" />
                    )}
                </button>

                {/* ─── Collapsed view: vertical dots ─── */}
                {collapsed ? (
                    <div className="flex flex-col items-center gap-3 py-10 px-2">
                        <StatusDot status={conn.status} label={`Network: ${conn.label}`} />
                        <StatusDot status={micStatus} label={`Mic: ${micLabel}`} />
                        <StatusDot status={shield.status} label={`Integrity: ${shield.label}`} />
                    </div>
                ) : (
                    /* ─── Expanded view ─── */
                    <div className="p-3 pt-4 space-y-1">
                        {/* Header */}
                        <div className="flex items-center gap-1.5 mb-3 px-1">
                            <Activity className="w-3 h-3 text-primary/70" />
                            <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">Session</span>
                        </div>

                        {/* Network */}
                        <MetricRow
                            icon={conn.icon}
                            label="Network"
                            value={conn.label}
                            status={conn.status}
                            tooltip={connectionState === 'CONNECTED' ? 'WebSocket connection is active and stable' : `Connection state: ${connectionState}`}
                        />

                        {/* Microphone */}
                        <MetricRow
                            icon={isMicUnmuted ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-neutral-500" />}
                            label="Mic"
                            value={
                                <div className="flex items-center gap-1.5">
                                    <span>{micLabel}</span>
                                    {isMicUnmuted && (
                                        <div className="w-8 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 rounded-full transition-all duration-100 ease-out"
                                                style={{ width: `${volumePercent}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            }
                            status={micStatus}
                            tooltip={isMicUnmuted ? `Audio input level: ${volumePercent}%` : 'Microphone is muted — click the mic button to unmute'}
                        />

                        {/* Integrity Shield */}
                        <MetricRow
                            icon={shield.icon}
                            label="Integrity"
                            value={shield.label}
                            status={shield.status}
                            tooltip={violation.strikes === 0 ? 'No integrity violations detected' : `${violation.strikes} of ${violation.maxStrikes} violations before auto-termination`}
                        />

                        {/* Question Progress */}
                        {totalQuestions > 0 && (
                            <MetricRow
                                icon={<HelpCircle className="w-3.5 h-3.5 text-cyan-400/60" />}
                                label="Progress"
                                value={
                                    <div className="flex items-center gap-1.5">
                                        <span>{questionsAsked}/{totalQuestions}</span>
                                        <div className="w-8 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(100, (questionsAsked / totalQuestions) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                }
                                tooltip={`Question ${questionsAsked} of ${totalQuestions}`}
                            />
                        )}

                        {/* Bottom separator + branding */}
                        <div className="pt-2 mt-1 border-t border-white/[0.04]">
                            <div className="flex items-center justify-center gap-1 opacity-30">
                                <Shield className="w-2.5 h-2.5" />
                                <span className="text-[8px] tracking-widest uppercase font-medium">Scire Proctored</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
