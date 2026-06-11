'use strict';

const MAX_LAYERS = 18;
const TOOL_VERSION = '2.4';
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
  const dynamic = positive - periodHours / 2;
  return { positive, dynamic, delay: Math.abs(dynamic) };
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

function currentPlainExplanation(res) {
  const outdoorAmplitude = 12; // Example: daily mean 24 °C, afternoon peak 36 °C.
  const quasiSteady = res.U0 * outdoorAmplitude;
  const dynamicHeatFlow = res.Y12.value * outdoorAmplitude;
  const reductionPct = Number.isFinite(res.decrement) ? (1 - res.decrement) * 100 : NaN;
  const storage1K = res.chi1;
  const storage10m2_2K = res.chi1 * 10 * 2 / 3600;
  return `
    <strong>Plain-language reading:</strong>
    <p>If the outdoor temperature wave has an amplitude of <strong>12 K</strong> — for example daily mean 24 °C and afternoon peak 36 °C — the steady-state heat-flow amplitude would be about <strong>${fmt(quasiSteady, 1)} W/m²</strong>. With the dynamic EN ISO 13786 calculation, the periodic part reaching the room side is about <strong>${fmt(dynamicHeatFlow, 1)} W/m²</strong>.</p>
    <p>The decrement factor <strong>f = ${fmt(res.decrement, 3)}</strong> means: only about <strong>${fmt(res.decrement * 100, 0)}%</strong> of the quasi-steady temperature-wave effect remains; roughly <strong>${fmt(reductionPct, 0)}%</strong> is damped by the construction. The EN phase shift is <strong>${fmt(res.Y12.phase.dynamic, 1)} h</strong>. For practical reading, use the absolute delay: the heat-flow peak appears roughly <strong>${fmt(res.Y12.phase.delay, 1)} h</strong> after the outdoor heat-wave reference peak. The sign is only a phase convention.</p>
    <p>The internal areal heat capacity <strong>χ₁ = ${fmt(res.chi1, 1)} kJ/(m²K)</strong> can be read as the room-side thermal buffer. A 10 m² inner surface with a 2 K room-side temperature swing can dynamically take up roughly <strong>${fmt(storage10m2_2K, 2)} kWh</strong> in this simplified interpretation.</p>`;
}

