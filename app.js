'use strict';

const MAX_LAYERS = 18;
const DEFAULT_STATE = {
  periodSeconds: 86400,
  rsi: 0.13,
  rse: 0.04,
  projectName: 'Example construction',
  layers: [
    { name: 'Interior plaster', lambda: 0.70, density: 1400, specificHeat: 1000, thickness: 0.010 },
    { name: 'Autoclaved aerated concrete 500', lambda: 0.10, density: 500, specificHeat: 1000, thickness: 0.175 },
    { name: 'Mineral insulation board', lambda: 0.045, density: 100, specificHeat: 1000, thickness: 0.120 },
    { name: 'External render', lambda: 0.21, density: 800, specificHeat: 1000, thickness: 0.020 }
  ]
};

let materialDb = [];
let state = structuredClone(DEFAULT_STATE);

const $ = (id) => document.getElementById(id);
const num = (v) => {
  if (v === null || v === undefined || v === '') return NaN;
  return Number(String(v).replace(',', '.'));
};
const fmt = (v, d = 3) => Number.isFinite(v) ? v.toLocaleString('de-DE', { maximumFractionDigits: d, minimumFractionDigits: d }) : '–';
const fmtFlex = (v, d = 4) => Number.isFinite(v) ? v.toLocaleString('de-DE', { maximumFractionDigits: d }) : '–';

function complex(re = 0, im = 0) { return { re, im }; }
function cAdd(a, b) { return complex(a.re + b.re, a.im + b.im); }
function cSub(a, b) { return complex(a.re - b.re, a.im - b.im); }
function cMul(a, b) { return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re); }
function cDiv(a, b) {
  const den = b.re * b.re + b.im * b.im;
  return den === 0 ? complex(NaN, NaN) : complex((a.re * b.re + a.im * b.im) / den, (a.im * b.re - a.re * b.im) / den);
}
function cNeg(a) { return complex(-a.re, -a.im); }
function cAbs(a) { return Math.hypot(a.re, a.im); }
function cPhaseHours(a, periodHours) {
  if (!Number.isFinite(a.re) || !Number.isFinite(a.im) || (a.re === 0 && a.im === 0)) return { positive: 0, dynamic: -periodHours / 2 };
  let angle = Math.atan2(a.im, a.re);
  if (angle < 0) angle += 2 * Math.PI;
  const positive = angle / (2 * Math.PI) * periodHours;
  return { positive, dynamic: positive - periodHours / 2 };
}
function mMul(A, B) {
  return [
    [cAdd(cMul(A[0][0], B[0][0]), cMul(A[0][1], B[1][0])), cAdd(cMul(A[0][0], B[0][1]), cMul(A[0][1], B[1][1]))],
    [cAdd(cMul(A[1][0], B[0][0]), cMul(A[1][1], B[1][0])), cAdd(cMul(A[1][0], B[0][1]), cMul(A[1][1], B[1][1]))]
  ];
}
function identity() { return [[complex(1, 0), complex(0, 0)], [complex(0, 0), complex(1, 0)]]; }

function validLayer(l) {
  return l && l.name && l.lambda > 0 && l.density > 0 && l.specificHeat > 0 && l.thickness > 0;
}

function layerMatrix(layer, periodSeconds) {
  const lambda = layer.lambda;
  const rho = layer.density;
  const c = layer.specificHeat;
  const d = layer.thickness;
  const delta = Math.sqrt(lambda * periodSeconds / (Math.PI * rho * c));
  const xi = d / delta;
  const sh = Math.sinh(xi), ch = Math.cosh(xi), si = Math.sin(xi), co = Math.cos(xi);
  const z11 = complex(ch * co, sh * si);
  const z12 = complex(-(delta / (2 * lambda)) * (sh * co + ch * si), -(delta / (2 * lambda)) * (ch * si - sh * co));
  const z21 = complex(-(lambda / delta) * (sh * co - ch * si), -(lambda / delta) * (sh * co + ch * si));
  const z22 = complex(ch * co, sh * si);
  return { matrix: [[z11, z12], [z21, z22]], delta, xi, R: d / lambda };
}

