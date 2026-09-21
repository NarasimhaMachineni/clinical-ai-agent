const assert = require('assert');
const fs = require('fs');

console.log('=== TEST 1: CDISC Variable Type Determination ===');
const { determineCdiscVariableType, verifyAndRepairClinicalData } = require('../engines/clinicalVerificationEngine.js');

// Test standard numeric variables
const numVars = ['AVAL', 'BASE', 'CHG', 'PCHG', 'AGE', 'VISITNUM', 'AVISITN', 'AESEQ', 'LBSEQ', 'AESTDY', 'LBDY', 'TRTDURD', 'LBSTRESN', 'SYSBP', 'DIABP'];
numVars.forEach(v => {
  const res = determineCdiscVariableType(v);
  assert.strictEqual(res.type, 'Num', `Expected ${v} to be Num, got ${res.type}`);
  assert.strictEqual(res.isNumeric, true, `Expected ${v} isNumeric to be true`);
});
console.log(`✓ Verified ${numVars.length} CDISC numeric variables correctly classified.`);

// Test character and date variables
const charVars = ['USUBJID', 'STUDYID', 'ARM', 'SEX', 'RACE', 'SAFFL', 'ITTFL', 'AETERM', 'PARAMCD'];
charVars.forEach(v => {
  const res = determineCdiscVariableType(v);
  assert.strictEqual(res.type, 'Char', `Expected ${v} to be Char, got ${res.type}`);
  assert.strictEqual(res.isNumeric, false, `Expected ${v} isNumeric to be false`);
});
console.log(`✓ Verified ${charVars.length} CDISC character variables correctly classified.`);

// Test Date variables
const dateVars = ['TRTSDT', 'AESTDTC', 'RFSTDTC', 'BRTHDTC'];
dateVars.forEach(v => {
  const res = determineCdiscVariableType(v);
  assert.strictEqual(res.isDate, true, `Expected ${v} isDate to be true`);
});
console.log(`✓ Verified ${dateVars.length} date/datetime variables correctly identified.`);

// Test Empirical Heuristics
const empiricalNum = determineCdiscVariableType('CUSTOM_SCORE', ['10', '20.5', '35', '42', '55.1']);
assert.strictEqual(empiricalNum.type, 'Num', 'Expected empirical numeric inference');
console.log('✓ Verified empirical data inference fallback.');


console.log('\n=== TEST 2: 100% Data Auditing and Repair Across Large Dataset ===');
// Create 250 rows with planted text numbers, day 0 violations, and BDS math discrepancies
const testRows = [];
for (let i = 1; i <= 250; i++) {
  testRows.push({
    STUDYID: 'CDISC01',
    USUBJID: `CDISC01-001-${String(i).padStart(3, '0')}`,
    PARAMCD: 'ALT',
    AVAL: i === 10 ? '>120' : (i === 20 ? '55.4 mg/dL' : (100 + i)),
    BASE: 100,
    CHG: i === 30 ? 999 : (i), // math error on row 30
    LBDY: i === 5 ? 0 : i,      // Day 0 error on row 5
    SEX: i === 15 ? 'N' : (i % 2 === 0 ? 'M' : 'F'), // Demographic corruption on row 15
    CUSTOM_NOTE: `Note for subject ${i}` // Non-standard variable
  });
}

const auditResult = verifyAndRepairClinicalData('ADLB', testRows);
assert.strictEqual(auditResult.cleanRows.length, 250, 'Expected 100% of 250 rows to be audited and cleaned');
assert.ok(auditResult.auditLog.length >= 4, `Expected at least 4 errors found, got ${auditResult.auditLog.length}`);
assert.ok(Array.isArray(auditResult.columnProfiles), 'Expected columnProfiles array');
assert.strictEqual(auditResult.columnProfiles.length, Object.keys(testRows[0]).length, 'Expected profiling for all columns');

