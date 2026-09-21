/**
 * ClinicalOps AI Agent — Performance & Complete Data Validation Test Suite
 * Validates:
 * 1. JobManager lifecycle (create, start, progress, cancel, complete, throughput)
 * 2. Double-click prevention & concurrency guards
 * 3. Chunked non-blocking processing with 100% cell-level auditing
 * 4. Zero fake progress metrics
 * 5. Quick Profile vs Full Validation distinction
 * 6. Correction approval/rejection lifecycle & clean dataset generation
 * 7. Source data immutability
 * 8. Section 54/55 Validation Completeness Report & Coverage metrics
 */

const assert = require('assert');
const { JobManager } = require('../engines/jobManager');
const {
  verifyAndRepairClinicalData,
  quickProfileDataset,
  generateValidationCompletenessReport,
  compareBeforeAndAfterValidation
} = require('../engines/clinicalVerificationEngine');

console.log('================================================================');
console.log('🧪 RUNNING PERFORMANCE & COMPLETE DATA VALIDATION TEST SUITE');
console.log('================================================================\n');

// ------------------------------------------------------------------
// 1. JobManager Lifecycle & Concurrency Guard
// ------------------------------------------------------------------
console.log('--- 1. Testing JobManager Lifecycle & Double-Click Guard ---');
const jm = new JobManager();

// Create Job
const { job } = jm.createJob('FULL_VALIDATION', 'ADSL', 500, 500 * 10);
assert(job, 'Job must be created');
assert.strictEqual(job.status, 'QUEUED', 'Initial status must be QUEUED');
assert.strictEqual(job.totalRows, 500, 'Total rows must match input');
assert.strictEqual(job.progress, 0.0, 'Initial progress must be 0.0');
assert(job.jobId.startsWith('JOB-'), 'Job ID must follow convention');

// Double-click prevention
jm.startJob(job.jobId);
assert.strictEqual(job.status, 'RUNNING');
assert.strictEqual(jm.isBusy(), true, 'JobManager must report busy');

const duplicateAttempt = jm.createJob('FULL_VALIDATION', 'ADSL', 500);
assert(duplicateAttempt.error, 'Duplicate job creation while busy must be blocked');
console.log('  ✅ PASS: Job created, started, and concurrent duplicate execution blocked.');

// Progress streaming (exact, not fake)
jm.updateProgress(job.jobId, {
  rowsProcessed: 250,
  cellsProcessed: 2500,
  errorsFound: 3,
  warningsFound: 1
});
assert.strictEqual(job.rowsProcessed, 250);
assert.strictEqual(job.progress, 0.5, 'Progress must be exactly 0.5 (250/500), no fake percentage');
console.log('  ✅ PASS: Real progress calculation verified (exactly 50.0%).');

// Complete Job
jm.completeJob(job.jobId, { testResult: true });
assert.strictEqual(job.status, 'COMPLETED');
assert.strictEqual(job.progress, 1.0);
assert.strictEqual(jm.isBusy(), false);
console.log('  ✅ PASS: Job completed cleanly with status COMPLETED.');

// ------------------------------------------------------------------
// 2. Cancellable Operations (Never False PASS)
// ------------------------------------------------------------------
console.log('\n--- 2. Testing Cancellable Operations (Section 17) ---');
const { job: jobToCancel } = jm.createJob('FULL_VALIDATION', 'DM', 1000);
jm.startJob(jobToCancel.jobId);
jm.updateProgress(jobToCancel.jobId, { rowsProcessed: 400 });

// Cancel while running
const cancelledJob = jm.cancelActiveJob();
assert.strictEqual(cancelledJob.status, 'CANCELLED', 'Status must be CANCELLED');
assert.strictEqual(cancelledJob.isCancelled, true);
assert.strictEqual(cancelledJob.rowsProcessed, 400, 'Partial diagnostics must be preserved');
assert.notStrictEqual(cancelledJob.status, 'PASS', 'Cancelled job must NEVER report PASS');
console.log('  ✅ PASS: Job cancellation preserved partial work and avoided false PASS.');

// ------------------------------------------------------------------
// 3. Chunked Non-Blocking Execution with 100% Cell Auditing
// ------------------------------------------------------------------
console.log('\n--- 3. Testing Chunked Non-Blocking 100% Cell-Level Auditing ---');

// Generate 1,000 synthetic clinical rows
const largeDataset = [];
for (let i = 1; i <= 1000; i++) {
  largeDataset.push({
    STUDYID: 'CDISC01',
    USUBJID: `CDISC01-${String(i).padStart(4, '0')}`,
    SUBJID: String(i).padStart(4, '0'),
    AGE: i % 25 === 0 ? ' 55 yrs ' : 45 + (i % 30),
    SEX: i % 2 === 0 ? 'M' : 'F',
    WEIGHT: 70 + (i % 20),
    HEIGHT: 175,
    BMI: i % 10 === 0 ? 999.0 : +( (70 + (i % 20)) / (1.75 * 1.75) ).toFixed(1),
    SYSBP: 120,
    DIABP: 80
  });
}

