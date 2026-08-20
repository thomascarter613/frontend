const paths = {
  home: '<path d="M3 10.5 10 4l7 6.5V18H6v-7.5Z"/><path d="M8.5 18v-5h3v5"/>',
  explorer: '<path d="M3 5.5h5l1.5 2H17V18H3Z"/>',
  search: '<circle cx="9" cy="9" r="5"/><path d="m13 13 4 4"/>',
  projects: '<rect x="3" y="4" width="14" height="12" rx="1"/><path d="M6 8h8M6 11h5"/>',
  documents: '<path d="M5 3h7l3 3v11H5Z"/><path d="M12 3v4h4M8 10h5M8 13h5"/>',
  tasks: '<rect x="3" y="3" width="14" height="14" rx="2"/><path d="m6.5 9 1.5 1.5L11.5 7M12.5 10H15M6.5 14H15"/>',
  data: '<ellipse cx="10" cy="5" rx="6" ry="2.5"/><path d="M4 5v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5M4 10v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5"/>',
  analytics: '<path d="M4 16V9M9 16V5M14 16v-7M3 16h14"/>',
  automations: '<path d="M6 4h8l3 6-3 6H6l-3-6Z"/><path d="m8 7 5 3-5 3Z"/>',
  extensions: '<path d="M7 3v4H3v6h4v4h6v-4h4V7h-4V3Z"/>',
  settings: '<circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4"/>',
  chevron: '<path d="m8 6 4 4-4 4"/>',
  close: '<path d="m6 6 8 8M14 6l-8 8"/>',
  panel: '<rect x="3" y="4" width="14" height="12" rx="1"/><path d="M3 12h14"/>',
  moon: '<path d="M15.5 13.5A7 7 0 0 1 6.5 4.5 7 7 0 1 0 15.5 13.5Z"/>',
  sun: '<circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4"/>',
  split: '<rect x="3" y="4" width="14" height="12" rx="1"/><path d="M10 4v12"/>',
  more: '<circle cx="5" cy="10" r="1"/><circle cx="10" cy="10" r="1"/><circle cx="15" cy="10" r="1"/>',
  command: '<path d="M7 7H5a3 3 0 1 1 3-3v12a3 3 0 1 1-3-3h10a3 3 0 1 1-3 3V4a3 3 0 1 1 3 3Z"/>',
  bell: '<path d="M5 14h10l-1.5-2V8a3.5 3.5 0 0 0-7 0v4Z"/><path d="M8.5 16a1.7 1.7 0 0 0 3 0"/>',
  wifi: '<path d="M3 8a10 10 0 0 1 14 0M6 11a6 6 0 0 1 8 0M9 14a2 2 0 0 1 2 0"/><circle cx="10" cy="17" r=".6"/>',
};

export function icon(name, label = '') {
  const path = paths[name] ?? paths.documents;
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${label}">${path}</svg>`;
}
