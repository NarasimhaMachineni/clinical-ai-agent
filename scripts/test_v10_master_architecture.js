/**
 * Test Suite: ClinicalOps AI Agent v10.0 Master Architecture
 * Verifies all v10.0 engineering requirements:
 * 1. Universal Cell Accountability (Section 16)
 * 2. Real SAS & R Double Programming Derivations & Tolerance (Section 35)
 * 3. 13-Step Deterministic Execution Plan (Section 41)
 * 4. 21 CFR Part 11 Study Database Lock (Section 71)
 * 5. Full System Diagnostics & Health Telemetry (Section 75)
 * 6. 11-Stage End-to-End System Self-Test Runner (Section 76)
 * 7. Developer Golden Test Fixtures with Defect Detection (Section 77)
 * 8. High-Throughput Performance Benchmark (Section 78)
 */

const assert = require('assert');
const {
  CellAccountabilityEngine,
  SASRDoubleProgrammingEngine,
  ExecutionPlanEngine,
  StudyLockManager,
  SystemHealthEngine,
  SelfTestRunner,
  GoldenFixtureEngine,
  PerformanceBenchmarkEngine,
  DMValidator,
  ADAEValidator,
  ADSLValidator
} = require('../engines/clinicalValidationOrchestrator.js');

console.log('================================================================');
console.log('🧪 RUNNING CLINICALOPS AI AGENT v10.0 MASTER ARCHITECTURE SUITE');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// 1. UNIVERSAL CELL ACCOUNTABILITY (Section 16)
// ----------------------------------------------------------------------------
console.log('--- 1. Testing Universal Cell Accountability (Section 16) ---');
const testRows = [
  { USUBJID: '001-001', AGE: 45, SEX: 'M', ARM: 'DRUG A', DCSREAS: '' },
  { USUBJID: '001-002', AGE: null, SEX: 'FEMALE', ARM: 'PLACEBO', DCSREAS: '' }
];
const testLog = [
  { row: 2, variable: 'SEX', severity: 'ERROR', status: 'OPEN', error: 'Invalid CT' },
  { row: 2, variable: 'AGE', severity: 'ERROR', status: 'OPEN', error: 'Missing AGE' }
];
const cellAudit = CellAccountabilityEngine.auditDatasetCells('DM', testRows, testLog);

assert.strictEqual(cellAudit.totalCells, 10);
assert.strictEqual(cellAudit.discrepancy, 0);
assert.strictEqual(cellAudit.isReconciled, true);
assert.strictEqual(cellAudit.states.NOT_APPLICABLE, 2); // DCSREAS blanks for active subjects
console.log(`  ✅ Total Cells: ${cellAudit.totalCells}, Reconciled: ${cellAudit.reconciledSum}, Discrepancy: ${cellAudit.discrepancy}`);
console.log('  ✅ PASS: 7-state mutual exclusivity holds with zero uncounted cells');

// ----------------------------------------------------------------------------
// 2. REAL SAS & R DOUBLE PROGRAMMING DERIVATION & RECONCILIATION (Section 35)
// ----------------------------------------------------------------------------
console.log('\n--- 2. Testing SAS & R Double Programming Derivation (Section 35) ---');
// Test TRTEMFL derivation on sample AE dataset
const aeSample = [
  { USUBJID: '001-001', AESTDTC: '2025-01-15', TRTSDT: '2025-01-10' }, // Event after TRT -> Y
  { USUBJID: '001-002', AESTDTC: '2025-01-05', TRTSDT: '2025-01-10' }, // Event before TRT -> N
  { USUBJID: '001-003', AESTDTC: '2025-01-10', TRTSDT: '2025-01-10' }  // Event on TRT date -> Y
];

const dualAE = SASRDoubleProgrammingEngine.executeDualDerivations('TRTEMFL', aeSample);
assert.strictEqual(dualAE.rowCount, 3);
assert.strictEqual(dualAE.status, 'MATCH');
assert.strictEqual(dualAE.reconciliation.mismatchedRows, 0);
assert.strictEqual(dualAE.reconciliation.conformanceRate, 100);

// Verify exact values
assert.strictEqual(dualAE.sasDerived[0].TRTEMFL, 'Y');
assert.strictEqual(dualAE.rDerived[0].TRTEMFL, 'Y');
assert.strictEqual(dualAE.sasDerived[1].TRTEMFL, 'N');
assert.strictEqual(dualAE.rDerived[1].TRTEMFL, 'N');
console.log(`  ✅ TRTEMFL: SAS and R derived identical values across all ${dualAE.rowCount} rows`);

