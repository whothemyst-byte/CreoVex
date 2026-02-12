/**
 * Recovery Dialog Component
 * 
 * Shows when autosave files are detected on app startup.
 * Allows user to restore unsaved changes or discard them.
 */

import React from 'react';
import './RecoveryDialog.css';

interface RecoveryDialogProps {
    autosavePath: string;
    autosaveTime: Date;
    onRestore: () => void;
    onDiscard: () => void;
}

export function RecoveryDialog({ autosavePath, autosaveTime, onRestore, onDiscard }: RecoveryDialogProps) {
    const timeString = autosaveTime.toLocaleString();

    return (
        <div className="recovery-dialog-overlay">
            <div className="recovery-dialog">
                <div className="recovery-dialog-icon">⚠️</div>
                <h2>Unsaved Changes Detected</h2>
                <p className="recovery-message">
                    CreoVox found unsaved work from <strong>{timeString}</strong>.
                </p>
                <p className="recovery-question">
                    Would you like to restore it?
                </p>

                <div className="recovery-actions">
                    <button
                        onClick={onRestore}
                        className="recovery-button primary"
                    >
                        Restore
                    </button>
                    <button
                        onClick={onDiscard}
                        className="recovery-button secondary"
                    >
                        Discard
                    </button>
                </div>

                <div className="recovery-details">
                    <small>{autosavePath}</small>
                </div>
            </div>
        </div>
    );
}
