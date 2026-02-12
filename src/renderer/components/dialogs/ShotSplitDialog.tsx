import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './Dialog.css';

type ShotSplitDialogProps = {
    shotName: string;
    startFrame: number;
    endFrame: number;
    onClose: () => void;
    onConfirm: (splitFrame: number) => void;
};

export function ShotSplitDialog({
    shotName,
    startFrame,
    endFrame,
    onClose,
    onConfirm
}: ShotSplitDialogProps) {
    const suggested = Math.floor((startFrame + endFrame) / 2);
    const [splitFrame, setSplitFrame] = useState(suggested);
    const [error, setError] = useState('');

    const handleConfirm = () => {
        const split = Math.round(splitFrame);
        if (split <= startFrame || split >= endFrame) {
            setError('Split frame must be inside the shot range (not the first or last frame).');
            return;
        }

        setError('');
        onConfirm(split);
    };

    return ReactDOM.createPortal(
        <div className="cvx-dialog-overlay" onClick={onClose}>
            <div className="cvx-dialog-card" onClick={(e) => e.stopPropagation()}>
                <div className="cvx-dialog-header">
                    <h3>Split Shot</h3>
                    <button className="cvx-dialog-close" onClick={onClose}>x</button>
                </div>
                <div className="cvx-dialog-body">
                    <div className="cvx-dialog-hint">Shot: {shotName}</div>
                    <div className="cvx-dialog-hint">Current range: {startFrame} - {endFrame}</div>
                    <div className="cvx-dialog-row">
                        <label>Split at Frame</label>
                        <input
                            type="number"
                            min={startFrame + 1}
                            max={endFrame - 1}
                            value={splitFrame}
                            onChange={(e) => setSplitFrame(parseInt(e.target.value, 10) || suggested)}
                        />
                    </div>
                    {error && <div className="cvx-dialog-error">{error}</div>}
                </div>
                <div className="cvx-dialog-footer">
                    <button className="cvx-dialog-btn" onClick={onClose}>Cancel</button>
                    <button className="cvx-dialog-btn primary" onClick={handleConfirm}>Split</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
