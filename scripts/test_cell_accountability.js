/**
 * Test Suite: Universal Cell Accountability & Reconciliation Balance
 * Section 16 & Section 26 Verification
 * Verifies that:
 * Total Applicable Cells = VALID + INVALID + WARNING + MISSING + CORRECTED + REVIEW_REQUIRED + NOT_APPLICABLE
 * Discrepancy === 0 under all possible data conditions.
 */

const assert = require('assert');
const { CellAccountabilityEngine, DMValidator, ADAEValidator, ADSLValidator } = require('../engines/clinicalValidationOrchestrator.js');

console.log('================================================================');
console.log('🧪 RUNNING UNIVERSAL CELL ACCOUNTABILITY RECONCILIATION SUITE');
console.log('================================================================\n');

// Test Case 1: Empty Dataset
console.log('--- Test Case 1: Empty Dataset ---');
const emptyAudit = CellAccountabilityEngine.auditDatasetCells('DM', []);
assert.strictEqual(emptyAudit.totalCells, 0);
assert.strictEqual(emptyAudit.discrepancy, 0);
assert.strictEqual(emptyAudit.isReconciled, true);
console.log('  ✅ PASS: Empty dataset reconciled (0 cells, 0 discrepancy)');

// Test Case 2: Clean Perfect Dataset
console.log('\n--- Test Case 2: Clean Perfect Dataset ---');
const cleanRows = [
  { STUDYID: 'ST01', DOMAIN: 'DM', USUBJID: '001', SUBJID: '001', AGE: 45, AGEU: 'YEARS', SEX: 'M', ARM: 'DRUG A', ARMCD: 'ACT', RFSTDTC: '2025-01-10' },
  { STUDYID: 'ST01', DOMAIN: 'DM', USUBJID: '002', SUBJID: '002', AGE: 52, AGEU: 'YEARS', SEX: 'F', ARM: 'PLACEBO', ARMCD: 'PBO', RFSTDTC: '2025-02-01' }
];
const cleanAudit = CellAccountabilityEngine.auditDatasetCells('DM', cleanRows, []);
assert.strictEqual(cleanAudit.totalCells, 20); // 2 rows * 10 columns
assert.strictEqual(cleanAudit.states.VALID, 20);
assert.strictEqual(cleanAudit.discrepancy, 0);
assert.strictEqual(cleanAudit.isReconciled, true);
console.log(`  ✅ PASS: Clean dataset: 20/20 VALID cells, discrepancy = 0`);

// Test Case 3: Mixed Errors, Corrections, Missing, Warnings, and Not-Applicable Blanks
console.log('\n--- Test Case 3: Complex Multi-State Dataset ---');
const complexRows = [
  // Row 1: Valid + Structural blanks (DCSREAS, DTHDTC)
  { USUBJID: '001', AGE: 45, SEX: 'M', ARM: 'DRUG A', RFSTDTC: '2025-01-10', DCSREAS: '', DTHDTC: null },
  // Row 2: Invalid SEX ('FEMALE'), Unexpected missing AGE (null)
  { USUBJID: '002', AGE: null, SEX: 'FEMALE', ARM: 'PLACEBO', RFSTDTC: '2025-02-01', DCSREAS: '', DTHDTC: null },
  // Row 3: Corrected SEX ('F'), Review Required note
  { USUBJID: '003', AGE: 70, SEX: 'F', ARM: 'DRUG A', RFSTDTC: '2025-03-01', DCSREAS: '', DTHDTC: null }
];

const mockAuditLog = [
  { row: 2, variable: 'SEX', severity: 'ERROR', status: 'OPEN', error: 'Invalid Controlled Terminology' },
  { row: 2, variable: 'AGE', severity: 'ERROR', status: 'OPEN', error: 'Missing required value' },
  { row: 3, variable: 'SEX', severity: 'INFO', status: 'FIXED', oldVal: 'FEMALE', newVal: 'F' },
  { row: 3, variable: 'AGE', severity: 'WARNING', status: 'REVIEW_REQUIRED', error: 'Subject over 65 protocol exception' }
];

const complexRepaired = JSON.parse(JSON.stringify(complexRows));
complexRepaired[2].SEX = 'F';

const auditResult = CellAccountabilityEngine.auditDatasetCells('DM', complexRows, mockAuditLog, complexRepaired);
console.log('Cell Summary Stats:', JSON.stringify(auditResult.states, null, 2));

