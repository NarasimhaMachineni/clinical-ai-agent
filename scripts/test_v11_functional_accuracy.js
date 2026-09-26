const assert = require('assert');
const fs = require('fs');

console.log('================================================================');
console.log('🧪 RUNNING V11.0 FULL FUNCTIONAL ACCURACY & DATA-LINKAGE TEST SUITE');
console.log('================================================================');

// Load ClinicalValidationOrchestrator
const orch = require('../engines/clinicalValidationOrchestrator.js');
const {
  StudyDataStore,
  LiveStudyMetricsEngine,
  LiverSafetyEngine,
  RuleExecutionEngine,
  ExplanationContextManager,
  TlfDrillDownEngine,
  ClinicalValidationOrchestrator
} = orch;

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// 1. StudyDataStore Tests
// -----------------------------------------------------------------------------
console.log('\n--- 1. StudyDataStore: Single Authoritative Store ---');

test('Store starts empty and responds to setDataset, getDataset, removeDataset, clearAll', () => {
  StudyDataStore.clearAll();
  assert.strictEqual(StudyDataStore.studyId, '');
  assert.strictEqual(Object.keys(StudyDataStore.datasets).length, 0);

  const rawDm = [
    { STUDYID: 'STUDY-101', USUBJID: 'SUBJ-001', AGE: 45, SEX: 'M', ARM: 'ACTIVE' },
    { STUDYID: 'STUDY-101', USUBJID: 'SUBJ-002', AGE: 52, SEX: 'F', ARM: 'PLACEBO' },
    { STUDYID: 'STUDY-101', USUBJID: 'SUBJ-002', AGE: 52, SEX: 'F', ARM: 'PLACEBO' } // dupe record
  ];
  const cleanDm = rawDm.slice(0, 2);

  StudyDataStore.setDataset('DM', cleanDm, rawDm);
  assert.strictEqual(StudyDataStore.hasDataset('DM'), true);
  assert.strictEqual(StudyDataStore.getDataset('DM').length, 2);
  assert.strictEqual(StudyDataStore.getSourceDataset('DM').length, 3);
  assert.strictEqual(StudyDataStore.studyId, 'STUDY-101');

  // Unique subjects count
  assert.strictEqual(StudyDataStore.getUniqueSubjects().length, 2);

  StudyDataStore.removeDataset('DM');
  assert.strictEqual(StudyDataStore.hasDataset('DM'), false);
  assert.strictEqual(StudyDataStore.getUniqueSubjects().length, 0);

  StudyDataStore.clearAll();
});

// -----------------------------------------------------------------------------
// 2. LiveStudyMetricsEngine Tests
// -----------------------------------------------------------------------------
console.log('\n--- 2. LiveStudyMetricsEngine: Non-Mock Study Metrics ---');

test('Patient metric evaluates unique USUBJID hierarchy without double-counting rows', () => {
  StudyDataStore.clearAll();

  // Test with LB only (multi-row per subject)
  const lbRows = [
    { USUBJID: 'SUBJ-01', LBTESTCD: 'ALT', AVAL: 30 },
    { USUBJID: 'SUBJ-01', LBTESTCD: 'AST', AVAL: 28 },
    { USUBJID: 'SUBJ-02', LBTESTCD: 'ALT', AVAL: 45 },
    { USUBJID: 'SUBJ-02', LBTESTCD: 'AST', AVAL: 42 }
  ];
  StudyDataStore.setDataset('LB', lbRows, lbRows);

  let snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.patients.count, 2, 'Must count 2 unique subjects, NOT 4 rows');
  assert.strictEqual(snap.patients.isRowMismatch, true, 'Multi-record domain flag must be true');

  // Ingest ADSL (authoritative parent domain)
  const adslRows = [
    { USUBJID: 'SUBJ-01', ARM: 'Active', SAFFL: 'Y', ITTFL: 'Y' },
    { USUBJID: 'SUBJ-02', ARM: 'Active', SAFFL: 'Y', ITTFL: 'Y' },
    { USUBJID: 'SUBJ-03', ARM: 'Placebo', SAFFL: 'N', ITTFL: 'Y' }
  ];
  StudyDataStore.setDataset('ADSL', adslRows, adslRows);

  snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.patients.count, 3);
  assert.strictEqual(snap.patients.source, 'ADSL');
  assert.strictEqual(snap.patients.isRowMismatch, false);
});

