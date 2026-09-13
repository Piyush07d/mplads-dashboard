/**
 * Minimal lucide-style icon set (inline SVG strings), stroke-based,
 * 24x24 viewBox, currentColor — mirrors the look of the lucide-react
 * icons used in the original app.
 */
(function (global) {
  "use strict";

  const wrap = (inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const ICONS = {
    shieldCheck: wrap(
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    ),
    layoutDashboard: wrap(
      '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    ),
    wrench: wrap(
      '<path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2Z"/>',
    ),
    hardHat: wrap(
      '<path d="M2 18h20"/><path d="M6 18v-4a6 6 0 0 1 12 0v4"/><path d="M10 10V6a2 2 0 0 1 4 0v4"/><path d="M4 18v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1"/>',
    ),
    users: wrap(
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    ),
    alertTriangle: wrap(
      '<path d="m10.29 3.86-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    ),
    banknote: wrap(
      '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    ),
    circleDollarSign: wrap(
      '<circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5c0-1.4-1.34-2.5-3-2.5s-3 1.1-3 2.5 1.34 2.2 3 2.5 3 1.1 3 2.5-1.34 2.5-3 2.5-3-1.1-3-2.5"/>',
    ),
    clock: wrap('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    gauge: wrap(
      '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    ),
    piggyBank: wrap(
      '<path d="M19 5c-1.5-1.4-3.5-2-6-2-4.4 0-8 2.7-8 7 0 1.7.6 3.2 1.7 4.4L5 18h3v2h4v-2h1.5L16 15c1.5-.4 2.5-1.4 3-2h2v-4h-1c-.3-1.4-1-2.5-1-4Z"/><circle cx="9.5" cy="10.5" r=".5" fill="currentColor"/><path d="M2 9v3"/>',
    ),
    stamp: wrap(
      '<path d="M5 22h14"/><path d="M5 18h14"/><rect x="7" y="12" width="10" height="6" rx="1"/><path d="M9 12V8a3 3 0 0 1 6 0v4"/><circle cx="12" cy="5" r="2"/>',
    ),
    checkCircle2: wrap(
      '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    ),
    search: wrap('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    x: wrap('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
    download: wrap(
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    ),
    fileJson: wrap(
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M9.5 14c-1 0-1.5.5-1.5 1.5S8.5 17 9.5 17"/><path d="M14.5 14c1 0 1.5.5 1.5 1.5s-.5 1.5-1.5 1.5"/>',
    ),
    fileSpreadsheet: wrap(
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8M8 17h8M8 13v4M12 13v4M16 13v4"/>',
    ),
    image: wrap(
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    ),
    printer: wrap(
      '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    ),
    filter: wrap('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
    clipboardList: wrap(
      '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6M9 8h2"/>',
    ),
  };

  global.ICONS = ICONS;
})(window);
