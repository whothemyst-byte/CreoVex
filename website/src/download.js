import { latestRelease } from './release-data.js';

const versionValue = document.getElementById('version-value');
const assetName = document.getElementById('asset-name');
const checksum = document.getElementById('checksum');
const publishedAt = document.getElementById('published-at');
const downloadLink = document.getElementById('download-link');
const releasePageLink = document.getElementById('release-page-link');
const copyChecksum = document.getElementById('copy-checksum');

if (versionValue) versionValue.textContent = latestRelease.version;
if (assetName) assetName.textContent = latestRelease.assetName;
if (checksum) checksum.textContent = latestRelease.sha256;
if (publishedAt) publishedAt.textContent = latestRelease.publishedAt;
if (downloadLink) downloadLink.setAttribute('href', latestRelease.assetUrl);
if (releasePageLink) releasePageLink.setAttribute('href', latestRelease.releasePage);

if (copyChecksum) {
  copyChecksum.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(latestRelease.sha256);
      copyChecksum.textContent = 'Copied';
      setTimeout(() => {
        copyChecksum.textContent = 'Copy';
      }, 1200);
    } catch {
      copyChecksum.textContent = 'Failed';
      setTimeout(() => {
        copyChecksum.textContent = 'Copy';
      }, 1200);
    }
  });
}