const avalProfile = auditResult.columnProfiles.find(c => c.variable === 'AVAL');
assert.strictEqual(avalProfile.type, 'Num', 'Expected AVAL to be profiled as Num');
assert.strictEqual(avalProfile.completeness, '100.0%', 'Expected 100% completeness');

console.log(`✓ Audited 100% of ${auditResult.cleanRows.length} records. Clean rows: ${auditResult.cleanRows.length}, Discrepancies repaired: ${auditResult.auditLog.length}.`);


console.log('\n=== TEST 3: SAS & R Code Generation & Independent Double Programming ===');
const { generateSasCode, generateRPharmaverseCode, compareSasAndRCode } = require('../engines/codeGenEngine.js');

const sas = generateSasCode('CDISC01', 'ADLB', Object.keys(testRows[0]), testRows);
assert.ok(sas.includes('proc compare'), 'SAS code must include PROC COMPARE');
assert.ok(sas.includes('attrib'), 'SAS code must include explicit attrib');
assert.ok(sas.includes('data adam.adlb'), 'SAS code must define target dataset');

const r = generateRPharmaverseCode('CDISC01', 'ADLB', Object.keys(testRows[0]), testRows);
assert.ok(r.includes('diffdf('), 'R code must include diffdf');
assert.ok(r.includes('admiral'), 'R code must include admiral references');

const comparison = compareSasAndRCode(sas, r, 'ADLB');
assert.strictEqual(comparison.status, 'PASS', 'Expected double programming comparison to PASS');
assert.strictEqual(comparison.overallConcordance, '100.0%', 'Expected 100.0% concordance');
assert.strictEqual(comparison.sysinfoCode, 0, 'Expected &SYSINFO = 0');
console.log('✓ Verified SAS 9.4 and R Pharmaverse dual code generation and PROC COMPARE / diffdf reconciliation.');


console.log('\n=== TEST 4: UI Order, Copilot Removal, and Elements Verification ===');
const htmlContent = fs.readFileSync('index.html', 'utf8');
const publicHtmlContent = fs.readFileSync('public/index.html', 'utf8');

[htmlContent, publicHtmlContent].forEach((content, fIdx) => {
  const fileName = fIdx === 0 ? 'index.html' : 'public/index.html';
  
  // Verify copilot is removed
  assert.ok(!content.includes('claude-copilot-drawer'), `${fileName} must NOT contain claude-copilot-drawer`);
  assert.ok(!content.includes('btn-open-copilot'), `${fileName} must NOT contain btn-open-copilot`);
  assert.ok(!content.includes('Claude AI Copilot'), `${fileName} must NOT contain Claude AI Copilot`);
  
  // Verify 6 tab buttons order
  const tabBtnRegex = /data-tab="(tab-[a-z]+)"/g;
  const buttonsFound = [];
  let m;
  while ((m = tabBtnRegex.exec(content)) !== null) {
    buttonsFound.push(m[1]);
  }
  const expectedTabs = ['tab-datasets', 'tab-specs', 'tab-review', 'tab-tlfs', 'tab-qc', 'tab-deliverables'];
  assert.deepStrictEqual(buttonsFound, expectedTabs, `${fileName} tab buttons order must match exactly: ${expectedTabs.join(', ')}`);

  // Verify tab panes order
  const tabPaneRegex = /<div class="tab-pane[^"]*" id="(tab-[a-z]+)"/g;
  const panesFound = [];
  while ((m = tabPaneRegex.exec(content)) !== null) {
    panesFound.push(m[1]);
  }
  assert.deepStrictEqual(panesFound, expectedTabs, `${fileName} tab panes order must match exactly: ${expectedTabs.join(', ')}`);

  // Verify Custom TLF button and Double QC container
  assert.ok(content.includes('CUSTOM_TLF'), `${fileName} must include CUSTOM_TLF button`);
  assert.ok(content.includes('double-prog-qc-container'), `${fileName} must include double-prog-qc-container`);
});
console.log('✓ Verified both index.html and public/index.html conform 100% to all UI and tab requirements.');

console.log('\n>>> ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! <<<');
