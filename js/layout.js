(function (global) {
  "use strict";

  const ICONS = global.ICONS;
  const TENURE = global.MPLADS.TENURE;

  const NAV = [
    { to: "index.html", label: "Overview", icon: "layoutDashboard" },
    { to: "projects.html", label: "Projects", icon: "wrench" },
    { to: "contractors.html", label: "Contractors", icon: "hardHat" },
    { to: "mps.html", label: "MPs", icon: "users" },
    { to: "alerts.html", label: "Alerts", icon: "alertTriangle" },
  ];

  function renderShell(activePage) {
    const shell = document.createElement("div");
    shell.className = "app-shell";

    const navLinks = NAV.map((item) => {
      const isActive = item.to === activePage;
      return `
        <a href="${item.to}" class="sidebar-link${isActive ? " active" : ""}">
          ${ICONS[item.icon]}
          ${item.label}
        </a>
      `;
    }).join("");

    shell.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="sidebar-brand-icon">${ICONS.shieldCheck}</span>
          <div>
            <p class="sidebar-brand-title">MPLADS</p>
            <p class="sidebar-brand-sub">Audit &amp; Anomaly Console</p>
          </div>
        </div>
        <nav class="sidebar-nav">${navLinks}</nav>
        <div class="sidebar-tenure">
          <div class="sidebar-tenure-box">
            <p class="label-caps">Active tenure</p>
            <p class="mt-1" style="margin-top:0.25rem;font-size:0.875rem;font-weight:600;color:var(--foreground);">${TENURE.short}</p>
            <p style="margin-top:0.25rem;font-size:0.68rem;line-height:1.5;color:var(--muted-foreground);">
              Data resets at tenure close — export before archival.
            </p>
          </div>
        </div>
      </aside>
      <main class="main-content" id="main-content"></main>
    `;

    document.body.innerHTML = "";
    document.body.appendChild(shell);
    return document.getElementById("main-content");
  }

  global.Layout = { renderShell, NAV };
})(window);
