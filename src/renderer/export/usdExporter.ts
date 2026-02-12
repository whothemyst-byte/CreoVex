/**
 * USD Scene Exporter
 * Export CreoVox scene data to USD (USDA text format)
 * 
 * Format: USDA (ASCII) for human readability and diffability
 * Standard: Pixar USD specification
 * 
 * Structure:
 * /World
 *   /Strokes
 *     /Frame_XXX
 *       /Stroke_XXX (UsdGeomBasisCurves)
 *   /Camera (UsdGeomCamera)
 * 
 * ABSOLUTE RULES:
 * - No data loss
 * - No rasterization (vector only)
 * - Deterministic output
 * - Inspectable text format
 */

import { Stroke, CameraKeyframe } from '../state/frameState';

export type USDExportOptions = {
    projectName: string;
    version: string;
    fps: number;
    startFrame: number;
    endFrame: number;
    frames: Map<number, Stroke[]>;
    cameraKeyframes: CameraKeyframe[];
};

/**
 * Export complete scene to USD
 */
export function exportToUSD(options: USDExportOptions): string {
    const header = generateUSDHeader(options);
    const strokes = generateStrokesHierarchy(options.frames);
    const camera = generateCamera(options.cameraKeyframes, options.fps);

    return `${header}

def Xform "World" {
    def Scope "Strokes" {
${strokes}
    }

${camera}
}
`;
}

/**
 * Generate USD header with metadata
 */
function generateUSDHeader(options: USDExportOptions): string {
    return `#usda 1.0
(
    defaultPrim = "World"
    metersPerUnit = 1
    timeCodesPerSecond = ${options.fps}
    startTimeCode = ${options.startFrame}
    endTimeCode = ${options.endFrame}
    upAxis = "Y"
    customData = {
        string creovox:version = "${options.version}"
        string creovox:projectName = "${options.projectName}"
        int creovox:fps = ${options.fps}
    }
)`;
}

/**
 * Generate stroke hierarchy
 * Each frame gets its own Scope with BasisCurves children
 */
function generateStrokesHierarchy(frames: Map<number, Stroke[]>): string {
    const frameSections: string[] = [];

    // Sort frames numerically
    const sortedFrames = Array.from(frames.keys()).sort((a, b) => a - b);

    for (const frameNum of sortedFrames) {
        const strokes = frames.get(frameNum);
        if (!strokes || strokes.length === 0) continue;

        const frameId = `Frame_${String(frameNum).padStart(3, '0')}`;
        const strokesUSD = strokes
            .map((stroke, index) => strokeToUSDCurve(stroke, index))
            .join('\n\n');

        frameSections.push(`        def Scope "${frameId}" {
${strokesUSD}
        }`);
    }

    return frameSections.join('\n\n');
}

/**
 * Convert single stroke to UsdGeomBasisCurves
 */
function strokeToUSDCurve(stroke: Stroke, index: number): string {
    if (stroke.length === 0) return '';

    const strokeId = `Stroke_${String(index).padStart(3, '0')}`;

    // Convert points to USD format: (x, y, z=0)
    const points = stroke
        .map(p => `(${p.x}, ${p.y}, 0)`)
        .join(', ');

    // Convert pressure to width (baseWidth + pressure * scale)
    const baseWidth = 3;
    const pressureScale = 3;
    const widths = stroke
        .map(p => baseWidth + (p.pressure * pressureScale))
        .join(', ');

    return `            def BasisCurves "${strokeId}" {
                uniform token type = "linear"
                uniform token wrap = "nonperiodic"
                int[] curveVertexCounts = [${stroke.length}]
                point3f[] points = [${points}]
                float[] widths = [${widths}]
                custom color3f displayColor = (0.1, 0.1, 0.1)
            }`;
}

/**
 * Generate camera with animation
 */
function generateCamera(keyframes: CameraKeyframe[], fps: number): string {
    if (keyframes.length === 0) {
        // Static camera at origin
        return `    def Camera "Camera" {
        float focalLength = 50
        double3 xformOp:translate = (0, 0, 0)
        uniform token[] xformOpOrder = ["xformOp:translate"]
    }`;
    }

    // Sort keyframes by frame
    const sortedKeyframes = [...keyframes].sort((a, b) => a.frame - b.frame);

    // Generate time samples for focal length
    const focalSamples = sortedKeyframes
        .map(kf => `            ${kf.frame}: ${zoomToFocalLength(kf.zoom)}`)
        .join(',\n');

    // Generate time samples for position
    // Note: USD camera moves, so we negate the CreoVox pan values
    const translateSamples = sortedKeyframes
        .map(kf => `            ${kf.frame}: (${-kf.x}, ${-kf.y}, 0)`)
        .join(',\n');

    return `    def Camera "Camera" {
        float focalLength.timeSamples = {
${focalSamples}
        }
        double3 xformOp:translate.timeSamples = {
${translateSamples}
        }
        uniform token[] xformOpOrder = ["xformOp:translate"]
    }`;
}

/**
 * Convert CreoVox zoom to USD focal length
 * Standard 50mm lens at zoom=1.0
 * Inverse relationship: zoom in → longer focal length
 */
function zoomToFocalLength(zoom: number): number {
    const baseFocalLength = 50;
    return baseFocalLength / Math.max(0.1, zoom); // Prevent division by zero
}

/**
 * Validate export options
 */
export function validateUSDExport(options: USDExportOptions): string[] {
    const errors: string[] = [];

    if (options.fps <= 0) {
        errors.push('Invalid FPS. Must be greater than 0.');
    }

    if (options.startFrame < 1) {
        errors.push('Start frame must be at least 1.');
    }

    if (options.endFrame < options.startFrame) {
        errors.push('End frame must be >= start frame.');
    }

    if (options.frames.size === 0) {
        errors.push('No frames to export.');
    }

    return errors;
}

// TODO: USDZ export (binary + packaged assets)
// TODO: Per-layer USD files (compositing workflows)
// TODO: USD material assignment (stroke colors per frame)
// TODO: UsdSkel for skeletal animation (future character rigging)
// TODO: Texture coordinate generation for fill effects
