# CreoVox Beta Release Notes

## Version

- `0.1.0-beta.1`
- Date: `2026-02-12`

## Artifact

- Windows portable executable: `release/CreoVox 0.1.0-beta.1.exe`
- SHA256: `DF7122711413AD038C19675834C4B53198688E7084221BE633DEB9A808DF3AE9`

## In-Scope Features (Beta)

- Drawing canvas with pressure-aware strokes
- Timeline frame navigation and playback
- Save/Save As/Load project
- USD export
- OTIO export
- PNG image sequence export

## QA Status

- Build pipeline: PASS (`npm run build`)
- Windows packaging: PASS (`npm run dist:win`)
- Packaged app contents check: PASS (`app.asar` contains `dist/main` and `dist/renderer`)
- Packaged launch smoke: PASS (`release/win-unpacked/CreoVox.exe` stayed running)
- Full manual workflow smoke: Pending (requires interactive validation)

## Known Limitations

- Video export is not implemented
- OTIO import is not implemented
- Advanced audio controls (mute/effects/buses/automation) are not implemented
- App icon is still Electron default