function renderResults(res) {
  const cards = $('results');
  cards.innerHTML = `
    <div class="metric"><span>U₀</span><strong>${fmt(res.U0, 4)}</strong><small>W/(m²K)</small></div>
    <div class="metric"><span>|Y₁₁| indoor admittance</span><strong>${fmt(res.Y11.value, 3)}</strong><small>W/(m²K), phase ${fmt(res.Y11.phase.positive, 2)} h</small></div>
    <div class="metric"><span>|Y₂₂| outdoor admittance</span><strong>${fmt(res.Y22.value, 3)}</strong><small>W/(m²K), phase ${fmt(res.Y22.phase.positive, 2)} h</small></div>
    <div class="metric"><span>|Y₁₂| periodic transmittance</span><strong>${fmt(res.Y12.value, 4)}</strong><small>W/(m²K), EN shift ${fmt(res.Y12.phase.dynamic, 2)} h · practical delay ${fmt(res.Y12.phase.delay, 2)} h</small></div>
    <div class="metric"><span>Decrement factor f</span><strong>${fmt(res.decrement, 4)}</strong><small>${res.check}</small></div>
    <div class="metric"><span>Amplitude damping 1/f</span><strong>${fmt(res.damping, 2)}</strong><small>–</small></div>
    <div class="metric"><span>χ₁ internal areal heat capacity</span><strong>${fmt(res.chi1, 2)}</strong><small>kJ/(m²K)</small></div>
    <div class="metric"><span>χ₂ external areal heat capacity</span><strong>${fmt(res.chi2, 2)}</strong><small>kJ/(m²K)</small></div>`;
  $('summaryTable').innerHTML = `
    <tr><th>Total thickness</th><td>${fmt(res.totalThickness, 3)} m</td></tr>
    <tr><th>Sum d·ρ·c</th><td>${fmt(res.totalHeatCapacity, 1)} kJ/(m²K)</td></tr>
    <tr><th>Valid layers</th><td>${res.validLayers.length}</td></tr>
    <tr><th>Calculation method</th><td>Matrix method according to EN ISO 13786, 24 h default period</td></tr>`;
  $('plainExplanation').innerHTML = currentPlainExplanation(res);
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

function getSavedLibrary() {
  // Migration: old versions used stw_constructions as both library and comparison.
  const lib = localStorage.getItem('stw_library');
  if (lib) { try { return (JSON.parse(lib) || []).map(ensureDelay); } catch { return []; } }
  const old = localStorage.getItem('stw_constructions');
  if (old) {
    try {
      const parsed = JSON.parse(old);
      if (Array.isArray(parsed)) {
        localStorage.setItem('stw_library', JSON.stringify(parsed));
        return parsed.map(ensureDelay);
      }
    } catch {}
  }
  return [];
}
function setSavedLibrary(list) {
  localStorage.setItem('stw_library', JSON.stringify(list));
  renderSavedConstructionSelect();
}
function ensureDelay(x) {
  if (x && x.results && !Number.isFinite(x.results.delay)) x.results.delay = Math.abs(x.results.shift);
  return x;
}
function getComparisonSet() {
  try { return (JSON.parse(localStorage.getItem('stw_comparison') || '[]') || []).map(ensureDelay); } catch { return []; }
}
function setComparisonSet(list) {
  localStorage.setItem('stw_comparison', JSON.stringify(list));
}
function makeConstructionItem() {
  const res = calculate(state);
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    name: state.projectName || 'Unnamed construction',
    state: structuredClone(state),
    results: { U0: res.U0, Y12: res.Y12.value, shift: res.Y12.phase.dynamic, delay: res.Y12.phase.delay, f: res.decrement, damping: res.damping, chi1: res.chi1, chi2: res.chi2, thickness: res.totalThickness, heatCapacity: res.totalHeatCapacity }
  };
}
function renderSavedConstructionSelect() {
  const select = $('savedConstructionSelect');
  if (!select) return;
  const lib = getSavedLibrary();
  if (!lib.length) {
    select.innerHTML = '<option value="">No saved constructions yet</option>';
    return;
  }
  select.innerHTML = '<option value="">Select saved construction…</option>' + lib.map((x) => `<option value="${esc(x.id)}">${esc(x.name)} · ${new Date(x.date).toLocaleDateString('en-US')}</option>`).join('');
}
function saveCurrentConstructionToLibrary(silent = false) {
  const res = calculate(state);
  if (!res.validLayers.length) { alert('Please add at least one valid layer before saving the construction.'); return null; }
  const lib = getSavedLibrary();
  const name = state.projectName || 'Unnamed construction';
  const existingIdx = lib.findIndex(x => x.name === name);
  const item = makeConstructionItem();
  if (existingIdx >= 0) {
    item.id = lib[existingIdx].id;
    lib[existingIdx] = item;
  } else {
    lib.push(item);
  }
  setSavedLibrary(lib);
  if (!silent) alert(`Construction "${name}" saved locally.`);
  return item;
}
function loadSavedConstructionById(id) {
  const item = getSavedLibrary().find(x => x.id === id);
  if (!item) return;
  state = structuredClone(item.state);
  loadStateToInputs();
}
function deleteSavedConstructionById(id) {
  if (!id) return;
  const lib = getSavedLibrary();
  const item = lib.find(x => x.id === id);
  if (!item) return;
  if (!confirm(`Delete saved construction "${item.name}" from the local library?`)) return;
  setSavedLibrary(lib.filter(x => x.id !== id));
}
function addCurrentToComparison() {
  const res = calculate(state);
  if (!res.validLayers.length) { alert('Please add at least one valid layer before adding the construction to the comparison.'); return; }
  const item = saveCurrentConstructionToLibrary(true);
  if (!item) return;
  const comp = getComparisonSet();
  const existingIdx = comp.findIndex(x => x.name === item.name);
  if (existingIdx >= 0) comp[existingIdx] = item;
  else {
    if (comp.length >= 10) { alert('The comparison is limited to 10 constructions. Delete one comparison item before adding another.'); return; }
    comp.push(item);
  }
  setComparisonSet(comp);
  renderComparison();
}