test('Safety Population displays NOT CONFIGURED when SAFFL variable is missing', () => {
  StudyDataStore.clearAll();
  const adslNoSaffl = [
    { USUBJID: 'SUBJ-01', ARM: 'Active', ITTFL: 'Y' },
    { USUBJID: 'SUBJ-02', ARM: 'Placebo', ITTFL: 'Y' }
  ];
  StudyDataStore.setDataset('ADSL', adslNoSaffl, adslNoSaffl);

  const snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.safety.status, 'NOT CONFIGURED', 'Per Section 4, missing SAFFL must be NOT CONFIGURED');
  assert.strictEqual(snap.safety.count, null);
});

test('Safety Population correctly computes N and % when SAFFL is configured', () => {
  StudyDataStore.clearAll();
  const adslWithSaffl = [
    { USUBJID: 'SUBJ-01', ARM: 'Active', SAFFL: 'Y' },
    { USUBJID: 'SUBJ-02', ARM: 'Active', SAFFL: 'Y' },
    { USUBJID: 'SUBJ-03', ARM: 'Placebo', SAFFL: 'N' },
    { USUBJID: 'SUBJ-04', ARM: 'Placebo', SAFFL: 'Y' }
  ];
  StudyDataStore.setDataset('ADSL', adslWithSaffl, adslWithSaffl);

  const snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.safety.status, 'CONFIGURED');
  assert.strictEqual(snap.safety.count, 3);
  assert.strictEqual(snap.safety.percent, '75.0');
  assert.strictEqual(snap.safety.excludedSubjects.length, 1);
  assert.strictEqual(snap.safety.excludedSubjects[0], 'SUBJ-03');
});

test('Adverse Events metric keeps SDTM AE vs ADAE counts distinct without double-counting', () => {
  StudyDataStore.clearAll();
  const aeRows = [
    { USUBJID: 'SUBJ-01', AETERM: 'Headache', AESER: 'N' },
    { USUBJID: 'SUBJ-01', AETERM: 'Nausea', AESER: 'N' },
    { USUBJID: 'SUBJ-02', AETERM: 'Rash', AESER: 'Y' }
  ];
  StudyDataStore.setDataset('AE', aeRows, aeRows);

  let snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.adverseEvents.totalEvents, 3);
  assert.strictEqual(snap.adverseEvents.uniqueSubjects, 2);
  assert.strictEqual(snap.adverseEvents.seriousEvents, 1);
  assert.strictEqual(snap.adverseEvents.source, 'AE');

  // If ADAE is uploaded, ADAE takes precedence as analysis dataset without adding to AE
  const adaeRows = [
    { USUBJID: 'SUBJ-01', AEDECOD: 'Headache', AESER: 'N', TRTEMFL: 'Y' },
    { USUBJID: 'SUBJ-02', AEDECOD: 'Rash', AESER: 'Y', TRTEMFL: 'Y' }
  ];
  StudyDataStore.setDataset('ADAE', adaeRows, adaeRows);

  snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.adverseEvents.totalEvents, 2, 'Must use ADAE count, NOT 3 + 2 = 5');
  assert.strictEqual(snap.adverseEvents.source, 'ADAE');
  assert.strictEqual(snap.adverseEvents.treatmentEmergentEvents, 2);
});

// -----------------------------------------------------------------------------
// 3. Liver Safety / Hy's Law Engine Tests
// -----------------------------------------------------------------------------
console.log('\n--- 3. LiverSafetyEngine: Clinical Lab Threshold Screening ---');

test('LiverSafetyEngine returns NOT CONFIGURED when no lab dataset loaded', () => {
  StudyDataStore.clearAll();
  const res = LiverSafetyEngine.evaluateLiverSafety(StudyDataStore);
  assert.strictEqual(res.status, 'NOT CONFIGURED');
});

