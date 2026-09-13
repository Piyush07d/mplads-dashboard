(function () {
  "use strict";

  const D = window.MPLADS;

  function renderComingSoon({ activePage, icon, iconTone, description }) {
    const main = window.Layout.renderShell(activePage);
    main.innerHTML = `
      <div class="page">
        <section class="console-card coming-soon">
          <span class="rail-accent rail-top"></span>
          <span class="coming-soon-icon tone-${iconTone}-chip">${window.ICONS[icon]}</span>
          <span class="badge badge-signal" style="margin-top:1.25rem;">Tenure ${D.TENURE.short}</span>
          <h1>Coming soon</h1>
          <p class="desc">${description}</p>
        </section>
      </div>
    `;
  }

  window.PageComingSoon = { renderComingSoon };
})();