function nextConstructionName() {
  const saved = getComparisonSet();
  const letter = String.fromCharCode(65 + Math.min(saved.length, 9));
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
  if (results.delay === best.maxDelay) tags.push('largest practical delay');
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
    box.innerHTML = '<strong>Interpretation:</strong> Add at least two constructions for a real comparison. The report then translates f, 1/f, shift and χ₁ into plain language.';
    return;
  }
  const by = (key, val) => saved.find(x => x.results[key] === val)?.name || '–';
  box.innerHTML = `
    <strong>Quick comparison:</strong>
    <ul>
      <li><strong>Best summer damping:</strong> ${esc(by('f', best.minF))} has the lowest decrement factor f (${fmt(best.minF, 4)}). Lower f means less of the outdoor heat wave reaches the room side.</li>
      <li><strong>Strongest amplitude reduction:</strong> ${esc(by('damping', best.maxDamping))} has the highest 1/f (${fmt(best.maxDamping, 2)}). This is an intuitive “damping multiplier”.</li>
      <li><strong>Latest practical heat-wave arrival:</strong> ${esc(by('delay', best.maxDelay))} has the largest practical delay (${fmt(best.maxDelay, 2)} h). This can move the peak from afternoon into evening/night, depending on the construction. The signed EN shift is kept in the table as a phase convention.</li>
      <li><strong>Best room-side buffer:</strong> ${esc(by('chi1', best.maxChi1))} has the highest χ₁ (${fmt(best.maxChi1, 1)} kJ/(m²K)). This means the inner surface can absorb more short-term heat before the room temperature rises.</li>
    </ul>`;
}

function finiteValues(saved, key) { return saved.map(x => x.results[key]).filter(Number.isFinite); }
function comparisonBest(saved) {
  const getMin = (k) => Math.min(...finiteValues(saved, k));
  const getMax = (k) => Math.max(...finiteValues(saved, k));
  return { minF: getMin('f'), maxDamping: getMax('damping'), maxShift: getMax('shift'), maxDelay: getMax('delay'), maxChi1: getMax('chi1') };
}


function saveConstruction() {
  // Backward-compatible alias used by older buttons/files.
  addCurrentToComparison();
}


