/**
 * Deterministic mock dataset for the MPLADS anomaly-review prototype.
 * Ported 1:1 from the original mplads-data.ts (same seeded PRNG) so figures
 * match the source app exactly.
 */
(function (global) {
  "use strict";

  const TENURE = {
    label: "17th Lok Sabha term · 2024–2029",
    short: "2024–2029",
    house: "Both Houses",
  };

  // Simple seeded PRNG so numbers never change between renders.
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const STATE_SEED = [
    { name: "Uttar Pradesh", mps: 80 },
    { name: "Maharashtra", mps: 48 },
    { name: "West Bengal", mps: 42 },
    { name: "Bihar", mps: 40 },
    { name: "Tamil Nadu", mps: 39 },
    { name: "Madhya Pradesh", mps: 29 },
    { name: "Karnataka", mps: 28 },
    { name: "Gujarat", mps: 26 },
    { name: "Rajasthan", mps: 25 },
    { name: "Andhra Pradesh", mps: 25 },
    { name: "Odisha", mps: 21 },
    { name: "Kerala", mps: 20 },
    { name: "Telangana", mps: 17 },
    { name: "Assam", mps: 14 },
    { name: "Jharkhand", mps: 14 },
    { name: "Punjab", mps: 13 },
    { name: "Chhattisgarh", mps: 11 },
    { name: "Haryana", mps: 10 },
    { name: "Delhi", mps: 7 },
    { name: "Uttarakhand", mps: 5 },
    { name: "Himachal Pradesh", mps: 4 },
    { name: "Tripura", mps: 2 },
    { name: "Meghalaya", mps: 2 },
    { name: "Manipur", mps: 2 },
    { name: "Goa", mps: 2 },
    { name: "Arunachal Pradesh", mps: 2 },
    { name: "Nagaland", mps: 1 },
    { name: "Mizoram", mps: 1 },
    { name: "Sikkim", mps: 1 },
    { name: "Ladakh", mps: 1 },
  ];

  const FIRST = [
    "Anil", "Rekha", "Suresh", "Kavita", "Praveen", "Meera", "Rajat", "Sunita",
    "Dinesh", "Farida", "Gopal", "Harleen", "Imran", "Jyoti", "Karan", "Lalita",
    "Mahesh", "Nandini", "Omkar", "Pallavi", "Tarun", "Trisha", "Uday", "Vandana",
    "Yashwant",
  ];
  const LAST = [
    "Sharma", "Reddy", "Patil", "Banerjee", "Iyer", "Nair", "Chauhan", "Das",
    "Kulkarni", "Mahato", "Rathore", "Verma", "Sethi", "Mishra", "Gogoi",
  ];

  const DISTRICT_SUFFIX = ["North", "South", "East", "West", "Central", "Rural"];

  const PROJECT_TYPES = [
    "Road & Culvert", "Drinking Water", "School Infrastructure", "Public Health",
    "Sanitation", "Street Lighting", "Community Hall", "Sports Facility",
  ];

  const CONTRACTORS = [
    "Shreeji Infra Works", "Kaveri Buildtech", "Nirman Associates", "Sunrise Civil Co.",
    "Deccan Engineers", "Vindhya Constructions", "Bharat Pathway Ltd.", "Ganga Utilities",
    "Metro Line Builders", "Astha Public Works", "Sahyadri Projects", "Trinetra Contractors",
  ];

  const RISK_INDICATORS = [
    "Cost far above district median for this work type",
    "Repeated vendor across adjacent sanctions",
    "Completion certificate filed before final payment trail",
    "Payment released in unusually round instalments",
    "Long dormancy then sudden full utilisation",
    "Duplicate work description within same district",
    "Beneficiary count inconsistent with sanction size",
  ];

  const r = rng(20242029);

  const mps = (() => {
    const out = [];
    let n = 0;
    for (const st of STATE_SEED) {
      for (let i = 0; i < st.mps; i++) {
        n++;
        const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
        const allocated = 12 + Math.round((r() * 60)) / 10; // ~12-18 Cr
        const sanctionRate = 0.55 + r() * 0.42;
        const sanctioned = +(allocated * sanctionRate).toFixed(2);
        const spent = +(sanctioned * (0.4 + r() * 0.58)).toFixed(2);
        const total = 60 + Math.floor(r() * 260);
        const completed = Math.floor(total * (0.2 + r() * 0.5));
        const pending = total - completed;
        out.push({
          id: `MP-${String(n).padStart(4, "0")}`,
          name,
          state: st.name,
          constituency: `${st.name.split(" ")[0]} ${DISTRICT_SUFFIX[Math.floor(r() * 6)]}`,
          house: r() > 0.78 ? "Rajya Sabha" : "Lok Sabha",
          allocated,
          sanctioned,
          spent,
          completed,
          completedValue: +(spent * (0.5 + r() * 0.4)).toFixed(2),
          pending,
          flagged: Math.floor(r() * 9),
        });
      }
    }
    return out;
  })();

  const states = STATE_SEED.map((st) => {
    const group = mps.filter((m) => m.state === st.name);
    const sum = (f) => +group.reduce((a, m) => a + f(m), 0).toFixed(2);
    return {
      name: st.name,
      mpCount: group.length,
      allocated: sum((m) => m.allocated),
      sanctioned: sum((m) => m.sanctioned),
      spent: sum((m) => m.spent),
      completed: group.reduce((a, m) => a + m.completed, 0),
      completedValue: sum((m) => m.completedValue),
      pending: group.reduce((a, m) => a + m.pending, 0),
      flagged: group.reduce((a, m) => a + m.flagged, 0),
    };
  });

  const projects = (() => {
    const p = rng(778899);
    const out = [];
    for (let i = 0; i < 900; i++) {
      const state = states[Math.floor(p() * states.length)];
      const mp = mps.filter((m) => m.state === state.name)[0];
      const pool = mps.filter((m) => m.state === state.name);
      const chosen = pool[Math.floor(p() * pool.length)] ?? mp;
      const type = PROJECT_TYPES[Math.floor(p() * PROJECT_TYPES.length)];
      const statusRoll = p();
      const status = statusRoll > 0.66 ? "Completed" : statusRoll > 0.18 ? "In Progress" : "Recommended";
      const risk = Math.round(p() * 100);
      const indicators = RISK_INDICATORS.filter(() => p() > 0.78).slice(0, 3);
      const q = 1 + Math.floor(p() * 8);
      const year = 2024 + Math.floor((q - 1) / 4);
      const qq = ((q - 1) % 4) + 1;
      out.push({
        id: `PRJ-${String(10000 + i)}`,
        title: `${type} upgrade, ward ${1 + Math.floor(p() * 40)}`,
        state: state.name,
        district: `${state.name.split(" ")[0]} ${DISTRICT_SUFFIX[Math.floor(p() * 6)]}`,
        type,
        contractor: CONTRACTORS[Math.floor(p() * CONTRACTORS.length)],
        mp: chosen.name,
        cost: +(5 + p() * 240).toFixed(1),
        status,
        riskScore: risk,
        indicators: risk > 60 && indicators.length === 0 ? [RISK_INDICATORS[0]] : indicators,
        sanctionedOn: `${year}-${String(qq * 3).padStart(2, "0")}-15`,
        quarter: `${year} Q${qq}`,
      });
    }
    return out;
  })();

  const QUARTERS = Array.from(new Set(projects.map((p) => p.quarter))).sort();

  const utilization = (spent, allocated) => (allocated > 0 ? +((spent / allocated) * 100).toFixed(1) : 0);

  function allIndiaMetrics() {
    const allocated = +states.reduce((a, s) => a + s.allocated, 0).toFixed(2);
    const sanctioned = +states.reduce((a, s) => a + s.sanctioned, 0).toFixed(2);
    const spent = +states.reduce((a, s) => a + s.spent, 0).toFixed(2);
    return {
      scopeLabel: "All India",
      scopeKind: "All India",
      allocated,
      sanctioned,
      spent,
      mpCount: mps.length,
      completed: states.reduce((a, s) => a + s.completed, 0),
      completedValue: +states.reduce((a, s) => a + s.completedValue, 0).toFixed(2),
      pending: states.reduce((a, s) => a + s.pending, 0),
      unused: +(allocated - spent).toFixed(2),
      expenditureRate: utilization(spent, allocated),
    };
  }

  function stateMetrics(name) {
    const s = states.find((x) => x.name === name);
    return {
      scopeLabel: s.name,
      scopeKind: "State",
      allocated: s.allocated,
      sanctioned: s.sanctioned,
      spent: s.spent,
      mpCount: s.mpCount,
      completed: s.completed,
      completedValue: s.completedValue,
      pending: s.pending,
      unused: +(s.allocated - s.spent).toFixed(2),
      expenditureRate: utilization(s.spent, s.allocated),
    };
  }

  function mpMetrics(id) {
    const m = mps.find((x) => x.id === id);
    return {
      scopeLabel: `${m.name} · ${m.constituency}`,
      scopeKind: "MP",
      mpName: m.name,
      allocated: m.allocated,
      sanctioned: m.sanctioned,
      spent: m.spent,
      mpCount: 1,
      completed: m.completed,
      completedValue: m.completedValue,
      pending: m.pending,
      unused: +(m.allocated - m.spent).toFixed(2),
      expenditureRate: utilization(m.spent, m.allocated),
    };
  }

  const topStatesByUtilization = [...states]
    .map((s) => ({ name: s.name, utilization: utilization(s.spent, s.allocated), allocated: s.allocated, spent: s.spent }))
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 10);

  const topMpsByUtilization = [...mps]
    .map((m) => ({ id: m.id, name: m.name, state: m.state, utilization: utilization(m.spent, m.allocated), allocated: m.allocated, spent: m.spent }))
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 10);

  const fmtCr = (v) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
  const fmtNum = (v) => v.toLocaleString("en-IN");

  global.MPLADS = {
    TENURE,
    DISTRICT_SUFFIX,
    PROJECT_TYPES,
    mps,
    states,
    projects,
    QUARTERS,
    utilization,
    allIndiaMetrics,
    stateMetrics,
    mpMetrics,
    topStatesByUtilization,
    topMpsByUtilization,
    fmtCr,
    fmtNum,
  };
})(window);
