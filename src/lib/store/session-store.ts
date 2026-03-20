import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SessionStatus, TranscriptSpeaker } from '@/types/backend';

// Derived from backend FSM
export enum DialogueState {
    AUTH = 'auth',
    CALIBRATION = 'calibration',
    QUESTION = 'question',
    LISTENING = 'listening',
    EVALUATION = 'evaluation',
    SCAFFOLD = 'scaffold',
    TRANSFER = 'transfer',
    END = 'end',
    TERMINATED = 'terminated',
}

export interface TranscriptItem {
    text: string;
    speaker: TranscriptSpeaker;
    timestamp: string;
    is_final: boolean;
    message_id?: string;
    confidence?: number;
}

export type ConnectionState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'FAILED' | 'DISCONNECTED';

export interface SessionState {
    // Session Identity
    sessionId: string | null;
    examId: string | null;
    studentId: string | null;

    // Connection State
    connectionState: ConnectionState;
    isConnected: boolean; // Computed or legacy sync
    isReconnecting: boolean;
    error: string | null; // Fatal connection error

    latencyMs: number;
    lastHeartbeat: string | null;

    // Viva State (FSM)
    status: SessionStatus;
    fsmState: DialogueState;
    questionsAsked: number;

    // Audio/Media State
    isMicActive: boolean;
    isAudioPlaying: boolean;
    isAgentSpeaking: boolean;
    userVolume: number;
    agentVolume: number; // Split volumes

    // Data
    transcripts: TranscriptItem[];
    currentPartialTranscript: string | null;

    // Exam Metadata & Settings
    expiryTime: string | null;
    examSettings: Record<string, any>;
    onboardingAccepted: boolean;

    // Integrity Violation
    violation: {
        isWarning: boolean;
        type: 'FULLSCREEN' | 'TAB_SWITCH' | 'FACE_MISSING' | null;
        remainingSeconds: number;
    };

    setViolationState: (isWarning: boolean, type: 'FULLSCREEN' | 'TAB_SWITCH' | 'FACE_MISSING' | null, remainingSeconds: number) => void;
    decrementViolationTimer: () => void;

    // Actions
    setSessionInfo: (sessionId: string, examId: string, studentId: string) => void;
    setSessionMetadata: (expiryTime: string | null, settings: Record<string, any>) => void;
    setConnectionState: (state: ConnectionState) => void;
    setError: (error: string | null, fatal?: boolean) => void;
    setOnboardingStatus: (accepted: boolean) => void;

    setFsmState: (state: DialogueState, questionsAsked?: number) => void;
    setStatus: (status: SessionStatus) => void;
    addTranscript: (item: TranscriptItem) => void;
    updatePartialTranscript: (text: string | null) => void;
    setAudioStatus: (isPlaying: boolean) => void;
    setAgentSpeaking: (isSpeaking: boolean) => void;
    setMicStatus: (isActive: boolean) => void;
    setUserVolume: (vol: number) => void;
    setAgentVolume: (vol: number) => void;
    resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
    immer((set) => ({
        // Initial State
        sessionId: null,
        examId: null,
        studentId: null,

        connectionState: 'IDLE',
        isConnected: false,
        isReconnecting: false,
        error: null,

        latencyMs: 0,
        lastHeartbeat: null,

        status: SessionStatus.PENDING,
        fsmState: DialogueState.AUTH,
        questionsAsked: 0,

        isMicActive: false,
        isAudioPlaying: false,
        isAgentSpeaking: false,
        userVolume: 0,
        agentVolume: 0,

        transcripts: [],
        currentPartialTranscript: null,

        expiryTime: null,
        examSettings: {},
        onboardingAccepted: false,

        // Integrity Violation State
        violation: {
            isWarning: false,
            type: null,
            remainingSeconds: 0,
        },

        // Actions
        setViolationState: (isWarning, type, remainingSeconds) =>
            set((state) => {
                state.violation.isWarning = isWarning;
                state.violation.type = type;
                state.violation.remainingSeconds = remainingSeconds;
            }),

        decrementViolationTimer: () =>
            set((state) => {
                if (state.violation.remainingSeconds > 0) {
                    state.violation.remainingSeconds -= 1;
                }
            }),

        setSessionInfo: (sessionId, examId, studentId) =>
            set((state) => {
                state.sessionId = sessionId;
                state.examId = examId;
                state.studentId = studentId;
            }),

        setSessionMetadata: (expiryTime, examSettings) =>
            set((state) => {
                state.expiryTime = expiryTime;
                state.examSettings = examSettings;
            }),

        setConnectionState: (connectionState) =>
            set((state) => {
                state.connectionState = connectionState;
                state.isConnected = connectionState === 'CONNECTED';
                state.isReconnecting = connectionState === 'RECONNECTING';
                if (connectionState === 'CONNECTED' || connectionState === 'CONNECTING') {
                    state.error = null;
                }
            }),

        setError: (error, fatal = true) =>
            set((state) => {
                state.error = error;
                // FRONT-8 FIX: Only force FAILED on fatal errors.
                // Non-fatal errors (e.g. VOICE_UNAVAILABLE) should keep the connection alive.
                if (error && fatal) state.connectionState = 'FAILED';
            }),

        setOnboardingStatus: (accepted) =>
            set((state) => {
                state.onboardingAccepted = accepted;
            }),

        setFsmState: (fsmState, questionsAsked) =>
            set((state) => {
                // Validate incoming FSM state against known enum values
                if (!Object.values(DialogueState).includes(fsmState)) return;
                state.fsmState = fsmState;
                if (questionsAsked !== undefined) state.questionsAsked = questionsAsked;
            }),

        setStatus: (status) =>
            set((state) => {
                state.status = status;
            }),

        addTranscript: (item) =>
            set((state) => {
                // If it's a final transcript, clear the partial one
                if (item.is_final) {
                    state.currentPartialTranscript = null;
                }
                state.transcripts.push(item);
            }),

        updatePartialTranscript: (text) =>
            set((state) => {
                state.currentPartialTranscript = text;
            }),

        setAudioStatus: (isPlaying) =>
            set((state) => {
                state.isAudioPlaying = isPlaying;
            }),

        setAgentSpeaking: (isSpeaking) =>
            set((state) => {
                state.isAgentSpeaking = isSpeaking;
            }),

        setMicStatus: (isActive) =>
            set((state) => {
                state.isMicActive = isActive;
            }),

        setUserVolume: (vol) =>
            set((state) => {
                state.userVolume = vol;
            }),

        setAgentVolume: (vol) =>
            set((state) => {
                state.agentVolume = vol;
            }),



        resetSession: () =>
            set((state) => {
                state.sessionId = null;
                state.examId = null;
                state.studentId = null;
                state.connectionState = 'IDLE';
                state.isConnected = false;
                state.isReconnecting = false;
                state.error = null;
                state.transcripts = [];
                state.currentPartialTranscript = null;
                state.fsmState = DialogueState.AUTH;
                state.status = SessionStatus.PENDING;
                state.isMicActive = false;
                state.isAudioPlaying = false;
                state.isAgentSpeaking = false;
                state.userVolume = 0;
                state.agentVolume = 0;
                state.expiryTime = null;
                state.examSettings = {};
                state.onboardingAccepted = false;
            }),
    }))
);