function calculate(inputState) {
  const periodSeconds = inputState.periodSeconds;
  const periodHours = periodSeconds / 3600;
  const valid = inputState.layers.filter(validLayer);
  let P = identity();
  const layerDetails = [];
  valid.forEach((l) => {
    const info = layerMatrix(l, periodSeconds);
    P = mMul(info.matrix, P);
    layerDetails.push({ ...l, R: info.R, delta: info.delta, xi: info.xi });
  });
  const p11 = P[0][0], p12 = P[0][1], p21 = P[1][0], p22 = P[1][1];
  const Rsi = inputState.rsi, Rse = inputState.rse;
  const Zee11 = cSub(p11, complex(Rse * p21.re, Rse * p21.im));
  const Zee12 = cSub(cSub(p12, complex(Rsi * p11.re, Rsi * p11.im)), complex(Rse * (p22.re - Rsi * p21.re), Rse * (p22.im - Rsi * p21.im)));
  const Zee21 = p21;
  const Zee22 = cSub(p22, complex(Rsi * p21.re, Rsi * p21.im));
  const Y11 = cDiv(cNeg(Zee11), Zee12);
  const Y22 = cDiv(cNeg(Zee22), Zee12);
  const Y12 = cDiv(complex(1, 0), Zee12);
  const chi1 = cAbs(cDiv(cSub(Zee11, complex(1, 0)), Zee12)) * periodSeconds / (2 * Math.PI) / 1000;
  const chi2 = cAbs(cDiv(cSub(Zee22, complex(1, 0)), Zee12)) * periodSeconds / (2 * Math.PI) / 1000;
  const totalR = valid.reduce((s, l) => s + l.thickness / l.lambda, 0);
  const totalThickness = valid.reduce((s, l) => s + l.thickness, 0);
  const totalHeatCapacity = valid.reduce((s, l) => s + l.thickness * l.density * l.specificHeat, 0) / 1000;
  const U0 = valid.length ? 1 / (Rsi + totalR + Rse) : NaN;
  const decrement = Number.isFinite(U0) ? cAbs(Y12) / U0 : NaN;
  return {
    validLayers: valid,
    layerDetails,
    periodHours,
    U0,
    Y11: { value: cAbs(Y11), phase: cPhaseHours(Y11, periodHours) },
    Y22: { value: cAbs(Y22), phase: cPhaseHours(Y22, periodHours) },
    Y12: { value: cAbs(Y12), phase: cPhaseHours(Y12, periodHours) },
    decrement,
    damping: Number.isFinite(decrement) && decrement !== 0 ? 1 / decrement : NaN,
    chi1,
    chi2,
    totalThickness,
    totalHeatCapacity,
    check: decrement < 1 ? 'OK' : 'Check: f ≥ 1',
    matrices: { Zee11, Zee12, Zee21, Zee22, P }
  };
}

function renderMaterialSelect() {
  const select = $('materialSelect');
  select.innerHTML = '<option value="">Select material from database…</option>' + materialDb.map((m, i) => `<option value="${i}">${m.name_en} / ${m.name_de}</option>`).join('');
}

