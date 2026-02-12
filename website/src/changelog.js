import { changelog } from './release-data.js';

const list = document.getElementById('changelog-list');

if (list) {
  list.innerHTML = changelog
    .map(
      (entry) => `
      <article class="log-entry">
        <h2>v${entry.version}</h2>
        <p class="log-date">${entry.date}</p>
        <ul>
          ${entry.notes.map((note) => `<li>${note}</li>`).join('')}
        </ul>
      </article>
    `
    )
    .join('');
}
