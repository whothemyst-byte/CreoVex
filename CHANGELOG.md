# Changelog

## Unreleased

- Bumped app version to `1.0.0` and wired Windows icon configuration (`build/icon.ico`) for packaging.
- Added generated icon assets under `build/` (`icon.ico`, `icon.png`) for Windows portable builds.
- Replaced placeholder audio duration metadata with WAV/MP3 header extraction in main process (`audio:loadAudio`).
- Improved audio import duration calculation in renderer by preferring `durationSeconds * fps`.
- Hardened autosave recovery flow:
  - detect and prioritize valid autosave candidates
  - track and report corrupted autosave files
  - validate autosave JSON before restore
  - support batch discard of multiple autosaves
  - improved user-facing restore failure messaging
- Added strict Windows-first release gate checklist in `V1_RELEASE_CHECKLIST.md` with blocker tracking.
- Added renderer `ErrorBoundary` with crash-safe fallback UI and reload action.
- Added autosave recovery API surface in preload (`autosave:check/restore/discard`).
- Implemented autosave detection in main process and recovery dialog flow in renderer.
- Added persisted main-process crash logging (`userData/logs/main.log`) with rotation.
- Added `website/` Vite project with landing, download, and changelog pages.
- Added root scripts for website dev/build/preview workflows.

## 0.1.0-beta.1 - 2026-02-12

- Stabilized Electron runtime path resolution for preload and packaged renderer assets.
- Added `audio:import` IPC handler compatibility for renderer audio import flow.
- Added beta packaging scripts and Electron Builder configuration for Windows portable output.
- Updated toolbar behavior to disable clearly non-functional actions with explicit Coming Soon labeling.
- Documented beta scope and known limitations in `README.md`.