function renderLayers() {
  const tbody = $('layersBody');
  tbody.innerHTML = '';
  for (let i = 0; i < MAX_LAYERS; i++) {
    const l = state.layers[i] || { name: '', lambda: '', density: '', specificHeat: '', thickness: '' };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><input data-row="${i}" data-field="name" value="${l.name || ''}" placeholder="Layer name"></td>
      <td><input data-row="${i}" data-field="lambda" value="${l.lambda ?? ''}" inputmode="decimal"></td>
      <td><input data-row="${i}" data-field="density" value="${l.density ?? ''}" inputmode="decimal"></td>
      <td><input data-row="${i}" data-field="specificHeat" value="${l.specificHeat ?? ''}" inputmode="decimal"></td>
      <td><input data-row="${i}" data-field="thickness" value="${l.thickness ?? ''}" inputmode="decimal"></td>
      <td class="right"><button class="small" data-action="remove" data-row="${i}">Remove</button></td>`;
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateLayerFromInput));
  tbody.querySelectorAll('button[data-action="remove"]').forEach(btn => btn.addEventListener('click', () => {
    state.layers.splice(Number(btn.dataset.row), 1);
    calculateAndRender();
  }));
}

function updateLayerFromInput(e) {
  const row = Number(e.target.dataset.row);
  const field = e.target.dataset.field;
  while (state.layers.length <= row) state.layers.push({ name: '', lambda: '', density: '', specificHeat: '', thickness: '' });
  state.layers[row][field] = field === 'name' ? e.target.value : num(e.target.value);
  calculateAndRender(false);
}

function renderResults(res) {
  const cards = $('results');
  cards.innerHTML = `
    <div class="metric"><span>U₀</span><strong>${fmt(res.U0, 4)}</strong><small>W/(m²K)</small></div>
    <div class="metric"><span>|Y₁₁| indoor admittance</span><strong>${fmt(res.Y11.value, 3)}</strong><small>W/(m²K), phase ${fmt(res.Y11.phase.positive, 2)} h</small></div>
    <div class="metric"><span>|Y₂₂| outdoor admittance</span><strong>${fmt(res.Y22.value, 3)}</strong><small>W/(m²K), phase ${fmt(res.Y22.phase.positive, 2)} h</small></div>
    <div class="metric"><span>|Y₁₂| periodic transmittance</span><strong>${fmt(res.Y12.value, 4)}</strong><small>W/(m²K), shift ${fmt(res.Y12.phase.dynamic, 2)} h</small></div>
    <div class="metric"><span>Decrement factor f</span><strong>${fmt(res.decrement, 4)}</strong><small>${res.check}</small></div>
    <div class="metric"><span>Amplitude damping 1/f</span><strong>${fmt(res.damping, 2)}</strong><small>–</small></div>
    <div class="metric"><span>χ₁ internal areal heat capacity</span><strong>${fmt(res.chi1, 2)}</strong><small>kJ/(m²K)</small></div>
    <div class="metric"><span>χ₂ external areal heat capacity</span><strong>${fmt(res.chi2, 2)}</strong><small>kJ/(m²K)</small></div>`;
  $('summaryTable').innerHTML = `
    <tr><th>Total thickness</th><td>${fmt(res.totalThickness, 3)} m</td></tr>
    <tr><th>Sum d·ρ·c</th><td>${fmt(res.totalHeatCapacity, 1)} kJ/(m²K)</td></tr>
    <tr><th>Valid layers</th><td>${res.validLayers.length}</td></tr>
    <tr><th>Calculation method</th><td>Matrix method after EN ISO 13786, 24 h default period</td></tr>`;
  $('detailsBody').innerHTML = res.layerDetails.map((l, idx) => `
    <tr><td>${idx + 1}</td><td>${l.name}</td><td>${fmtFlex(l.R, 4)}</td><td>${fmtFlex(l.delta, 4)}</td><td>${fmtFlex(l.xi, 4)}</td></tr>`).join('');
}

function calculateAndRender(redrawLayers = true) {
  state.projectName = $('projectName')?.value || state.projectName;
  state.periodSeconds = num($('periodSeconds')?.value) || 86400;
  state.rsi = num($('rsi')?.value); if (!Number.isFinite(state.rsi)) state.rsi = 0.13;
  state.rse = num($('rse')?.value); if (!Number.isFinite(state.rse)) state.rse = 0.04;
  if (redrawLayers) renderLayers();
  const res = calculate(state);
  renderResults(res);
  saveLocal();
}

function loadStateToInputs() {
  $('projectName').value = state.projectName || '';
  $('periodSeconds').value = state.periodSeconds;
  $('rsi').value = state.rsi;
  $('rse').value = state.rse;
  renderLayers();
  calculateAndRender(false);
}

function addSelectedMaterial() {
  const idx = Number($('materialSelect').value);
  if (!Number.isInteger(idx) || !materialDb[idx]) return;
  const m = materialDb[idx];
  state.layers.push({ name: m.name_en, lambda: m.lambda, density: m.density, specificHeat: m.specificHeat, thickness: m.defaultThickness || 0.1 });
  state.layers = state.layers.filter(l => l && (l.name || l.lambda || l.thickness)).slice(0, MAX_LAYERS);
  calculateAndRender();
}

function clearLayers() {
  state.layers = [];
  calculateAndRender();
}

function loadExample(type) {
  if (type === 'd1') {
    state = { periodSeconds: 86400, rsi: 0.13, rse: 0.04, projectName: 'Calibration D.1 concrete wall', layers: [{ name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 }] };
  } else if (type === 'd2') {
    state = { periodSeconds: 86400, rsi: 0.13, rse: 0.04, projectName: 'Calibration D.2 multilayer construction', layers: [
      { name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 },
      { name: 'Thermal insulation layer', lambda: 0.04, density: 30, specificHeat: 1400, thickness: 0.1 },
      { name: 'Render', lambda: 1.0, density: 1200, specificHeat: 1500, thickness: 0.005 }
    ] };
  } else {
    state = structuredClone(DEFAULT_STATE);
  }
  loadStateToInputs();
}

function saveConstruction() {
  const res = calculate(state);
  const saved = JSON.parse(localStorage.getItem('stw_constructions') || '[]');
  saved.push({
    id: crypto.randomUUID(), date: new Date().toISOString(), name: state.projectName || 'Unnamed construction', state: structuredClone(state), results: {
      U0: res.U0, Y12: res.Y12.value, shift: res.Y12.phase.dynamic, f: res.decrement, damping: res.damping, chi1: res.chi1, chi2: res.chi2, thickness: res.totalThickness
    }
  });
  localStorage.setItem('stw_constructions', JSON.stringify(saved));
  renderComparison();
}

function renderComparison() {
  const saved = JSON.parse(localStorage.getItem('stw_constructions') || '[]');
  $('comparisonBody').innerHTML = saved.map(x => `<tr>
    <td>${x.name}</td><td>${new Date(x.date).toLocaleDateString('de-DE')}</td><td>${fmt(x.results.U0, 4)}</td><td>${fmt(x.results.Y12, 4)}</td><td>${fmt(x.results.shift, 2)}</td><td>${fmt(x.results.f, 4)}</td><td>${fmt(x.results.damping, 2)}</td><td>${fmt(x.results.chi1, 1)}</td><td>${fmt(x.results.chi2, 1)}</td><td><button class="small" data-load="${x.id}">Load</button> <button class="small danger" data-del="${x.id}">Delete</button></td>
  </tr>`).join('');
  $('comparisonBody').querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => {
    const item = saved.find(x => x.id === b.dataset.load); if (item) { state = item.state; loadStateToInputs(); }
  }));
  $('comparisonBody').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    localStorage.setItem('stw_constructions', JSON.stringify(saved.filter(x => x.id !== b.dataset.del))); renderComparison();
  }));
}

function saveLocal() { localStorage.setItem('stw_current', JSON.stringify(state)); }
function loadLocal() {
  const local = localStorage.getItem('stw_current');
  if (local) { try { state = JSON.parse(local); } catch { state = structuredClone(DEFAULT_STATE); } }
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ state, saved: JSON.parse(localStorage.getItem('stw_constructions') || '[]') }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'summer-thermal-tool-data.json'; a.click(); URL.revokeObjectURL(a.href);
}
function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    if (data.state) state = data.state;
    if (data.saved) localStorage.setItem('stw_constructions', JSON.stringify(data.saved));
    loadStateToInputs(); renderComparison();
  };
  reader.readAsText(file);
}
function exportMaterials() {
  const blob = new Blob([JSON.stringify({ meta: { exported: new Date().toISOString() }, materials: materialDb }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'materials.json'; a.click(); URL.revokeObjectURL(a.href);
}
function importMaterials(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    materialDb = data.materials || data;
    renderMaterialSelect();
  };
  reader.readAsText(file);
}

function bind() {
  ['projectName', 'periodSeconds', 'rsi', 'rse'].forEach(id => $(id).addEventListener('input', () => calculateAndRender(false)));
  $('addMaterial').addEventListener('click', addSelectedMaterial);
  $('clearLayers').addEventListener('click', clearLayers);
  $('loadDefault').addEventListener('click', () => loadExample('default'));
  $('loadD1').addEventListener('click', () => loadExample('d1'));
  $('loadD2').addEventListener('click', () => loadExample('d2'));
  $('saveConstruction').addEventListener('click', saveConstruction);
  $('clearComparison').addEventListener('click', () => { localStorage.removeItem('stw_constructions'); renderComparison(); });
  $('exportJson').addEventListener('click', exportJson);
  $('importJson').addEventListener('change', e => importJson(e.target.files[0]));
  $('exportMaterials').addEventListener('click', exportMaterials);
  $('importMaterials').addEventListener('change', e => importMaterials(e.target.files[0]));
  $('printPage').addEventListener('click', () => window.print());
}

async function init() {
  bind();
  try {
    const r = await fetch('materials.json');
    const db = await r.json();
    materialDb = db.materials || [];
  } catch {
    materialDb = [];
  }
  renderMaterialSelect();
  loadLocal();
  loadStateToInputs();
  renderComparison();
}

document.addEventListener('DOMContentLoaded', init);

// Expose for simple browser-console verification.
window.STW = { calculate, loadExampleState: (kind) => kind === 'd1' ? { periodSeconds: 86400, rsi: 0.13, rse: 0.04, layers: [{ name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 }] } : structuredClone(DEFAULT_STATE) };
