import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { AppSettings } from '../../utils/settings';
import './Dialog.css';

type SettingsDialogProps = {
    initialSettings: AppSettings;
    onClose: () => void;
    onSave: (settings: AppSettings) => void;
};

export function SettingsDialog({ initialSettings, onClose, onSave }: SettingsDialogProps) {
    const [settings, setSettings] = useState<AppSettings>(initialSettings);

    const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    return ReactDOM.createPortal(
        <div className="cvx-dialog-overlay" onClick={onClose}>
            <div className="cvx-dialog-card" onClick={(e) => e.stopPropagation()}>
                <div className="cvx-dialog-header">
                    <h3>Settings</h3>
                    <button className="cvx-dialog-close" onClick={onClose}>x</button>
                </div>
                <div className="cvx-dialog-body">
                    <div className="cvx-dialog-row">
                        <label>Default Brush Size</label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={settings.brushSizeDefault}
                            onChange={(e) => update('brushSizeDefault', Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                        />
                    </div>
                    <div className="cvx-dialog-row">
                        <label>Default Eraser Size</label>
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={settings.eraserSizeDefault}
                            onChange={(e) => update('eraserSizeDefault', Math.max(1, Math.min(200, parseInt(e.target.value, 10) || 1)))}
                        />
                    </div>
                    <div className="cvx-dialog-row">
                        <label>Default FPS</label>
                        <input
                            type="number"
                            min={1}
                            max={120}
                            value={settings.defaultFps}
                            onChange={(e) => update('defaultFps', Math.max(1, Math.min(120, parseInt(e.target.value, 10) || 24)))}
                        />
                    </div>
                    <div className="cvx-dialog-row">
                        <label>Autosave Interval (seconds)</label>
                        <input
                            type="number"
                            min={5}
                            max={300}
                            value={settings.autosaveIntervalSec}
                            onChange={(e) => update('autosaveIntervalSec', Math.max(5, Math.min(300, parseInt(e.target.value, 10) || 30)))}
                        />
                    </div>
                    <div className="cvx-dialog-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={settings.onionSkinDefault}
                                onChange={(e) => update('onionSkinDefault', e.target.checked)}
                            />{' '}
                            Enable Onion Skin by default
                        </label>
                    </div>
                </div>
                <div className="cvx-dialog-footer">
                    <button className="cvx-dialog-btn" onClick={onClose}>Cancel</button>
                    <button className="cvx-dialog-btn primary" onClick={() => onSave(settings)}>Save</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
