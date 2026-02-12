import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './Dialog.css';

type FrameRangeDialogProps = {
    shotName: string;
    maxFrames: number;
    initialStart: number;
    initialEnd: number;
    onClose: () => void;
    onConfirm: (startFrame: number, endFrame: number) => void;
};

export function FrameRangeDialog({
    shotName,
    maxFrames,
    initialStart,
    initialEnd,
    onClose,
    onConfirm
}: FrameRangeDialogProps) {
    const [startFrame, setStartFrame] = useState(initialStart);
    const [endFrame, setEndFrame] = useState(initialEnd);
    const [error, setError] = useState('');

    const handleConfirm = () => {
        const start = Math.max(1, Math.min(maxFrames, Math.round(startFrame)));
        const end = Math.max(1, Math.min(maxFrames, Math.round(endFrame)));

        if (start > end) {
            setError('Start frame must be less than or equal to end frame.');
            return;
        }

        setError('');
        onConfirm(start, end);
    };

    return ReactDOM.createPortal(
        <div className="cvx-dialog-overlay" onClick={onClose}>
            <div className="cvx-dialog-card" onClick={(e) => e.stopPropagation()}>
                <div className="cvx-dialog-header">
                    <h3>Adjust Shot Frame Range</h3>
                    <button className="cvx-dialog-close" onClick={onClose}>x</button>
                </div>
                <div className="cvx-dialog-body">
                    <div className="cvx-dialog-hint">Shot: {shotName}</div>
                    <div className="cvx-dialog-row">
                        <label>Start Frame</label>
                        <input
                            type="number"
                            min={1}
                            max={maxFrames}
                            value={startFrame}
                            onChange={(e) => setStartFrame(parseInt(e.target.value, 10) || 1)}
                        />
                    </div>
                    <div className="cvx-dialog-row">
                        <label>End Frame</label>
                        <input
                            type="number"
                            min={1}
                            max={maxFrames}
                            value={endFrame}
                            onChange={(e) => setEndFrame(parseInt(e.target.value, 10) || maxFrames)}
                        />
                    </div>
                    {error && <div className="cvx-dialog-error">{error}</div>}
                </div>
                <div className="cvx-dialog-footer">
                    <button className="cvx-dialog-btn" onClick={onClose}>Cancel</button>
                    <button className="cvx-dialog-btn primary" onClick={handleConfirm}>Apply</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