test('LiverSafetyEngine flags true Hy\'s Law case: ALT >= 3x ULN and BILI >= 2x ULN and ALP < 2x ULN', () => {
  StudyDataStore.clearAll();
  const adlbRows = [
    // Normal subject
    { USUBJID: 'SUBJ-01', PARAMCD: 'ALT', AVAL: 35, ANRHI: 50 },
    { USUBJID: 'SUBJ-01', PARAMCD: 'BILI', AVAL: 1.0, ANRHI: 1.2 },
    { USUBJID: 'SUBJ-01', PARAMCD: 'ALP', AVAL: 80, ANRHI: 120 },
    // DILI Hy's Law Subject: ALT = 200 (4x ULN), BILI = 3.6 (3x ULN), ALP = 130 (1.08x ULN)
    { USUBJID: 'SUBJ-02', PARAMCD: 'ALT', AVAL: 200, ANRHI: 50 },
    { USUBJID: 'SUBJ-02', PARAMCD: 'BILI', AVAL: 3.6, ANRHI: 1.2 },
    { USUBJID: 'SUBJ-02', PARAMCD: 'ALP', AVAL: 130, ANRHI: 120 }
  ];
  StudyDataStore.setDataset('ADLB', adlbRows, adlbRows);

  const res = LiverSafetyEngine.evaluateLiverSafety(StudyDataStore);
  assert.strictEqual(res.status, 'ALERTS FOUND');
  assert.strictEqual(res.alertCount, 1);
  assert.strictEqual(res.alerts[0].subject, 'SUBJ-02');
  assert.strictEqual(res.alerts[0].altRatio, '4.00');
  assert.strictEqual(res.alerts[0].biliRatio, '3.00');
});

// -----------------------------------------------------------------------------
// 4. RuleExecutionEngine Tests
// -----------------------------------------------------------------------------
console.log('\n--- 4. RuleExecutionEngine: Real Rule Execution (Zero Mock PASS) ---');

test('RuleExecutionEngine does not execute rules when datasets are missing, reporting NOT_APPLICABLE', () => {
  StudyDataStore.clearAll();
  const res = RuleExecutionEngine.executeRules(StudyDataStore);
  assert.strictEqual(res.summary.executed, 0);
  assert.strictEqual(res.summary.passed, 0);
  assert.strictEqual(res.summary.failed, 0);
  assert.strictEqual(res.summary.notApplicable, 6);
});

test('RuleExecutionEngine executes rules against real ADSL data and correctly fails invalid values', () => {
  StudyDataStore.clearAll();
  const invalidAdsl = [
    { USUBJID: 'SUBJ-01', AGE: 45, SEX: 'M', ARM: 'ACT' },
    { USUBJID: 'SUBJ-02', AGE: -5, SEX: 'INVALID_SEX', ARM: 'PBO' } // negative age and invalid sex
  ];
  StudyDataStore.setDataset('ADSL', invalidAdsl, invalidAdsl);

  const res = RuleExecutionEngine.executeRules(StudyDataStore);
  assert.strictEqual(res.summary.executed, 2, 'Should execute Age and Sex rules on ADSL');
  assert.strictEqual(res.summary.failed, 2, 'Both Age and Sex rules should fail');
  assert.strictEqual(res.summary.passed, 0, 'Zero fake pass results allowed');
});

// -----------------------------------------------------------------------------
// 5. TlfDrillDownEngine Tests
// -----------------------------------------------------------------------------
console.log('\n--- 5. TlfDrillDownEngine: Cell-Level Traceability ---');

test('TlfDrillDownEngine generates complete traceability payload', () => {
  const subjects = ['SUBJ-01', 'SUBJ-02'];
  const sourceRows = [
    { USUBJID: 'SUBJ-01', ARM: 'Active', SEX: 'F', AGE: 34 },
    { USUBJID: 'SUBJ-02', ARM: 'Active', SEX: 'F', AGE: 42 }
  ];
  const drill = TlfDrillDownEngine.generateDrillDownData(
    'Table 14-1',
    'Sex: Female (Active)',
    subjects,
    sourceRows,
    'Direct count',
    'SEX == "F"',
    'N = 2'
  );

  assert.strictEqual(drill.tableId, 'Table 14-1');
  assert.strictEqual(drill.totalSubjects, 2);
  assert.strictEqual(drill.totalRecords, 2);
  assert.deepStrictEqual(drill.subjects, subjects);
  assert.strictEqual(drill.filterCondition, 'SEX == "F"');
});

