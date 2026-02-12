# Packaging TODOs

Before releasing CreoVox to production, complete these packaging tasks:

## Critical Items

### 1. App Icon
- [ ] Create app icon source file (1024x1024 PNG)
- [ ] Generate icon sizes for all platforms:
  - Windows: 16x16, 32x32, 48x48, 256x256, .ico
  - macOS: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024, .icns
  - Linux: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512
- [ ] Place icons in `build/` directory
- [ ] Update `package.json` with icon path

### 2. Electron Builder Configuration
- [ ] Install electron-builder: `npm install --save-dev electron-builder`
- [ ] Configure in `package.json`:
  ```json
  "build": {
    "appId": "com.creovox.app",
    "productName": "CreoVox",
    "files": [
      "dist/**/*",
      "engine/pkg/**/*",
      "package.json"
    ],
    "directories": {
      "output": "release"
    },
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "build/icon.icns",
      "category": "public.app-category.graphics-design"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "build/icons",
      "category": "Graphics"
    }
  }
  ```

### 3. FFmpeg Bundling
- [ ] Download FFmpeg binaries for each platform:
  - Windows: `ffmpeg.exe`
  - macOS: `ffmpeg`
  - Linux: `ffmpeg`
- [ ] Place in `resources/ffmpeg/` directory
- [ ] Update electron-builder config:
  ```json
  "extraResources": [{
    "from": "resources/ffmpeg/${os}",
    "to": "ffmpeg",
    "filter": ["**/*"]
  }]
  ```
- [ ] Update video render code to use bundled FFmpeg path

### 4. Versioning
- [ ] Set proper version in `package.json` (follow semver: `1.0.0`)
- [ ] Add version display in app (Help → About)
- [ ] Update version in metadata for USD/OTIO exports
- [ ] Add changelog file (`CHANGELOG.md`)

### 5. License & EULA
- [ ] Add LICENSE file to project root
- [ ] Create EULA text if required
- [ ] Add license screen on first run (optional)
- [ ] Update `package.json` license field (currently `Proprietary`)

## Security & Signing

### 6. Code Signing
**Windows:**
- [ ] Obtain code signing certificate
- [ ] Configure certificate in electron-builder:
  ```json
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "${env.CERT_PASSWORD}"
  }
  ```

**macOS:**
- [ ] Enroll in Apple Developer Program
- [ ] Create Developer ID Application certificate
- [ ] Configure in electron-builder:
  ```json
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)"
  }
  ```
- [ ] Notarize app with Apple

### 7. Auto-Update Setup
- [ ] Choose update server (GitHub Releases, custom server, etc.)
- [ ] Install electron-updater: `npm install electron-updater`
- [ ] Configure auto-updater in main process
- [ ] Test update flow

## Testing

### 8. Platform Testing
- [ ] Test installer on Windows 10/11
- [ ] Test DMG on macOS (Intel + Apple Silicon)
- [ ] Test AppImage on Ubuntu/Debian
- [ ] Verify uninstaller works correctly
- [ ] Test auto-update mechanism

### 9. Crash Reporting (Optional)
- [ ] Set up Sentry or similar service
- [ ] Integrate crash reporting in main/renderer
- [ ] Test crash reporting in production mode

## Build Scripts

### 10. Add Build Commands
Add to `package.json` scripts:
```json
{
  "pack": "electron-builder --dir",
  "dist": "electron-builder",
  "dist:win": "electron-builder --win",
  "dist:mac": "electron-builder --mac",
  "dist:linux": "electron-builder --linux",
  "release": "npm run build && electron-builder --publish always"
}
```

## Final Checklist

Before first release:
- [ ] Remove all console.log (logger should handle dev-only logging)
- [ ] Set NODE_ENV to production
- [ ] Test with production builds (not dev mode)
- [ ] Verify all features work in packaged app
- [ ] Check file permissions and paths
- [ ] Verify autosave works in packaged app
- [ ] Test crash recovery dialog
- [ ] Ensure all assets are bundled correctly
- [ ] Run security audit: `npm audit`
- [ ] Update README with download/install instructions

---

**Note:** This is a checklist only. Implementation is not part of the current hardening scope.
