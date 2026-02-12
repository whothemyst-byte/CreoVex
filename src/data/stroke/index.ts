/**
 * Stroke Module Entry Point
 * 
 * Responsibilities:
 * - Stroke registry (frame/layer/UUID mapping)
 * - Stroke CRUD operations
 * - Stroke processing pipeline orchestration
 * - Wasm tessellation coordination
 * 
 * Architecture: Data Layer
 * Authority: drawing_engine_architecture.md
 */

// TODO: Implement StrokeRegistry
// - Map<frameNumber, Map<layerID, Map<strokeUUID, Stroke>>>
// - Commit stroke (from UI capture)
// - Process stroke (simplification, tessellation via Wasm)
// - Cache coordination

export interface StrokeData {
    uuid: string;
    frameNumber: number;
    layerID: string;
    points: Float32Array;      // [x0, y0, x1, y1, ...]
    pressure: Float32Array;    // [p0, p1, p2, ...]
    widths?: Float32Array;     // Computed after processing
    color: [number, number, number];  // RGB
    opacity: number;           // 0.0-1.0
    toolID: string;
    createdAt: string;         // ISO 8601
}

export class StrokeRegistry {
    // TODO: Implement per drawing_engine_architecture.md
}
