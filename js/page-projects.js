(function () {
  "use strict";

  const D = window.MPLADS;
  const Components = window.Components;
  const { renderTimelineChart } = window.ChartsUI;

  function riskTone(score) {
    if (score >= 75) return "pill-risk";
    if (score >= 50) return "pill-caution";
    return "pill-good";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const main = window.Layout.renderShell("projects.html");
    main.innerHTML = `
      <div class="page">
        <header class="console-card header-card">
          <span class="rail-accent rail-left"></span>
          <div style="padding-left:0.75rem;">
            <span class="badge badge-signal">Tenure ${D.TENURE.short}</span>
            <h1 class="header-title" style="font-size:1.9rem;">Project Register</h1>
            <p class="header-desc">Filters here are independent of the overview panel — nothing is carried across sections.</p>
          </div>
        </header>

        <section class="console-card section panel">
          <div class="filters-row">
            ${window.ICONS.filter}
            <h2 style="font-size:0.875rem;font-weight:600;">Auditor filters</h2>
          </div>
          <div class="filters-grid">
            <div>
              <p class="label-caps" style="margin-bottom:0.5rem;">State</p>
              <div id="state-filter"></div>
            </div>
            <div>
              <p class="label-caps" style="margin-bottom:0.5rem;">District</p>
              <div id="district-filter"></div>
            </div>
            <div>
              <p class="label-caps" style="margin-bottom:0.5rem;">Project type</p>
              <div id="type-filter"></div>
            </div>
            <div>
              <p class="label-caps" style="margin-bottom:0.5rem;">Person / firm</p>
              <div class="segmented" id="name-kind-toggle">
                <button type="button" data-kind="mp" class="active">MP name</button>
                <button type="button" data-kind="contractor">Contractor name</button>
              </div>
              <div id="name-filter"></div>
            </div>
          </div>
          <div class="active-query-row">
            <span>Active query:</span>
            <code class="active-query-code" id="active-query"></code>
            <button type="button" class="btn btn-ghost btn-sm" id="reset-filters" style="margin-left:auto;">Reset filters</button>
          </div>
        </section>

        <div class="grid-stats" id="stat-cards"></div>

        <section class="console-card section chart-section">
          <div class="chart-header">
            <div>
              <h3 class="chart-title" id="timeline-title">Delivery timeline</h3>
              <p class="chart-caption">Works sanctioned vs completed per quarter, with completed value in ₹ crore.</p>
            </div>
            <div id="timeline-export"></div>
          </div>
          <div class="chart-canvas-wrap timeline" id="timeline-wrap">
            <canvas id="timeline-canvas"></canvas>
            <div class="chart-empty-overlay hidden" id="timeline-empty">
              <div class="chart-empty-box">
                <p>Timeline unavailable</p>
                <p>Select a state to activate the quarter-wise delivery view.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="console-card table-section">
          <div class="table-section-header">
            <div>
              <h3 class="table-section-title">Sanction register</h3>
              <p class="table-section-sub" id="table-sub"></p>
            </div>
            <div id="table-export"></div>
          </div>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>State / District</th>
                  <th>Type</th>
                  <th>MP</th>
                  <th>Contractor</th>
                  <th style="text-align:right;">Cost (₹L)</th>
                  <th>Status</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody id="table-body"></tbody>
            </table>
          </div>
        </section>
      </div>
    `;

    let stateSel = null;
    let districtSel = null;
    let typeSel = null;
    let nameKind = "mp";
    let nameSel = null;
    let timelineChart = null;

    const stateFilter = new Components.Typeahead(document.getElementById("state-filter"), {
      placeholder: "Search state…",
      options: [...D.states].sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({ value: s.name, label: s.name })),
      value: stateSel,
      onSelect: (v) => {
        stateSel = v;
        districtSel = null;
        districtFilter.setValue(null);
        districtFilter.setOptions(districtOptions());
        update();
      },
    });

    const districtFilter = new Components.Typeahead(document.getElementById("district-filter"), {
      placeholder: "Search district…",
      options: districtOptions(),
      value: districtSel,
      onSelect: (v) => {
        districtSel = v;
        update();
      },
    });

    const typeFilter = new Components.Typeahead(document.getElementById("type-filter"), {
      placeholder: "Search work type…",
      options: D.PROJECT_TYPES.map((t) => ({ value: t, label: t })),
      value: typeSel,
      onSelect: (v) => {
        typeSel = v;
        update();
      },
    });

    const nameFilter = new Components.Typeahead(document.getElementById("name-filter"), {
      placeholder: "Search MP name…",
      options: nameOptions(),
      value: nameSel,
      onSelect: (v) => {
        nameSel = v;
        update();
      },
    });

    document.querySelectorAll("#name-kind-toggle button").forEach((btn) => {
      btn.addEventListener("click", () => {
        nameKind = btn.dataset.kind;
        nameSel = null;
        document.querySelectorAll("#name-kind-toggle button").forEach((b) => b.classList.toggle("active", b === btn));
        nameFilter.setValue(null);
        nameFilter.setOptions(nameOptions());
        nameFilter.inputEl.placeholder = nameKind === "mp" ? "Search MP name…" : "Search contractor…";
        nameFilter._syncInput();
        update();
      });
    });

    document.getElementById("reset-filters").addEventListener("click", () => {
      stateSel = null;
      districtSel = null;
      typeSel = null;
      nameSel = null;
      stateFilter.setValue(null);
      districtFilter.setOptions(districtOptions());
      districtFilter.setValue(null);
      typeFilter.setValue(null);
      nameFilter.setValue(null);
      update();
    });

    function districtOptions() {
      const pool = stateSel ? D.projects.filter((p) => p.state === stateSel) : D.projects;
      return [...new Set(pool.map((p) => p.district))].sort().map((d) => ({ value: d, label: d }));
    }

    function nameOptions() {
      if (nameKind === "contractor") {
        return [...new Set(D.projects.map((p) => p.contractor))].sort().map((c) => ({ value: c, label: c, hint: "Contractor" }));
      }
      return [...new Set(D.mps.map((m) => m.name))].sort().map((n) => ({ value: n, label: n, hint: "MP" }));
    }

    function filteredProjects() {
      return D.projects.filter(
        (p) =>
          (!stateSel || p.state === stateSel) &&
          (!districtSel || p.district === districtSel) &&
          (!typeSel || p.type === typeSel) &&
          (!nameSel || (nameKind === "mp" ? p.mp === nameSel : p.contractor === nameSel)),
      );
    }

    function update() {
      const filtered = filteredProjects();
      const recommended = filtered.length;
      const completed = filtered.filter((p) => p.status === "Completed").length;
      const inProgress = filtered.filter((p) => p.status === "In Progress").length;
      const flagged = filtered.filter((p) => p.riskScore >= 70).length;

      document.getElementById("active-query").textContent = `{ name: "${nameSel ?? "—"}", name_type: "${nameKind}" }`;

      Components.renderStatCards(document.getElementById("stat-cards"), [
        {
          label: "Recommended",
          value: D.fmtNum(recommended),
          sub: "Projects in current filter",
          note: "Works recommended by MPs and entered in the register.",
          icon: "clipboardList",
          tone: "signal",
        },
        {
          label: "In progress",
          value: D.fmtNum(inProgress),
          sub: `${((inProgress / (recommended || 1)) * 100).toFixed(1)}% of scope`,
          note: "Awaiting completion certificate.",
          icon: "clock",
          tone: "caution",
          progress: (inProgress / (recommended || 1)) * 100,
        },
        {
          label: "Completed",
          value: D.fmtNum(completed),
          sub: `${((completed / (recommended || 1)) * 100).toFixed(1)}% of scope`,
          note: "Marked complete with recorded expenditure.",
          icon: "checkCircle2",
          tone: "good",
          progress: (completed / (recommended || 1)) * 100,
        },
        {
          label: "Risk-flagged",
          value: D.fmtNum(flagged),
          sub: "Risk score ≥ 70",
          note: "Patterns needing verification — not an allegation of fraud.",
          icon: "alertTriangle",
          tone: "risk",
          progress: (flagged / (recommended || 1)) * 100,
        },
      ]);

      // Timeline
      const quarters = [...new Set(D.projects.map((p) => p.quarter))].sort();
      const timeline = quarters.map((q) => {
        const inQ = filtered.filter((p) => p.quarter === q);
        return {
          quarter: q,
          started: inQ.length,
          completed: inQ.filter((p) => p.status === "Completed").length,
          value: +(inQ.reduce((a, p) => a + p.cost, 0) / 100).toFixed(2),
        };
      });

      document.getElementById("timeline-title").textContent = `Delivery timeline${stateSel ? ` · ${stateSel}` : ""}`;
      const scopeActive = Boolean(stateSel);
      document.getElementById("timeline-wrap").classList.toggle("faded", !scopeActive);
      document.getElementById("timeline-empty").classList.toggle("hidden", scopeActive);

      if (timelineChart && typeof timelineChart.destroy === "function") timelineChart.destroy();
      timelineChart = renderTimelineChart(document.getElementById("timeline-canvas"), timeline);

      const timelineExportMount = document.getElementById("timeline-export");
      timelineExportMount.innerHTML = "";
      timelineExportMount.appendChild(
        Components.renderExportMenu({
          filename: `mplads-timeline-${(stateSel ?? "no-state").toLowerCase().replace(/\W+/g, "-")}`,
          chartRef: () => document.getElementById("timeline-wrap"),
          rows: () => timeline,
        }),
      );

      // Table
      document.getElementById("table-sub").textContent = `Showing ${Math.min(50, filtered.length)} of ${D.fmtNum(filtered.length)} works in scope.`;
      const tbody = document.getElementById("table-body");
      tbody.innerHTML = filtered
        .slice(0, 50)
        .map(
          (p) => `
        <tr>
          <td><p class="row-title">${p.title}</p><p class="metric-figure row-id">${p.id}</p></td>
          <td style="white-space:nowrap;"><p>${p.state}</p><p class="row-district">${p.district}</p></td>
          <td style="white-space:nowrap;">${p.type}</td>
          <td style="white-space:nowrap;">${p.mp}</td>
          <td style="white-space:nowrap;">${p.contractor}</td>
          <td class="metric-figure" style="text-align:right;">${p.cost.toFixed(1)}</td>
          <td>
            <span class="pill ${
              p.status === "Completed" ? "pill-good" : p.status === "In Progress" ? "pill-caution" : "pill-muted"
            }">${p.status}</span>
          </td>
          <td><span class="metric-figure pill ${riskTone(p.riskScore)}">${p.riskScore}</span></td>
        </tr>
      `,
        )
        .join("");

      const tableExportMount = document.getElementById("table-export");
      tableExportMount.innerHTML = "";
      tableExportMount.appendChild(
        Components.renderExportMenu({
          filename: "mplads-project-register",
          rows: () =>
            filtered.slice(0, 500).map((p) => ({
              id: p.id,
              title: p.title,
              state: p.state,
              district: p.district,
              type: p.type,
              mp: p.mp,
              contractor: p.contractor,
              cost_lakh: p.cost,
              status: p.status,
              risk_score: p.riskScore,
              indicators: p.indicators.join(" | "),
            })),
        }),
      );
    }

    update();
  });
})();
