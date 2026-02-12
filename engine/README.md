# CreoVox Wasm Engine

This directory contains the Rust/Wasm performance engine for CreoVox.

## Building

```bash
# Install wasm-pack if not already installed
cargo install wasm-pack

# Build the engine
npm run build:engine
```

This will generate Wasm bindings in `engine/pkg/` that can be imported by the TypeScript code.

## Current Implementation

- ✅ `smooth_stroke()` - Chaikin subdivision smoothing
- ✅ Memory management (`alloc`, `free_buffer`)
- ⏳ `tessellate_stroke()` - Quad strip extrusion (TODO)
- ⏳ `simplify_stroke()` - RDP algorithm (TODO)
- ⏳ `apply_pressure()` - Variable width (TODO)

## Architecture

Authority: `drawing_engine_architecture.md`, `ffi_contract.md`

The engine processes strokes after mouse release:
1. JS captures raw input points
2. Points sent to Wasm via `smooth_stroke()`
3. Wasm applies Chaikin subdivision
4. Smoothed points returned to JS
5. Smoothed stroke stored and rendered
