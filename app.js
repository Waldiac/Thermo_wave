'use strict';

const MAX_LAYERS = 18;
const DEFAULT_STATE = {
  periodSeconds: 86400,
  rsi: 0.13,
  rse: 0.04,
  projectName: 'Construction A',
  layers: [
    { name: 'Interior plaster', lambda: 0.70, density: 1400, specificHeat: 1000, thickness: 0.010 },
    { name: 'Autoclaved aerated concrete 500', lambda: 0.10, density: 500, specificHeat: 1000, thickness: 0.175 },
    { name: 'Mineral insulation board', lambda: 0.045, density: 100, specificHeat: 1000, thickness: 0.120 },
    { name: 'External render', lambda: 0.21, density: 800, specificHeat: 1000, thickness: 0.020 }
  ]
};

let materialDb = [];
let state = structuredClone(DEFAULT_STATE);
let editLayerIndex = null;

const $ = (id) => document.getElementById(id);
const num = (v) => {
  if (v === null || v === undefined || v === '') return NaN;
  return Number(String(v).trim().replace(',', '.'));
};
const fmt = (v, d = 3) => Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d, useGrouping: false }) : '–';
const fmtFlex = (v, d = 4) => Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: d, useGrouping: false }) : '–';
const esc = (s) => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

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
  select.innerHTML = '<option value="">Select material from database…</option>' + materialDb.map((m, i) => `<option value="${i}">${esc(m.name_en)} / ${esc(m.name_de)}</option>`).join('');
}

function layerFromEditor() {
  return {
    name: $('layerName').value.trim(),
    lambda: num($('layerLambda').value),
    density: num($('layerDensity').value),
    specificHeat: num($('layerHeat').value),
    thickness: num($('layerThickness').value)
  };
}
function fillLayerEditor(layer = {}) {
  $('layerName').value = layer.name || '';
  $('layerLambda').value = Number.isFinite(layer.lambda) ? fmtFlex(layer.lambda, 4) : '';
  $('layerDensity').value = Number.isFinite(layer.density) ? fmtFlex(layer.density, 1) : '';
  $('layerHeat').value = Number.isFinite(layer.specificHeat) ? fmtFlex(layer.specificHeat, 1) : '';
  $('layerThickness').value = Number.isFinite(layer.thickness) ? fmtFlex(layer.thickness, 4) : '';
}
function clearLayerEditor() {
  editLayerIndex = null;
  fillLayerEditor({});
  $('addLayer').disabled = false;
  $('updateLayer').disabled = true;
  $('cancelLayerEdit').disabled = true;
}

function saveMaterialsLocal() {
  localStorage.setItem('stw_materials', JSON.stringify(materialDb));
}
function loadMaterialsLocal() {
  const local = localStorage.getItem('stw_materials');
  if (!local) return false;
  try {
    const parsed = JSON.parse(local);
    if (Array.isArray(parsed)) { materialDb = parsed; return true; }
  } catch {}
  return false;
}
function saveCurrentEditorAsMaterial() {
  const layer = layerFromEditor();
  if (!validateEditorLayer(layer)) return;
  const id = layer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || crypto.randomUUID();
  const material = {
    id,
    name_en: layer.name,
    name_de: layer.name,
    lambda: layer.lambda,
    density: layer.density,
    specificHeat: layer.specificHeat,
    defaultThickness: layer.thickness,
    category: 'User materials'
  };
  const existingIdx = materialDb.findIndex(m => (m.name_en || '').toLowerCase() === layer.name.toLowerCase() || m.id === id);
  if (existingIdx >= 0) materialDb[existingIdx] = { ...materialDb[existingIdx], ...material };
  else materialDb.push(material);
  saveMaterialsLocal();
  renderMaterialSelect();
  alert('Material saved locally in the browser database. Export materials JSON if you want to reuse or publish the updated database.');
}

