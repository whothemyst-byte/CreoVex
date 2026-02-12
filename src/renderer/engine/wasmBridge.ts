/**
 * Wasm Engine Bridge
 * 
 * TypeScript interface to Rust/Wasm engine functions.
 * Handles FFI, memory management, and type conversions.
 * 
 * Architecture: Data Layer
 * Authority: ffi_contract.md, drawing_engine_architecture.md
 * 
 * TODO: Move to src/data/wasm/ when Data Layer is implemented
 * TODO: Add async/chunked processing for large strokes
 * TODO: Integrate with Data Layer state management
 */

import type { Point } from '../state/frameState';

interface WasmModule {
    smooth_stroke(pointsPtr: number, pointsLen: number): number;
    alloc(size: number): number;
    free_buffer(ptr: number, size: number): void;
    memory: WebAssembly.Memory;
}

let wasmModule: WasmModule | null = null;
let isInitialized = false;

/**
 * Initialize Wasm module
 * 
 * Must be called before using any Wasm functions
 */
export async function initWasm(): Promise<boolean> {
    if (isInitialized) return true;

    try {
        // Load Wasm module from engine/pkg (built by wasm-pack)
        // @ts-expect-error - Wasm module generated at build time
        const wasm = await import('../../../engine/pkg/creovox_engine.js');

        // Initialize the Wasm module
        await wasm.default();

        // Store references to exported functions
        wasmModule = {
            smooth_stroke: wasm.smooth_stroke,
            alloc: wasm.alloc,
            free_buffer: wasm.free_buffer,
            memory: wasm.memory
        } as WasmModule;

        isInitialized = true;
        console.log('✓ Wasm engine initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize Wasm engine:', error);
        return false;
    }
}

/**
 * Smooth stroke using Wasm Chaikin subdivision
 * 
 * Pressure is preserved and interpolated during smoothing.
 * 
 * @param points - Array of points to smooth (with pressure data)
 * @returns Smoothed points with interpolated pressure, or original points if Wasm fails
 * 
 * TODO: Add adaptive smoothing based on stroke velocity
 * TODO: Support chunked processing for >1000 points
 * TODO: Add custom pressure curve application
 */
export function smoothStroke(points: Point[]): Point[] {
    // Fallback if Wasm not initialized
    if (!wasmModule) {
        console.warn('Wasm not initialized, using raw stroke');
        return points;
    }

    if (points.length < 2) {
        return points;
    }

    try {
        // Convert Point[] to Float32Array [x, y, p, x, y, p, ...]
        const coordCount = points.length * 3;  // x, y, pressure per point
        const coords = new Float32Array(coordCount);

        for (let i = 0; i < points.length; i++) {
            coords[i * 3] = points[i].x;
            coords[i * 3 + 1] = points[i].y;
            coords[i * 3 + 2] = points[i].pressure;
        }

        // Allocate memory in Wasm
        const inputSize = coords.byteLength;
        const inputPtr = wasmModule.alloc(inputSize);

        // Copy data to Wasm memory
        const wasmMemory = new Uint8Array(wasmModule.memory.buffer);
        const coordBytes = new Uint8Array(coords.buffer);
        wasmMemory.set(coordBytes, inputPtr);

        // Call Wasm function
        const outputPtr = wasmModule.smooth_stroke(inputPtr, coordCount);

        // Free input buffer
        wasmModule.free_buffer(inputPtr, inputSize);

        // Handle error
        if (outputPtr === 0) {
            console.error('Wasm smooth_stroke returned null');
            return points;
        }

        // Read result
        const resultMemory = new Uint8Array(wasmModule.memory.buffer);

        // Read point count (first 4 bytes)
        const pointCountBytes = resultMemory.slice(outputPtr, outputPtr + 4);
        const pointCount = new Uint32Array(pointCountBytes.buffer)[0];

        // Read coordinates (x, y, pressure triplets)
        const coordsStart = outputPtr + 4;
        const coordsBytes = resultMemory.slice(coordsStart, coordsStart + pointCount * 3 * 4);
        const resultCoords = new Float32Array(coordsBytes.buffer);

        // Free output buffer
        const outputSize = 4 + pointCount * 3 * 4;
        wasmModule.free_buffer(outputPtr, outputSize);

        // Convert back to Point[]
        const smoothedPoints: Point[] = [];
        for (let i = 0; i < pointCount; i++) {
            smoothedPoints.push({
                x: resultCoords[i * 3],
                y: resultCoords[i * 3 + 1],
                pressure: resultCoords[i * 3 + 2]  // ✅ Pressure preserved from Wasm
            });
        }

        return smoothedPoints;
    } catch (error) {
        console.error('Wasm smoothing failed:', error);
        return points; // Fallback to original
    }
}

// TODO: Export other Wasm functions as they're implemented
// export function tessellateStroke(...)
// export function simplifyStroke(...)
// export function applyPressureCurve(...)
