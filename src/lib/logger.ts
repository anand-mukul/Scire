export const Logger = {
    debug: (...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(...args);
        }
    },
    log: (...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(...args);
        }
    },
    info: (...args: any[]) => {
        // Info logs are generally kept or could be situational
        console.info(...args);
    },
    warn: (...args: any[]) => {
        console.warn(...args);
    },
    error: (...args: any[]) => {
        console.error(...args);
    },
};
