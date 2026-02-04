class IntegrityService {
    private static instance: IntegrityService;
    private tabSwitchCount: number = 0;
    private eventListeners: Array<{ type: string; listener: EventListener }> = [];

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

    public getMetrics() {
        return {
            tab_switches: this.tabSwitchCount,
            window_focused: document.hasFocus()
        };
    }

    public stopMonitoring() {
        this.eventListeners.forEach(({ type, listener }) => {
            window.removeEventListener(type, listener);
            document.removeEventListener(type, listener);
        });
        this.eventListeners = [];
    }

    private addListener(target: any, type: string, listener: EventListener) {
        target.addEventListener(type, listener);
        this.eventListeners.push({ type, listener });
    }

    private handleTabSwitch() {
        this.tabSwitchCount++;
        console.log("Tab switch detected:", this.tabSwitchCount);
    }
}

export const integrityService = IntegrityService.getInstance();
