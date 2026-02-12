/**
 * Tool Rail Component
 * 
 * Complete production toolbar for anime creation.
 * Organized into 6 functional categories with context-aware activation.
 * 
 * Categories:
 * 1. Drawing Tools (8 tools)
 * 2. Shot & Camera Tools (6 tools)
 * 3. Timeline Tools (9 tools)
 * 4. Storyboard Tools (3 tools - stage-specific)
 * 5. Audio Tools (4 tools)
 * 6. Navigation/Project Tools (5 tools)
 * 
 * Architecture: UI Component
 * Authority: production_toolbar_plan.md
 */

import React, { useState } from 'react';
import { useToolState } from '../state/toolState';
import { useFrameState } from '../state/frameState';
import { Stage, useNarrativeState } from '../../data/narrative';
import { getToolShortcut } from '../utils/keyboardShortcuts';
import RenderDialog from './RenderDialog';
import * as Icons from './icons/ToolIcons';
import './ToolRail.css';

type ToolRailProps = {
    onImportAudio: () => void;
    onToggleMute: () => void;
    onOpenSettings: () => void;
    onOpenFrameRange: () => void;
    onOpenShotSplit: () => void;
    onOpenShotMerge: () => void;
    onAddCameraKeyframe: () => void;
};

const ToolRail: React.FC<ToolRailProps> = ({
    onImportAudio,
    onToggleMute,
    onOpenSettings,
    onOpenFrameRange,
    onOpenShotSplit,
    onOpenShotMerge,
    onAddCameraKeyframe
}) => {
    const { activeTool, setTool } = useToolState();
    const {
        onionSkinEnabled,
        isPlaying,
        globalMuted,
        toggleOnionSkin,
        play,
        stop,
        nextFrame,
        previousFrame,
        addFrame,
        duplicateFrame,
    } = useFrameState();

    const {
        currentStage,
        selectedSceneId,
        selectedShotId,
        addScene,
        addShot,
    } = useNarrativeState();

    const [showRenderDialog, setShowRenderDialog] = useState(false);

    // Context-aware tool activation
    const hasShotSelected = Boolean(selectedShotId);
    const hasSceneSelected = Boolean(selectedSceneId);
    const shotToolsEnabled = [Stage.Shots, Stage.Storyboard, Stage.Animation, Stage.EditExport].includes(currentStage) && hasShotSelected;
    const storyboardToolsVisible = currentStage === Stage.Storyboard;

    // Helper to create tool button
    const ToolButton = ({
        tool,
        icon: Icon,
        label,
        disabled = false,
        disabledReason,
        onClick,
        active,
    }: {
        tool?: string;
        icon: React.FC<any>;
        label: string;
        disabled?: boolean;
        disabledReason?: string;
        onClick?: () => void;
        active?: boolean;
    }) => {
        const isActive = active ?? (tool ? activeTool === tool : false);
        const shortcut = tool ? getToolShortcut(tool as any) : undefined;
        const tooltip = `${label}${shortcut ? ` (${shortcut})` : ''}${disabled && disabledReason ? ` - ${disabledReason}` : ''}`;

        return (
            <button
                className={`tool-button ${isActive ? 'active' : ''}`}
                title={tooltip}
                disabled={disabled}
                onClick={() => {
                    if (onClick) {
                        onClick();
                    } else if (tool) {
                        setTool(tool as any);
                    }
                }}
            >
                <Icon size={24} />
            </button>
        );
    };

    return (
        <>
            {/* 1. Drawing Tools */}
            <div className="tool-section">
                <div className="section-label">Draw</div>
                <ToolButton tool="pen" icon={Icons.PenIcon} label="Pen Tool" />
                <ToolButton tool="eraser" icon={Icons.EraserIcon} label="Eraser" />
                <ToolButton tool="select" icon={Icons.SelectIcon} label="Select" />
                <ToolButton tool="lasso" icon={Icons.LassoIcon} label="Lasso Select" />
                <ToolButton tool="move" icon={Icons.MoveIcon} label="Move" />
                <ToolButton tool="transform" icon={Icons.TransformIcon} label="Transform" />
            </div>

            {/* 2. View Tools */}
            <div className="tool-section">
                <div className="section-label">View</div>
                <ToolButton tool="hand" icon={Icons.HandIcon} label="Hand (Pan)" />
                <ToolButton tool="zoom" icon={Icons.ZoomIcon} label="Zoom" />
                <ToolButton
                    icon={Icons.OnionSkinIcon}
                    label="Onion Skin"
                    onClick={toggleOnionSkin}
                />
            </div>

            {/* 3. Shot & Camera Tools */}
            <div className="tool-section">
                <div className="section-label">Camera</div>
                <ToolButton
                    active={activeTool === 'hand'}
                    icon={Icons.CameraMoveIcon}
                    label="Camera Move"
                    disabled={!shotToolsEnabled}
                    disabledReason={!hasSceneSelected ? "No scene selected" : "No shot selected"}
                    onClick={() => setTool('hand')}
                />
                <ToolButton
                    active={activeTool === 'zoom'}
                    icon={Icons.CameraZoomIcon}
                    label="Camera Zoom"
                    disabled={!shotToolsEnabled}
                    disabledReason={!hasSceneSelected ? "No scene selected" : "No shot selected"}
                    onClick={() => setTool('zoom')}
                />
                <ToolButton
                    active={false}
                    icon={Icons.CameraKeyframeIcon}
                    label="Add Camera Keyframe"
                    disabled={!shotToolsEnabled}
                    disabledReason={!hasSceneSelected ? "No scene selected" : "No shot selected"}
                    onClick={onAddCameraKeyframe}
                />
            </div>

            {/* 4. Shot Tools */}
            <div className="tool-section">
                <div className="section-label">Shots</div>
                <ToolButton
                    active={false}
                    icon={Icons.FrameRangeIcon}
                    label="Adjust Frame Range"
                    disabled={!shotToolsEnabled}
                    disabledReason={!hasSceneSelected ? "No scene selected" : "No shot selected"}
                    onClick={onOpenFrameRange}
                />
                <ToolButton
                    active={false}
                    icon={Icons.ShotSplitIcon}
                    label="Split Shot"
                    disabled={!shotToolsEnabled}
                    disabledReason={!hasSceneSelected ? "No scene selected" : "No shot selected"}
                    onClick={onOpenShotSplit}
                />
                <ToolButton
                    active={false}
                    icon={Icons.ShotMergeIcon}
                    label="Merge Shots"
                    disabled={!shotToolsEnabled}
                    disabledReason={!hasSceneSelected ? "No scene selected" : "No shot selected"}
                    onClick={onOpenShotMerge}
                />
            </div>

            {/* 5. Timeline Tools */}
            <div className="tool-section">
                <div className="section-label">Timeline</div>
                {!isPlaying ? (
                    <ToolButton
                        icon={Icons.PlayIcon}
                        label="Play"
                        onClick={play}
                    />
                ) : (
                    <ToolButton
                        icon={Icons.StopIcon}
                        label="Stop"
                        onClick={stop}
                    />
                )}
                <ToolButton
                    icon={Icons.PreviousFrameIcon}
                    label="Previous Frame"
                    onClick={previousFrame}
                />
                <ToolButton
                    icon={Icons.NextFrameIcon}
                    label="Next Frame"
                    onClick={nextFrame}
                />
                <ToolButton
                    icon={Icons.AddFrameIcon}
                    label="Add Frame"
                    onClick={addFrame}
                />
                <ToolButton
                    icon={Icons.DuplicateFrameIcon}
                    label="Duplicate Frame"
                    onClick={duplicateFrame}
                />
            </div>

            {/* 6. Storyboard Tools (only in storyboard stage) */}
            {storyboardToolsVisible && (
                <div className="tool-section">
                    <div className="section-label">Storyboard</div>
                    <div className="section-info">
                        Quick sketch tools active.
                        See panel for conversion.
                    </div>
                </div>
            )}

            {/* 7. Audio Tools */}
            <div className="tool-section">
                <div className="section-label">Audio</div>
                <ToolButton
                    icon={Icons.AddAudioIcon}
                    label="Add Audio Track"
                    onClick={onImportAudio}
                />
                <ToolButton
                    icon={Icons.MuteIcon}
                    label={globalMuted ? 'Unmute All Audio' : 'Mute All Audio'}
                    onClick={onToggleMute}
                    active={globalMuted}
                />
            </div>

            {/* Spacer - pushes bottom tools down */}
            <div style={{ flex: 1 }} />

            {/* 8. Navigation/Project Tools (bottom) */}
            <div className="tool-section">
                <div className="section-label">Project</div>
                <ToolButton
                    icon={Icons.AddSceneIcon}
                    label="Add Scene"
                    onClick={() => addScene('New Scene', '')}
                />
                <ToolButton
                    icon={Icons.AddSceneIcon}
                    label="Add Shot"
                    disabled={!hasSceneSelected}
                    disabledReason="No scene selected"
                    onClick={() => {
                        if (selectedSceneId) {
                            addShot(selectedSceneId, {
                                name: 'New Shot',
                                purpose: '',
                                startFrame: 1,
                                endFrame: 24,
                                hasStoryboard: false,
                                hasAnimation: false
                            });
                        }
                    }}
                />
            </div>

            {/* 9. Settings & Render (always at bottom) */}
            <div className="tool-section">
                <ToolButton
                    icon={Icons.SettingsIcon}
                    label="Settings"
                    onClick={onOpenSettings}
                />
                <ToolButton
                    icon={Icons.RenderIcon}
                    label="Render Output"
                    onClick={() => setShowRenderDialog(true)}
                />
            </div>

            {/* Render Dialog */}
            {showRenderDialog && (
                <RenderDialog onClose={() => setShowRenderDialog(false)} />
            )}
        </>
    );
};

export default ToolRail;
