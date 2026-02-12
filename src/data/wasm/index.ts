/**
 * Wasm Engine Bridge
 * 
 * Responsibilities:
 * - Load Wasm module
 * - Expose FFI functions with type safety
 * - Memory management (allocate/free buffers)
 * - Error handling and recovery
 * 
 * Architecture: Data Layer (mediates UI <-> Engine)
 * Authority: ffi_contract.md
 */

// TODO: Implement WasmBridge
// - Load engine/pkg/creovox_engine.js
// - Wrap FFI functions (tessellate_stroke, simplify_stroke, etc.)
// - Handle memory ownership (JavaScript allocates input, Wasm allocates output)
// - Implement free_buffer cleanup

export interface WasmEngine {
    // Stroke Processing (ffi_contract.md Section 2.1)
    tessellate_stroke(input: TessellateInput): TessellateOutput;
    simplify_stroke(input: SimplifyInput): SimplifyOutput;
    apply_pressure_curve(input: PressureCurveInput): PressureCurveOutput;

    // Bounding Box & Spatial (ffi_contract.md Section 2.2)
    compute_bbox(input: BboxInput): BboxOutput;

    // Camera & Projection (ffi_contract.md Section 2.3)
    compute_camera_matrix(input: CameraMatrixInput): CameraMatrixOutput;

    // Cache Management (ffi_contract.md Section 2.4)
    invalidate_cache(input: { stroke_uuids: string[] }): { cleared_count: number };
    get_cache_stats(): CacheStats;

    // Memory Management
    free_buffer(ptr: number): void;
}

export interface TessellateInput {
    points: Float32Array;
    widths: Float32Array;
    quality_level: number;  // 0=High, 1=Medium, 2=Low
    stroke_uuid: string;
}

export interface TessellateOutput {
    vertices: Float32Array;
    indices: Uint32Array;
    bbox: Float32Array;     // [minX, minY, maxX, maxY]
}

export interface SimplifyInput {
    points: Float32Array;
    tolerance: number;      // Default 0.3
}

export interface SimplifyOutput {
    points: Float32Array;
    reduction_ratio: number;
}

export interface PressureCurveInput {
    raw_pressure: Float32Array;
    curve_exponent: number;  // Default 0.7
    base_width: number;
    velocity?: Float32Array;
}

export interface PressureCurveOutput {
    widths: Float32Array;
}

export interface BboxInput {
    points: Float32Array;
    widths: Float32Array;
}

export interface BboxOutput {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
}

export interface CameraMatrixInput {
    position: Float32Array;    // [x, y, z]
    rotation: Float32Array;    // [rx, ry, rz]
    fov: number;
    aspect_ratio: number;
    near: number;
    far: number;
}

export interface CameraMatrixOutput {
    matrix: Float32Array;      // 4×4 matrix (column-major)
}

export interface CacheStats {
    entry_count: number;
    memory_bytes: number;
    hit_rate: number;
}

export class WasmBridge {
    private engine: WasmEngine | null = null;

    async initialize(): Promise<void> {
        // TODO: Load Wasm module from bindings/engine
        // TODO: Wrap FFI exports
    }

    // TODO: Implement wrapper methods per ffi_contract.md
}
