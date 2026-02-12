/**
 * Audio Lane Component
 * Timeline audio track visualization
 * 
 * Features:
 * - Display audio blocks on timeline
 * - Show track duration and start frame
 * - Placeholder waveform visualization
 * - Track info on hover
 * 
 * Design:
 * - Matches film-strip aesthetic
 * - Positioned below frame cells
 * - Glass-panel styling
 */

import React from 'react';
import { useFrameState } from '../state/frameState';
import './AudioLane.css';

const AudioLane: React.FC = () => {
    const {
        audioTracks,
        currentFrame,
        maxFrames
    } = useFrameState();

    // Frame cell width (must match TimelineBar)
    const FRAME_WIDTH = 80;
    const FRAME_GAP = 8;

    return (
        <div className="audio-lane">
            {audioTracks.length === 0 ? (
                <div className="audio-lane-empty">
                    No audio tracks
                </div>
            ) : (
                <div className="audio-track-container">
                    {audioTracks.map((track) => {
                        const left = (track.startFrame - 1) * (FRAME_WIDTH + FRAME_GAP);
                        const width = track.durationFrames * (FRAME_WIDTH + FRAME_GAP) - FRAME_GAP;

                        // Check if track is playing at current frame
                        const isPlaying = currentFrame >= track.startFrame &&
                            currentFrame < (track.startFrame + track.durationFrames);

                        return (
                            <div
                                key={track.id}
                                className={`audio-block ${isPlaying ? 'playing' : ''}`}
                                style={{
                                    left: `${left}px`,
                                    width: `${width}px`
                                }}
                                title={`Audio: ${track.filePath.split(/[\\/]/).pop()}\nFrames: ${track.startFrame}-${track.startFrame + track.durationFrames}\nDuration: ${Math.round(track.durationFrames / 24 * 10) / 10}s`}
                            >
                                {/* Waveform placeholder */}
                                <div className="waveform-placeholder">
                                    <svg width="100%" height="100%" preserveAspectRatio="none">
                                        {/* Simple wave pattern */}
                                        {Array.from({ length: Math.min(track.durationFrames, 100) }).map((_, i) => {
                                            const x = (i / Math.min(track.durationFrames, 100)) * 100;
                                            const height = 30 + Math.sin(i * 0.3) * 20 + Math.random() * 10;
                                            return (
                                                <line
                                                    key={i}
                                                    x1={`${x}%`}
                                                    y1="50%"
                                                    x2={`${x}%`}
                                                    y2={`${50 + height}%`}
                                                    stroke="rgba(74, 158, 255, 0.3)"
                                                    strokeWidth="1"
                                                />
                                            );
                                        })}
                                    </svg>
                                </div>

                                {/* Track info */}
                                <div className="audio-info">
                                    <span className="audio-name">
                                        {track.filePath.split(/[\\/]/).pop()?.substring(0, 20)}
                                    </span>
                                    <span className="audio-duration">
                                        {Math.round(track.durationFrames / 24 * 10) / 10}s
                                    </span>
                                </div>

                                {/* Playhead indicator */}
                                {isPlaying && (
                                    <div
                                        className="audio-playhead"
                                        style={{
                                            left: `${((currentFrame - track.startFrame) / track.durationFrames) * 100}%`
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AudioLane;

// TODO: Real waveform generation from audio buffer
// TODO: Waveform caching for performance
// TODO: Audio trimming UI
// TODO: Volume envelope visualization
// TODO: Multiple audio layer support