function renderComparison() {
  const saved = getComparisonSet();
  const best = saved.length ? comparisonBest(saved) : {};
  $('comparisonBody').innerHTML = saved.length ? saved.map((x, i) => `<tr>
    <td><strong>${constructionLabel(i)}</strong></td><td>${esc(x.name)}</td><td>${new Date(x.date).toLocaleDateString('en-US')}</td><td>${fmt(x.results.U0, 4)}</td><td>${fmt(x.results.Y12, 4)}</td><td>${fmt(x.results.shift, 2)}</td><td>${fmt(x.results.delay, 2)}</td><td>${fmt(x.results.f, 4)}</td><td>${fmt(x.results.damping, 2)}</td><td>${fmt(x.results.chi1, 1)}</td><td>${fmt(x.results.chi2, 1)}</td><td>${esc(qualitativeAssessment(x.results, best))}</td><td><button class="small" data-load="${x.id}">Load</button> <button class="small danger" data-del="${x.id}">Remove</button></td>
  </tr>`).join('') : '<tr><td colspan="13" class="empty">No constructions in the comparison yet. Save or load a construction and click “Add/update in comparison”.</td></tr>';
  $('comparisonBody').querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => {
    const item = saved.find(x => x.id === b.dataset.load); if (item) { state = structuredClone(item.state); loadStateToInputs(); }
  }));
  $('comparisonBody').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    setComparisonSet(saved.filter(x => x.id !== b.dataset.del)); renderComparison();
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
function plainRankList(saved) {
  return saved.map((x, i) => {
    const amp = 12;
    const qDyn = x.results.Y12 * amp;
    const storage = x.results.chi1 * 10 * 2 / 3600;
    return `<tr><td><strong>${constructionLabel(i)}</strong></td><td>${esc(x.name)}</td><td>${fmt(qDyn, 1)} W/m²</td><td>${fmt(x.results.f * 100, 0)}%</td><td>${fmt(x.results.shift, 1)} h / ${fmt(x.results.delay, 1)} h delay</td><td>${fmt(storage, 2)} kWh</td></tr>`;
  }).join('');
}
function summerScore(saved) {
  const vals = (k) => saved.map(x => x.results[k]).filter(Number.isFinite);
  const min = (a) => Math.min(...a), max = (a) => Math.max(...a);
  const ranges = { f: vals('f'), Y12: vals('Y12'), delay: vals('delay'), chi1: vals('chi1') };
  const normLow = (v, arr) => max(arr) === min(arr) ? 0.5 : (max(arr) - v) / (max(arr) - min(arr));
  const normHigh = (v, arr) => max(arr) === min(arr) ? 0.5 : (v - min(arr)) / (max(arr) - min(arr));
  return saved.map((x, i) => ({
    index: i,
    item: x,
    score: 0.35 * normLow(x.results.f, ranges.f) + 0.25 * normLow(x.results.Y12, ranges.Y12) + 0.20 * normHigh(x.results.delay, ranges.delay) + 0.20 * normHigh(x.results.chi1, ranges.chi1)
  })).sort((a, b) => b.score - a.score);
}
function generateComparativeReport() {
  const saved = getComparisonSet();
  const box = $('reportBox');
  if (!saved.length) { box.innerHTML = '<strong>Report:</strong> No comparison constructions available.'; return; }
  if (saved.length === 1) { box.innerHTML = '<strong>Report:</strong> Add at least two constructions to generate a comparative assessment.'; return; }
  const minF = bestBy(saved, 'f', 'min');
  const maxDamping = bestBy(saved, 'damping', 'max');
  const maxShift = bestBy(saved, 'shift', 'max');
  const maxDelay = bestBy(saved, 'delay', 'max');
  const minY12 = bestBy(saved, 'Y12', 'min');
  const maxChi1 = bestBy(saved, 'chi1', 'max');
  const minU0 = bestBy(saved, 'U0', 'min');
  const ranking = summerScore(saved);
  const rows = saved.map((x, i) => `Construction ${constructionLabel(i)} = ${esc(x.name)}`).join('; ');
  box.innerHTML = `
    <h3>Comparative report according to EN ISO 13786</h3>
    <p>${rows}.</p>
    <h4>Plain-language example: outdoor peak 36 °C</h4>
    <p>Assumption for interpretation only: daily mean outdoor temperature 24 °C and afternoon peak 36 °C. This corresponds to an outdoor temperature amplitude of 12 K. The table below estimates what this periodic heat wave means for each construction.</p><p><strong>Note on the sign of the time shift:</strong> EN ISO 13786 uses a phase-angle convention. Therefore the signed value can be negative. For everyday interpretation, the table also gives the practical delay as an absolute number of hours.</p>
    <table class="mini-report"><thead><tr><th>ID</th><th>Construction</th><th>Dynamic heat-flow amplitude at 12 K</th><th>Remaining heat-wave effect f</th><th>Peak shift</th><th>Room-side buffer: 10 m², 2 K</th></tr></thead><tbody>${plainRankList(saved)}</tbody></table>
    <h4>Technical comparison</h4>
    <ul>
      ${compareSentence(minF, 'lowest decrement factor f', 'This is usually the most direct indicator for summer damping: less of the outdoor temperature wave remains.', '', 4)}
      ${compareSentence(maxDamping, 'highest amplitude damping 1/f', 'This says the same thing in a more intuitive way: higher means stronger damping.', '', 2)}
      ${compareSentence(minY12, 'lowest periodic thermal transmittance |Y₁₂|', 'At the same outdoor amplitude, this construction transmits the lowest periodic heat-flow amplitude to the room side.', ' W/(m²K)', 4)}
      ${compareSentence(maxDelay, 'largest practical delay', 'The heat-flow peak arrives latest in plain-language terms. This is useful when night ventilation can remove the delayed heat. The signed EN shift may be positive or negative depending on the phase convention.', ' h', 2)}
      ${compareSentence(maxChi1, 'highest internal areal heat capacity χ₁', 'The inner side has the strongest short-term buffer against room temperature swings.', ' kJ/(m²K)', 1)}
      ${compareSentence(minU0, 'lowest steady-state U₀ value', 'Good for ordinary heat transfer, but not sufficient alone to judge summer dynamic behaviour.', ' W/(m²K)', 4)}
    </ul>
    <h4>Overall summer tendency</h4>
    <p><strong>Best combined tendency:</strong> Construction ${constructionLabel(ranking[0].index)} (${esc(ranking[0].item.name)}). This ranking combines low f, low |Y₁₂|, large practical delay and high χ₁. It is a practical reading aid, not an EN ISO 13786 rating class.</p>
    <p><strong>How to read this:</strong> A wall with low f and low |Y₁₂| keeps the outdoor heat wave small on the room side. A high χ₁ helps absorb short internal or solar gains at the inner surface. A useful practical delay is most valuable when the delayed heat can be removed by evening or night ventilation.</p>`;
}



