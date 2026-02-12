/**
 * Stage Navigation Component
 * 
 * Top navigation bar for workflow stages.
 * Allows users to switch between Script, Scenes, Shots, Storyboard, Animation, and Export.
 * 
 * Architecture: UI Layer
 * Authority: narrative_spine_plan.md Part 2
 */

import React from 'react';
import { Stage, useNarrativeState } from '../../data/narrative';
import './StageNav.css';

export function StageNav() {
    const { currentStage, setStage } = useNarrativeState();

    const stages = [
        { id: Stage.Script, label: 'Script', icon: '📝' },
        { id: Stage.Scenes, label: 'Scenes', icon: '🎬' },
        { id: Stage.Shots, label: 'Shots', icon: '🎥' },
        { id: Stage.Storyboard, label: 'Storyboard', icon: '✏️' },
        { id: Stage.Animation, label: 'Animation', icon: '🎞️' },
        { id: Stage.EditExport, label: 'Export', icon: '📤' }
    ];

    return (
        <nav className="stage-nav">
            {stages.map(stage => (
                <button
                    key={stage.id}
                    className={`stage-button ${currentStage === stage.id ? 'active' : ''}`}
                    onClick={() => setStage(stage.id)}
                    title={stage.label}
                >
                    <span className="stage-icon">{stage.icon}</span>
                    <span className="stage-label">{stage.label}</span>
                </button>
            ))}
        </nav>
    );
}
