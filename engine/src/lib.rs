/**
 * CreoVox Rust/Wasm Engine
 * 
 * Performance-critical stroke processing operations.
 * 
 * Architecture: Engine Layer
 * Authority: drawing_engine_architecture.md, ffi_contract.md
 */

use wasm_bindgen::prelude::*;

/**
 * Smooth stroke using Chaikin subdivision algorithm
 * 
 * Input format: [x0, y0, p0, x1, y1, p1, x2, y2, p2, ...]
 * Output format: same structure, smoothed
 * 
 * Algorithm: 2 iterations of Chaikin subdivision for noticeable smoothing
 * Performance: O(n) where n = point count
 * 
 * Pressure is preserved and smoothed alongside position data.
 * 
 * TODO: Add adaptive subdivision (more smoothing for jagged sections)
 * TODO: Support chunked processing for large strokes (>1000 points)
 * TODO: Add custom pressure curve application (per brush type)
 */
#[wasm_bindgen]
pub fn smooth_stroke(points_ptr: *const f32, points_len: usize) -> *mut u8 {
    // Validate input (must be triplets: x, y, pressure)
    if points_ptr.is_null() || points_len == 0 || points_len % 3 != 0 {
        return std::ptr::null_mut();
    }

    // Convert raw pointer to slice
    let points = unsafe { std::slice::from_raw_parts(points_ptr, points_len) };
    
    // Need at least 2 points (6 floats) to smooth
    if points.len() < 6 {
        // Return copy of original points
        return serialize_points(points);
    }

    // Apply Chaikin subdivision (2 iterations for visible smoothing)
    let smoothed = chaikin_subdivide(points, 2);
    
    // Serialize result
    serialize_points(&smoothed)
}

/**
 * Chaikin subdivision algorithm with pressure preservation
 * 
 * Each iteration:
 * - For each line segment, create 2 new points at 1/4 and 3/4 positions
 * - Interpolate pressure values at the same ratios
 * - Remove original intermediate points (keep endpoints)
 * 
 * This creates a corner-cutting effect that smooths the curve while
 * maintaining natural pressure transitions.
 */
fn chaikin_subdivide(points: &[f32], iterations: usize) -> Vec<f32> {
    let mut current = points.to_vec();
    
    for _ in 0..iterations {
        if current.len() < 6 {
            break;
        }
        
        let mut next = Vec::with_capacity(current.len() * 2);
        
        // Always keep first point (x, y, pressure)
        next.push(current[0]);
        next.push(current[1]);
        next.push(current[2]);
        
        // Process each segment
        for i in 0..(current.len() / 3 - 1) {
            let x0 = current[i * 3];
            let y0 = current[i * 3 + 1];
            let p0 = current[i * 3 + 2];
            let x1 = current[(i + 1) * 3];
            let y1 = current[(i + 1) * 3 + 1];
            let p1 = current[(i + 1) * 3 + 2];
            
            // Point at 1/4 along segment (position + pressure)
            let q_x = 0.75 * x0 + 0.25 * x1;
            let q_y = 0.75 * y0 + 0.25 * y1;
            let q_p = 0.75 * p0 + 0.25 * p1;  // Interpolate pressure
            
            // Point at 3/4 along segment (position + pressure)
            let r_x = 0.25 * x0 + 0.75 * x1;
            let r_y = 0.25 * y0 + 0.75 * y1;
            let r_p = 0.25 * p0 + 0.75 * p1;  // Interpolate pressure
            
            next.push(q_x);
            next.push(q_y);
            next.push(q_p);
            next.push(r_x);
            next.push(r_y);
            next.push(r_p);
        }
        
        // Always keep last point (x, y, pressure)
        let last_idx = current.len() - 3;
        next.push(current[last_idx]);
        next.push(current[last_idx + 1]);
        next.push(current[last_idx + 2]);
        
        current = next;
    }
    
    current
}

/**
 * Serialize points to buffer that JS can read
 * 
 * Output format:
 * - 4 bytes: point count (u32)
 * - N * 12 bytes: f32 triplets [x0, y0, p0, x1, y1, p1, ...]
 */
fn serialize_points(points: &[f32]) -> *mut u8 {
    let point_count = (points.len() / 3) as u32;
    let total_bytes = 4 + (points.len() * 4);
    
    // Allocate buffer
    let mut buffer = Vec::<u8>::with_capacity(total_bytes);
    
    // Write point count
    buffer.extend_from_slice(&point_count.to_le_bytes());
    
    // Write points (x, y, pressure triplets)
    for &value in points {
        buffer.extend_from_slice(&value.to_le_bytes());
    }
    
    // Return pointer (JS must free this)
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

/**
 * Memory management: Allocate buffer for JS to write into
 * 
 * Authority: ffi_contract.md (Memory Ownership Rules)
 */
#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    let mut buffer = Vec::<u8>::with_capacity(size);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

/**
 * Memory management: Free buffer allocated by Wasm
 * 
 * Authority: ffi_contract.md (Memory Ownership Rules)
 */
#[wasm_bindgen]
pub fn free_buffer(ptr: *mut u8, size: usize) {
    if !ptr.is_null() && size > 0 {
        unsafe {
            let _ = Vec::from_raw_parts(ptr, size, size);
        }
    }
}

// TODO: Implement tessellate_stroke (quad strip extrusion)
// TODO: Implement simplify_stroke (Ramer-Douglas-Peucker)
// TODO: Implement apply_pressure (variable width based on pressure curve)
// TODO: Implement fit_curve (cubic Bezier fitting)
// TODO: Implement camera matrix computation
// TODO: Implement cache management
