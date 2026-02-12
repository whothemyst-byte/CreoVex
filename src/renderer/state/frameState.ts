/**
 * Frame State Management
 * 
 * Manages per-frame stroke storage for timeline-aware drawing.
 * 
 * Architecture: UI Layer (temporary — will move to Data Layer)
 * Authority: system_architecture.md
 * 
 * TODO: Move to src/data/timeline/ when Data Layer is implemented
 * TODO: Replace with OTIO-based timeline management
 * TODO: Add layer support (multi-layer per frame)
 */

import { create } from 'zustand';

export type Point = {
    x: number;
    y: number;
    pressure: number;
};

// Stroke is array of points (backward compatible)
export type Stroke = Point[];

// Stroke ID format: "frame:index" (e.g., "5:2" = frame 5, stroke index 2)
export type StrokeId = string;

/**
 * TASK 1: Camera keyframe data model
 */
export type CameraKeyframe = {
    frame: number;
    x: number;
    y: number;
    zoom: number;
};

export type CameraTrack = CameraKeyframe[];

// TODO: Easing curves
// TODO: Separate camera tracks
// TODO: Multiple cameras
// TODO: USD camera animation export

/**
 * Audio Track data model
 * Multiple audio tracks supported
 */
export type AudioTrack = {
    id: string;
    filePath: string;
    startFrame: number;
    durationFrames: number;
    volume: number; // 0-1
};

export type AudioTracks = AudioTrack[];

// TODO: OTIO-based audio tracks
// TODO: Multiple audio buses (music, SFX, dialogue)
// TODO: Waveform generation and caching
// TODO: Volume automation keyframes
// TODO: Audio effects (reverb, EQ)
// TODO: Audio trimming and fades

/**
 * Project snapshot for serialization
 * 
 * TODO: Replace with USD/USDA format
 * TODO: Add camera data
 * TODO: Add layer information
 * TODO: Add asset references
 */
export interface ProjectSnapshot {
    meta: {
        version: string;
        fps: number;
        createdAt: string;
        modifiedAt: string;
    };
    frames: {
        [frameNumber: string]: Stroke[];
    };
    storyboardFrames?: {
        [frameNumber: string]: Stroke[];
    };
    audio?: {
        tracks: AudioTrack[];
    };
    camera?: {
        keyframes: CameraKeyframe[];
    };
    narrative?: import('../../data/narrative').NarrativeSnapshot;
}

interface FrameStore {
    [frameNumber: number]: Stroke[];
}

interface FrameState {
    currentFrame: number;
    maxFrames: number;
    fps: number;
    frameStore: FrameStore;
    storyboardFrames: FrameStore; // Separate storyboard storage
    onionSkinEnabled: boolean;

    // Playback state
    isPlaying: boolean;
    playheadFrame: number;

    // Camera keyframes
    cameraKeyframes: CameraTrack;

    // Audio tracks
    audioTracks: AudioTracks;

    // Frame navigation
    nextFrame: () => void;
    prevFrame: () => void;
    previousFrame: () => void; // Alias for prevFrame
    setFrame: (frame: number) => void;

    // Frame manipulation
    addFrame: () => void;
    duplicateFrame: () => void;

    // Stroke management
    addStroke: (frameNumber: number, stroke: Stroke) => void;
    getStrokes: (frameNumber: number) => Stroke[];

    // Storyboard management (separate from animation)
    addStoryboardStroke: (frameNumber: number, stroke: Stroke) => void;
    getStoryboardStrokes: (frameNumber: number) => Stroke[];
    copyStoryboardToAnimation: (startFrame: number, endFrame: number) => void;

    // Onion skin
    toggleOnionSkin: () => void;

    // Playback controls
    play: () => void;
    stop: () => void;
    setPlayheadFrame: (frame: number) => void;

    // TASK 2: Camera keyframe management
    addCameraKeyframe: (frame: number, x: number, y: number, zoom: number) => void;
    removeCameraKeyframe: (frame: number) => void;
    getCameraAtFrame: (frame: number) => { x: number; y: number; zoom: number };
    hasCameraKeyframe: (frame: number) => boolean;

