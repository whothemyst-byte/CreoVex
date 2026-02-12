import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Shot } from '../../../data/narrative';
import './Dialog.css';

type ShotMergeDialogProps = {
    selectedShot: Shot;
    mergeCandidates: Shot[];
    onClose: () => void;
    onConfirm: (targetShotId: string) => void;
};

export function ShotMergeDialog({
    selectedShot,
    mergeCandidates,
    onClose,
    onConfirm
}: ShotMergeDialogProps) {
    const [targetShotId, setTargetShotId] = useState<string>(mergeCandidates[0]?.id || '');

    return ReactDOM.createPortal(
        <div className="cvx-dialog-overlay" onClick={onClose}>
            <div className="cvx-dialog-card" onClick={(e) => e.stopPropagation()}>
                <div className="cvx-dialog-header">
                    <h3>Merge Shots</h3>
                    <button className="cvx-dialog-close" onClick={onClose}>x</button>
                </div>
                <div className="cvx-dialog-body">
                    <div className="cvx-dialog-hint">
                        Base shot: {selectedShot.name} ({selectedShot.startFrame}-{selectedShot.endFrame})
                    </div>
                    <div className="cvx-dialog-row">
                        <label>Merge with Adjacent Shot</label>
                        <select value={targetShotId} onChange={(e) => setTargetShotId(e.target.value)}>
                            {mergeCandidates.map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                    {candidate.name} ({candidate.startFrame}-{candidate.endFrame})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="cvx-dialog-footer">
                    <button className="cvx-dialog-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="cvx-dialog-btn primary"
                        disabled={!targetShotId}
                        onClick={() => onConfirm(targetShotId)}
                    >
                        Merge
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
