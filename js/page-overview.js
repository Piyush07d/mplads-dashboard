(function () {
  "use strict";

  const D = window.MPLADS;
  const Components = window.Components;
  const { UtilizationChart } = window.ChartsUI;

  document.addEventListener("DOMContentLoaded", () => {
    const main = window.Layout.renderShell("index.html");
    main.innerHTML = `
      <div class="page">
        <header class="console-card header-card">
          <span class="rail-accent rail-left"></span>
          <div class="header-card-content">
            <div>
              <span class="badge badge-signal">Tenure ${D.TENURE.short} · ${D.TENURE.house}</span>
              <h1 class="header-title">MPLADS Overview<span class="header-title-sub metric-figure">${D.TENURE.short}</span></h1>
              <p class="header-desc">
                Member of Parliament Local Area Development Scheme — fund flow, delivery and risk
                indicators for the running tenure. Flags mark patterns for review; they are not
                findings of wrongdoing.
              </p>
            </div>
            <div class="scope-box">
              <p class="label-caps">Scope in view</p>
              <p class="scope-box-value" id="scope-label"></p>
            </div>
          </div>
        </header>

        <section class="section">
          <div class="console-card panel">
            <div class="panel-search-row">
              <div class="panel-search-grid">
                <div>
                  <p class="label-caps" style="margin-bottom:0.5rem;">Search by state</p>
                  <div id="state-typeahead"></div>
                </div>
                <div>
                  <p class="label-caps" style="margin-bottom:0.5rem;">Search by MP name</p>
                  <div id="mp-typeahead"></div>
                </div>
              </div>
              <div id="overview-export"></div>
            </div>
          </div>
          <div class="grid-stats" id="stat-cards"></div>
        </section>

        <section class="grid-charts">
          <div id="state-chart"></div>
          <div id="mp-chart"></div>
        </section>
      </div>
    `;

    let stateSel = null;
    let mpSel = null;

    const stateOptions = [...D.states]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => ({ value: s.name, label: s.name, hint: `${s.mpCount} MPs` }));
    const mpOptions = [...D.mps]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => ({ value: m.id, label: m.name, hint: m.state }));

    const stateRows = D.topStatesByUtilization.map((s) => ({
      key: s.name, name: s.name, utilization: s.utilization, allocated: +s.allocated.toFixed(1), spent: +s.spent.toFixed(1),
    }));
    const mpRows = D.topMpsByUtilization.map((m) => ({
      key: m.id, name: m.name, utilization: m.utilization, allocated: +m.allocated.toFixed(1), spent: +m.spent.toFixed(1),
    }));

    const stateTypeahead = new Components.Typeahead(document.getElementById("state-typeahead"), {
      placeholder: "Type a state, e.g. T for Tamil Nadu…",
      options: stateOptions,
      value: stateSel,
      onSelect: (v) => {
        stateSel = v;
        mpSel = null;
        mpTypeahead.setValue(null);
        stateChart.setSelected(stateSel);
        mpChart.setSelected(null);
        update();
      },
    });

    const mpTypeahead = new Components.Typeahead(document.getElementById("mp-typeahead"), {
      placeholder: "Type an MP name…",
      options: mpOptions,
      value: mpSel,
      onSelect: (v) => {
        mpSel = v;
        if (v) {
          stateSel = null;
          stateTypeahead.setValue(null);
          stateChart.setSelected(null);
        }
        mpChart.setSelected(mpSel);
        update();
      },
    });

    const stateChart = new UtilizationChart(document.getElementById("state-chart"), {
      title: "Top 10 states by fund utilisation",
      caption: "Click a bar to scope the panel above. Toggle any series to rescale the axes.",
      data: stateRows,
      selected: stateSel,
      filename: `mplads-state-utilisation-${D.TENURE.short}`,
      onSelect: (key) => {
        mpSel = null;
        mpTypeahead.setValue(null);
        mpChart.setSelected(null);
        stateSel = key;
        stateTypeahead.setValue(key);
        stateChart.setSelected(key);
        update();
      },
    });

    const mpChart = new UtilizationChart(document.getElementById("mp-chart"), {
      title: "Top 10 MPs by fund utilisation",
      caption: "Click a bar to load that MP's allocation, spend and delivery above.",
      data: mpRows,
      selected: mpSel,
      filename: `mplads-mp-utilisation-${D.TENURE.short}`,
      onSelect: (key) => {
        stateSel = null;
        stateTypeahead.setValue(null);
        stateChart.setSelected(null);
        mpSel = key;
        mpTypeahead.setValue(key);
        mpChart.setSelected(key);
        update();
      },
    });

    const exportMount = document.getElementById("overview-export");

    function currentMetrics() {
      if (mpSel) return D.mpMetrics(mpSel);
      if (stateSel) return D.stateMetrics(stateSel);
      return D.allIndiaMetrics();
    }

    function update() {
      const metrics = currentMetrics();
      document.getElementById("scope-label").textContent = metrics.scopeLabel;

      exportMount.innerHTML = "";
      exportMount.appendChild(
        Components.renderExportMenu({
          label: "Export panel",
          filename: `mplads-overview-${metrics.scopeLabel.replace(/\W+/g, "-").toLowerCase()}-${D.TENURE.short}`,
          rows: [
            {
              tenure: D.TENURE.short,
              scope: metrics.scopeLabel,
              allocated_cr: metrics.allocated,
              sanctioned_cr: metrics.sanctioned,
              spent_cr: metrics.spent,
              mp_count: metrics.mpCount,
              expenditure_rate_pct: metrics.expenditureRate,
              works_completed: metrics.completed,
              completed_value_cr: metrics.completedValue,
              works_pending: metrics.pending,
              unused_cr: metrics.unused,
            },
          ],
        }),
      );

      const cards = [
        {
          label: "Total allocated",
          value: D.fmtCr(metrics.allocated),
          note: "Entitlement released to MPs for the active tenure.",
          icon: "banknote",
          tone: "signal",
        },
        {
          label: "Sanctioned amount",
          value: D.fmtCr(metrics.sanctioned),
          sub: `${((metrics.sanctioned / metrics.allocated) * 100).toFixed(1)}% of allocation`,
          note: "Value of works formally sanctioned by the district authority.",
          icon: "stamp",
          tone: "violet",
          progress: (metrics.sanctioned / metrics.allocated) * 100,
        },
        {
          label: metrics.scopeKind === "MP" ? "Member of Parliament" : "Members of Parliament",
          value: metrics.scopeKind === "MP" ? metrics.mpName ?? "—" : D.fmtNum(metrics.mpCount),
          sub: metrics.scopeKind === "MP" ? metrics.scopeLabel.split("·")[1]?.trim() : "In scope",
          note: "Constituency-level accountability unit for every sanction.",
          icon: "users",
          tone: "good",
        },
        {
          label: "Expenditure rate",
          value: `${metrics.expenditureRate}%`,
          sub: `${D.fmtCr(metrics.spent)} spent`,
          note: "Vendor expenditure recorded as a share of allocation.",
          icon: "gauge",
          tone: metrics.expenditureRate < 50 ? "caution" : "good",
          progress: metrics.expenditureRate,
        },
        {
          label: "Works completed",
          value: D.fmtNum(metrics.completed),
          sub: `Worth ${D.fmtCr(metrics.completedValue)}`,
          note: "Projects marked complete with recorded value.",
          icon: "checkCircle2",
          tone: "good",
        },
        {
          label: "Pending works",
          value: D.fmtNum(metrics.pending),
          sub: `${((metrics.pending / (metrics.pending + metrics.completed)) * 100).toFixed(1)}% of pipeline`,
          note: "Sanctioned works awaiting completion certificates.",
          icon: "clock",
          tone: "caution",
          progress: (metrics.pending / (metrics.pending + metrics.completed)) * 100,
        },
        {
          label: "Unused funds",
          value: D.fmtCr(metrics.unused),
          sub: `${(100 - metrics.expenditureRate).toFixed(1)}% idle`,
          note: "Allocation with no expenditure trail yet — a liquidity indicator, not a finding.",
          icon: "piggyBank",
          tone: "risk",
          progress: 100 - metrics.expenditureRate,
        },
        {
          label: "Sanction-to-spend gap",
          value: D.fmtCr(+(metrics.sanctioned - metrics.spent).toFixed(2)),
          sub: "Sanctioned but unpaid",
          note: "Widening gaps warrant a payment-trail review.",
          icon: "circleDollarSign",
          tone: "violet",
        },
      ];

      Components.renderStatCards(document.getElementById("stat-cards"), cards);
    }

    update();
  });
})();