    // Audio track management
    addAudioTrack: (track: AudioTrack) => void;
    removeAudioTrack: (id: string) => void;
    updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => void;
    getAudioTrack: (id: string) => AudioTrack | undefined;
    getAudioTracksAtFrame: (frame: number) => AudioTrack[];

    // Project persistence
    serializeProject: () => ProjectSnapshot;
    deserializeProject: (snapshot: ProjectSnapshot) => void;
    clearProject: () => void;
}

export const useFrameState = create<FrameState>((set, get) => ({
    currentFrame: 1,
    maxFrames: 300,
    fps: 24,
    frameStore: {},
    storyboardFrames: {}, // Separate storyboard storage
    onionSkinEnabled: false,
    isPlaying: false,
    playheadFrame: 1,
    cameraKeyframes: [],
    audioTracks: [],  // Initialize empty audio tracks

    nextFrame: () => {
        // TASK 5: Stop playback when user scrubs
        set({ isPlaying: false });
        set((state) => ({
            currentFrame: Math.min(state.currentFrame + 1, state.maxFrames),
            playheadFrame: Math.min(state.currentFrame + 1, state.maxFrames)
        }));
    },

    prevFrame: () => {
        // TASK 5: Stop playback when user scrubs
        set({ isPlaying: false });
        set((state) => ({
            currentFrame: Math.max(state.currentFrame - 1, 1),
            playheadFrame: Math.max(state.currentFrame - 1, 1)
        }));
    },

    // Alias for consistency
    previousFrame: () => {
        get().prevFrame();
    },

    setFrame: (frame: number) => set((state) => ({
        currentFrame: Math.max(1, Math.min(frame, state.maxFrames))
    })),

    /**
     * Add a new blank frame at the end
     */
    addFrame: () => set((state) => ({
        maxFrames: state.maxFrames + 1
    })),

    /**
     * Duplicate the current frame
     */
    duplicateFrame: () => set((state) => {
        const currentFrame = state.currentFrame;
        const strokes = state.frameStore[currentFrame] || [];
        const newFrameNumber = currentFrame + 1;

        // Copy strokes to new frame
        const newFrameStore = { ...state.frameStore };

        // Shift all frames after current forward by 1
        for (let i = state.maxFrames; i >= newFrameNumber; i--) {
            if (newFrameStore[i]) {
                newFrameStore[i + 1] = newFrameStore[i];
            }
        }

        // Insert duplicated frame
        newFrameStore[newFrameNumber] = strokes.map(stroke => [...stroke]);

        return {
            frameStore: newFrameStore,
            maxFrames: state.maxFrames + 1,
            currentFrame: newFrameNumber
        };
    }),

    addStroke: (frameNumber: number, stroke: Stroke) => set((state) => ({
        frameStore: {
            ...state.frameStore,
            [frameNumber]: [...(state.frameStore[frameNumber] || []), stroke]
        }
    })),

    getStrokes: (frameNumber) => {
        const state = get();
        return state.frameStore[frameNumber] || [];
    },

    // ===== STORYBOARD MANAGEMENT =====

    /**
     * Add stroke to storyboard (separate from animation)
     */
    addStoryboardStroke: (frameNumber, stroke) => {
        set((state) => ({
            storyboardFrames: {
                ...state.storyboardFrames,
                [frameNumber]: [...(state.storyboardFrames[frameNumber] || []), stroke]
            }
        }));
    },

    /**
     * Get storyboard strokes for a frame
     */
    getStoryboardStrokes: (frameNumber) => {
        const state = get();
        return state.storyboardFrames[frameNumber] || [];
    },

    /**
     * Copy storyboard frames to animation frames
     * Used when converting storyboard to animation
     */
    copyStoryboardToAnimation: (startFrame, endFrame) => {
        const state = get();
        const updatedFrameStore = { ...state.frameStore };

        for (let frame = startFrame; frame <= endFrame; frame++) {
            const storyboardStrokes = state.storyboardFrames[frame];
            if (storyboardStrokes && storyboardStrokes.length > 0) {
                // Copy strokes from storyboard to animation
                updatedFrameStore[frame] = [...storyboardStrokes];
            }
        }

        set({ frameStore: updatedFrameStore });
    },

    /**
     * Toggle onion skin visibility
     * 
     * TODO: Add onion skin range control (show N frames before/after)
     * TODO: Add color customization for prev/next frames
     * TODO: Add opacity control
     */
    toggleOnionSkin: () => set((state) => ({
        onionSkinEnabled: !state.onionSkinEnabled
    })),

    /**
     * Start playback
     * 
     * Playback loop is managed by DrawingCanvas via useEffect
     * 
     * TODO: Audio-synced playback
     * TODO: OTIO-driven playback engine
     */
    play: () => set({
        isPlaying: true
    }),

    /**
     * Stop playback
     */
    stop: () => set({
        isPlaying: false
    }),

    /**
     * Set playhead frame (used during playback)
     * Also updates currentFrame to keep them in sync
     */
    setPlayheadFrame: (frame: number) => set((state) => ({
        playheadFrame: Math.max(1, Math.min(frame, state.maxFrames)),
        currentFrame: Math.max(1, Math.min(frame, state.maxFrames))
    })),

    /**
     * TASK 2: Add or update camera keyframe
     * One keyframe per frame max
     */
    addCameraKeyframe: (frame: number, x: number, y: number, zoom: number) => set((state) => {
        const existingIndex = state.cameraKeyframes.findIndex(kf => kf.frame === frame);

        const newKeyframe: CameraKeyframe = { frame, x, y, zoom };

        if (existingIndex >= 0) {
            // Overwrite existing
            const updated = [...state.cameraKeyframes];
            updated[existingIndex] = newKeyframe;
            return { cameraKeyframes: updated };
        } else {
            // Add new and sort
            const updated = [...state.cameraKeyframes, newKeyframe];
            updated.sort((a, b) => a.frame - b.frame);
            return { cameraKeyframes: updated };
        }
    }),

    /**
     * Remove camera keyframe at frame
     */
    removeCameraKeyframe: (frame: number) => set((state) => ({
        cameraKeyframes: state.cameraKeyframes.filter(kf => kf.frame !== frame)
    })),

    /**
     * TASK 3: Get camera at frame (with interpolation)
     */
    getCameraAtFrame: (frame: number): { x: number; y: number; zoom: number } => {
        const keyframes = get().cameraKeyframes;

        // TASK 6: No keyframes → return default
        if (keyframes.length === 0) {
            return { x: 0, y: 0, zoom: 1.0 };
        }

        // Check for exact keyframe
        const exact = keyframes.find(kf => kf.frame === frame);
        if (exact) {
            return { x: exact.x, y: exact.y, zoom: exact.zoom };
        }

        // Find previous and next keyframes
        let prev: CameraKeyframe | null = null;
        let next: CameraKeyframe | null = null;

        for (const kf of keyframes) {
            if (kf.frame < frame) {
                prev = kf;
            } else if (kf.frame > frame && !next) {
                next = kf;
                break;
            }
        }

        // TASK 6: One keyframe → hold value
        if (prev && !next) {
            return { x: prev.x, y: prev.y, zoom: prev.zoom };
        }
        if (!prev && next) {
            return { x: next.x, y: next.y, zoom: next.zoom };
        }

        // Linear interpolation
        if (prev && next) {
            const t = (frame - prev.frame) / (next.frame - prev.frame);

            // TASK 6: Safe interpolation (no divide-by-zero)
            if (isNaN(t) || !isFinite(t)) {
                return { x: prev.x, y: prev.y, zoom: prev.zoom };
            }

            return {
                x: prev.x + (next.x - prev.x) * t,
                y: prev.y + (next.y - prev.y) * t,
                zoom: Math.max(0.25, Math.min(4.0, prev.zoom + (next.zoom - prev.zoom) * t))  // Clamp zoom
            };
        }

        // Fallback
        return { x: 0, y: 0, zoom: 1.0 };
    },

    /**
     * TASK 5: Check if keyframe exists at frame
     */
    hasCameraKeyframe: (frame: number): boolean => {
        return get().cameraKeyframes.some(kf => kf.frame === frame);
    },

    /**
     * Audio track management
     */
    addAudioTrack: (track: AudioTrack) => set((state) => ({
        audioTracks: [...state.audioTracks, track]
    })),

    removeAudioTrack: (id: string) => set((state) => ({
        audioTracks: state.audioTracks.filter(track => track.id !== id)
    })),

    updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => set((state) => ({
        audioTracks: state.audioTracks.map(track =>
            track.id === id ? { ...track, ...updates } : track
        )
    })),

    getAudioTrack: (id: string): AudioTrack | undefined => {
        return get().audioTracks.find(track => track.id === id);
    },

    getAudioTracksAtFrame: (frame: number): AudioTrack[] => {
        const tracks = get().audioTracks;
        return tracks.filter(track => {
            const endFrame = track.startFrame + track.durationFrames;
            return frame >= track.startFrame && frame < endFrame;
        });
    },

    /**
     * Serialize project to JSON snapshot
     * 
     * TODO: Replace with USDA export
     * TODO: Add streaming for large projects (>10MB)
     * TODO: Add compression (gzip)
     */
    serializeProject: (): ProjectSnapshot => {
        const state = get();
        const now = new Date().toISOString();

        return {
            meta: {
                version: '0.1.0',
                fps: state.fps,
                createdAt: now,
                modifiedAt: now
            },
            frames: Object.fromEntries(
                Object.entries(state.frameStore).map(([frame, strokes]) => [
                    frame.toString(),
                    strokes
                ])
            ),
            storyboardFrames: Object.fromEntries(
                Object.entries(state.storyboardFrames).map(([frame, strokes]) => [
                    frame.toString(),
                    strokes
                ])
            ),
            audio: {
                tracks: state.audioTracks
            },
            camera: {
                keyframes: state.cameraKeyframes
            },
            narrative: (() => {
                try {
                    const { useNarrativeState } = require('../../data/narrative');
                    return useNarrativeState.getState()?.serialize();
                } catch (e) {
                    return undefined;
                }
            })()
        };
    },

    /**
     * Deserialize project from JSON snapshot
     * 
     * TODO: Add backward compatibility for version migrations
     * TODO: Add partial frame loading for large files
     * TODO: Validate USD schema compliance
     */
    deserializeProject: (snapshot: ProjectSnapshot) => {
        // Check version compatibility
        if (snapshot.meta.version !== '0.1.0') {
            console.warn(`Project version ${snapshot.meta.version} may not be fully compatible`);
        }

        // Parse animation frames
        const frameStore: FrameStore = {};
        for (const [frame, strokes] of Object.entries(snapshot.frames || {})) {
            const frameNum = parseInt(frame, 10);
            if (!isNaN(frameNum) && frameNum >= 1) {
                frameStore[frameNum] = strokes;
            }
        }

        // Parse storyboard frames (backward compatible)
        const storyboardFrames: FrameStore = {};
        if (snapshot.storyboardFrames) {
            for (const [frame, strokes] of Object.entries(snapshot.storyboardFrames)) {
                const frameNum = parseInt(frame, 10);
                if (!isNaN(frameNum) && frameNum >= 1) {
                    storyboardFrames[frameNum] = strokes;
                }
            }
        }

        set({
            frameStore,
            storyboardFrames,
            cameraKeyframes: snapshot.camera?.keyframes || [],
            audioTracks: snapshot.audio?.tracks || [],
            fps: snapshot.meta.fps || 24,
            currentFrame: 1,
            playheadFrame: 1,
            isPlaying: false
        });

        // Deserialize narrative data (if present)
        if (snapshot.narrative) {
            try {
                const { useNarrativeState } = require('../../data/narrative');
                useNarrativeState.getState()?.deserialize(snapshot.narrative);
            } catch (e) {
                console.warn('Failed to load narrative data:', e);
            }
        } else {
            // Auto-initialize narrative for old projects
            try {
                const { useNarrativeState } = require('../../data/narrative');
                useNarrativeState.getState()?.reset();
            } catch (e) {
                // Narrative module not available
            }
        }
    },

    /**
     * Clear all project data
     */
    clearProject: () => {
        set({
            frameStore: {},
            storyboardFrames: {},
            cameraKeyframes: [],
            audioTracks: [],
            currentFrame: 1,
            playheadFrame: 1,
            isPlaying: false
        });

        // Clear narrative data
        try {
            const { useNarrativeState } = require('../../data/narrative');
            useNarrativeState.getState()?.reset();
        } catch (e) {
            // Narrative module not available
        }
    }
}));
