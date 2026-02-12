import { latestRelease } from './release-data.js';

const summary = document.getElementById('release-summary');
const downloadBtn = document.getElementById('download-btn');

if (summary) {
  summary.textContent = `Latest release: v${latestRelease.version} (${latestRelease.platform})`;
}

if (downloadBtn) {
  downloadBtn.setAttribute('href', latestRelease.assetUrl);
}
