const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('./app.js', 'utf8').replace(/document\.addEventListener\('DOMContentLoaded', init\);/, '');
const sandbox = { console, structuredClone, crypto: { randomUUID: () => 'test' }, localStorage: { getItem:()=>null, setItem:()=>{} }, window: {}, document: { addEventListener:()=>{} } };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const calc = sandbox.window.STW.calculate;
const cases = [
  { name: 'D1', state: { periodSeconds: 86400, rsi: 0.13, rse: 0.04, layers: [{ name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 }] }, ref: { U0: 3.5573122529644272, Y11: 5.7043133758164046, Y22: 11.591877212675554, Y12: 1.8270711331659655, f: 0.5136099963233214, chi1: 86.16770938339988, chi2: 170.87491385741822 } },
  { name: 'D2', state: { periodSeconds: 86400, rsi: 0.13, rse: 0.04, layers: [{ name: 'Concrete', lambda: 1.8, density: 2400, specificHeat: 1000, thickness: 0.2 }, { name: 'Thermal insulation layer', lambda: 0.04, density: 30, specificHeat: 1400, thickness: 0.1 }, { name: 'Render', lambda: 1.0, density: 1200, specificHeat: 1500, thickness: 0.005 }] }, ref: { U0: 0.3589232303090728, Y11: 5.941759819168739, Y22: 0.8470497907097969, Y12: 0.060558015062072604, f: 0.1687213586312745, chi1: 82.29012815275597, chi2: 12.479971826698106 } }
];
for (const c of cases) {
  const r = calc(c.state);
  const got = { U0: r.U0, Y11: r.Y11.value, Y22: r.Y22.value, Y12: r.Y12.value, f: r.decrement, chi1: r.chi1, chi2: r.chi2 };
  console.log(c.name);
  for (const k of Object.keys(c.ref)) {
    const diff = Math.abs(got[k] - c.ref[k]);
    console.log(`  ${k}: ${got[k]} ref ${c.ref[k]} diff ${diff}`);
    if (diff > 1e-9) process.exitCode = 1;
  }
}