// Test TRTDURD derivation on ADSL dataset
const adslSample = [
  { USUBJID: '001-001', TRTSDT: '2025-01-01', TRTEDT: '2025-01-15' }, // 15 days
  { USUBJID: '001-002', TRTSDT: '2025-02-01', TRTEDT: '2025-02-01' }  // 1 day
];
const dualADSL = SASRDoubleProgrammingEngine.executeDualDerivations('TRTDURD', adslSample);
assert.strictEqual(dualADSL.status, 'MATCH');
assert.strictEqual(dualADSL.sasDerived[0].TRTDURD, 15);
assert.strictEqual(dualADSL.rDerived[0].TRTDURD, 15);
assert.strictEqual(dualADSL.sasDerived[1].TRTDURD, 1);
assert.strictEqual(dualADSL.rDerived[1].TRTDURD, 1);
console.log(`  ✅ TRTDURD: (TRTEDT - TRTSDT) + 1 matches at 10^-6 tolerance`);

// Test BDS CHG/PCHG derivation
const bdsSample = [
  { USUBJID: '001-001', PARAMCD: 'GLUC', AVAL: 110, BASE: 100 }, // CHG = 10, PCHG = 10%
  { USUBJID: '001-002', PARAMCD: 'GLUC', AVAL: 80, BASE: 100 }   // CHG = -20, PCHG = -20%
];
const dualBDS = SASRDoubleProgrammingEngine.executeDualDerivations('CHG', bdsSample);
assert.strictEqual(dualBDS.status, 'MATCH');
assert.strictEqual(dualBDS.sasDerived[0].CHG, 10);
assert.strictEqual(dualBDS.rDerived[0].CHG, 10);
assert.strictEqual(dualBDS.sasDerived[0].PCHG, 10);
assert.strictEqual(dualBDS.rDerived[0].PCHG, 10);
console.log(`  ✅ CHG & PCHG: Mathematical delta = 0.000000 across both implementations`);

// Verify dual code generation
const progs = SASRDoubleProgrammingEngine.generateDualPrograms('TRTEMFL');
assert(progs.sasCode.includes('data work.adae;'), 'SAS code must include DATA step');
assert(progs.rCode.includes('library(admiral)'), 'R code must include admiral package');
console.log('  ✅ Dual program generation verified (SAS v9.4 + R Admiral)');

// ----------------------------------------------------------------------------
// 3. 13-STEP EXECUTION PLAN (Section 41)
// ----------------------------------------------------------------------------
console.log('\n--- 3. Testing 13-Step Execution Plan (Section 41) ---');
const plan = ExecutionPlanEngine.generatePlan('Verify Complete Study', 'ALL');
assert.strictEqual(plan.steps.length, 13, 'Execution plan must contain exactly 13 steps');
assert.strictEqual(plan.steps[0].name, 'Ingest & Register Datasets');
assert.strictEqual(plan.steps[12].name, 'Generate 16-Section Regulatory Report');
console.log(`  ✅ Generated 13-step plan: "${plan.actionName}" with Plan ID: ${plan.planId}`);

// ----------------------------------------------------------------------------
// 4. 21 CFR PART 11 STUDY DATABASE LOCK (Section 71)
// ----------------------------------------------------------------------------
console.log('\n--- 4. Testing 21 CFR Part 11 Study Lock Governance (Section 71) ---');
assert.strictEqual(StudyLockManager.getState(), 'PRE_LOCK');
assert.strictEqual(StudyLockManager.isLocked(), false);
StudyLockManager.assertNotLocked('Test Modification');

// Lock the study
const lockRes = StudyLockManager.lockStudy('Dr. Jane Doe, Lead Biostatistician', 'Interim Database Freeze');
assert.strictEqual(StudyLockManager.getState(), 'LOCKED');
assert.strictEqual(StudyLockManager.isLocked(), true);
console.log(`  ✅ Study locked by: ${lockRes.metadata.lockedBy} (Hash: ${lockRes.metadata.lockHash})`);

// Ensure mutation throws error when locked
let threwError = false;
try {
  StudyLockManager.assertNotLocked('Apply Automated Fixes');
} catch (e) {
  threwError = true;
  assert(e.message.includes('STUDY_LOCKED_ERROR'));
}
assert(threwError, 'Attempted modification while study is locked MUST throw STUDY_LOCKED_ERROR');
console.log('  ✅ GxP Mutation Guard: Prevented unauthorized write operation while LOCKED');

// Unlock the study
const unlockRes = StudyLockManager.unlockStudy('Dr. Jane Doe', 'AUTH-TOKEN-12345', 'Query Remediation');
assert.strictEqual(StudyLockManager.getState(), 'PRE_LOCK');
assert.strictEqual(StudyLockManager.isLocked(), false);
console.log(`  ✅ Study successfully unlocked: "${unlockRes.metadata.reason}"`);

