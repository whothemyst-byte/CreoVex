/**
 * Warning Toast Component
 * 
 * Non-blocking warnings for user guidance.
 * Calm, informative tone - never nagging.
 * 
 * Architecture: UI Layer
 * Authority: narrative_spine_plan.md Part 6
 */

import React, { useEffect } from 'react';
import './WarningToast.css';

interface WarningToastProps {
    message: string;
    onDismiss: () => void;
    autoHideDuration?: number; // ms, default 5000
}

export function WarningToast({ message, onDismiss, autoHideDuration = 5000 }: WarningToastProps) {
    useEffect(() => {
        if (autoHideDuration > 0) {
            const timer = setTimeout(onDismiss, autoHideDuration);
            return () => clearTimeout(timer);
        }
    }, [autoHideDuration, onDismiss]);

    return (
        <div className="warning-toast">
            <span className="warning-icon">⚠️</span>
            <span className="warning-message">{message}</span>
            <button onClick={onDismiss} className="dismiss-button" title="Dismiss">
                ✕
            </button>
        </div>
    );
}
