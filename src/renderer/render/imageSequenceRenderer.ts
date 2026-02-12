/**
 * Image Sequence Renderer
 * Offline frame-by-frame rendering to PNG
 * 
 * Responsibilities:
 * - Render individual frames to ImageData
 * - Export frames as PNG files
 * - Deterministic rendering (no requestAnimationFrame)
 * - Progress reporting via callback
 * 
 * Architecture: Renderer Process (Rendering Layer)
 * Authority: audio_render_plan.md
 */

import { Stroke, Point, CameraKeyframe } from '../state/frameState';

export type RenderOptions = {
    startFrame: number;
    endFrame: number;
    width: number;
    height: number;
    fps: number;
    onProgress?: (frame: number, total: number) => void;
};

export type FrameData = {
    frame: number;
    strokes: Stroke[];
    camera: { x: number; y: number; zoom: number };
};

/**
 * Render a single frame to canvas and export as ImageData
 */
export async function renderFrame(
    canvas: HTMLCanvasElement,
    frameData: FrameData,
    width: number,
    height: number
): Promise<ImageData> {
    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    // Clear canvas
    ctx.fillStyle = '#2a2a2a'; // Match canvas background
    ctx.fillRect(0, 0, width, height);

    // Apply camera transform
    ctx.save();
    ctx.translate(-frameData.camera.x, -frameData.camera.y);
    ctx.scale(frameData.camera.zoom, frameData.camera.zoom);

    // Draw white canvas boundary (1920x1080)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1920, 1080);

    // Draw strokes
    frameData.strokes.forEach(stroke => {
        drawStrokeWithPressure(ctx, stroke, '#1a1a1a');
    });

    ctx.restore();

    // Extract pixel data
    return ctx.getImageData(0, 0, width, height);
}

/**
 * Draw stroke with pressure-based width
 * (Duplicated from DrawingCanvas for offline rendering)
 */
function drawStrokeWithPressure(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    color: string
): void {
    if (stroke.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < stroke.length - 1; i++) {
        const point = stroke[i];
        const nextPoint = stroke[i + 1];

        // Use pressure to modulate line width
        const baseWidth = 3;
        const pressureScale = 3;
        const lineWidth = baseWidth + (point.pressure * pressureScale);

        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
    }
}

/**
 * Convert ImageData to PNG Blob
 */
export async function imageToPNG(imageData: ImageData): Promise<Blob> {
    // Create temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to create temp canvas');
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create PNG blob'));
            }
        }, 'image/png');
    });
}

/**
 * Convert Blob to ArrayBuffer for IPC transfer
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return await blob.arrayBuffer();
}

/**
 * Render image sequence
 * Returns array of PNG data buffers
 */
export async function renderImageSequence(
    frames: Map<number, Stroke[]>,
    cameraKeyframes: CameraKeyframe[],
    options: RenderOptions
): Promise<Map<number, ArrayBuffer>> {
    const results = new Map<number, ArrayBuffer>();
    const offscreenCanvas = document.createElement('canvas');

    // Helper to get camera at frame
    const getCameraAtFrame = (frame: number): { x: number; y: number; zoom: number } => {
        if (cameraKeyframes.length === 0) {
            return { x: 0, y: 0, zoom: 1.0 };
        }

        const exact = cameraKeyframes.find(kf => kf.frame === frame);
        if (exact) {
            return { x: exact.x, y: exact.y, zoom: exact.zoom };
        }

        let prev: CameraKeyframe | null = null;
        let next: CameraKeyframe | null = null;

        for (const kf of cameraKeyframes) {
            if (kf.frame < frame) {
                prev = kf;
            } else if (kf.frame > frame && !next) {
                next = kf;
                break;
            }
        }

        if (prev && next) {
            const t = (frame - prev.frame) / (next.frame - prev.frame);
            return {
                x: prev.x + (next.x - prev.x) * t,
                y: prev.y + (next.y - prev.y) * t,
                zoom: Math.max(0.25, Math.min(4.0, prev.zoom + (next.zoom - prev.zoom) * t))
            };
        }

        if (prev) return { x: prev.x, y: prev.y, zoom: prev.zoom };
        if (next) return { x: next.x, y: next.y, zoom: next.zoom };

        return { x: 0, y: 0, zoom: 1.0 };
    };

    // Render each frame
    for (let frame = options.startFrame; frame <= options.endFrame; frame++) {
        const strokes = frames.get(frame) || [];
        const camera = getCameraAtFrame(frame);

        const frameData: FrameData = {
            frame,
            strokes,
            camera
        };

        // Render frame
        const imageData = await renderFrame(
            offscreenCanvas,
            frameData,
            options.width,
            options.height
        );

        // Convert to PNG
        const pngBlob = await imageToPNG(imageData);
        const arrayBuffer = await blobToArrayBuffer(pngBlob);

        results.set(frame, arrayBuffer);

        // Report progress
        if (options.onProgress) {
            const total = options.endFrame - options.startFrame + 1;
            const current = frame - options.startFrame + 1;
            options.onProgress(current, total);
        }
    }

    return results;
}

// TODO: Hardware-accelerated rendering (WebGL)
// TODO: Render quality settings (anti-aliasing, resolution scale)
// TODO: Render layers separately
// TODO: Alpha channel export
// TODO: Render hooks for effects/filters