// ----------------------------------------------------------------------------
// 5. SYSTEM HEALTH & SELF-DIAGNOSTICS (Section 75)
// ----------------------------------------------------------------------------
console.log('\n--- 5. Testing Full System Health & Diagnostics (Section 75) ---');
const health = SystemHealthEngine.runDiagnostics({ DM: testRows });
assert.strictEqual(health.overallStatus, 'HEALTHY');
assert(health.checks.length >= 8);
health.checks.forEach(c => {
  assert(c.status === 'HEALTHY' || c.status === 'STANDBY');
  console.log(`  ✅ Diagnostic: ${c.name} -> ${c.status} (${c.detail})`);
});

// ----------------------------------------------------------------------------
// 6. AUTONOMOUS 11-STAGE SELF-TEST RUNNER (Section 76)
// ----------------------------------------------------------------------------
console.log('\n--- 6. Testing 11-Stage End-to-End Self-Test Runner (Section 76) ---');
const selfTest = SelfTestRunner.runFullSelfTest();
assert.strictEqual(selfTest.overallStatus, 'PASS');
assert.strictEqual(selfTest.passedCount, 11);
assert.strictEqual(selfTest.totalStages, 11);
selfTest.stages.forEach(st => {
  console.log(`  ✅ Stage ${st.stage}: ${st.name} [${st.status}] in ${st.durationMs}ms`);
});
console.log(`  ✅ Full Self-Test passed in ${selfTest.totalDurationMs}ms with zero defects`);

// ----------------------------------------------------------------------------
// 7. DEVELOPER GOLDEN TEST FIXTURES (Section 77)
// ----------------------------------------------------------------------------
console.log('\n--- 7. Testing Golden Test Fixtures Defect Detection (Section 77) ---');
const fixtures = GoldenFixtureEngine.getFixtures();
assert(fixtures.DM && fixtures.ADAE && fixtures.ADSL && fixtures.VS);

// Test DM intentional defects
const dmResult = DMValidator.validate(fixtures.DM);
const hasMaleSex = dmResult.issues.some(i => i.variable === 'SEX' && String(i.oldVal).toUpperCase() === 'MALE');
assert(hasMaleSex, 'Golden fixture DM must detect invalid SEX "MALE"');
console.log(`  ✅ Golden DM: Detected expected defect: SEX="MALE"`);

// Test AE intentional inverted dates
const aeResult = require('../engines/clinicalValidationOrchestrator.js').AEValidator.validate(fixtures.ADAE);
const hasInvertedDate = aeResult.issues.some(i => i.error && i.error.includes('Inverted chronology'));
assert(hasInvertedDate, 'Golden fixture AE must detect inverted start and end dates');
console.log(`  ✅ Golden AE: Detected inverted dates (AEENDTC < AESTDTC)`);

// Test ADAE intentional TRTEMFL defect
const adaeResult = ADAEValidator.validate(fixtures.ADAE);
const hasTrtemflIssue = adaeResult.issues.some(i => i.error && i.error.includes('TRTEMFL'));
assert(hasTrtemflIssue, 'Golden fixture ADAE must detect discrepant TRTEMFL');
console.log(`  ✅ Golden ADAE: Detected discrepant TRTEMFL vs TRTSDT`);

// Test ADSL negative duration
const slResult = ADSLValidator.validate(fixtures.ADSL);
const hasNegDur = slResult.issues.some(i => i.variable === 'TRTDURD' || (i.error && i.error.includes('Duration')));
assert(hasNegDur, 'Golden fixture ADSL must detect negative treatment duration');
console.log(`  ✅ Golden ADSL: Detected negative duration (TRTDURD = -5)`);

// ----------------------------------------------------------------------------
// 8. HIGH-THROUGHPUT PERFORMANCE BENCHMARK (Section 78)
// ----------------------------------------------------------------------------
console.log('\n--- 8. Testing High-Throughput Performance Benchmark (Section 78) ---');
const bench = PerformanceBenchmarkEngine.runBenchmark(1000);
console.log(`  ✅ Processed ${bench.rowCount} clinical records in ${bench.durationMs}ms`);
console.log(`  ✅ Real Throughput: ${bench.throughputRowsPerSec.toLocaleString()} rows/sec`);
assert(bench.passedThreshold, 'Benchmark throughput must exceed threshold');

console.log('\n================================================================');
console.log('🎉 ALL v10.0 MASTER ARCHITECTURE TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');