// -----------------------------------------------------------------------------
// 6. ExplanationContextManager Tests
// -----------------------------------------------------------------------------
console.log('\n--- 6. ExplanationContextManager: Isolated Context & Race Guard ---');

test('ExplanationContextManager isolates context and detects stale contexts', () => {
  ExplanationContextManager.clearContext();
  const ctx1 = ExplanationContextManager.createContext({ domain: 'ADSL', row: 1, variable: 'AGE' }, 'LINEAGE');
  assert.strictEqual(ctx1.isStale(), false);

  // A new request arrives (e.g. rapid clicking)
  const ctx2 = ExplanationContextManager.createContext({ domain: 'ADAE', row: 5, variable: 'AETERM' }, 'LINEAGE');
  assert.strictEqual(ctx2.isStale(), false);
  assert.strictEqual(ctx1.isStale(), true, 'ctx1 must now be stale, preventing race condition rendering');

  assert.strictEqual(ExplanationContextManager.getCurrentContext().contextId, ctx2.contextId);
  ExplanationContextManager.clearContext();
  assert.strictEqual(ExplanationContextManager.getCurrentContext(), null);
});

// -----------------------------------------------------------------------------
// 7. Verify app.js Structure & Global Functions
// -----------------------------------------------------------------------------
console.log('\n--- 7. app.js Global Handlers & Integration Verification ---');

test('app.js defines all required v11.0 functions and handlers', () => {
  const appCode = fs.readFileSync('app.js', 'utf8');

  const requiredSymbols = [
    'updateLiveStudyMetrics',
    'openMetricDrillDown',
    'closeMetricDrillDownModal',
    'triggerValidateAllData',
    'triggerQuickProfile',
    'renderTlfStudio',
    'switchTlfView',
    'openTlfCellDrillDown',
    'closeTlfDrillDownModal',
    'exportCellTraceabilityCsv',
    'openLineageExplanationModal',
    'navigateExplanationIssue',
    'closeLineageModal',
    'openWhyInspector',
    'closeReasoningTraceModal',
    'renderMetricWhyTrace',
    'COMMAND_PALETTE_ACTIONS'
  ];

  requiredSymbols.forEach(sym => {
    assert(appCode.includes(sym), `app.js must define or reference ${sym}`);
  });
});

test('public/app.js is synchronized with root app.js', () => {
  const rootApp = fs.readFileSync('app.js', 'utf8');
  const pubApp = fs.readFileSync('public/app.js', 'utf8');
  assert.strictEqual(rootApp, pubApp, 'root app.js and public/app.js must be identical');
});

test('public/index.html is synchronized with root index.html', () => {
  const rootHtml = fs.readFileSync('index.html', 'utf8');
  const pubHtml = fs.readFileSync('public/index.html', 'utf8');
  assert.strictEqual(rootHtml, pubHtml, 'root index.html and public/index.html must be identical');
});

test('Command palette includes all required clinical commands', () => {
  const appCode = fs.readFileSync('app.js', 'utf8');
  const requiredCmds = [
    '/validate-all',
    '/quick-profile',
    '/study-map',
    '/profiler',
    '/twin',
    '/double-prog',
    '/why',
    '/deep-verify',
    '/verify-study',
    '/tlf-14-1',
    '/tlf-14-2',
    '/tlf-km',
    '/tlf-lab',
    '/hys-law',
    '/fda-rules',
    '/study-lock',
    '/sys-health'
  ];

  requiredCmds.forEach(cmd => {
    assert(appCode.includes(cmd), `Command palette must include ${cmd}`);
  });
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} V11.0 FUNCTIONAL ACCURACY TESTS PASSED!`);
console.log('================================================================');
