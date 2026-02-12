/**
 * Timeline Module Entry Point
 * 
 * Responsibilities:
 * - OTIO timeline management
 * - Frame evaluation (RationalTime conversion)
 * - Playback clock synchronization
 * - Scrubbing logic
 * 
 * Architecture: Data Layer
 * Authority: timeline_camera_interop.md (Section 1)
 */

// TODO: Implement TimelineManager
// - OTIO timeline wrapper
// - RationalTime <-> frame number conversion
// - Playback evaluation (6-step process)
// - Scrubbing with cache prefetch

export interface TimelineState {
    currentFrame: number;      // 1-indexed
    frameRate: number;         // Fixed (24/25/30/60)
    totalFrames: number;
}

export class TimelineManager {
    // TODO: Implement per timeline_camera_interop.md
}