function validateEditorLayer(layer) {
  if (!validLayer(layer)) {
    alert('Please enter a layer name and positive values for λ, ρ, c and d.');
    return false;
  }
  return true;
}
function addLayerFromEditor() {
  if (state.layers.length >= MAX_LAYERS) { alert(`Maximum ${MAX_LAYERS} layers.`); return; }
  const layer = layerFromEditor();
  if (!validateEditorLayer(layer)) return;
  state.layers.push(layer);
  clearLayerEditor();
  calculateAndRender();
}
function editLayer(index) {
  const layer = state.layers[index];
  if (!layer) return;
  editLayerIndex = index;
  fillLayerEditor(layer);
  $('addLayer').disabled = true;
  $('updateLayer').disabled = false;
  $('cancelLayerEdit').disabled = false;
  $('layerName').focus();
}
function updateLayerFromEditor() {
  if (editLayerIndex === null) return;
  const layer = layerFromEditor();
  if (!validateEditorLayer(layer)) return;
  state.layers[editLayerIndex] = layer;
  clearLayerEditor();
  calculateAndRender();
}
function useSelectedMaterial() {
  const idx = Number($('materialSelect').value);
  if (!Number.isInteger(idx) || !materialDb[idx]) return;
  const m = materialDb[idx];
  fillLayerEditor({ name: m.name_en, lambda: m.lambda, density: m.density, specificHeat: m.specificHeat, thickness: m.defaultThickness || 0.1 });
}

function renderLayers() {
  const tbody = $('layersBody');
  const valid = state.layers.filter(l => l && (l.name || l.lambda || l.thickness));
  state.layers = valid.slice(0, MAX_LAYERS);
  if (!state.layers.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty">No layers added yet. Start with the inner layer.</td></tr>';
    return;
  }
  tbody.innerHTML = state.layers.map((l, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(l.name)}</td>
      <td>${fmtFlex(l.lambda, 4)}</td>
      <td>${fmtFlex(l.density, 1)}</td>
      <td>${fmtFlex(l.specificHeat, 1)}</td>
      <td>${fmtFlex(l.thickness, 4)}</td>
      <td><button class="small" data-edit="${i}">Edit</button> <button class="small danger" data-remove="${i}">Remove</button></td>
    </tr>`).join('');
  tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editLayer(Number(btn.dataset.edit))));
  tbody.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    state.layers.splice(Number(btn.dataset.remove), 1);
    if (editLayerIndex !== null) clearLayerEditor();
    calculateAndRender();
  }));
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
    <tr><td>${idx + 1}</td><td>${esc(l.name)}</td><td>${fmtFlex(l.R, 4)}</td><td>${fmtFlex(l.delta, 4)}</td><td>${fmtFlex(l.xi, 4)}</td></tr>`).join('');
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
  $('periodSeconds').value = fmtFlex(state.periodSeconds, 0);
  $('rsi').value = fmtFlex(state.rsi, 3);
  $('rse').value = fmtFlex(state.rse, 3);
  clearLayerEditor();
  renderLayers();
  calculateAndRender(false);
}

function clearLayers() {
  state.layers = [];
  clearLayerEditor();
  calculateAndRender();
}


