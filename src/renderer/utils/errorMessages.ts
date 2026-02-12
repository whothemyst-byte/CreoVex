/**
 * Error Message Converter
 * 
 * Converts technical error objects into user-friendly messages.
 * Prevents exposing stack traces and technical details to end users.
 */

export function getReadableError(error: unknown): string {
    if (typeof error === 'string') {
        const message = error.toLowerCase();

        if (message.includes('autosave_invalid_json')) {
            return 'Autosave file is corrupted and cannot be restored.';
        }

        if (message.includes('autosave_no_valid_candidate')) {
            return 'Only corrupted autosave files were found. Nothing can be restored.';
        }

        return `Operation failed: ${error}`;
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Permission errors
        if (message.includes('eacces') || message.includes('permission') || message.includes('eperm')) {
            return 'Permission denied. Check file permissions or try running as administrator.';
        }

        // Disk full
        if (message.includes('enospc')) {
            return 'Disk is full. Free up space and try again.';
        }

        // File not found
        if (message.includes('enoent')) {
            return 'File not found. It may have been moved or deleted.';
        }

        if (message.includes('autosave_invalid_json')) {
            return 'Autosave file is corrupted and cannot be restored.';
        }

        if (message.includes('autosave_no_valid_candidate')) {
            return 'Only corrupted autosave files were found. Nothing can be restored.';
        }

        // Network/connection errors
        if (message.includes('etimedout') || message.includes('econnrefused')) {
            return 'Network error. Check your connection and try again.';
        }

        // File already in use
        if (message.includes('ebusy')) {
            return 'File is in use by another program. Close it and try again.';
        }

        // Path too long
        if (message.includes('enametoolong')) {
            return 'File path is too long. Try saving to a shorter path.';
        }

        // Generic fallback with cleaned message
        return `Operation failed: ${error.message}`;
    }

    // Unknown error type
    return 'Operation failed due to unknown error.';
}

/**
 * Get a safe error object for logging (strips sensitive data)
 */
export function getSafeErrorForLogging(error: unknown): Record<string, any> {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n') // Only first 3 lines
        };
    }
    return { error: String(error) };
}
