# CreoVox

Professional Anime Production Suite (Desktop)

## Project Structure

```
CreoVox/
├── src/                          # Main application code
│   ├── main/                     # Electron main process
│   ├── renderer/                 # React renderer process
│   ├── data/                     # Data Layer (authoritative state)
│   └── shared/                   # Shared types & constants
├── engine/                       # Rust/Wasm engine
├── assets/                       # Runtime assets
├── build/                        # Build scripts & config
└── package.json
```

## Architecture

- **Application Shell:** Electron main process (OS integration, IPC routing)
- **UI Layer:** React components (renderer process)
- **Engine Layer:** Rust/Wasm (stroke processing, camera math)
- **Data Layer:** JavaScript (USD/OTIO ownership, state management)
- **Interoperability Layer:** USD/OTIO export/import

## Prerequisites

- Node.js 18+ with npm
- Rust 1.70+ with wasm-pack
- Python 3.x (for node-gyp)

## Setup

```bash
# Install JavaScript dependencies
npm install

# Build Wasm engine
cd engine
wasm-pack build --target web --out-dir ../src/data/bindings/engine
cd ..

# Run development mode
npm run dev
```

## Development

- `npm run dev` - Start Electron in development mode
- `npm run build` - Build for production
- `npm run build:engine` - Rebuild Wasm engine only

## Architecture Documentation

See `CLAUDE.md` for locked architectural decisions and constraints.

Detailed specifications:
- System architecture: `.gemini/antigravity/brain/.../system_architecture.md`
- Drawing engine: `.gemini/antigravity/brain/.../drawing_engine_architecture.md`
- FFI contract: `.gemini/antigravity/brain/.../ffi_contract.md`
- Timeline/Camera/Interop: `.gemini/antigravity/brain/.../timeline_camera_interop.md`