function nextConstructionName() {
  const saved = JSON.parse(localStorage.getItem('stw_constructions') || '[]');
  const letter = String.fromCharCode(65 + Math.min(saved.length, 25));
  return `Construction ${letter}`;
}
function newConstruction() {
  state = { periodSeconds: 86400, rsi: 0.13, rse: 0.04, projectName: nextConstructionName(), layers: [] };
  loadStateToInputs();
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

function qualitativeAssessment(results, best) {
  const tags = [];
  if (results.f === best.minF) tags.push('best damping');
  if (results.shift === best.maxShift) tags.push('largest time shift');
  if (results.chi1 === best.maxChi1) tags.push('highest internal heat capacity');
  if (!tags.length && Number.isFinite(results.f)) tags.push(results.f < 0.15 ? 'good damping' : results.f < 0.35 ? 'moderate damping' : 'weak damping');
  return tags.join(', ');
}
function constructionLabel(index) {
  return String.fromCharCode(65 + (index % 26));
}
function renderComparisonInterpretation(saved, best) {
  const box = $('comparisonInterpretation');
  if (!saved.length) { box.innerHTML = ''; return; }
  if (saved.length === 1) {
    box.innerHTML = '<strong>Interpretation:</strong> Save at least two constructions for a comparative assessment of the less common dynamic values.';
    return;
  }
  const by = (key, val) => saved.find(x => x.results[key] === val)?.name || '–';
  box.innerHTML = `
    <strong>Comparative interpretation of less common values:</strong>
    <ul>
      <li><strong>f</strong> is the decrement factor. The lower value is better for summer damping. Best: <strong>${esc(by('f', best.minF))}</strong> (${fmt(best.minF, 4)}).</li>
      <li><strong>1/f</strong> is the amplitude damping. The higher value means stronger reduction of the external temperature wave. Best: <strong>${esc(by('damping', best.maxDamping))}</strong> (${fmt(best.maxDamping, 2)}).</li>
      <li><strong>Shift h</strong> describes the delay of the periodic heat flow. Larger positive values are usually favourable because the peak load is shifted into later hours. Largest: <strong>${esc(by('shift', best.maxShift))}</strong> (${fmt(best.maxShift, 2)} h).</li>
      <li><strong>χ₁</strong> is the internal areal heat capacity relevant for the room side. A higher value supports thermal buffering on the inside. Highest: <strong>${esc(by('chi1', best.maxChi1))}</strong> (${fmt(best.maxChi1, 1)} kJ/(m²K)).</li>
      <li><strong>χ₂</strong> is the external-side areal heat capacity. It is useful for understanding whether storage mass is mainly located outside or inside the insulation layer.</li>
    </ul>`;
}
function finiteValues(saved, key) { return saved.map(x => x.results[key]).filter(Number.isFinite); }
function comparisonBest(saved) {
  const getMin = (k) => Math.min(...finiteValues(saved, k));
  const getMax = (k) => Math.max(...finiteValues(saved, k));
  return { minF: getMin('f'), maxDamping: getMax('damping'), maxShift: getMax('shift'), maxChi1: getMax('chi1') };
}

function saveConstruction() {
  const res = calculate(state);
  const saved = JSON.parse(localStorage.getItem('stw_constructions') || '[]');
  const existingIdx = saved.findIndex(x => x.name === (state.projectName || 'Unnamed construction'));
  const item = {
    id: existingIdx >= 0 ? saved[existingIdx].id : crypto.randomUUID(),
    date: new Date().toISOString(),
    name: state.projectName || 'Unnamed construction',
    state: structuredClone(state),
    results: { U0: res.U0, Y12: res.Y12.value, shift: res.Y12.phase.dynamic, f: res.decrement, damping: res.damping, chi1: res.chi1, chi2: res.chi2, thickness: res.totalThickness }
  };
  if (existingIdx >= 0) saved[existingIdx] = item; else saved.push(item);
  localStorage.setItem('stw_constructions', JSON.stringify(saved));
  renderComparison();
}

function renderComparison() {
  const saved = JSON.parse(localStorage.getItem('stw_constructions') || '[]');
  const best = saved.length ? comparisonBest(saved) : {};
  $('comparisonBody').innerHTML = saved.map((x, i) => `<tr>
    <td><strong>${constructionLabel(i)}</strong></td><td>${esc(x.name)}</td><td>${new Date(x.date).toLocaleDateString('en-US')}</td><td>${fmt(x.results.U0, 4)}</td><td>${fmt(x.results.Y12, 4)}</td><td>${fmt(x.results.shift, 2)}</td><td>${fmt(x.results.f, 4)}</td><td>${fmt(x.results.damping, 2)}</td><td>${fmt(x.results.chi1, 1)}</td><td>${fmt(x.results.chi2, 1)}</td><td>${esc(qualitativeAssessment(x.results, best))}</td><td><button class="small" data-load="${x.id}">Load</button> <button class="small danger" data-del="${x.id}">Delete</button></td>
  </tr>`).join('');
  $('comparisonBody').querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => {
    const item = saved.find(x => x.id === b.dataset.load); if (item) { state = item.state; loadStateToInputs(); }
  }));
  $('comparisonBody').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    localStorage.setItem('stw_constructions', JSON.stringify(saved.filter(x => x.id !== b.dataset.del))); renderComparison();
  }));
  renderComparisonInterpretation(saved, best);
}

