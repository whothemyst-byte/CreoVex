/**
 * Shot Panel Component
 * 
 * Displays shots for the selected scene.
 * Allows shot management and selection.
 * 
 * Architecture: UI Layer
 * Authority: narrative_spine_plan.md Part 3
 */

import React, { useState } from 'react';
import { useNarrativeState } from '../../data/narrative';
import { useFrameState } from '../state/frameState';
import './ShotPanel.css';

export function ShotPanel() {
    const {
        scenes,
        selectedSceneId,
        selectedShotId,
        addShot,
        removeShot,
        updateShot,
        selectShot
    } = useNarrativeState();

    const { setFrame } = useFrameState();

    const [isAddingShot, setIsAddingShot] = useState(false);
    const [newShotName, setNewShotName] = useState('');
    const [newShotDuration, setNewShotDuration] = useState(24); // 1 second at 24fps

    const selectedScene = scenes.find(s => s.id === selectedSceneId);

    const handleAddShot = () => {
        if (!selectedSceneId || !newShotName.trim()) return;

        // Calculate start frame (after last shot or frame 1)
        const lastShot = selectedScene?.shots[selectedScene.shots.length - 1];
        const startFrame = lastShot ? lastShot.endFrame + 1 : 1;

        addShot(selectedSceneId, {
            name: newShotName.trim(),
            startFrame,
            endFrame: startFrame + newShotDuration - 1,
            hasStoryboard: false,
            hasAnimation: false
        });

        setNewShotName('');
        setNewShotDuration(24);
        setIsAddingShot(false);
    };

    const handleSelectShot = (shotId: string) => {
        selectShot(shotId);
        // Update playhead to shot's start frame
        const shot = selectedScene?.shots.find(s => s.id === shotId);
        if (shot) {
            setFrame(shot.startFrame);
        }
    };

    if (!selectedScene) {
        return (
            <div className="shot-panel empty">
                <span className="empty-message">
                    Select a scene to view its shots
                </span>
            </div>
        );
    }

    return (
        <div className="shot-panel">
            <div className="panel-header">
                <h3>Shots - {selectedScene.name}</h3>
                <button
                    onClick={() => setIsAddingShot(true)}
                    className="add-button"
                    title="Add Shot"
                >
                    + Add
                </button>
            </div>

            <ul className="shot-list">
                {isAddingShot && (
                    <li className="shot-item adding">
                        <div className="shot-form">
                            <input
                                type="text"
                                value={newShotName}
                                onChange={(e) => setNewShotName(e.target.value)}
                                placeholder="Shot name..."
                                autoFocus
                                className="shot-input"
                            />
                            <div className="duration-input">
                                <label>Duration:</label>
                                <input
                                    type="number"
                                    value={newShotDuration}
                                    onChange={(e) => setNewShotDuration(parseInt(e.target.value) || 24)}
                                    min="1"
                                    className="shot-duration"
                                />
                                <span>frames</span>
                            </div>
                            <div className="form-actions">
                                <button onClick={handleAddShot} className="confirm-button">✓ Add</button>
                                <button
                                    onClick={() => {
                                        setIsAddingShot(false);
                                        setNewShotName('');
                                        setNewShotDuration(24);
                                    }}
                                    className="cancel-button"
                                >
                                    ✕ Cancel
                                </button>
                            </div>
                        </div>
                    </li>
                )}

                {selectedScene.shots.length === 0 && !isAddingShot && (
                    <li className="shot-item empty-state">
                        <span className="empty-message">
                            No shots yet. Add one to start!
                        </span>
                    </li>
                )}

                {selectedScene.shots.map((shot) => (
                    <li
                        key={shot.id}
                        className={`shot-item ${selectedShotId === shot.id ? 'selected' : ''}`}
                        onClick={() => handleSelectShot(shot.id)}
                    >
                        <div className="shot-header">
                            <span className="shot-name">{shot.name}</span>
                            <div className="shot-status">
                                {shot.hasStoryboard && <span className="status-badge storyboard" title="Has storyboard">✏️</span>}
                                {shot.hasAnimation && <span className="status-badge animation" title="Has animation">🎞️</span>}
                            </div>
                        </div>
                        <div className="shot-meta">
                            <span className="shot-frames">
                                Frames: {shot.startFrame}-{shot.endFrame} ({shot.endFrame - shot.startFrame + 1} frames)
                            </span>
                            {shot.purpose && <span className="shot-purpose">{shot.purpose}</span>}
                        </div>
                        <div className="shot-actions">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete shot "${shot.name}"?`)) {
                                        removeShot(shot.id);
                                    }
                                }}
                                className="delete-button"
                                title="Delete"
                            >
                                🗑
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