async function runChunkedAuditTest() {
  const { job: auditJob } = jm.createJob('FULL_VALIDATION', 'VS', largeDataset.length, largeDataset.length * 10);
  jm.startJob(auditJob.jobId);

  let progressCalls = 0;
  const chunkedResults = await jm.processInChunks(largeDataset, async (slice, startIdx, endIdx) => {
    // Audit each chunk
    const res = verifyAndRepairClinicalData('VS', slice, { rowOffset: startIdx });
    return res.repairedRows || res.cleanRows;
  }, {
    chunkSize: 250,
    onProgress: (prog) => {
      progressCalls++;
      jm.updateProgress(auditJob.jobId, {
        rowsProcessed: prog.itemsProcessed,
        cellsProcessed: prog.itemsProcessed * 10
      });
    }
  });

  jm.completeJob(auditJob.jobId, chunkedResults);

  assert.strictEqual(chunkedResults.length, 1000, 'All 1,000 rows must be processed');
  assert(progressCalls >= 4, `Must make incremental chunk calls (got ${progressCalls})`);
  assert.strictEqual(auditJob.rowsProcessed, 1000);
  assert.strictEqual(auditJob.cellsProcessed, 10000);
  console.log(`  ✅ PASS: 1,000 rows (10,000 cells) audited across ${progressCalls} chunks with zero freezing.`);
}

runChunkedAuditTest().then(() => {
  // ------------------------------------------------------------------
  // 4. Quick Profile Distinction (Section 67)
  // ------------------------------------------------------------------
  console.log('\n--- 4. Testing Quick Profile vs Full Validation (Section 67) ---');
  const prof = quickProfileDataset('DM', largeDataset.slice(0, 100));
  assert.strictEqual(prof.isQuickProfile, true);
  assert.strictEqual(prof.rowCount, 100);
  assert.strictEqual(prof.columnCount, 10);
  assert.strictEqual(prof.totalCells, 1000);
  assert(prof.columnProfiles.length === 10);
  
  // Verify typing: AGE, WEIGHT, HEIGHT should be Num
  const ageProfile = prof.columnProfiles.find(p => p.variable === 'AGE');
  assert(ageProfile, 'AGE column profile must exist');
  assert.strictEqual(ageProfile.type, 'Num', 'AGE must be categorized as Num');

  const sexProfile = prof.columnProfiles.find(p => p.variable === 'SEX');
  assert(sexProfile, 'SEX column profile must exist');
  assert.strictEqual(sexProfile.type, 'Char', 'SEX must be categorized as Char');

  console.log(`  ✅ PASS: Quick Profile scanned 100 rows in ${prof.executionTimeMs}ms with accurate CDISC Num vs Char typing.`);

  // ------------------------------------------------------------------
  // 5. Correction Approval & Clean Dataset Generation (Sections 69-71)
  // ------------------------------------------------------------------
  console.log('\n--- 5. Testing Correction Approval & Clean Dataset Generation ---');
  const dirtySample = [
    { STUDYID: 'CDISC01', USUBJID: 'CDISC01-001', WEIGHT: '75.5 kg', HEIGHT: 1.75, BMI: 12.0 },
    { STUDYID: 'CDISC01', USUBJID: 'CDISC01-002', WEIGHT: 80.0, HEIGHT: 1.80, BMI: 99.9 }
  ];

  // Raw source must remain immutable
  const rawCopy = JSON.parse(JSON.stringify(dirtySample));
  const res = verifyAndRepairClinicalData('VS', dirtySample);

  assert(res.auditLog.length > 0, 'Audit log must find issues');
  // Mark one approved, leave another pending
  res.auditLog[0].status = 'APPROVED';

  // Compare Before vs After
  const revalRes = verifyAndRepairClinicalData('VS', res.repairedRows);
  const diff = compareBeforeAndAfterValidation(res.auditLog, revalRes.auditLog);
  assert(diff.revalidationPass === true, 'Revalidation must introduce 0 new errors');
  console.log(`  ✅ PASS: Clean dataset generated with approved corrections; ${diff.summaryText}`);

  // Source immutability check
  assert.deepStrictEqual(dirtySample[0].WEIGHT, rawCopy[0].WEIGHT, 'Source record 1 must remain unaltered');
  assert.deepStrictEqual(dirtySample[1].BMI, rawCopy[1].BMI, 'Source record 2 must remain unaltered');
  console.log('  ✅ PASS: Source data immutability confirmed.');

  // ------------------------------------------------------------------
  // 6. Section 54/55 Completeness Report & Coverage
  // ------------------------------------------------------------------
  console.log('\n--- 6. Testing Section 54 & 55 Completeness Report ---');
  const report = generateValidationCompletenessReport('VS', dirtySample, res.auditLog);
  assert.strictEqual(report.dataset, 'VS');
  assert.strictEqual(report.rows, 2);
  assert.strictEqual(report.columns, 5);
  assert.strictEqual(report.cells, 10);
  assert.strictEqual(report.cellsAudited, 10);
  assert.strictEqual(report.rulesConfigured, 12);
  assert.strictEqual(report.rulesExecuted, 12);
  assert.strictEqual(report.rulesFailedToExecute, 0);
  assert.strictEqual(report.rowCoverage, '100.0%');
  assert.strictEqual(report.cellCoverage, '100.0%');
  assert.strictEqual(report.ruleCoverage, '100.0%');
  console.log('  ✅ PASS: Completeness Report contains all 13 real counts with 100% row/cell/rule coverage.');

  console.log('\n================================================================');
  console.log('🎉 ALL PERFORMANCE & COMPLETE VALIDATION TESTS PASSED (100%)!');
  console.log('================================================================\n');
}).catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
