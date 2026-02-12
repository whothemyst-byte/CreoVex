# CLAUDE.md

## Project Name
**CreoVox** — Professional Anime Production Suite (Desktop)

---

## PURPOSE OF THIS FILE (MANDATORY)
This file is the **single source of truth** for the CreoVox project.

**Every agent, prompt, or reasoning step MUST:**
1. Read this file fully before acting
2. Verify all outputs against this file
3. Refuse to proceed if a request contradicts this file
4. Update this file **only** when:
   - A prompt is completed and introduces a new locked decision, OR
   - The user explicitly instructs to update CLAUDE.md

No assumption, optimization, or creative deviation is allowed outside what is defined here.

---

## PROJECT VISION
CreoVox is a **studio-in-a-box anime production suite** designed for **solo creators and small teams** who want **industry-grade pipelines without fragmented workflows**.

The product prioritizes **directorial flow, creative momentum, and professional interoperability** over raw feature count.

CreoVox is not a toy, not a browser app, and not a social-content tool. It is a **serious desktop production environment**.

---

## CORE PRODUCT PRINCIPLES (NON-NEGOTIABLE)

1. **Director-First Design**
   - Every feature must serve shot composition, timing, and storytelling
   - Technical complexity must never interrupt creative flow

2. **Near Real-Time Feedback**
   - Playback, scrubbing, and interaction must feel live
   - Dropped frames are acceptable; broken flow is not

3. **Interoperability Over Lock-In**
   - CreoVox must integrate cleanly with professional tools
   - USD and OTIO are first-class citizens

4. **Deterministic & Predictable Systems**
   - No hidden state
   - No magic automation without explainability

5. **Production-Grade Architecture**
   - Designed to be sold, transferred, and maintained
   - Clear ownership boundaries and documentation

---

## EXPLICIT NON-GOALS (DO NOT VIOLATE)

- ❌ No browser-based version
- ❌ No mobile or tablet support
- ❌ No cloud-first or SaaS dependency
- ❌ No AI auto-animation or generative content features (unless explicitly added later)
- ❌ No social-media-first workflows (Reels, Shorts, TikTok, etc.)

---

## TARGET USERS

### Primary
- Solo anime creators
- Indie anime filmmakers
- Small animation studios (2–10 people)

### Secondary
- Storyboard artists
- Directors transitioning from traditional pipelines

---

## PLATFORM & SCOPE (LOCKED)

- **Platform:** Desktop only
- **Framework:** Electron
- **UI:** React
- **Performance Core:** Rust compiled to WebAssembly (Wasm)

This is permanent unless the user explicitly changes it.

---

## PLAYBACK PHILOSOPHY (LOCKED)

**Mode:** Near real-time, flow-first playback

- Timeline should feel live
- Scrubbing must be responsive
- Playback may degrade fidelity to preserve interaction
- Caching and progressive refinement are expected

This is **not** an After Effects-style RAM-preview-first tool.

---

## ASSET SYSTEM (LOCKED)

**Type:** Hybrid Asset System

- Assets are stored locally in the project folder
- Internally tracked via stable IDs
- **USD is the source of truth**
- Filesystem is a mirrored representation

This enables:
- Safe refactors
- Reliable relinking
- Professional round-tripping

---

## DATA & PIPELINE STANDARDS

### Scene & Assets
- **Universal Scene Description (USD)**

### Timeline
- **OpenTimelineIO (OTIO)**

### Audio
- Multi-track, timeline-synced
- Locked to playback clock

---

## DRAWING & VISUAL ENGINE

- Vector-based drawing engine
- Pressure-sensitive input (pen tablets)
- Anime-ink aesthetic
- Stroke-based, not raster-first
- Real-time feedback is mandatory

The drawing engine is a **core differentiator**, not a utility.

---

## DRAWING ENGINE ARCHITECTURE (LOCKED)

**Foundation Specification:** Defined in `drawing_engine_architecture.md`

- **Pipeline:** Seven-stage stroke processing (capture → preview → fitting → pressure → simplification → tessellation → cache)
- **Aesthetic:** Anime-ink rules (tapered ends, round caps/joins, pressure smoothing, 50%-150% width range)
- **Data Model:** SoA point arrays (x, y, pressure, timestamp mandatory; tilt optional)
- **USD Schema:** Custom `CreoVoxStroke` (inherits `BasisCurves`, stores pressure + metadata)
- **Performance:** <0.5ms input handling, <5ms preview, <50ms curve fitting, <10ms tessellation
- **Caching:** LRU cache (512 MB default), keyed by (strokeUUID, qualityLevel)
- **Dual Representation:** Polyline preview (capture) → Tessellated mesh (final) with 100ms crossfade

### Locked Algorithms

1. **Curve Fitting:** Cubic Bézier least-squares fit (0.5px max error)
2. **Simplification:** Ramer-Douglas-Peucker (0.3px tolerance)
3. **Tessellation:** Quad strip extrusion with round caps/joins
4. **Pressure Curve:** Power function (exponent 0.7 default)
5. **Anti-Aliasing:** Hardware MSAA (4×) or shader-based fallback

