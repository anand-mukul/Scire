import { Logger } from '@/lib/logger';

class IntegrityService {
    private static instance: IntegrityService;
    private tabSwitchCount: number = 0;
    private eventListeners: Array<{ type: string; listener: EventListener }> = [];
    private snapshotInterval: ReturnType<typeof setInterval> | null = null;

    private constructor() { }

    public static getInstance(): IntegrityService {
        if (!IntegrityService.instance) {
            IntegrityService.instance = new IntegrityService();
        }
        return IntegrityService.instance;
    }

    public startMonitoring() {
        this.stopMonitoring();
        this.tabSwitchCount = 0;

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
    public getMetrics(): {
        tab_switches: number;
        noise_score: number | null;
        window_focused: boolean;
        timestamp: string;
    } {
        return {
            tab_switches: this.tabSwitchCount,
            noise_score: this.estimateNoiseScore(),
            window_focused: document.hasFocus(),
            timestamp: new Date().toISOString(),
        };
    }

    public stopMonitoring() {
        this.eventListeners.forEach(({ type, listener }) => {
            window.removeEventListener(type, listener);
            document.removeEventListener(type, listener);
        });
        this.eventListeners = [];
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = null;
        }
    }

    /**
     * Start periodic snapshot sending via WebSocket.
     * Sends integrity metrics every intervalMs to populate IntegritySnapshot fields.
     */
    public startPeriodicSnapshots(
        sendFn: (data: Record<string, unknown>) => void,
        intervalMs: number = 60000
    ) {
        this.stopPeriodicSnapshots();
        this.snapshotInterval = setInterval(() => {
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

    private addListener(target: EventTarget, type: string, listener: EventListener) {
        target.addEventListener(type, listener);
        this.eventListeners.push({ type, listener });
    }

    private handleTabSwitch() {
        this.tabSwitchCount++;
        Logger.log("Tab switch detected:", this.tabSwitchCount);
    }

    /**
     * Estimate noise score from ambient audio level.
     * Returns null if AudioContext is not available.
     * This is a placeholder — future biometrics integration can replace this
     * with real noise analysis from AudioAnalysisService.
     */
    private estimateNoiseScore(): number | null {
        // Placeholder: returns null until AudioAnalysisService integration.
        // The backend handles null gracefully (skips noise_score in risk calculation).
        return null;
    }
}

export const integrityService = IntegrityService.getInstance();