function saveLocal() { localStorage.setItem('stw_current', JSON.stringify(state)); }
function loadLocal() {
  const local = localStorage.getItem('stw_current');
  if (local) { try { state = JSON.parse(local); } catch { state = structuredClone(DEFAULT_STATE); } }
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ state, library: getSavedLibrary(), comparison: getComparisonSet() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'summer-thermal-tool-data.json'; a.click(); URL.revokeObjectURL(a.href);
}
function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result);
    if (data.state) state = data.state;
    if (data.library) localStorage.setItem('stw_library', JSON.stringify(data.library));
    if (data.comparison) localStorage.setItem('stw_comparison', JSON.stringify(data.comparison));
    if (data.saved && !data.library) localStorage.setItem('stw_library', JSON.stringify(data.saved));
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
  
  $('saveToLibrary').addEventListener('click', () => saveCurrentConstructionToLibrary(false));
  $('addToComparison').addEventListener('click', addCurrentToComparison);
  $('loadSavedConstruction').addEventListener('click', () => loadSavedConstructionById($('savedConstructionSelect').value));
  $('deleteSavedConstruction').addEventListener('click', () => deleteSavedConstructionById($('savedConstructionSelect').value));
  $('newConstruction').addEventListener('click', newConstruction);
  $('newConstructionTop').addEventListener('click', newConstruction);
  $('generateReport').addEventListener('click', generateComparativeReport);
  $('clearComparison').addEventListener('click', () => { localStorage.removeItem('stw_comparison'); renderComparison(); });
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
  renderSavedConstructionSelect();
  loadLocal();
  loadStateToInputs();
  renderComparison();
}

document.addEventListener('DOMContentLoaded', init);

// Expose for simple browser-console verification.
window.STW = { calculate, loadExampleState: (kind) => kind === 'd1' ? { periodSeconds: 86400, rsi: 0.13, rse: 0.04, layers: [{ name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 }] } : structuredClone(DEFAULT_STATE) };
