/**
 * Storyboard Tools Component
 * 
 * Provides tools for storyboard mode:
 * - Visual indicator that you're in storyboard mode
 * - "Convert to Animation" button for selected shot
 * - Shot info display
 * 
 * Architecture: UI Layer  
 * Authority: narrative_spine_plan.md Part 4
 */

import React from 'react';
import { useNarrativeState } from '../../data/narrative';
import { useFrameState } from '../state/frameState';
import './StoryboardTools.css';

export function StoryboardTools() {
    const { scenes, selectedSceneId, selectedShotId } = useNarrativeState();
    const { copyStoryboardToAnimation } = useFrameState();

    const selectedScene = scenes.find(s => s.id === selectedSceneId);
    const selectedShot = selectedScene?.shots.find(s => s.id === selectedShotId);

    if (!selectedShot) {
        return (
            <div className="storyboard-tools empty">
                <span className="mode-indicator">✏️ Storyboard Mode</span>
                <span className="empty-message">Select a shot to start boarding</span>
            </div>
        );
    }

    const handleConvert = () => {
        if (!selectedShot) return;

        const confirmed = confirm(
            `Convert storyboard to animation for "${selectedShot.name}"?\n\n` +
            `This will copy frames ${selectedShot.startFrame}-${selectedShot.endFrame} ` +
            `from storyboard to animation.`
        );

        if (confirmed) {
            copyStoryboardToAnimation(selectedShot.startFrame, selectedShot.endFrame);
            alert(`Storyboard converted! Frames ${selectedShot.startFrame}-${selectedShot.endFrame} are now animation frames.`);
        }
    };

    return (
        <div className="storyboard-tools">
            <div className="mode-indicator">
                <span className="icon">✏️</span>
                <span className="label">Storyboard Mode</span>
            </div>

            <div className="shot-info">
                <div className="shot-name">{selectedShot.name}</div>
                <div className="shot-frames">
                    Frames: {selectedShot.startFrame}-{selectedShot.endFrame}
                    ({selectedShot.endFrame - selectedShot.startFrame + 1} frames)
                </div>
            </div>

            <button
                onClick={handleConvert}
                className="convert-button"
                title="Copy storyboard frames to animation"
            >
                🎞️ Convert to Animation
            </button>

            <div className="help-text">
                Storyboard frames are separate from animation.
                Convert when ready to finalize.
            </div>
        </div>
    );
}
