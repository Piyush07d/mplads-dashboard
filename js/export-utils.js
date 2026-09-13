(function (global) {
  "use strict";

  function triggerDownload(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function exportCsv(rows, filename) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    triggerDownload(url, `${filename}.csv`);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function exportJson(data, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    triggerDownload(url, `${filename}.json`);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /** Rasterises a <canvas> (Chart.js chart) or an <svg> inside a container to a PNG. */
  async function exportChartPng(container, filename) {
    if (!container) return;
    const canvas = container.querySelector("canvas");
    if (canvas) {
      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = canvas.width;
      bgCanvas.height = canvas.height;
      const ctx = bgCanvas.getContext("2d");
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      ctx.drawImage(canvas, 0, 0);
      triggerDownload(bgCanvas.toDataURL("image/png"), `${filename}.png`);
      return;
    }
    const svg = container.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true);
    const rect = svg.getBoundingClientRect();
    clone.setAttribute("width", String(rect.width));
    clone.setAttribute("height", String(rect.height));
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#0b1220");
    clone.insertBefore(bg, clone.firstChild);
    const source = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = svgUrl;
    });
    const scale = 2;
    const canvasEl = document.createElement("canvas");
    canvasEl.width = rect.width * scale;
    canvasEl.height = rect.height * scale;
    const ctx = canvasEl.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    triggerDownload(canvasEl.toDataURL("image/png"), `${filename}.png`);
  }

  function printSection() {
    window.print();
  }

  global.ExportUtils = { exportCsv, exportJson, exportChartPng, printSection };
})(window);