---

## CAMERA & CINEMATIC SYSTEM

- Shot-based camera model
- Keyframed camera rigs
- Supports depth, parallax, and staging
- Cameras are exportable via USD

CreoVox treats drawings as **scenes**, not flat canvases.

---

## INTEROPERABILITY (LOCKED GOAL)

CreoVox must round-trip cleanly with:
- After Effects
- DaVinci Resolve

Assumptions:
- External tools may modify timelines and assets
- Metadata preservation is critical
- Lossless export paths must exist

---

## TIMELINE, CAMERA & INTEROPERABILITY (LOCKED)

**Foundation Specification:** Defined in `timeline_camera_interop.md`

- **Time Model:** Fixed frame rate (24/25/30/60 fps), OTIO RationalTime, 1-indexed frames (user), 0-indexed (internal)
- **OTIO Mapping:** Timeline → `otio.Timeline`, Layers → `otio.Track`, Clips → USD ExternalReference
- **Playback:** 6-step evaluation (timeline → layers → camera → geometry → composite → audio), <24ms budget
- **Camera:** `UsdGeomCamera` primitive, keyframeable (position, rotation, focal length), linear interpolation
- **USD Export:** Lossless stroke + camera export, `customData:creovox:*` namespace, human-inspectable USDA
- **OTIO Export:** Timeline fidelity (tracks, clips, markers), metadata preserved, round-trip validated
- **Round-Trip:** After Effects/Resolve can modify timeline, frame rate immutable, missing assets block export

### Module Boundaries

- Timeline: `src/data/timeline/` (OTIO management, playback, scrubbing)
- Camera: `src/data/camera/` (USD camera, keyframes, animation)
- Interop: `src/data/interop/` (USD/OTIO export, import validation, conflict resolution)

---

## PERFORMANCE EXPECTATIONS

- Low-latency drawing (< 10ms perceived input delay target)
- Responsive timeline scrubbing
- Graceful degradation under load
- No UI blocking on heavy computation

---

## ARCHITECTURAL DISCIPLINE

- Clear boundaries between:
  - UI
  - Engine
  - Data
  - Interop

- No cross-layer shortcuts
- No hidden shared mutable state

---

## SYSTEM ARCHITECTURE (LOCKED)

**Foundation Architecture:** Defined in `system_architecture.md`

- **Architecture:** Five-layer system (Application Shell, UI, Engine, Data, Interoperability)
- **Process Model:** Electron main/renderer separation, async IPC by default
- **Engine:** Rust/Wasm with JavaScript-owned data lifecycle
- **Data Ownership:** USD (scene), OTIO (timeline) as authoritative sources
- **Asset System:** UUID-based stable IDs + filesystem mirroring
- **Performance:** 60fps UI target, <10ms input latency, four-level degradation
- **Extension Points:** Tools, Effects, Exporters, Camera Rigs (additive-only)

### Layer Boundaries (Non-Negotiable)

1. **Application Shell** — OS integration, window management, IPC routing
2. **UI Layer** — React components, user interaction, presentation logic
3. **Engine Layer** — Rust/Wasm for stroke rendering, camera math, heavy computation
4. **Data Layer** — USD/OTIO ownership, asset graph, validation, change propagation
5. **Interoperability Layer** — USD/OTIO export/import, external tool integration

### Forbidden Communication Paths

- ❌ UI Layer → Engine Layer (must go through Data Layer)
- ❌ Engine Layer → UI Layer (must go through Data Layer callbacks)
- ❌ Interoperability Layer → UI/Engine (must go through Data Layer)

---

## PROMPT EXECUTION RULES

When generating prompts:

1. Prompts must be **bounded** (single responsibility)
2. Prompts must reference this CLAUDE.md implicitly
3. Prompts must avoid vague language
4. Prompts must assume **Claude Sonnet 4.5 (Thinking)**
5. Prompts must be suitable for **Antigravity IDE** execution

---

## CLAUDE AGENT BEHAVIOR (MANDATORY)

The agent must:

- Treat this file as authoritative
- Cross-check every output against it
- Ask for clarification if a request conflicts with it
- Update this file only when instructed or when a completed prompt introduces a new locked decision

Failure to respect this file invalidates the output.

---

## CHANGE MANAGEMENT

All changes must be:
- Explicit
- Logged by updating this file
- Confirmed by the user

No silent changes are allowed.

---

## CURRENT STATUS

- Core architecture decisions: **LOCKED**
- System architecture: **LOCKED** (five-layer model, process separation, data ownership)
- Drawing engine architecture: **LOCKED** (seven-stage pipeline, anime-ink aesthetic, USD schema)
- Prompt generation: **IN PROGRESS**
- Implementation: **OUT OF SCOPE (for now)**

---

## END OF FILE

