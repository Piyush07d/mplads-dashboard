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
    get foreground() { return cssVar("--foreground"); },
    get accent() { return cssVar("--accent"); },
  };

  const SERIES_DEF = [
    { key: "utilization", label: "Utilisation %", color: () => COLORS.signal },
    { key: "allocated", label: "Allocated (₹Cr)", color: () => COLORS.caution },
    { key: "spent", label: "Spent (₹Cr)", color: () => COLORS.violet },
  ];

  const LABEL_FONT = '11px "DM Sans", ui-sans-serif, sans-serif';
  const NUM_FONT = '11px "IBM Plex Mono", ui-monospace, monospace';

  function colorWithAlpha(color, alpha) {
    // Modern browsers accept color-mix() as a canvas fillStyle/strokeStyle,
    // same as they did as a Chart.js dataset color before.
    return `color-mix(in oklab, ${color} ${Math.round(alpha * 100)}%, transparent)`;
  }

  /** Sizes a canvas for the device pixel ratio and returns a ready 2D context. */
  function setupCanvas(canvas) {
    const wrap = canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.display = "block";
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
  }

  /** Rounds a value up to a "nice" axis maximum (1/2/5/10 × 10^n). */
  function niceMax(v) {
    if (!(v > 0)) return 10;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    let niceN;
    if (n <= 1) niceN = 1;
    else if (n <= 2) niceN = 2;
    else if (n <= 5) niceN = 5;
    else niceN = 10;
    return niceN * pow;
  }

  function fillRoundRectTop(ctx, x, y, w, h, r, fill) {
    if (!(h > 0.4) || !(w > 0)) return;
    const radius = Math.max(0, Math.min(r, w / 2, h));
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function ensureTooltip(wrap, className) {
    let el = wrap.querySelector(":scope > ." + className);
    if (!el) {
      el = document.createElement("div");
      el.className = className;
      Object.assign(el.style, {
        position: "absolute",
        top: "0",
        left: "0",
        zIndex: "5",
        pointerEvents: "none",
        background: "var(--popover)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "0.5rem 0.65rem",
        fontSize: "0.72rem",
        lineHeight: "1.6",
        color: "var(--foreground)",
        boxShadow: "var(--shadow-console)",
        opacity: "0",
        transition: "opacity 80ms ease",
        maxWidth: "220px",
        whiteSpace: "nowrap",
        transform: "translate(-9999px,-9999px)",
      });
      wrap.appendChild(el);
    }
    return el;
  }

  function positionTooltip(el, wrap, x, y) {
    const wrapRect = wrap.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    let left = x + 16;
    let top = y - elRect.height / 2;
    if (left + elRect.width > wrapRect.width) left = x - elRect.width - 16;
    if (top < 0) top = 4;
    if (top + elRect.height > wrapRect.height) top = wrapRect.height - elRect.height - 4;
    el.style.transform = `translate(${Math.max(0, left)}px, ${Math.max(0, top)}px)`;
  }

  function fmtPct(v) {
    return `${v.toFixed(1)}%`;
  }
  function fmtAmt(v) {
    return `₹${Number(v).toLocaleString("en-IN")}Cr`;
  }

  /**
   * Utilisation chart: bar (utilisation %, clickable, dual-axis) + two toggleable
   * line series (allocated / spent), plus a leader/avg/rows summary strip and an
   * export menu. Drawn on a plain <canvas> — no external chart library.
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
      this._layout = null;
      this._rafId = null;
      this._ro = null;
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
      if (this._ro) this._ro.disconnect();

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
      this._setupInteraction();
      this._scheduleRedraw();

      this._ro = new ResizeObserver(() => this._scheduleRedraw());
      this._ro.observe(this.canvasWrap);
    }

    _scheduleRedraw() {
      if (this._rafId) return;
      this._rafId = requestAnimationFrame(() => {
        this._rafId = null;
        this._buildChart();
      });
    }

    _updateChart() {
      this._scheduleRedraw();
    }

    _setupInteraction() {
      const tooltip = ensureTooltip(this.canvasWrap, "chart-tooltip");
      this.canvas.addEventListener("mousemove", (e) => {
        const layout = this._layout;
        if (!layout) return;
        const x = e.offsetX;
        if (x < layout.plotLeft || x > layout.plotRight) {
          tooltip.style.opacity = "0";
          this.canvas.style.cursor = "default";
          return;
        }
        let idx = Math.floor((x - layout.plotLeft) / layout.slot);
        idx = Math.max(0, Math.min(layout.data.length - 1, idx));
        const row = layout.data[idx];
        const lines = [`<strong>${row.name}</strong>`];
        if (this.active.includes("utilization")) lines.push(`Utilisation: ${fmtPct(row.utilization)}`);
        if (this.active.includes("allocated")) lines.push(`Allocated: ${fmtAmt(row.allocated)}`);
        if (this.active.includes("spent")) lines.push(`Spent: ${fmtAmt(row.spent)}`);
        tooltip.innerHTML = lines.join("<br/>");
        tooltip.style.opacity = "1";
        positionTooltip(tooltip, this.canvasWrap, x, e.offsetY);
        this.canvas.style.cursor = this.active.includes("utilization") ? "pointer" : "default";
      });
      this.canvas.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
        this.canvas.style.cursor = "default";
      });
      this.canvas.addEventListener("click", (e) => {
        const layout = this._layout;
        if (!layout || !this.active.includes("utilization")) return;
        const x = e.offsetX;
        if (x < layout.plotLeft || x > layout.plotRight) return;
        let idx = Math.floor((x - layout.plotLeft) / layout.slot);
        idx = Math.max(0, Math.min(layout.data.length - 1, idx));
        const row = layout.data[idx];
        if (row) this.onSelect(row.key);
      });
    }

    _buildChart() {
      const { ctx, width, height } = setupCanvas(this.canvas);
      const data = this.data;
      const showPct = this.active.includes("utilization");
      const showAllocated = this.active.includes("allocated");
      const showSpent = this.active.includes("spent");
      const showAmt = showAllocated || showSpent;

      const leftMargin = showPct ? 36 : showAmt ? 52 : 16;
      const rightMargin = showPct && showAmt ? 56 : 14;
      const topMargin = 14;
      const bottomMargin = 78;

      const plotLeft = leftMargin;
      const plotRight = width - rightMargin;
      const plotTop = topMargin;
      const plotBottom = height - bottomMargin;
      const plotWidth = Math.max(1, plotRight - plotLeft);
      const plotHeight = Math.max(1, plotBottom - plotTop);
      const slot = plotWidth / data.length;
      const barWidth = Math.min(26, slot * 0.5);

      const amtMax = showAmt
        ? niceMax(
            Math.max(
              1,
              ...data.map((d) => Math.max(showAllocated ? d.allocated : 0, showSpent ? d.spent : 0)),
            ) * 1.15,
          )
        : 0;

      const pctScale = (v) => plotBottom - (v / 100) * plotHeight;
      const amtScale = (v) => plotBottom - (v / amtMax) * plotHeight;

      ctx.textBaseline = "middle";

      // Gridlines + left axis ticks
      const gridTicks = showPct ? [0, 25, 50, 75, 100] : showAmt ? [0, 0.25, 0.5, 0.75, 1].map((f) => f * amtMax) : [];
      ctx.strokeStyle = COLORS.border;
      ctx.fillStyle = COLORS.muted;
      ctx.font = NUM_FONT;
      ctx.textAlign = "right";
      gridTicks.forEach((tick) => {
        const y = showPct ? pctScale(tick) : amtScale(tick);
        if (showPct) {
          ctx.beginPath();
          ctx.moveTo(plotLeft, y);
          ctx.lineTo(plotRight, y);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        const label = showPct ? `${tick}%` : fmtAmt(Math.round(tick));
        ctx.fillText(label, plotLeft - 8, y);
      });

      // Right axis ticks (amount), only when both axes are shown
      if (showAmt && showPct) {
        ctx.textAlign = "left";
        [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
          const v = f * amtMax;
          const y = amtScale(v);
          ctx.fillText(fmtAmt(Math.round(v)), plotRight + 8, y);
        });
      }

      // Bars (utilisation)
      if (showPct) {
        data.forEach((row, i) => {
          const x = plotLeft + i * slot + (slot - barWidth) / 2;
          const y = pctScale(row.utilization);
          const h = plotBottom - y;
          let color;
          if (this.selected) {
            color = row.key === this.selected ? COLORS.good : colorWithAlpha(COLORS.signal, 0.38);
          } else {
            color = COLORS.signal;
          }
          fillRoundRectTop(ctx, x, y, barWidth, h, 5, color);
        });
      }

      // Line series (allocated / spent)
      function drawLine(getVal, color, dashed) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash(dashed ? [6, 4] : []);
        data.forEach((row, i) => {
          const x = plotLeft + i * slot + slot / 2;
          const y = amtScale(getVal(row));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        data.forEach((row, i) => {
          const x = plotLeft + i * slot + slot / 2;
          const y = amtScale(getVal(row));
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      if (showAllocated) drawLine((d) => d.allocated, COLORS.caution, true);
      if (showSpent) drawLine((d) => d.spent, COLORS.violet, false);

      // X axis line + rotated category labels
      ctx.strokeStyle = COLORS.border;
      ctx.beginPath();
      ctx.moveTo(plotLeft, plotBottom);
      ctx.lineTo(plotRight, plotBottom);
      ctx.stroke();

      ctx.font = LABEL_FONT;
      ctx.fillStyle = COLORS.muted;
      ctx.textAlign = "right";
      data.forEach((row, i) => {
        const cx = plotLeft + i * slot + slot / 2;
        ctx.save();
        ctx.translate(cx, plotBottom + 10);
        ctx.rotate((-55 * Math.PI) / 180);
        ctx.fillText(row.name, 0, 0);
        ctx.restore();
      });

      this._layout = { plotLeft, plotRight, plotTop, plotBottom, slot, data };
    }
  }

  /**
   * Delivery timeline chart: two grouped bars (Sanctioned / Completed) on the
   * count axis, plus a filled area line (Value ₹Cr) on the right axis. Drawn
   * on a plain <canvas> — no external chart library.
   */
  function renderTimelineChart(canvas, timeline) {
    // Strip any listeners left over from a previous render of this same node.
    const fresh = canvas.cloneNode();
    canvas.replaceWith(fresh);
    canvas = fresh;

    const wrap = canvas.parentElement;
    const tooltip = ensureTooltip(wrap, "chart-timeline-tooltip");
    let layout = null;

    function draw() {
      const { ctx, width, height } = setupCanvas(canvas);
      if (!timeline.length) {
        layout = null;
        return;
      }

      const leftMargin = 40;
      const rightMargin = 52;
      const topMargin = 14;
      const bottomMargin = 56; // x labels + legend

      const plotLeft = leftMargin;
      const plotRight = width - rightMargin;
      const plotTop = topMargin;
      const plotBottom = height - bottomMargin;
      const plotWidth = Math.max(1, plotRight - plotLeft);
      const plotHeight = Math.max(1, plotBottom - plotTop);
      const slot = plotWidth / timeline.length;
      const groupWidth = Math.min(46, slot * 0.62);
      const barWidth = groupWidth / 2 - 2;

      const countMax = niceMax(Math.max(1, ...timeline.map((t) => Math.max(t.started, t.completed))) * 1.2);
      const valueMax = niceMax(Math.max(1, ...timeline.map((t) => t.value)) * 1.25);
      const countScale = (v) => plotBottom - (v / countMax) * plotHeight;
      const valueScale = (v) => plotBottom - (v / valueMax) * plotHeight;

      ctx.textBaseline = "middle";

      // Left axis (count) gridlines + labels
      ctx.font = NUM_FONT;
      ctx.strokeStyle = COLORS.border;
      ctx.fillStyle = COLORS.muted;
      ctx.textAlign = "right";
      const countTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * countMax));
      countTicks.forEach((tick) => {
        const y = countScale(tick);
        ctx.beginPath();
        ctx.moveTo(plotLeft, y);
        ctx.lineTo(plotRight, y);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillText(String(tick), plotLeft - 8, y);
      });

      // Right axis (value) labels
      ctx.textAlign = "left";
      [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
        const v = f * valueMax;
        ctx.fillText(fmtAmt(Math.round(v)), plotRight + 8, valueScale(v));
      });

      // Value area (filled line)
      ctx.beginPath();
      timeline.forEach((t, i) => {
        const x = plotLeft + i * slot + slot / 2;
        const y = valueScale(t.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      const lastX = plotLeft + (timeline.length - 1) * slot + slot / 2;
      const firstX = plotLeft + slot / 2;
      ctx.lineTo(lastX, plotBottom);
      ctx.lineTo(firstX, plotBottom);
      ctx.closePath();
      ctx.fillStyle = colorWithAlpha(COLORS.caution, 0.16);
      ctx.fill();

      ctx.beginPath();
      timeline.forEach((t, i) => {
        const x = plotLeft + i * slot + slot / 2;
        const y = valueScale(t.value);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = COLORS.caution;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Grouped bars
      timeline.forEach((t, i) => {
        const groupX = plotLeft + i * slot + (slot - groupWidth) / 2;
        const sy = countScale(t.started);
        const cy = countScale(t.completed);
        fillRoundRectTop(ctx, groupX, sy, barWidth, plotBottom - sy, 4, COLORS.signal);
        fillRoundRectTop(ctx, groupX + barWidth + 4, cy, barWidth, plotBottom - cy, 4, COLORS.good);
      });

      // X axis line + labels
      ctx.strokeStyle = COLORS.border;
      ctx.beginPath();
      ctx.moveTo(plotLeft, plotBottom);
      ctx.lineTo(plotRight, plotBottom);
      ctx.stroke();

      ctx.font = LABEL_FONT;
      ctx.fillStyle = COLORS.muted;
      ctx.textAlign = "center";
      timeline.forEach((t, i) => {
        const x = plotLeft + i * slot + slot / 2;
        ctx.fillText(t.quarter, x, plotBottom + 16);
      });

      // Legend
      const legendY = height - 14;
      const legendItems = [
        { label: "Sanctioned", color: COLORS.signal },
        { label: "Completed", color: COLORS.good },
        { label: "Value (₹Cr)", color: COLORS.caution },
      ];
      ctx.font = LABEL_FONT;
      const gap = 20;
      const widths = legendItems.map((it) => 14 + 6 + ctx.measureText(it.label).width);
      const totalWidth = widths.reduce((a, w) => a + w, 0) + gap * (legendItems.length - 1);
      let lx = width / 2 - totalWidth / 2;
      legendItems.forEach((it, i) => {
        ctx.fillStyle = it.color;
        ctx.fillRect(lx, legendY - 5, 10, 10);
        ctx.fillStyle = COLORS.muted;
        ctx.textAlign = "left";
        ctx.fillText(it.label, lx + 16, legendY);
        lx += widths[i] + gap;
      });

      layout = { plotLeft, plotRight, plotTop, plotBottom, slot, timeline };
    }

    function handleMove(e) {
      if (!layout) return;
      const x = e.offsetX;
      if (x < layout.plotLeft || x > layout.plotRight) {
        tooltip.style.opacity = "0";
        return;
      }
      let idx = Math.floor((x - layout.plotLeft) / layout.slot);
      idx = Math.max(0, Math.min(layout.timeline.length - 1, idx));
      const t = layout.timeline[idx];
      tooltip.innerHTML = [
        `<strong>${t.quarter}</strong>`,
        `Sanctioned: ${t.started}`,
        `Completed: ${t.completed}`,
        `Value: ${fmtAmt(t.value)}`,
      ].join("<br/>");
      tooltip.style.opacity = "1";
      positionTooltip(tooltip, wrap, x, e.offsetY);
    }
    function handleLeave() {
      tooltip.style.opacity = "0";
    }

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);

    let rafId = null;
    function scheduleRedraw() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        draw();
      });
    }

    draw();
    const ro = new ResizeObserver(() => scheduleRedraw());
    ro.observe(wrap);

    return {
      destroy() {
        ro.disconnect();
        if (rafId) cancelAnimationFrame(rafId);
      },
    };
  }

  global.ChartsUI = { UtilizationChart, renderTimelineChart };
})(window);