const expectedTotal = 3 * 7; // 3 rows * 7 columns = 21 cells
assert.strictEqual(auditResult.totalCells, expectedTotal, 'Total cells must equal rows * cols');
assert.strictEqual(auditResult.reconciledSum, expectedTotal, 'Reconciled sum must equal total cells');
assert.strictEqual(auditResult.discrepancy, 0, 'Discrepancy must be exactly 0');
assert.strictEqual(auditResult.isReconciled, true, 'isReconciled must be true');

// Verify that every state was populated
assert(auditResult.states.VALID > 0, 'VALID cells must be > 0');
assert(auditResult.states.INVALID > 0, 'INVALID cells must be > 0');
assert(auditResult.states.CORRECTED > 0, 'CORRECTED cells must be > 0');
assert(auditResult.states.REVIEW_REQUIRED > 0, 'REVIEW_REQUIRED cells must be > 0');
assert(auditResult.states.NOT_APPLICABLE > 0, 'NOT_APPLICABLE cells must be > 0');

console.log(`  ✅ Total Cells: ${auditResult.totalCells}`);
console.log(`  ✅ VALID: ${auditResult.states.VALID} (${auditResult.percentages.VALID}%)`);
console.log(`  ✅ INVALID: ${auditResult.states.INVALID} (${auditResult.percentages.INVALID}%)`);
console.log(`  ✅ WARNING: ${auditResult.states.WARNING} (${auditResult.percentages.WARNING}%)`);
console.log(`  ✅ MISSING: ${auditResult.states.MISSING} (${auditResult.percentages.MISSING}%)`);
console.log(`  ✅ CORRECTED: ${auditResult.states.CORRECTED} (${auditResult.percentages.CORRECTED}%)`);
console.log(`  ✅ REVIEW_REQUIRED: ${auditResult.states.REVIEW_REQUIRED} (${auditResult.percentages.REVIEW_REQUIRED}%)`);
console.log(`  ✅ NOT_APPLICABLE: ${auditResult.states.NOT_APPLICABLE} (${auditResult.percentages.NOT_APPLICABLE}%)`);
console.log(`  ✅ Sum = ${auditResult.reconciledSum} &bull; Discrepancy = ${auditResult.discrepancy} (100% RECONCILED)`);

// Test Case 4: Randomized Property Test (100 datasets with random dimensions and defects)
console.log('\n--- Test Case 4: Property-Based Randomized Stress Test (100 iterations) ---');
for (let iter = 1; iter <= 100; iter++) {
  const rowCount = Math.floor(Math.random() * 50) + 1;
  const colNames = ['USUBJID', 'PARAMCD', 'AVAL', 'BASE', 'CHG', 'PCHG', 'ANRIND', 'VISIT', 'DCSREAS'];
  const testRows = [];
  const testIssues = [];

  for (let r = 1; r <= rowCount; r++) {
    const rowObj = {};
    colNames.forEach(col => {
      const rand = Math.random();
      if (rand < 0.1) rowObj[col] = '';
      else if (rand < 0.2) rowObj[col] = null;
      else if (col.includes('VAL') || col === 'BASE' || col === 'CHG' || col === 'PCHG') rowObj[col] = +(Math.random() * 100).toFixed(2);
      else rowObj[col] = `VAL-${r}`;
    });
    testRows.push(rowObj);

    if (Math.random() < 0.3) {
      testIssues.push({
        row: r,
        variable: colNames[Math.floor(Math.random() * colNames.length)],
        severity: Math.random() < 0.5 ? 'ERROR' : 'WARNING',
        status: Math.random() < 0.3 ? 'FIXED' : (Math.random() < 0.5 ? 'REVIEW_REQUIRED' : 'OPEN'),
        error: 'Random synthetic defect'
      });
    }
  }

  const res = CellAccountabilityEngine.auditDatasetCells('ADLB', testRows, testIssues);
  assert.strictEqual(res.discrepancy, 0, `Iteration ${iter} failed with non-zero discrepancy: ${res.discrepancy}`);
  assert.strictEqual(res.isReconciled, true, `Iteration ${iter} failed isReconciled check`);
}
console.log('  ✅ PASS: 100/100 randomized property tests reconciled with discrepancy = 0');

console.log('\n================================================================');
console.log('🎉 ALL UNIVERSAL CELL ACCOUNTABILITY TESTS PASSED (100%)!');
console.log('================================================================\n');
