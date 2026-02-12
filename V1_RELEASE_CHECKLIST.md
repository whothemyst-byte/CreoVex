# CreoVox v1.0 Release Checklist (Windows-first)

Purpose: strict, repeatable gate for Desktop v1.0.0 release readiness.
Owner: release manager + engineering lead
Status baseline date: 2026-02-12

## 1) Immediate Blockers (Must Close Before v1.0.0)

- [x] App icon assets and packaging wiring are complete.
Status now: complete.
Evidence: `build/icon.ico` and `build/icon.png` created; `package.json` now sets `build.win.icon` to `build/icon.ico`.

- [x] Audio import duration metadata uses real extraction, not placeholder frames.
Status now: complete.
Evidence: `src/main/index.js` now derives metadata from WAV headers and MP3 frame headers, and no longer uses fixed placeholder duration.

- [x] Autosave recovery edge cases are complete (multiple candidates, corrupted files, restore failure messaging).
Status now: complete.
Evidence: `autosave:check` now filters valid candidates and reports corrupted counts; `autosave:restore` validates JSON; renderer messaging now maps autosave-specific failures.

- [ ] Full v1.0 manual QA matrix has been executed and signed off.
Status now: blocked.
Evidence: no dedicated v1.0 smoke matrix artifact currently tracked.

## 2) Pre-Release Engineering Gate

- [x] Version set to `1.0.0` in `package.json`.
- [x] Build passes: renderer, main process, packaging.
- [x] Windows portable artifact builds successfully (`npm run dist:win`).
- [ ] Main/renderer crash logging verified in packaged build.
- [ ] Autosave recovery verified in packaged build.
- [ ] Save/Load schema compatibility checks pass for known project samples.

## 3) Feature Smoke Matrix (Manual)

Run on Windows 10/11 with packaged app.

Drawing + Timeline
- [ ] Draw strokes across multiple frames.
- [ ] Frame selection/playhead start behavior is correct.
- [ ] Playback remains stable over extended timeline.

Audio
- [ ] Import WAV/MP3/M4A and verify duration correctness.
- [ ] Verify sync stays stable during sustained playback.
- [ ] Verify behavior when referenced audio file is missing/moved.

Project IO
- [ ] Save new project.
- [ ] Save existing project (same path).
- [ ] Save As to new path.
- [ ] Load valid project.
- [ ] Load incompatible/corrupted project and confirm user-facing error quality.

Recovery
- [ ] Autosave discovered after forced-close.
- [ ] Multiple autosave candidates are handled predictably.
- [ ] Corrupted autosave does not crash app.
- [ ] Restore failure shows actionable user message.

Export
- [ ] USD export succeeds and output is readable.
- [ ] OTIO export succeeds and output validates.
- [ ] PNG image sequence render succeeds with expected frame count.

## 4) Release Ops Gate

- [ ] Changelog finalized for `1.0.0`.
- [ ] Release notes finalized.
- [x] SHA256 recorded for Windows artifact.
Value: `46F4C270E7AD51A40ACC9658152A46A3E6230435B5947714615495FFDC44206C`
- [ ] Git tag created (`v1.0.0`).
- [ ] GitHub release published with installer/portable artifact.

## 5) Post-Release Verification (Within 24h)

- [ ] Download link works from website.
- [ ] Artifact launches on clean Windows test machine.
- [ ] First-run create/save/load workflow passes.
- [ ] Any crash reports/log anomalies triaged.

## 6) Phase 1 Execution Order (Recommended)

1. Close packaging trust blocker: icon pipeline and build wiring.
2. Replace audio metadata placeholder with real duration extraction.
3. Harden autosave edge-case handling + user messaging.
4. Execute full QA matrix on packaged build.
5. Release-candidate freeze, then publish `1.0.0`.
