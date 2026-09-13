(function (global) {
  "use strict";

  const ICONS = global.ICONS;
  const ExportUtils = global.ExportUtils;

  /* ---------------- toast ---------------- */

  function ensureToastStack() {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(title, description) {
    const stack = ensureToastStack();
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<strong>${title}</strong>${description ? `<span>${description}</span>` : ""}`;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity 200ms ease";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 220);
    }, 2600);
  }

  /* ---------------- StatCard ---------------- */

  function renderStatCard({ label, value, sub, note, icon, tone = "signal", progress }) {
    const wrap = document.createElement("article");
    wrap.className = "console-card console-card-hover stat-card";
    const iconSvg = ICONS[icon] || "";
    wrap.innerHTML = `
      <div class="stat-card-top">
        <div>
          <p class="label-caps">${label}</p>
          <p class="metric-figure stat-card-value tone-${tone}-value">${value}</p>
          ${sub ? `<p class="stat-card-sub">${sub}</p>` : ""}
        </div>
        <span class="stat-card-icon tone-${tone}-chip">${iconSvg}</span>
      </div>
      ${note ? `<p class="stat-card-note">${note}</p>` : ""}
      ${
        typeof progress === "number"
          ? `<div class="stat-card-bar-track"><div class="stat-card-bar-fill tone-${tone}-bar" style="width:${Math.max(2, Math.min(100, progress))}%"></div></div>`
          : ""
      }
    `;
    return wrap;
  }

  function renderStatCards(container, cards) {
    container.innerHTML = "";
    cards.forEach((c) => container.appendChild(renderStatCard(c)));
  }

  /* ---------------- Typeahead ---------------- */

  class Typeahead {
    /**
     * @param {HTMLElement} mount
     * @param {{placeholder:string, options:{value:string,label:string,hint?:string}[], value:string|null, onSelect:(v:string|null)=>void, emptyText?:string}} opts
     */
    constructor(mount, opts) {
      this.mount = mount;
      this.options = opts.options;
      this.value = opts.value ?? null;
      this.onSelect = opts.onSelect;
      this.placeholder = opts.placeholder;
      this.emptyText = opts.emptyText ?? "No match found";
      this.query = "";
      this.open = false;
      this._render();
    }

    setOptions(options) {
      this.options = options;
      this._renderResults();
    }

    setValue(value) {
      this.value = value;
      this._syncInput();
    }

    _selected() {
      return this.options.find((o) => o.value === this.value) ?? null;
    }

    _filtered() {
      const q = this.query.trim().toLowerCase();
      const base = q ? this.options.filter((o) => o.label.toLowerCase().includes(q)) : this.options;
      return base.slice(0, 60);
    }

    _syncInput() {
      const selected = this._selected();
      this.inputEl.value = this.open ? this.query : selected ? selected.label : this.query;
      this.clearBtn.classList.toggle("hidden", !(selected || this.query));
    }

    _renderResults() {
      const results = this._filtered();
      if (!this.open) {
        this.resultsEl.classList.add("hidden");
        return;
      }
      this.resultsEl.classList.remove("hidden");
      if (results.length === 0) {
        this.resultsInner.innerHTML = `<p class="typeahead-empty">${this.emptyText}</p>`;
        return;
      }
      this.resultsInner.innerHTML = "";
      results.forEach((o) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "typeahead-option" + (o.value === this.value ? " selected" : "");
        btn.innerHTML = `<span class="typeahead-option-label">${o.label}</span>${
          o.hint ? `<span class="typeahead-option-hint">${o.hint}</span>` : ""
        }`;
        btn.addEventListener("mousedown", (e) => {
          e.preventDefault();
          this.value = o.value;
          this.query = "";
          this.open = false;
          this._syncInput();
          this._renderResults();
          this.onSelect(o.value);
        });
        this.resultsInner.appendChild(btn);
      });
    }

    _render() {
      this.mount.innerHTML = `
        <div class="typeahead">
          <div class="typeahead-input-wrap">
            <span class="typeahead-icon">${ICONS.search}</span>
            <input type="text" class="typeahead-input" placeholder="${this.placeholder}" autocomplete="off" />
            <button type="button" class="typeahead-clear hidden" aria-label="Clear">${ICONS.x}</button>
          </div>
          <div class="typeahead-results hidden">
            <div class="typeahead-results-inner"></div>
          </div>
        </div>
      `;
      this.inputEl = this.mount.querySelector(".typeahead-input");
      this.clearBtn = this.mount.querySelector(".typeahead-clear");
      this.resultsEl = this.mount.querySelector(".typeahead-results");
      this.resultsInner = this.mount.querySelector(".typeahead-results-inner");

      this.inputEl.addEventListener("input", (e) => {
        this.query = e.target.value;
        this.open = true;
        this._renderResults();
        this._syncInput();
      });
      this.inputEl.addEventListener("focus", () => {
        this.open = true;
        this._renderResults();
      });
      this.inputEl.addEventListener("blur", () => {
        setTimeout(() => {
          this.open = false;
          this._renderResults();
          this._syncInput();
        }, 150);
      });
      this.clearBtn.addEventListener("click", () => {
        this.query = "";
        this.value = null;
        this.open = false;
        this._syncInput();
        this._renderResults();
        this.onSelect(null);
      });

      this._syncInput();
      this._renderResults();
    }
  }

  /* ---------------- ExportMenu ---------------- */

  function renderExportMenu({ label = "Export", filename, rows, chartRef }) {
    const wrap = document.createElement("div");
    wrap.className = "export-menu";
    wrap.innerHTML = `
      <button type="button" class="btn btn-outline btn-sm export-menu-trigger">
        ${ICONS.download} ${label}
      </button>
      <div class="export-menu-panel">
        <p class="label-caps export-menu-label">Archive this view</p>
        <div class="export-menu-sep"></div>
        <button type="button" class="export-menu-item" data-action="csv">${ICONS.fileSpreadsheet} CSV (spreadsheet)</button>
        <button type="button" class="export-menu-item" data-action="json">${ICONS.fileJson} JSON (raw records)</button>
        ${chartRef ? `<button type="button" class="export-menu-item" data-action="png">${ICONS.image} PNG (chart image)</button>` : ""}
        <button type="button" class="export-menu-item" data-action="print">${ICONS.printer} Print / save as PDF</button>
      </div>
    `;

    const trigger = wrap.querySelector(".export-menu-trigger");
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".export-menu.open").forEach((m) => {
        if (m !== wrap) m.classList.remove("open");
      });
      wrap.classList.toggle("open");
    });
    document.addEventListener("click", () => wrap.classList.remove("open"));
    wrap.querySelector(".export-menu-panel").addEventListener("click", (e) => e.stopPropagation());

    wrap.querySelectorAll(".export-menu-item").forEach((item) => {
      item.addEventListener("click", async () => {
        wrap.classList.remove("open");
        const action = item.dataset.action;
        const rowData = typeof rows === "function" ? rows() : rows;
        if (action === "csv") {
          ExportUtils.exportCsv(rowData, filename);
          toast("CSV exported", `${rowData.length} rows saved`);
        } else if (action === "json") {
          ExportUtils.exportJson(rowData, filename);
          toast("JSON exported");
        } else if (action === "png") {
          const container = typeof chartRef === "function" ? chartRef() : chartRef;
          await ExportUtils.exportChartPng(container, filename);
          toast("Chart image exported");
        } else if (action === "print") {
          ExportUtils.printSection();
        }
      });
    });

    return wrap;
  }

  global.Components = { toast, renderStatCard, renderStatCards, Typeahead, renderExportMenu };
})(window);
