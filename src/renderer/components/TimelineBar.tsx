/**
 * Timeline Bar Component — Film-Strip Style
 * Cinematic horizontal frame strip
 * 
 * Features:
 * - Frame thumbnails (placeholders for now)
 * - Playhead indicator with glow
 * - Horizontal scrollable strip
 * - Camera keyframe indicators
 * - Click frame to jump
 * 
 * Design:
 * - Film-strip aesthetic
 * - Glass-panel background
 * - Smooth scroll behavior
 * - Clear current frame highlight
 */

import React, { useRef, useEffect } from 'react';
import { useFrameState } from '../state/frameState';
import AudioLane from './AudioLane';
import './TimelineBar.css';

const TimelineBar: React.FC = () => {
    const {
        currentFrame,
        maxFrames,
        fps,
        setFrame,
        hasCameraKeyframe,
        getCameraAtFrame,
        addCameraKeyframe
    } = useFrameState();

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to current frame
    useEffect(() => {
        if (scrollContainerRef.current) {
            const frameElement = scrollContainerRef.current.querySelector(`[data-frame="${currentFrame}"]`);
            if (frameElement) {
                frameElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [currentFrame]);

    // Generate frame range
    const frames = Array.from({ length: maxFrames }, (_, i) => i + 1);

    // Handle frame click
    const handleFrameClick = (frame: number) => {
        setFrame(frame);
    };

    // Handle add camera keyframe
    const handleAddCameraKeyframe = () => {
        const cam = getCameraAtFrame(currentFrame);
        addCameraKeyframe(currentFrame, cam.x, cam.y, cam.zoom);
    };

    const hasKeyframe = hasCameraKeyframe(currentFrame);

    return (
        <div className="timeline-container">
            {/* Timeline Controls */}
            <div className="timeline-controls">
                <div className="timeline-info">
                    <span className="frame-counter">
                        Frame <strong>{currentFrame}</strong> / {maxFrames}
                    </span>
                    <span className="fps-display">{fps} fps</span>
                </div>

                {/* Camera Keyframe Button */}
                <button
                    onClick={handleAddCameraKeyframe}
                    className={`camera-keyframe-btn ${hasKeyframe ? 'active' : ''}`}
                    title={hasKeyframe ? 'Update camera keyframe' : 'Add camera keyframe'}
                >
                    {hasKeyframe ? '● Camera' : '○ Camera'}
                </button>
            </div>

            {/* Film-Strip Frames */}
            <div className="film-strip" ref={scrollContainerRef}>
                <div className="film-strip-track">
                    {frames.map((frame) => {
                        const isActive = frame === currentFrame;
                        const hasKey = hasCameraKeyframe(frame);

                        return (
                            <div
                                key={frame}
                                data-frame={frame}
                                className={`frame-cell ${isActive ? 'active' : ''}`}
                                onClick={() => handleFrameClick(frame)}
                            >
                                {/* Frame Thumbnail (placeholder) */}
                                <div className="frame-thumbnail">
                                    <span className="frame-number">{frame}</span>
                                </div>

                                {/* Camera Keyframe Indicator */}
                                {hasKey && <div className="keyframe-dot"></div>}

                                {/* Playhead Indicator */}
                                {isActive && <div className="playhead-indicator"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Audio Lane */}
            <AudioLane />
        </div>
    );
};

export default TimelineBar;
