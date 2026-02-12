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
- `npm run dist:win` - Build Windows portable beta artifact

## Beta Build (Windows)

```bash
npm install
npm run dist:win
```

Output is generated in the `release/` directory.

## Beta Scope (v0.1.0-beta.1)

- Drawing canvas with pressure-aware strokes
- Timeline frame navigation and playback
- Save/Save As/Load project
- USD export
- OTIO export
- PNG image sequence rendering

## Known Limitations (Beta)

- Video export is not implemented yet
- OTIO import and round-trip conflict resolution are not implemented
- Full Data Layer migration is still in progress
- Advanced audio features (mute buses/effects/scrubbing automation) are not implemented
- Some toolbar items are intentionally marked as Coming Soon

## Architecture Documentation

See `CLAUDE.md` for locked architectural decisions and constraints.

Detailed specifications:
- System architecture: `.gemini/antigravity/brain/.../system_architecture.md`
- Drawing engine: `.gemini/antigravity/brain/.../drawing_engine_architecture.md`
- FFI contract: `.gemini/antigravity/brain/.../ffi_contract.md`
- Timeline/Camera/Interop: `.gemini/antigravity/brain/.../timeline_camera_interop.md`
