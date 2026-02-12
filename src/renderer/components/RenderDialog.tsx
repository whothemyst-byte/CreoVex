/**
 * Render Dialog Component
 * UI for exporting image sequences and video
 * 
 * Features:
 * - Format selection (Images/Video)
 * - Frame range input
 * - Resolution options
 * - Progress tracking
 * - Cancel button
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useFrameState } from '../state/frameState';
import { renderImageSequence } from '../render/imageSequenceRenderer';
import './RenderDialog.css';

type RenderDialogProps = {
    onClose: () => void;
};

const RenderDialog: React.FC<RenderDialogProps> = ({ onClose }) => {
    const {
        currentFrame,
        maxFrames,
        fps,
        getStrokes,
        cameraKeyframes
    } = useFrameState();

    const [format, setFormat] = useState<'images' | 'video'>('images');
    const [startFrame, setStartFrame] = useState(1);
    const [endFrame, setEndFrame] = useState(maxFrames);
    const [resolution, setResolution] = useState<'1080p' | '720p' | '4K'>('1080p');
    const [isRendering, setIsRendering] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState('');

    // Resolution presets
    const resolutions: Record<string, { width: number; height: number }> = {
        '720p': { width: 1280, height: 720 },
        '1080p': { width: 1920, height: 1080 },
        '4K': { width: 3840, height: 2160 }
    };

    /**
     * Handle image sequence export
     */
    const handleExportImages = async () => {
        try {
            setIsRendering(true);
            setStatus('Selecting output directory...');

            // Select output directory
            const dirResult = await window.electronAPI.render.selectOutputDir();
            if (!dirResult.success || dirResult.canceled) {
                setIsRendering(false);
                setStatus('');
                return;
            }

            const outputDir = dirResult.path!;
            setStatus('Rendering frames...');

            // Gather frame data
            const frameStore = new Map<number, any[]>();
            const state = useFrameState.getState();

            for (let frame = startFrame; frame <= endFrame; frame++) {
                const strokes = state.getStrokes(frame);
                frameStore.set(frame, strokes);
            }

            // Render frames
            const { width, height } = resolutions[resolution];

            const renderedFrames = await renderImageSequence(
                frameStore,
                cameraKeyframes,
                {
                    startFrame,
                    endFrame,
                    width,
                    height,
                    fps,
                    onProgress: (current, total) => {
                        setProgress({ current, total });
                        setStatus(`Rendering frame ${current} of ${total}...`);
                    }
                }
            );

            // Convert to plain object for IPC
            const framesObj: { [frame: number]: ArrayBuffer } = {};
            renderedFrames.forEach((buffer, frame) => {
                framesObj[frame] = buffer;
            });

            setStatus('Saving files...');

            // Save to disk
            const saveResult = await window.electronAPI.render.saveImageSequence(
                framesObj,
                outputDir
            );

            if (saveResult.success) {
                setStatus(`✓ Exported ${saveResult.count} frames to ${outputDir}`);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setStatus(`Error: ${saveResult.error}`);
            }
        } catch (error) {
            console.error('Render failed:', error);
            setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsRendering(false);
        }
    };

    /**
     * Handle video export (placeholder)
     */
    const handleExportVideo = async () => {
        setStatus('Video export coming soon (requires FFmpeg)');
        // TODO: Implement video rendering with FFmpeg
    };

    const handleRender = () => {
        if (format === 'images') {
            handleExportImages();
        } else {
            handleExportVideo();
        }
    };

    const frameCount = endFrame - startFrame + 1;
    const duration = frameCount / fps;

    return ReactDOM.createPortal(
        <div className="render-dialog-overlay" onClick={onClose}>
            <div className="render-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h2>Render Output</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="dialog-body">
                    {/* Format Selection */}
                    <div className="form-group">
                        <label>Format</label>
                        <div className="radio-group">
                            <label className={format === 'images' ? 'active' : ''}>
                                <input
                                    type="radio"
                                    value="images"
                                    checked={format === 'images'}
                                    onChange={(e) => setFormat(e.target.value as 'images')}
                                />
                                Image Sequence (PNG)
                            </label>
                            <label className={format === 'video' ? 'active' : ''}>
                                <input
                                    type="radio"
                                    value="video"
                                    checked={format === 'video'}
                                    onChange={(e) => setFormat(e.target.value as 'video')}
                                    disabled
                                />
                                Video (MP4) - Coming Soon
                            </label>
                        </div>
                    </div>

                    {/* Frame Range */}
                    <div className="form-group">
                        <label>Frame Range</label>
                        <div className="range-inputs">
                            <input
                                type="number"
                                min={1}
                                max={maxFrames}
                                value={startFrame}
                                onChange={(e) => setStartFrame(Math.max(1, Math.min(maxFrames, parseInt(e.target.value) || 1)))}
                                disabled={isRendering}
                            />
                            <span>to</span>
                            <input
                                type="number"
                                min={1}
                                max={maxFrames}
                                value={endFrame}
                                onChange={(e) => setEndFrame(Math.max(1, Math.min(maxFrames, parseInt(e.target.value) || maxFrames)))}
                                disabled={isRendering}
                            />
                        </div>
                        <div className="range-info">
                            {frameCount} frames ({duration.toFixed(2)}s at {fps} FPS)
                        </div>
                    </div>

                    {/* Resolution */}
                    <div className="form-group">
                        <label>Resolution</label>
                        <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value as '1080p' | '720p' | '4K')}
                            disabled={isRendering}
                        >
                            <option value="720p">720p (1280×720)</option>
                            <option value="1080p">1080p (1920×1080)</option>
                            <option value="4K">4K (3840×2160)</option>
                        </select>
                    </div>

                    {/* Progress */}
                    {isRendering && (
                        <div className="progress-container">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`
                                }}
                            />
                            <div className="progress-text">
                                {progress.current} / {progress.total}
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    {status && (
                        <div className={`status-message ${status.startsWith('✓') ? 'success' : status.startsWith('Error') ? 'error' : ''}`}>
                            {status}
                        </div>
                    )}
                </div>

                <div className="dialog-footer">
                    <button onClick={onClose} disabled={isRendering}>
                        Cancel
                    </button>
                    <button
                        onClick={handleRender}
                        disabled={isRendering || frameCount <= 0}
                        className="primary"
                    >
                        {isRendering ? 'Rendering...' : 'Render'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RenderDialog;

// TODO: Video rendering with FFmpeg
// TODO: Audio track inclusion for video
// TODO: Codec selection (H.264, H.265, VP9)
// TODO: Bitrate/quality settings
// TODO: Render presets (Draft, Final, etc.)
