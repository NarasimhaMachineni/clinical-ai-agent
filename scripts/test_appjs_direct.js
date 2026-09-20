const fs = require('fs');
const vm = require('vm');

const app = fs.readFileSync('app.js', 'utf8');
const testScript = fs.readFileSync('scripts/test_user_exact_50_rows.js', 'utf8');

const rawLines = testScript.split('const rawData = `')[1].split('`;')[0].trim().split('\n');
const headers = rawLines[0].split('\t');
const rows = rawLines.slice(1).map(l => {
  const vals = l.split('\t');
  const obj = {};
  headers.forEach((h, i) => obj[h] = vals[i] !== undefined ? vals[i].trim() : '');
  return obj;
});

const sandbox = { console, Set, Map, Array, Object, String, Number, parseInt, Math, Date, isNaN };
vm.createContext(sandbox);

const fnCode = app.slice(app.indexOf('function normalizeClinicalDate('), app.indexOf('function verifyAndRepairADaM('));
vm.runInContext(fnCode + '\nthis.fn = verifyAndRepairClinicalData;', sandbox);

const res = sandbox.fn('ADAE', rows);
console.log('app.js test with user 50 rows -> Total audit issues:', res.auditLog.length);
if (res.auditLog.length === 0) {
  console.log('✅ PERFECT: 0 errors detected in app.js for clean 50-row data!');
} else {
  console.log('❌ ISSUES:', res.auditLog);
  process.exit(1);
}
