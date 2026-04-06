import { Logger } from '@/lib/logger';
import { faceVerificationService } from './biometrics/faceVerificationService';

// ── Thresholds ──────────────────────────────────────────────────
const GAZE_YAW_THRESHOLD = 30;      // degrees — looking left/right beyond this
const GAZE_PITCH_THRESHOLD = 25;     // degrees — looking up/down beyond this
const GAZE_SUSTAINED_MS = 5000;      // must persist for 5s before triggering
const ILLUMINATION_SPIKE_DELTA = 0.3; // 30% jump in illumination = phone-screen reflection
const SELECTION_CLEAR_INTERVAL_MS = 150; // how often we wipe text selections

export type IntegrityViolationType =
    | 'TAB_SWITCH'
    | 'FULLSCREEN'
    | 'FACE_MISSING'
    | 'GAZE_DEVIATION'
    | 'COPY_ATTEMPT'
    | 'VOICE_MISMATCH'
    | 'NOISE_SPIKE'
    | 'ILLUMINATION_SPIKE'
    | 'FOCUS_LOSS'
    | 'SNAPSHOT_REUSE';

export interface IntegrityMetrics {
    tab_switches: number;
    noise_score: number | null;
    window_focused: boolean;
    face_similarity: number;
    head_pose: { pitch: number; yaw: number; roll: number } | null;
    illumination_variance: number | null;
    gaze_deviation_count: number;
    copy_attempts: number;
    webcam_snapshot: string | null;
    timestamp: string;
}

class IntegrityService {
    private static instance: IntegrityService;
    private tabSwitchCount: number = 0;
    private copyAttemptCount: number = 0;
    private gazeDeviationCount: number = 0;
    private eventListeners: Array<{ target: EventTarget; type: string; listener: EventListenerOrEventListenerObject }> = [];
    private snapshotInterval: ReturnType<typeof setInterval> | null = null;
    private selectionClearInterval: ReturnType<typeof setInterval> | null = null;
    private lockdownStyleEl: HTMLStyleElement | null = null;

    // Gaze tracking state
    private gazeDeviationStart: number | null = null;    // timestamp when gaze first deviated
    private lastIlluminationVariance: number | null = null;
    private gazeViolationCallback: ((type: IntegrityViolationType, reason: string) => void) | null = null;

    private constructor() { }

