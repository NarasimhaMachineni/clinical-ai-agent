const fs = require('fs');
const vm = require('vm');

let tlfOutputHtml = '';
const window = {
  location: { hostname: 'localhost', href: 'http://localhost:3050' },
  addEventListener: () => {},
  clientRealData: {},
  clientAuditLogs: {},
  CDISC_STANDARDS_CATALOG: []
};
const document = {
  createElement: () => ({
    appendChild: () => {},
    setAttribute: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {}
  }),
  getElementById: (id) => ({
    get innerHTML() { return tlfOutputHtml; },
    set innerHTML(val) { tlfOutputHtml = val; },
    textContent: '',
    appendChild: () => {},
    removeChild: () => {},
    children: [],
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {}
  }),
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {}
};

const sandbox = {
  window,
  document,
  console,
  setTimeout: () => {},
  setInterval: () => {},
  clientRealData: window.clientRealData,
  loadedSourceFilesMeta: [],
  currentDatasetTab: 'ADAE'
};

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('app.js', 'utf8'), sandbox);

// Load user 50 rows
const testScript = fs.readFileSync('scripts/test_user_exact_50_rows.js', 'utf8');
const startIdx = testScript.indexOf('const rawData = `') + 'const rawData = `'.length;
const endIdx = testScript.indexOf('`;', startIdx);
const rawData = testScript.substring(startIdx, endIdx);

const lines = rawData.trim().split('\n');
const headers = lines[0].split('\t');
const rows = lines.slice(1).map(l => {
  const vals = l.split('\t');
  const obj = {};
  headers.forEach((h, i) => obj[h] = vals[i] !== undefined ? vals[i].trim() : '');
  return obj;
});

console.log('Ingesting 50 ADAE rows...');
sandbox.window.deriveCrossDomainClinicalRelationships('ADAE', rows);

const realData = sandbox.window.clientRealData;
console.log('Synthesized ADSL length:', realData.ADSL ? realData.ADSL.length : 0);
console.log('Sample ADSL subject:', realData.ADSL ? realData.ADSL[0] : 'None');

// Test T14_1 (Demographics)
sandbox.window.renderTlfStudio('T14_1');
console.log('\nT14_1 rendered length:', tlfOutputHtml.length);
console.log('T14_1 contains studyId:', tlfOutputHtml.includes('Study: CDISC01'));
console.log('T14_1 contains Active 20 mg:', tlfOutputHtml.includes('Active 20 mg'));
console.log('T14_1 contains Active 10 mg:', tlfOutputHtml.includes('Active 10 mg'));
console.log('T14_1 contains Placebo:', tlfOutputHtml.includes('Placebo'));

// Test T14_2 (Adverse Events)
sandbox.window.clientRealData.ADAE = rows;
sandbox.window.renderTlfStudio('T14_2');
console.log('\nT14_2 rendered length:', tlfOutputHtml.length);
console.log('T14_2 contains Nasopharyngitis:', tlfOutputHtml.includes('Nasopharyngitis'));
console.log('T14_2 contains Urinary tract infection:', tlfOutputHtml.includes('Urinary Tract Infection') || tlfOutputHtml.includes('Urinary tract infection'));
console.log('T14_2 contains Nausea:', tlfOutputHtml.includes('Nausea'));
console.log('T14_2 contains Diarrhoea:', tlfOutputHtml.includes('Diarrhoea'));

// Test L16_2_7 (Adverse Events Listing)
sandbox.renderTlfStudio('L16_2_7');
console.log('\nL16_2_7 rendered length:', tlfOutputHtml.length);
console.log('L16_2_7 contains CDISC01-01-001:', tlfOutputHtml.includes('CDISC01-01-001'));
console.log('L16_2_7 contains SEVERE tag:', tlfOutputHtml.includes('SEVERE'));

// Test L16_2_1 (Discontinued Subjects Listing)
sandbox.renderTlfStudio('L16_2_1');
console.log('\nL16_2_1 contains CDISC01-01-023 (Drug Withdrawn):', tlfOutputHtml.includes('CDISC01-01-023'));