function bestBy(saved, key, mode='min') {
  let best = null;
  saved.forEach((x, i) => {
    const value = x.results[key];
    if (!Number.isFinite(value)) return;
    if (!best || (mode === 'min' ? value < best.value : value > best.value)) best = { item: x, index: i, value };
  });
  return best;
}
function compareSentence(best, keyLabel, explanation, unit='', decimals=3) {
  if (!best) return '';
  return `<li><strong>Construction ${constructionLabel(best.index)} (${esc(best.item.name)})</strong> has the ${keyLabel}: ${fmt(best.value, decimals)}${unit}. ${explanation}</li>`;
}
function generateComparativeReport() {
  const saved = JSON.parse(localStorage.getItem('stw_constructions') || '[]');
  const box = $('reportBox');
  if (!saved.length) { box.innerHTML = '<strong>Report:</strong> No saved constructions available.'; return; }
  if (saved.length === 1) { box.innerHTML = '<strong>Report:</strong> Save at least two constructions to generate a comparative assessment.'; return; }
  const minF = bestBy(saved, 'f', 'min');
  const maxDamping = bestBy(saved, 'damping', 'max');
  const maxShift = bestBy(saved, 'shift', 'max');
  const minY12 = bestBy(saved, 'Y12', 'min');
  const maxChi1 = bestBy(saved, 'chi1', 'max');
  const minU0 = bestBy(saved, 'U0', 'min');
  const rows = saved.map((x, i) => `Construction ${constructionLabel(i)} = ${esc(x.name)}`).join('; ');
  box.innerHTML = `
    <h3>Comparative report according to EN ISO 13786</h3>
    <p>${rows}.</p>
    <ul>
      ${compareSentence(minF, 'lowest decrement factor f', 'This indicates the strongest reduction of the periodic external temperature influence and is favourable for summer behaviour.', '', 4)}
      ${compareSentence(maxDamping, 'highest amplitude damping 1/f', 'This is the same effect expressed inversely: the higher this value, the more strongly the temperature wave is attenuated.', '', 2)}
      ${compareSentence(minY12, 'lowest periodic thermal transmittance |Y₁₂|', 'A lower value means less periodic heat flow reaches the room side under dynamic excitation.', ' W/(m²K)', 4)}
      ${compareSentence(maxShift, 'largest time shift', 'A larger positive shift can move the thermal peak into later hours and can reduce daytime overheating risk, depending on ventilation and solar gains.', ' h', 2)}
      ${compareSentence(maxChi1, 'highest internal areal heat capacity χ₁', 'This construction offers the strongest room-side thermal buffering among the selected options.', ' kJ/(m²K)', 1)}
      ${compareSentence(minU0, 'lowest steady-state U₀ value', 'This is favourable for steady-state heat transfer, but it is not identical with good dynamic summer performance.', ' W/(m²K)', 4)}
    </ul>
    <p><strong>Note:</strong> f, 1/f, |Y₁₂|, shift and χ₁ describe dynamic behaviour. For summer comfort they should be interpreted together with solar gains, ventilation strategy, internal loads and the national summer thermal protection method.</p>`;
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
    saveMaterialsLocal();
    renderMaterialSelect();
  };
  reader.readAsText(file);
}

function bind() {
  ['projectName', 'periodSeconds', 'rsi', 'rse'].forEach(id => $(id).addEventListener('input', () => calculateAndRender(false)));
  $('useMaterial').addEventListener('click', useSelectedMaterial);
  $('addLayer').addEventListener('click', addLayerFromEditor);
  $('updateLayer').addEventListener('click', updateLayerFromEditor);
  $('cancelLayerEdit').addEventListener('click', clearLayerEditor);
  $('saveMaterial').addEventListener('click', saveCurrentEditorAsMaterial);
  $('clearLayers').addEventListener('click', clearLayers);
  $('loadDefault').addEventListener('click', () => loadExample('default'));
  $('loadD1').addEventListener('click', () => loadExample('d1'));
  $('loadD2').addEventListener('click', () => loadExample('d2'));
  $('saveConstruction').addEventListener('click', saveConstruction);
  $('newConstruction').addEventListener('click', newConstruction);
  $('generateReport').addEventListener('click', generateComparativeReport);
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
  loadMaterialsLocal();
  renderMaterialSelect();
  loadLocal();
  loadStateToInputs();
  renderComparison();
}

document.addEventListener('DOMContentLoaded', init);

// Expose for simple browser-console verification.
window.STW = { calculate, loadExampleState: (kind) => kind === 'd1' ? { periodSeconds: 86400, rsi: 0.13, rse: 0.04, layers: [{ name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 }] } : structuredClone(DEFAULT_STATE) };
