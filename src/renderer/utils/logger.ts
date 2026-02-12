/**
 * Centralized Logging Utility
 * 
 * Provides structured logging with levels (info, warn, error).
 * Logs only appear in development mode to avoid console spam in production.
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    /**
     * Log informational messages (dev only)
     */
    info(message: string, data?: any): void {
        if (isDev) {
            console.log(`[INFO] ${message}`, data !== undefined ? data : '');
        }
    },

    /**
     * Log warning messages (dev only)
     */
    warn(message: string, data?: any): void {
        if (isDev) {
            console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
        }
    },

    /**
     * Log error messages (dev only)
     */
    error(message: string, data?: any): void {
        if (isDev) {
            console.error(`[ERROR] ${message}`, data !== undefined ? data : '');
        }
    }
};
