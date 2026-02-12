# CreoVox Progress and Phase-wise Feature Plan

This document summarizes what has been completed so far and what remains to be done, grouped in phases for the next releases.

## 1) What Is Done So Far

### Desktop App (Current Stable Beta Baseline)
- Core drawing workflow is working.
- Cursor-to-stroke alignment issue was fixed.
- Timeline frame selection/playhead behavior was fixed (play starts from selected frame).
- Audio import no longer crashes the app during import.
- Audio playback path was stabilized with a safer streaming backend.
- Save / Save As / Load workflows are working.
- USD export is working.
- OTIO export is working.
- PNG image sequence render is working.
- Windows portable packaging flow works (`dist:win`).
- GitHub release was created for `v0.1.0-beta.1` with installer artifact.

### Stability and Hardening Added
- Renderer crash fallback UI added via `ErrorBoundary`.
- Main-process crash logging hooks added (`render-process-gone`, `unresponsive`, uncaught handlers).
- Persistent main log file flow added (`userData/logs/main.log` with rotation).
- Autosave recovery IPC was added (`check`, `restore`, `discard`).
- Recovery dialog flow integrated in renderer startup.

### Website and Distribution
- New website project added under `website/` (Vite + Vercel).
- Pages created:
  - Landing (`/`)
  - Download (`/download.html`)
  - Changelog (`/changelog.html`)
- Download metadata file added (`website/src/release-data.js`).
- Download link fixed to the correct GitHub release asset filename.
- Website deployed to Vercel and production alias is active.

### Repo / Release Ops
- Changelog and README were updated for current state.
- Release tag pushed:
  - `v0.1.0-beta.1`
  - `website-release`

---

## 2) Pending Work (Phase-wise)

## Phase 1: Production Readiness (Desktop v1.0, Windows-first)

### P1.1 Quality and Reliability
- Finalize autosave recovery edge cases:
  - multiple autosave candidates
  - corrupted autosave handling
  - clear user messaging on restore failures
- Add stronger validation for project load/save schema compatibility.
- Remove remaining non-actionable console noise and normalize user-facing errors.

### P1.2 Audio and Timeline Robustness
- Improve real duration metadata extraction in main process (replace placeholder frame duration path).
- Validate long timeline audio playback sync behavior under sustained playback.
- Add safer handling for missing/moved audio files in loaded projects.

### P1.3 Packaging and Trust
- Add real app icon assets (Windows `.ico` and source set).
- Move from beta versioning to stable versioning (`1.0.0`).
- Decide and complete code signing path for Windows release (if certificate is available).

### P1.4 QA Gate for v1.0
- Execute full manual smoke matrix:
  - draw/timeline/audio/save-load/USD/OTIO/render
- Add a repeatable release checklist document (pre-release and post-release checks).

---

## Phase 2: Website Production Upgrade

### P2.1 Download UX Improvements
- Add “Latest Release” auto-sync process from GitHub Releases (or scripted update flow).
- Show installer size and release date dynamically in download page.
- Add fallback mirror/download guidance if GitHub asset fails.

### P2.2 Product and Trust Content
- Add support/contact section.
- Add known issues and troubleshooting page.
- Add privacy/license links from footer.

### P2.3 Deployment and Operations
- Keep Vercel preview and production workflow documented.
- Add a small release publish script/checklist:
  - build installer
  - compute SHA256
  - update release-data
  - deploy website

---

## Phase 3: Post-v1 Feature Expansion

### P3.1 Interop Expansion
- OTIO import (reverse direction).
- Round-trip conflict handling UX.
- More timeline metadata preservation and validation.

### P3.2 Render and Media
- Video export pipeline (FFmpeg integration path).
- Render quality presets and codec options.

### P3.3 Data/Architecture Completion
- Continue migration from temporary UI state ownership to full Data Layer ownership per architecture intent.
- Expand automated regression coverage for critical workflows.

---

## 3) Current Live Targets

- Desktop release (GitHub):
  - `v0.1.0-beta.1`
- Website production:
  - Active Vercel production alias (latest deploy contains corrected download link)

---

## 4) Recommended Immediate Next Action

- Start Phase 1 with a strict v1.0 release checklist and close all Windows production blockers (icon, metadata duration, autosave edge cases, final QA matrix).

