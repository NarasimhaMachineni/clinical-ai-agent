const assert = require('assert');

console.log('================================================================');
console.log('🧪 RUNNING 100% CELL-LEVEL DATA REVIEW & CORRECTION ENGINE TEST');
console.log('================================================================');

const {
  verifyAndRepairClinicalData,
  determineCdiscVariableType,
  generate16SectionDataQualityReport,
  CLINICAL_RULE_REGISTRY
} = require('../engines/clinicalVerificationEngine');

// 1. 100% Cell Auditing & Zero Truncation
console.log('\n--- 1. Testing 100% Cell-by-Cell Audit (Zero Truncation) ---');
const test50Rows = Array.from({ length: 50 }, (_, i) => ({
  STUDYID: 'STUDY-01',
  DOMAIN: 'DM',
  USUBJID: `SUBJ-${String(i+1).padStart(3, '0')}`,
  SUBJID: String(i+1).padStart(3, '0'),
  SITEID: '01',
  AGE: 40 + (i % 30),
  AGEU: 'YEARS',
  SEX: i % 2 === 0 ? 'M' : 'F',
  RACE: 'WHITE',
  ETHNIC: 'NOT HISPANIC OR LATINO',
  ARM: 'Active',
  ARMCD: 'ACT',
  RFSTDTC: '2024-01-01'
}));

const res50 = verifyAndRepairClinicalData('DM', test50Rows);
assert.strictEqual(res50.cleanRows.length, 50, 'All 50 rows must be audited');
const expectedCells = 50 * Object.keys(test50Rows[0]).length;
assert.strictEqual(res50.cellSummary.cellsAudited, expectedCells, `Must audit exactly ${expectedCells} cells`);
assert(res50.cellAuditMatrix && res50.cellAuditMatrix.length === expectedCells, 'cellAuditMatrix must contain 1 record per cell');
console.log(`  ✅ PASS: 100% of ${expectedCells} cells audited with zero truncation/sampling.`);

// 2. Cell Statuses Conformance
console.log('\n--- 2. Testing Cell Statuses (Section 4) ---');
const validStatuses = new Set(['VALID', 'INVALID', 'WARNING', 'MISSING', 'REVIEW_REQUIRED', 'CORRECTED', 'NOT_APPLICABLE']);
res50.cellAuditMatrix.forEach(c => {
  assert(validStatuses.has(c.validityStatus), `Cell status ${c.validityStatus} must be valid enum`);
});
assert(res50.cellSummary.validCells > 0, 'Must count valid cells');
console.log(`  ✅ PASS: Every cell assigned valid status (${res50.cellSummary.validCells} valid cells).`);

// 3. Harmless Numeric Cleaning (Section 9)
console.log('\n--- 3. Testing Harmless Numeric Cleaning (Section 9) ---');
const dirtyNumeric = [
  { USUBJID: 'S-01', SYSBP: '>120', DIABP: '80 mmHg', WEIGHT: '70.5 kg', HEIGHT: 175 }
];
const numRes = verifyAndRepairClinicalData('VS', dirtyNumeric);
assert.strictEqual(numRes.cleanRows[0].SYSBP, 120, '">120" stripped to numeric 120');
assert.strictEqual(numRes.cleanRows[0].DIABP, 80, '"80 mmHg" stripped to numeric 80');
assert.strictEqual(numRes.cleanRows[0].WEIGHT, 70.5, '"70.5 kg" stripped to numeric 70.5');
const numCleaningIssue = numRes.auditLog.find(iss => iss.variable === 'SYSBP');
assert(numCleaningIssue, 'SYSBP cleaning logged');
assert.strictEqual(numCleaningIssue.method, 'NUMERIC_TEXT_STRIPPING', 'Method is NUMERIC_TEXT_STRIPPING');
console.log('  ✅ PASS: Harmless textual formatting cleaned into numeric values with full audit trail.');

// 4. Uncertain Correction (Section 25)
console.log('\n--- 4. Testing Uncertain Correction (Section 25) ---');
const uncertainData = [
  { USUBJID: 'S-01', AETERM: 'Headache', AESEV: 'High', AESTDTC: '2024-01-01' }
];
const uncRes = verifyAndRepairClinicalData('AE', uncertainData);
const sevIssue = uncRes.auditLog.find(iss => iss.variable === 'AESEV');
assert(sevIssue, 'AESEV issue must be flagged');
assert.strictEqual(sevIssue.status, 'REVIEW_REQUIRED', 'Ambiguous AESEV="High" must be REVIEW_REQUIRED');
assert.strictEqual(sevIssue.autoFixAllowed, false, 'Ambiguous correction must NOT be auto-fixed');
assert(sevIssue.justification.includes('Multiple possible interpretations') || sevIssue.justification.includes('MODERATE or SEVERE'), 'Reason explains ambiguity');
console.log('  ✅ PASS: Uncertain correction marked REVIEW_REQUIRED without guessing.');

// 5. Cascade Revalidation (Section 27 & 28)
console.log('\n--- 5. Testing Cascade Revalidation (Sections 27 & 28) ---');
const cascadeData = [
  { USUBJID: 'S-01', WEIGHT: '80 kg', HEIGHT: '180 cm', BMI: 20.0, SYSBP: 130, DIABP: 85, MAP: 90 }
];
const casRes = verifyAndRepairClinicalData('VS', cascadeData);
assert.strictEqual(casRes.cleanRows[0].WEIGHT, 80);
assert.strictEqual(casRes.cleanRows[0].HEIGHT, 180);
// BMI = 80 / (1.8^2) = 24.69 -> 24.7
assert.strictEqual(casRes.cleanRows[0].BMI, 24.7, 'BMI recomputed from cleaned weight/height');
// MAP = 85 + (130 - 85)/3 = 85 + 15 = 100.0
assert.strictEqual(casRes.cleanRows[0].MAP, 100.0, 'MAP recomputed from cleaned BP');
console.log('  ✅ PASS: Downstream derived variables (BMI, MAP) dynamically cascaded and revalidated.');

// 6. Section 30 Final Review Summary & Section 35 Complete Audit Report
console.log('\n--- 6. Testing 16-Section Complete Audit Report ---');
const rpt = generate16SectionDataQualityReport('VS', dirtyNumeric, numRes.cleanRows, numRes.auditLog, numRes.cellAuditMatrix, numRes.cellSummary);
assert(rpt.includes('## 1. Dataset Overview'), 'Report must contain Section 1');
assert(rpt.includes('## 3. Cells Audited'), 'Report must contain Section 3');
assert(rpt.includes('## 7. Corrections'), 'Report must contain Section 7');
assert(rpt.includes('## 14. Correction Evidence'), 'Report must contain Section 14');
assert(rpt.includes('## 16. Audit Trail'), 'Report must contain Section 16');
console.log('  ✅ PASS: 16-Section Data Quality Report successfully generated.');

console.log('\n================================================================');
console.log('🎉 ALL 100% CELL-LEVEL REVIEW & CORRECTION TESTS PASSED (100%)!');
console.log('================================================================');
