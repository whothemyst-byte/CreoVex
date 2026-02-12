/**
 * OpenTimelineIO Exporter
 * Export CreoVox timeline to OTIO JSON format
 * 
 * Format: OTIO JSON (industry standard)
 * Standard: OpenTimelineIO specification
 * 
 * Structure:
 * Timeline
 *   → Video Track (USD scene reference)
 *   → Audio Track (media references)
 * 
 * ABSOLUTE RULES:
 * - Audio files referenced, NOT embedded
 * - Frame ranges preserved exactly
 * - No silent data loss
 * - Metadata survives round-trip
 */

import { AudioTrack } from '../state/frameState';

export type OTIOExportOptions = {
    projectName: string;
    version: string;
    fps: number;
    maxFrames: number;
    audioTracks: AudioTrack[];
    usdScenePath: string; // Absolute path to .usda file
};

/**
 * Export timeline to OTIO JSON
 */
export function exportToOTIO(options: OTIOExportOptions): string {
    const timeline = {
        "OTIO_SCHEMA": "Timeline.1",
        "metadata": {
            "creovox:version": options.version,
            "creovox:fps": options.fps
        },
        "name": options.projectName,
        "global_start_time": createRationalTime(0, options.fps),
        "tracks": [
            createVideoTrack(options.usdScenePath, options.fps, options.maxFrames),
            ...createAudioTracks(options.audioTracks, options.fps)
        ]
    };

    return JSON.stringify(timeline, null, 2);
}

/**
 * Create RationalTime object
 */
function createRationalTime(value: number, rate: number): any {
    return {
        "OTIO_SCHEMA": "RationalTime.1",
        "rate": rate,
        "value": value
    };
}

/**
 * Create TimeRange object
 */
function createTimeRange(startValue: number, durationValue: number, rate: number): any {
    return {
        "OTIO_SCHEMA": "TimeRange.1",
        "start_time": createRationalTime(startValue, rate),
        "duration": createRationalTime(durationValue, rate)
    };
}

/**
 * Create video track referencing USD scene
 */
function createVideoTrack(usdPath: string, fps: number, maxFrames: number): any {
    return {
        "OTIO_SCHEMA": "Track.1",
        "kind": "Video",
        "name": "Video",
        "source_range": createTimeRange(0, maxFrames, fps),
        "children": [
            {
                "OTIO_SCHEMA": "Clip.1",
                "name": "CreoVox Scene",
                "metadata": {
                    "creovox:sceneType": "usd"
                },
                "media_reference": {
                    "OTIO_SCHEMA": "ExternalReference.1",
                    "target_url": convertToFileURL(usdPath)
                },
                "source_range": createTimeRange(0, maxFrames, fps)
            }
        ]
    };
}

/**
 * Create audio tracks from CreoVox audio data
 */
function createAudioTracks(audioTracks: AudioTrack[], fps: number): any[] {
    if (audioTracks.length === 0) return [];

    // Group all audio clips into single audio track
    const audioClips = audioTracks.map(track => createAudioClip(track, fps));

    return [{
        "OTIO_SCHEMA": "Track.1",
        "kind": "Audio",
        "name": "Audio",
        "children": audioClips
    }];
}

/**
 * Create single audio clip
 */
function createAudioClip(track: AudioTrack, fps: number): any {
    // Extract filename from path for clip name
    const fileName = track.filePath.split(/[\\/]/).pop() || 'audio';

    // Calculate offset based on start frame
    // Frame 1 = offset 0, Frame 25 = offset 24, etc.
    const offsetFrames = track.startFrame - 1;

    return {
        "OTIO_SCHEMA": "Clip.1",
        "name": fileName,
        "metadata": {
            "creovox:trackId": track.id,
            "creovox:volume": track.volume
        },
        "media_reference": {
            "OTIO_SCHEMA": "ExternalReference.1",
            "target_url": convertToFileURL(track.filePath)
        },
        "source_range": createTimeRange(offsetFrames, track.durationFrames, fps)
    };
}

/**
 * Convert file path to file:// URL
 */
function convertToFileURL(filePath: string): string {
    // Normalize path separators
    let normalized = filePath.replace(/\\/g, '/');

    // Add file:// prefix if not present
    if (!normalized.startsWith('file://')) {
        // Windows paths need special handling: C:/path → file:///C:/path
        if (/^[A-Za-z]:/.test(normalized)) {
            normalized = 'file:///' + normalized;
        } else {
            normalized = 'file://' + normalized;
        }
    }

    return normalized;
}

/**
 * Validate OTIO export options
 */
export function validateOTIOExport(options: OTIOExportOptions): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (options.fps <= 0) {
        errors.push('Invalid FPS. Must be greater than 0.');
    }

    if (options.maxFrames < 1) {
        errors.push('No frames to export.');
    }

    if (!options.usdScenePath) {
        warnings.push('No USD scene path provided. Video track will be empty.');
    }

    // Check for missing audio files (warnings only, not blocking)
    for (const track of options.audioTracks) {
        if (!track.filePath) {
            warnings.push(`Audio track ${track.id} has no file path.`);
        }
    }

    return { errors, warnings };
}

/**
 * Generate example OTIO structure for documentation
 */
export function generateOTIOExample(): any {
    return {
        "OTIO_SCHEMA": "Timeline.1",
        "name": "Example",
        "global_start_time": { "OTIO_SCHEMA": "RationalTime.1", "rate": 24, "value": 0 },
        "tracks": [
            {
                "OTIO_SCHEMA": "Track.1",
                "kind": "Video",
                "children": [{
                    "OTIO_SCHEMA": "Clip.1",
                    "media_reference": {
                        "OTIO_SCHEMA": "ExternalReference.1",
                        "target_url": "file:///path/to/scene.usda"
                    }
                }]
            },
            {
                "OTIO_SCHEMA": "Track.1",
                "kind": "Audio",
                "children": [{
                    "OTIO_SCHEMA": "Clip.1",
                    "media_reference": {
                        "OTIO_SCHEMA": "ExternalReference.1",
                        "target_url": "file:///path/to/audio.mp3"
                    }
                }]
            }
        ]
    };
}

// TODO: OTIO import (reverse direction)
// TODO: Round-trip conflict resolution UI
// TODO: OTIO effect/transition support
// TODO: Multiple audio layers (separate tracks)
// TODO: Marker/annotation export
// TODO: EDL export (legacy compatibility)
