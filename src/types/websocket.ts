export enum MessageType {
    // Client -> Server
    PING = "ping",
    AUDIO_CHUNK = "audio_chunk",
    INTEGRITY_SNAPSHOT = "integrity_snapshot",
    INTERRUPT = "interrupt",
    SESSION_START = "session_start",

    // Server -> Client
    PONG = "pong",
    STATE_UPDATE = "state_update",
    TRANSCRIPT = "transcript",
    AGENT_SPEAKING = "agent_speaking",
    INTEGRITY_ALERT = "integrity_alert",
    ERROR = "error"
}

export enum DialogueState {
    AUTH = "auth",
    CALIBRATION = "calibration",
    QUESTION = "question",
    LISTENING = "listening",
    EVALUATION = "evaluation",
    SCAFFOLD = "scaffold",
    TRANSFER = "transfer",
    END = "end",
    TERMINATED = "terminated"
}

export interface BaseMessage {
    type: MessageType;
    timestamp?: string; // ISO 8601
}

// -- Client Payloads --

export interface AudioChunkMessage extends BaseMessage {
    type: MessageType.AUDIO_CHUNK;
    data: string; // Base64 encoded
}

export interface IntegritySnapshotMessage extends BaseMessage {
    type: MessageType.INTEGRITY_SNAPSHOT;
    data: Record<string, any>;
}

export interface SessionStartMessage extends BaseMessage {
    type: MessageType.SESSION_START;
}

// -- Server Payloads --

export interface StateUpdateMessage extends BaseMessage {
    type: MessageType.STATE_UPDATE;
    state: DialogueState;
}

export interface TranscriptMessage extends BaseMessage {
    type: MessageType.TRANSCRIPT;
    text: string;
    is_final: boolean;
    role: "STUDENT" | "ASSISTANT";
}

export interface AgentSpeakingMessage extends BaseMessage {
    type: MessageType.AGENT_SPEAKING;
    status: boolean;
}

export interface IntegrityAlertMessage extends BaseMessage {
    type: MessageType.INTEGRITY_ALERT;
    reason: string;
    violation_type: string;
    severity: "low" | "medium" | "high";
    remaining_seconds: number;
}

export interface ErrorMessage extends BaseMessage {
    type: MessageType.ERROR;
    code: string;
    message: string;
}

export type ServerMessage =
    | StateUpdateMessage
    | TranscriptMessage
    | AgentSpeakingMessage
    | IntegrityAlertMessage
    | ErrorMessage
    | { type: MessageType.PONG }
    | { type: MessageType.AUDIO_CHUNK, data: string }; // Echo or Instructor view
