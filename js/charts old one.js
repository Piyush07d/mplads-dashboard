(function (global) {
  "use strict";

  const Components = global.Components;

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  const COLORS = {
    get signal() { return cssVar("--signal"); },
    get good() { return cssVar("--good"); },
    get caution() { return cssVar("--caution"); },
    get violet() { return cssVar("--violet"); },
    get risk() { return cssVar("--risk"); },
    get border() { return cssVar("--border"); },
    get muted() { return cssVar("--muted-foreground"); },
    get popover() { return cssVar("--popover"); },
    get accent() { return cssVar("--accent"); },
  };

  const SERIES_DEF = [
    { key: "utilization", label: "Utilisation %", color: () => COLORS.signal },
    { key: "allocated", label: "Allocated (₹Cr)", color: () => COLORS.caution },
    { key: "spent", label: "Spent (₹Cr)", color: () => COLORS.violet },
  ];

  /**
   * Utilisation chart: bar (utilisation %, clickable, dual-axis) + two toggleable
   * line series (allocated / spent), plus a leader/avg/rows summary strip and an
   * export menu. Mirrors UtilizationChart.tsx.
   */
  class UtilizationChart {
    constructor(mount, { title, caption, data, selected, onSelect, filename }) {
      this.mount = mount;
      this.title = title;
      this.caption = caption;
      this.data = data;
      this.selected = selected;
      this.onSelect = onSelect;
      this.filename = filename;
      this.active = ["utilization", "allocated", "spent"];
      this.chart = null;
      this._render();
    }

    setSelected(key) {
      this.selected = key;
      this._updateChart();
    }

    setData(data) {
      this.data = data;
      this._render();
    }

    _toggle(key) {
      if (this.active.includes(key)) {
        if (this.active.length === 1) return;
        this.active = this.active.filter((k) => k !== key);
      } else {
        this.active = [...this.active, key];
      }
      this._renderToggles();
      this._updateChart();
    }

    _renderToggles() {
      this.togglesEl.innerHTML = "";
      SERIES_DEF.forEach((s) => {
        const on = this.active.includes(s.key);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "series-toggle" + (on ? " on" : "");
        btn.innerHTML = `<span class="series-swatch" style="background:${on ? s.color() : COLORS.muted}"></span>${s.label}`;
        btn.addEventListener("click", () => this._toggle(s.key));
        this.togglesEl.appendChild(btn);
      });
    }

    _render() {
      this.mount.innerHTML = `
        <section class="console-card chart-section">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">${this.title}</h3>
              <p class="chart-caption">${this.caption}</p>
            </div>
            <div class="export-mount"></div>
          </div>
          <div class="series-toggles"></div>
          <div class="chart-canvas-wrap"><canvas></canvas></div>
          <div class="chart-stats-row">
            <div>
              <p class="label-caps">Leader</p>
              <p class="chart-stats-value" style="color:var(--good)"></p>
            </div>
            <div>
              <p class="label-caps">Avg utilisation</p>
              <p class="metric-figure chart-stats-value"></p>
            </div>
            <div>
              <p class="label-caps">Rows</p>
              <p class="metric-figure chart-stats-value"></p>
            </div>
          </div>
        </section>
      `;
      this.togglesEl = this.mount.querySelector(".series-toggles");
      this.canvasWrap = this.mount.querySelector(".chart-canvas-wrap");
      this.canvas = this.mount.querySelector("canvas");
      const statVals = this.mount.querySelectorAll(".chart-stats-value");

      const leader = this.data[0];
      statVals[0].textContent = leader ? `${leader.name} (${leader.utilization}%)` : "—";
      const avg = this.data.reduce((a, d) => a + d.utilization, 0) / (this.data.length || 1);
      statVals[1].textContent = `${avg.toFixed(1)}%`;
      statVals[2].textContent = `Top ${this.data.length}`;

      const exportMount = this.mount.querySelector(".export-mount");
      exportMount.appendChild(
        Components.renderExportMenu({
          filename: this.filename,
          chartRef: () => this.canvasWrap,
          rows: () => this.data.map((d) => ({ name: d.name, utilization_pct: d.utilization, allocated_cr: d.allocated, spent_cr: d.spent })),
        }),
      );

      this._renderToggles();
      this._buildChart();
    }

    _buildChart() {
      if (typeof Chart === "undefined") {
        this.canvasWrap.innerHTML =
          '<div class="chart-empty-overlay"><div class="chart-empty-box"><p>Chart library unavailable</p><p>Check your internet connection and reload.</p></div></div>';
        return;
      }
      if (this.chart) this.chart.destroy();
      const labels = this.data.map((d) => d.name);
      const datasets = [];
      const scales = {
        x: {
          ticks: { color: COLORS.muted, font: { size: 11 }, maxRotation: 55, minRotation: 55, autoSkip: false },
          grid: { display: false },
          border: { color: COLORS.border },
        },
      };

      if (this.active.includes("utilization")) {
        datasets.push({
          type: "bar",
          label: "Utilisation %",
          data: this.data.map((d) => d.utilization),
          yAxisID: "pct",
          borderRadius: 5,
          barThickness: 22,
          backgroundColor: this.data.map((d) =>
            this.selected && this.selected !== d.key
              ? colorWithAlpha(this.selected === d.key ? COLORS.good : COLORS.signal, 0.42)
              : this.selected === d.key
                ? COLORS.good
                : COLORS.signal,
          ),
        });
        scales.pct = {
          position: "left",
          min: 0,
          max: 100,
          ticks: { color: COLORS.muted, font: { size: 11 }, callback: (v) => `${v}%` },
          grid: { color: COLORS.border },
          border: { display: false },
        };
      }

      const showAmount = this.active.includes("allocated") || this.active.includes("spent");
      if (this.active.includes("allocated")) {
        datasets.push({
          type: "line",
          label: "Allocated (₹Cr)",
          data: this.data.map((d) => d.allocated),
          yAxisID: "amt",
          borderColor: COLORS.caution,
          backgroundColor: COLORS.caution,
          borderWidth: 2,
          borderDash: [5, 4],
          pointRadius: 3,
          tension: 0.35,
        });
      }
      if (this.active.includes("spent")) {
        datasets.push({
          type: "line",
          label: "Spent (₹Cr)",
          data: this.data.map((d) => d.spent),
          yAxisID: "amt",
          borderColor: COLORS.violet,
          backgroundColor: COLORS.violet,
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.35,
        });
      }
      if (showAmount) {
        scales.amt = {
          position: this.active.includes("utilization") ? "right" : "left",
          ticks: { color: COLORS.muted, font: { size: 11 }, callback: (v) => `₹${v}Cr` },
          grid: { display: false },
          border: { display: false },
        };
      }

      this.chart = new Chart(this.canvas.getContext("2d"), {
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          onClick: (evt, elements) => {
            if (!elements.length) return;
            const idx = elements[0].index;
            const row = this.data[idx];
            if (row) this.onSelect(row.key);
          },
          onHover: (evt, elements) => {
            evt.native.target.style.cursor = elements.length ? "pointer" : "default";
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: COLORS.popover,
              borderColor: COLORS.border,
              borderWidth: 1,
              titleColor: "#fff",
              bodyColor: "#fff",
              padding: 10,
              callbacks: {
                label: (ctx) => {
                  const isPct = ctx.dataset.yAxisID === "pct";
                  const v = ctx.parsed.y;
                  return `${ctx.dataset.label}: ${isPct ? v.toFixed(1) + "%" : "₹" + Number(v).toLocaleString("en-IN") + " Cr"}`;
                },
              },
            },
          },
          scales,
        },
      });
    }

    _updateChart() {
      this._buildChart();
    }
  }

  function colorWithAlpha(oklchColor, alpha) {
    // Chart.js can't blend oklch with alpha reliably across all browsers via string concat,
    // fall back to a translucent overlay using globalAlpha-like approach via CSS color-mix.
    return `color-mix(in oklab, ${oklchColor} ${Math.round(alpha * 100)}%, transparent)`;
  }

  /**
   * Delivery timeline chart: two grouped bars (Sanctioned / Completed) on the
   * count axis, plus a filled area line (Value ₹Cr) on the right axis.
   * Mirrors the ComposedChart block in projects.tsx.
   */
  function renderTimelineChart(canvas, timeline) {
    if (typeof Chart === "undefined") return null;
    return new Chart(canvas.getContext("2d"), {
      data: {
        labels: timeline.map((t) => t.quarter),
        datasets: [
          {
            type: "bar",
            label: "Sanctioned",
            data: timeline.map((t) => t.started),
            yAxisID: "count",
            backgroundColor: COLORS.signal,
            borderRadius: 5,
            barThickness: 16,
          },
          {
            type: "bar",
            label: "Completed",
            data: timeline.map((t) => t.completed),
            yAxisID: "count",
            backgroundColor: COLORS.good,
            borderRadius: 5,
            barThickness: 16,
          },
          {
            type: "line",
            label: "Value (₹Cr)",
            data: timeline.map((t) => t.value),
            yAxisID: "value",
            borderColor: COLORS.caution,
            backgroundColor: colorWithAlpha(COLORS.caution, 0.16),
            fill: true,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { color: COLORS.muted, boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            backgroundColor: COLORS.popover,
            borderColor: COLORS.border,
            borderWidth: 1,
            titleColor: "#fff",
            bodyColor: "#fff",
            padding: 10,
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.yAxisID === "value") return `${ctx.dataset.label}: ₹${ctx.parsed.y}Cr`;
                return `${ctx.dataset.label}: ${ctx.parsed.y}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: COLORS.muted, font: { size: 11 } },
            grid: { display: false },
            border: { color: COLORS.border },
          },
          count: {
            position: "left",
            ticks: { color: COLORS.muted, font: { size: 11 } },
            grid: { color: COLORS.border },
            border: { display: false },
          },
          value: {
            position: "right",
            ticks: { color: COLORS.muted, font: { size: 11 }, callback: (v) => `₹${v}Cr` },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  }

  global.ChartsUI = { UtilizationChart, renderTimelineChart };
})(window);
