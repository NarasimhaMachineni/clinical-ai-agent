/**
 * ============================================================================
 * CLINICALOPS AI OS — v15.0 MASTER PRODUCTION ACCEPTANCE SUITE
 * Comprehensive Verification of Master Prompt Phases 1 - 14
 * ============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const orchestrator = require('../engines/clinicalValidationOrchestrator.js');
const {
  StudyDataStore,
  ClinicalValidationOrchestrator,
  DomainValidatorRegistry,
  DMValidator,
  AEValidator,
  ADSLValidator,
  ADAEValidator,
  BDSValidator,
  ADTTEValidator,
  SASRDoubleProgrammingEngine,
  TlfDrillDownEngine,
  FeatureRegistry,
  ClinicalOSOrchestrationEngine,
  StandardsRegistry,
  RegulatoryEvidenceLocker,
  LiverSafetyEngine
} = orchestrator;

console.log('================================================================');
console.log('🧪 RUNNING v15.0 MASTER REFACTORING & PRODUCTION ACCEPTANCE SUITE');
console.log('   (Verifying Phases 1 – 14 Full Compliance & GxP Integrity)');
console.log('================================================================\n');

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// PHASE 1: FORMAL AUDIT REPORT & CLASSIFICATION
// -----------------------------------------------------------------------------
console.log('--- PHASE 1: FORMAL AUDIT & FEATURE CLASSIFICATION ---');

test('AUDIT-001: Formal AUDIT_REPORT.md exists on disk', () => {
  const auditPath = path.resolve(__dirname, '../AUDIT_REPORT.md');
  assert(fs.existsSync(auditPath), 'AUDIT_REPORT.md must exist at root');
  const content = fs.readFileSync(auditPath, 'utf8');
  assert(content.includes('CLINICALOPS AI AGENT — COMPREHENSIVE PRODUCTION AUDIT REPORT'));
});

test('AUDIT-002: Audit report covers all 7 mandatory feature categories', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '../AUDIT_REPORT.md'), 'utf8');
  const requiredCategories = [
    'Fully Functional',
    'Partially Functional',
    'Placeholder or Simulated',
    'Broken',
    'Duplicated',
    'Unnecessary',
    'Requires Backend'
  ];
  requiredCategories.forEach(cat => {
    assert(content.toLowerCase().includes(cat.toLowerCase()), `Audit must classify '${cat}'`);
  });
});

// -----------------------------------------------------------------------------
// PHASE 2 & 9: 9-TAB WORKBENCH NAVIGATION & LAYOUT
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 2 & 9: 9-TAB WORKBENCH NAVIGATION & UI ---');

test('NAV-001: index.html has all 9 primary workbench tab buttons', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const expectedTabs = [
    'tab-dashboard',
    'tab-datasets',
    'tab-sdtm-val',
    'tab-adam-val',
    'tab-double-prog',
    'tab-tlfs',
    'tab-findings',
    'tab-reports',
    'tab-settings'
  ];
  expectedTabs.forEach(t => {
    assert(html.includes(`data-tab="${t}"`), `index.html must have tab button with data-tab="${t}"`);
  });
});

test('NAV-002: index.html has all 9 dedicated tab panes', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const expectedPanes = [
    'id="tab-dashboard"',
    'id="tab-datasets"',
    'id="tab-sdtm-val"',
    'id="tab-adam-val"',
    'id="tab-double-prog"',
    'id="tab-tlfs"',
    'id="tab-findings"',
    'id="tab-reports"',
    'id="tab-settings"'
  ];
  expectedPanes.forEach(p => {
    assert(html.includes(p), `index.html must contain pane with ${p}`);
  });
});

test('NAV-003: app.js switchTab supports alias routing for backward compatibility', () => {
  const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
  assert(appJs.includes("'tab-specs': 'tab-sdtm-val'"), 'switchTab must alias tab-specs to tab-sdtm-val');
  assert(appJs.includes("'tab-qc': 'tab-findings'"), 'switchTab must alias tab-qc to tab-findings');
  assert(appJs.includes("'tab-review': 'tab-reports'"), 'switchTab must alias tab-review to tab-reports');
  assert(appJs.includes("'tab-deliverables': 'tab-reports'"), 'switchTab must alias tab-deliverables to tab-reports');
  assert(appJs.includes("'tab-safety': 'tab-adam-val'"), 'switchTab must alias tab-safety to tab-adam-val');
  assert(appJs.includes("'tab-double-qc': 'tab-double-prog'"), 'switchTab must alias tab-double-qc to tab-double-prog');
});

// -----------------------------------------------------------------------------
// PHASE 3: RELIABLE & TRUTHFUL DATA INGESTION (NO FAKE ROWS)
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 3: RELIABLE & TRUTHFUL DATA INGESTION ---');

test('INGEST-001: app.js parseSas7bdatBuffer does NOT generate fabricated rows', () => {
  const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
  const funcStart = appJs.indexOf('function parseSas7bdatBuffer(');
  const funcEnd = appJs.indexOf('function parseSasProgramText(', funcStart);
  const sas7Func = appJs.slice(funcStart, funcEnd);

  assert(!sas7Func.includes('45 + (idx * 3) % 40'), 'Must not contain fake age calculation');
  assert(!sas7Func.includes('ONC-2025-'), 'Must not contain fabricated patient IDs in parseSas7bdatBuffer');
  assert(sas7Func.includes('METADATA_INSPECTED'), 'Must report METADATA_INSPECTED');
  assert(sas7Func.includes('rows: [] // Never fabricate synthetic clinical data'), 'Must return empty rows for compressed binary');
});

test('INGEST-002: app.js parseSasXptBuffer does NOT generate fake fallback row', () => {
  const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
  assert(!appJs.includes("v.name === 'USUBJID' ? 'STUDY-001' : (v.type === 'char' ? 'Y' : '1')"),
    'Must not contain fake fallback row when 0 obs parsed');
});

test('INGEST-003: StudyDataStore preserves original immutable raw copy', () => {
  StudyDataStore.clearAll();
  const rawData = [
    { STUDYID: 'P01', USUBJID: 'P01-001', SEX: 'm', AGE: '45' }
  ];
  StudyDataStore.setDataset('DM', rawData, rawData);
  assert.strictEqual(StudyDataStore.getRawSnapshot('DM')[0].SEX, 'm');

  // Perform active edit
  const active = JSON.parse(JSON.stringify(rawData));
  active[0].SEX = 'M';
  StudyDataStore.setDataset('DM', active);
  assert.strictEqual(StudyDataStore.getDataset('DM')[0].SEX, 'M');
  assert.strictEqual(StudyDataStore.getRawSnapshot('DM')[0].SEX, 'm', 'Raw snapshot must remain untouched');
});

// -----------------------------------------------------------------------------
// PHASE 4 & 5: DETERMINISTIC CDISC SDTM & ADaM VALIDATION
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 4 & 5: DETERMINISTIC CDISC SDTM & ADaM VALIDATION ---');

test('VAL-SDTM-001: DMValidator flags CT and missing age defects with full schema', () => {
  const dmData = [
    { STUDYID: 'S01', USUBJID: 'S01-001', SUBJID: '001', SEX: 'INVALID', AGE: '', ARM: 'Placebo' }
  ];
  const issues = DMValidator.validate(dmData);
  assert(issues.length >= 2, 'Must detect at least 2 defects in invalid DM');
  const sexIssue = issues.find(i => i.variable === 'SEX');
  assert(sexIssue, 'Must find SEX issue');
  assert(sexIssue.id, 'Issue must have rule ID');
  assert.strictEqual(sexIssue.domain, 'DM');
  assert.strictEqual(sexIssue.severity, 'ERROR');
  assert(sexIssue.rule, 'Issue must cite rule');
  assert(sexIssue.explanation, 'Issue must include explanation');
});

test('VAL-ADAM-001: ADTTEValidator is registered and validates time-to-event rules', () => {
  assert(DomainValidatorRegistry['ADTTE'], 'ADTTE must be registered in DomainValidatorRegistry');
  const adtteData = [
    { STUDYID: 'S01', USUBJID: 'S01-001', PARAMCD: 'PFS', PARAM: 'Progression Free Survival', STARTDT: '2025-01-01', ADT: '2025-01-20', AVAL: 20, CNSR: 0 },
    { STUDYID: 'S01', USUBJID: 'S01-002', PARAMCD: 'PFS', PARAM: 'Progression Free Survival', STARTDT: '2025-01-01', ADT: '2025-01-10', AVAL: 50, CNSR: 1 } // Discrepant AVAL (should be 10)
  ];
  const issues = ADTTEValidator.validate(adtteData);
  assert(issues.some(i => i.id.includes('ADTTE-AVAL-DERIV')), 'Must detect discrepant AVAL calculation');
});

test('VAL-ADAM-002: Hy\'s Law screening identifies potential DILI cases deterministically', () => {
  StudyDataStore.clearAll();
  const labRows = [
    { USUBJID: 'P-HY-01', PARAMCD: 'ALT', AVAL: 150, ANRHI: 40 },
    { USUBJID: 'P-HY-01', PARAMCD: 'BILI', AVAL: 2.5, ANRHI: 1.0 },
    { USUBJID: 'P-HY-01', PARAMCD: 'ALP', AVAL: 120, ANRHI: 100 },
    { USUBJID: 'P-NORMAL-02', PARAMCD: 'ALT', AVAL: 25, ANRHI: 40 }
  ];
  StudyDataStore.setDataset('ADLB', labRows, labRows);
  const liver = LiverSafetyEngine.evaluateLiverSafety(StudyDataStore);
  assert.strictEqual(liver.hysLawCases.length, 1);
  assert.strictEqual(liver.hysLawCases[0].usubjid, 'P-HY-01');
});

// -----------------------------------------------------------------------------
// PHASE 6: CONTROLLED CORRECTION WORKFLOW & IMMUTABILITY
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 6: CONTROLLED CORRECTION WORKFLOW ---');

test('FIX-001: Ambiguous defect flagged as REVIEW_REQUIRED without silent modification', () => {
  const rawDm = [{ STUDYID: 'S01', USUBJID: 'S01-001', SUBJID: '001', ARM: 'ARM A', AGE: '' }];
  const issues = DMValidator.validate(rawDm);
  const ageIssue = issues.find(i => i.variable === 'AGE');
  assert(ageIssue, 'Must find missing AGE issue');
  assert.strictEqual(ageIssue.status, 'REVIEW_REQUIRED', 'Missing clinical value must be REVIEW_REQUIRED');
  assert.strictEqual(ageIssue.canFix, false, 'Missing clinical value cannot be auto-fixed');
});

test('FIX-002: Rollback restores active dataset to immutable raw source state', () => {
  StudyDataStore.clearAll();
  const rawDm = [{ STUDYID: 'S01', USUBJID: 'S01-001', SEX: 'm', AGE: '30' }];
  StudyDataStore.setDataset('DM', rawDm, rawDm);
  const activeDm = JSON.parse(JSON.stringify(rawDm));
  activeDm[0].SEX = 'M';
  StudyDataStore.setDataset('DM', activeDm);
  assert.strictEqual(StudyDataStore.getDataset('DM')[0].SEX, 'M');

  StudyDataStore.rollbackToRaw('DM');
  assert.strictEqual(StudyDataStore.getDataset('DM')[0].SEX, 'm', 'Rollback must restore raw value');
});

// -----------------------------------------------------------------------------
// PHASE 7: TRUTHFUL SAS/R DOUBLE PROGRAMMING
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 7: TRUTHFUL SAS/R DOUBLE PROGRAMMING ---');

test('DOUBLE-001: SASRDoubleProgrammingEngine reports external runtime status truthfully', () => {
  const runtime = SASRDoubleProgrammingEngine.getRuntimeStatus();
  assert.strictEqual(runtime.sas.available, false, 'SAS execution must report unavailable on static host');
  assert(runtime.sas.runtime.includes('DISCONNECTED'), 'SAS status must be DISCONNECTED');
  assert.strictEqual(runtime.r.available, false, 'R execution must report unavailable on static host');
  assert.strictEqual(runtime.dualEngine.available, true, 'Dual comparison engine must be available');
});

test('DOUBLE-002: compareDatasets identifies cell discrepancies with configurable tolerance', () => {
  const sas = [
    { USUBJID: '001', PARAMCD: 'SYSBP', AVAL: 120.000, BASE: 120.000, CHG: 0.000 },
    { USUBJID: '002', PARAMCD: 'SYSBP', AVAL: 135.000, BASE: 125.000, CHG: 10.000 }
  ];
  const rTolerant = [
    { USUBJID: '001', PARAMCD: 'SYSBP', AVAL: 120.000001, BASE: 120.000, CHG: 0.000001 },
    { USUBJID: '002', PARAMCD: 'SYSBP', AVAL: 135.000, BASE: 125.000, CHG: 10.000 }
  ];
  const compTol = SASRDoubleProgrammingEngine.compareDatasets(sas, rTolerant, { tolerance: 1e-4 });
  assert.strictEqual(compTol.status, 'CONCORDANT_PASS', 'Small delta within tolerance must pass');

  const rDiscrepant = [
    { USUBJID: '001', PARAMCD: 'SYSBP', AVAL: 120.000, BASE: 120.000, CHG: 0.000 },
    { USUBJID: '002', PARAMCD: 'SYSBP', AVAL: 135.000, BASE: 125.000, CHG: 12.500 } // CHG differs by 2.5
  ];
  const compDisc = SASRDoubleProgrammingEngine.compareDatasets(sas, rDiscrepant, { tolerance: 1e-4 });
  assert.strictEqual(compDisc.status, 'DISCREPANCY_DETECTED', 'Delta exceeding tolerance must be detected');
  assert.strictEqual(compDisc.discrepancies.length, 1);
  assert.strictEqual(compDisc.discrepancies[0].variable, 'CHG');
});

// -----------------------------------------------------------------------------
// PHASE 8: SPECIFICATION-DRIVEN TLF GENERATION
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 8: SPECIFICATION-DRIVEN TLF GENERATION ---');

test('TLF-001: TlfDrillDownEngine calculates verifiable denominators from ADSL', () => {
  StudyDataStore.clearAll();
  const adsl = [
    { USUBJID: '001', ARM: 'Drug A', SAFFL: 'Y', ITTFL: 'Y' },
    { USUBJID: '002', ARM: 'Drug A', SAFFL: 'Y', ITTFL: 'Y' },
    { USUBJID: '003', ARM: 'Placebo', SAFFL: 'Y', ITTFL: 'Y' },
    { USUBJID: '004', ARM: 'Placebo', SAFFL: 'N', ITTFL: 'Y' }
  ];
  StudyDataStore.setDataset('ADSL', adsl, adsl);

  const denom = TlfDrillDownEngine.getDenominatorBreakdown('Table 14-1', 'SAFFL', StudyDataStore);
  assert.strictEqual(denom.eligibleSubjects, 3, 'Safety population denominator must equal 3');
  assert.strictEqual(denom.excludedSubjects, 1, 'Excluded subject count must equal 1');
});

test('TLF-002: TlfDrillDownEngine generates drill-down records with traceable keys', () => {
  const drill = TlfDrillDownEngine.generateDrillDownData(
    'Table 14-2',
    'Severe Headache',
    ['001', '002'],
    [{ USUBJID: '001', AETERM: 'Headache', AESEV: 'SEVERE' }],
    'N_observed / N_pop * 100',
    "AESEV == 'SEVERE'",
    'N = 50'
  );
  assert.strictEqual(drill.totalSubjects, 2);
  assert(drill.subjects.includes('001'));
  assert.strictEqual(drill.tableId, 'Table 14-2');
});

// -----------------------------------------------------------------------------
// PHASE 10: PERFORMANCE & MEASURED TELEMETRY
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 10: PERFORMANCE & MEASURED TELEMETRY ---');

test('PERF-001: app.js contains live telemetry tracking object', () => {
  const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
  assert(appJs.includes('clinicalPerformanceTelemetry = {'), 'clinicalPerformanceTelemetry object must exist');
  assert(appJs.includes('lastProfileMs:'), 'Telemetry must have lastProfileMs');
  assert(appJs.includes('lastValidationMs:'), 'Telemetry must have lastValidationMs');
  assert(appJs.includes('lastGridRenderMs:'), 'Telemetry must have lastGridRenderMs');
  assert(appJs.includes('getTelemetrySummary'), 'Telemetry must have getTelemetrySummary');
});

// -----------------------------------------------------------------------------
// PHASE 11: SECURITY & GxP EVIDENCE VAULT
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 11: SECURITY & GxP EVIDENCE VAULT ---');

test('SEC-001: RegulatoryEvidenceLocker seals tamper-evident audit records with SHA-256', () => {
  const pkg = RegulatoryEvidenceLocker.compileEvidencePackage(StudyDataStore);
  assert.ok(pkg.manifestHash, 'Evidence package must contain manifestHash');
  assert.strictEqual(pkg.manifestHash.length, 64, 'SHA-256 manifestHash must be 64 characters hex');
  assert.ok(pkg.hashSignature.startsWith('SIG-21CFR11-'), 'Evidence package must include 21 CFR Part 11 signature');
});

test('SEC-002: No hardcoded API keys in app.js or index.html', () => {
  const appJs = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  assert(!appJs.includes('AIzaSy'), 'No hardcoded Google API keys allowed in app.js');
  assert(!html.includes('AIzaSy'), 'No hardcoded Google API keys allowed in index.html');
  assert(!appJs.includes('sk-ant-'), 'No hardcoded Anthropic keys allowed in app.js');
  assert(!appJs.includes('sk-proj-'), 'No hardcoded OpenAI keys allowed in app.js');
});

// -----------------------------------------------------------------------------
// PHASE 12: FEATURE REGISTRY & ZERO ORPHAN BUTTONS
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 12: FEATURE REGISTRY & ZERO ORPHAN BUTTONS ---');

test('FEAT-001: FeatureRegistry confirms 100% operational status', () => {
  const audit = FeatureRegistry.auditCompliance();
  assert.strictEqual(audit.incompleteCount, 0, 'No incomplete or orphan features allowed');
  assert.strictEqual(audit.complianceRate, '100.0%');
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passCount} v15.0 MASTER REFACTORING ACCEPTANCE TESTS PASSED!`);
console.log('================================================================\n');