    public static getInstance(): IntegrityService {
        if (!IntegrityService.instance) {
            IntegrityService.instance = new IntegrityService();
        }
        return IntegrityService.instance;
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: Browser Lockdown (Anti-Copy/Paste & Extension Defeat)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Activate full browser lockdown for exam integrity.
     * Blocks copy/paste/cut, right-click, and dev shortcuts.
     * Actively clears text selection to defeat "Enable Copy" extensions.
     */
    public activateLockdown(): void {
        this.deactivateLockdown(); // Prevent duplicates

        // Inject CSS that prevents text selection globally
        this.lockdownStyleEl = document.createElement('style');
        this.lockdownStyleEl.id = 'scire-lockdown-styles';
        this.lockdownStyleEl.textContent = `
            body.scire-lockdown,
            body.scire-lockdown * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
            }
        `;
        document.head.appendChild(this.lockdownStyleEl);
        document.body.classList.add('scire-lockdown');

        // Block clipboard events
        this.addListener(document, 'copy', this.blockClipboard);
        this.addListener(document, 'cut', this.blockClipboard);
        this.addListener(document, 'paste', this.blockClipboard);

        // Block right-click context menu
        this.addListener(document, 'contextmenu', this.blockClipboard);

        // Block keyboard shortcuts: Ctrl/Cmd + C/V/X/A/S/U, F12, etc.
        this.addListener(document, 'keydown', this.blockKeyShortcuts);

        // Active selection clearing – defeats "Enable Copy" browser extensions
        // by instantly removing any text selection every 150ms
        this.selectionClearInterval = setInterval(() => {
            try {
                const sel = window.getSelection();
                if (sel && sel.toString().length > 0) {
                    sel.removeAllRanges();
                    this.copyAttemptCount++;
                    Logger.warn('IntegrityLockdown: Selection cleared (possible extension bypass)');
                }
            } catch {
                // Silently ignore any SecurityError from cross-origin frames
            }
        }, SELECTION_CLEAR_INTERVAL_MS);

        // Wipe clipboard on blur (tab switch) — clear whatever was copied
        this.addListener(window, 'blur', this.wipeClipboardOnBlur);

        Logger.log('IntegrityLockdown: Browser lockdown activated');
    }

    /**
     * Deactivate all lockdown features.
     */
    public deactivateLockdown(): void {
        if (this.lockdownStyleEl) {
            this.lockdownStyleEl.remove();
            this.lockdownStyleEl = null;
        }
        document.body.classList.remove('scire-lockdown');

        if (this.selectionClearInterval) {
            clearInterval(this.selectionClearInterval);
            this.selectionClearInterval = null;
        }
    }

    // Event handlers (arrow functions for stable `this` binding)
    private blockClipboard = (e: Event): void => {
        e.preventDefault();
        e.stopPropagation();
        this.copyAttemptCount++;
        Logger.warn(`IntegrityLockdown: Blocked ${e.type} event`);
    };

    private blockKeyShortcuts = (e: Event): void => {
        const ke = e as KeyboardEvent;
        const isCtrl = ke.ctrlKey || ke.metaKey;

        // Block: Ctrl/Cmd + C, V, X, A, S, U, P (copy, paste, cut, select-all, save, view-source, print)
        if (isCtrl && ['c', 'v', 'x', 'a', 's', 'u', 'p'].includes(ke.key.toLowerCase())) {
            ke.preventDefault();
            ke.stopPropagation();
            this.copyAttemptCount++;
            Logger.warn(`IntegrityLockdown: Blocked shortcut Ctrl+${ke.key.toUpperCase()}`);
            return;
        }

        // Block F12 (DevTools), Ctrl+Shift+I/J/C (DevTools)
        if (ke.key === 'F12') {
            ke.preventDefault();
            ke.stopPropagation();
            return;
        }
        if (isCtrl && ke.shiftKey && ['i', 'j', 'c'].includes(ke.key.toLowerCase())) {
            ke.preventDefault();
            ke.stopPropagation();
            return;
        }
    };

    private wipeClipboardOnBlur = async (): Promise<void> => {
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText('');
            }
        } catch {
            // Clipboard API may be blocked in some browsers when unfocused — acceptable
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Gaze & Illumination Fusion (Device Proxying Detection)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Set a callback that fires when a gaze violation is confirmed.
     * This is called from use-exam-integrity.ts to wire into the violation pipeline.
     */
    public setGazeViolationCallback(
        cb: (type: IntegrityViolationType, reason: string) => void
    ): void {
        this.gazeViolationCallback = cb;
    }

    /**
     * Evaluate current face detection data for gaze deviation.
     * Call this from the periodic snapshot loop (every 30-60s) or on-demand.
     * Uses head_pose angles and illumination variance to detect device-proxying.
     */
    public evaluateGazeAndIllumination(): void {
        const detection = faceVerificationService.getLatestDetection();
        if (!detection || !detection.headPose) {
            // No face data available — skip
            this.gazeDeviationStart = null;
            return;
        }

        const { yaw, pitch } = detection.headPose;
        const absYaw = Math.abs(yaw);
        const absPitch = Math.abs(pitch);

        const isGazeDeviated = absYaw > GAZE_YAW_THRESHOLD || absPitch > GAZE_PITCH_THRESHOLD;

        // Check illumination spike (phone screen glare detection)
        let illuminationSpiked = false;
        if (detection.illuminationVariance != null && this.lastIlluminationVariance != null) {
            const delta = Math.abs(detection.illuminationVariance - this.lastIlluminationVariance);
            if (delta > ILLUMINATION_SPIKE_DELTA) {
                illuminationSpiked = true;
            }
        }
        this.lastIlluminationVariance = detection.illuminationVariance ?? null;

        if (isGazeDeviated) {
            const now = Date.now();

            if (this.gazeDeviationStart == null) {
                // First detection of deviation
                this.gazeDeviationStart = now;
            } else if (now - this.gazeDeviationStart >= GAZE_SUSTAINED_MS) {
                // Sustained deviation → fire violation
                this.gazeDeviationCount++;
                this.gazeDeviationStart = null; // Reset for next detection window

                const reason = illuminationSpiked
                    ? 'gaze_deviation_with_illumination_spike'
                    : 'sustained_gaze_deviation';

                Logger.warn(
                    `IntegrityGaze: Violation triggered — yaw=${yaw.toFixed(1)}° pitch=${pitch.toFixed(1)}° ` +
                    `illumination_spike=${illuminationSpiked}`
                );

                if (this.gazeViolationCallback) {
                    this.gazeViolationCallback('GAZE_DEVIATION', reason);
                }
            }
        } else {
            // Gaze returned to normal — reset window
            this.gazeDeviationStart = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Core Monitoring (unchanged but enhanced)
    // ═══════════════════════════════════════════════════════════════

    public startMonitoring() {
        this.stopMonitoring();
        this.tabSwitchCount = 0;
        this.copyAttemptCount = 0;
        this.gazeDeviationCount = 0;

        // Listeners
        this.addListener(window, 'blur', () => this.handleTabSwitch());
        this.addListener(document, 'visibilitychange', () => {
            if (document.hidden) this.handleTabSwitch();
        });
    }

    /**
     * Returns current integrity metrics to include in snapshots.
     * These fields map directly to IntegritySnapshot model columns.
     */
    public getMetrics(): IntegrityMetrics {
        const detection = faceVerificationService.getLatestDetection();
        const base64Snapshot = faceVerificationService.getSnapshotBase64();
        
        return {
            tab_switches: this.tabSwitchCount,
            noise_score: this.estimateNoiseScore(),
            window_focused: document.hasFocus(),
            face_similarity: faceVerificationService.getLatestSimilarity(),
            head_pose: detection?.headPose || null,
            illumination_variance: detection?.illuminationVariance || null,
            gaze_deviation_count: this.gazeDeviationCount,
            copy_attempts: this.copyAttemptCount,
            webcam_snapshot: base64Snapshot,
            timestamp: new Date().toISOString(),
        };
    }

    public stopMonitoring() {
        this.eventListeners.forEach(({ target, type, listener }) => {
            target.removeEventListener(type, listener);
        });
        this.eventListeners = [];
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = null;
        }
        this.deactivateLockdown();
    }

    /**
     * Start periodic snapshot sending via WebSocket.
     * Also runs gaze evaluation on each tick.
     */
    public startPeriodicSnapshots(
        sendFn: (data: Record<string, unknown>) => void,
        intervalMs: number = 60000
    ) {
        this.stopPeriodicSnapshots();
        this.snapshotInterval = setInterval(() => {
            // Evaluate gaze each snapshot interval
            this.evaluateGazeAndIllumination();

            const metrics = this.getMetrics();
            sendFn({
                type: 'integrity_snapshot',
                data: metrics,
            });
        }, intervalMs);
    }

    public stopPeriodicSnapshots() {
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = null;
        }
    }

    private addListener(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject) {
        target.addEventListener(type, listener);
        this.eventListeners.push({ target, type, listener });
    }

    private handleTabSwitch() {
        this.tabSwitchCount++;
        Logger.log("Tab switch detected:", this.tabSwitchCount);
    }

    /**
     * Estimate noise score from ambient audio level.
     * Uses AudioAnalysisService for real microphone RMS data.
     * Returns null if AudioContext is not available.
     */
    private estimateNoiseScore(): number | null {
        try {
            const { AudioAnalysisService } = require('@/services/AudioAnalysisService');
            const levels = AudioAnalysisService.getInstance().getLevels();
            // Return user's ambient mic level as noise score (0-1)
            return levels.user > 0 ? Math.round(levels.user * 100) / 100 : null;
        } catch {
            return null;
        }
    }
}

export const integrityService = IntegrityService.getInstance();
