# Changelog

## Unreleased

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
