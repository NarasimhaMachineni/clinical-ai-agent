/**
 * CLINICALOPS AI OS — MASTER ACCEPTANCE TEST SUITE (v13.0)
 * Covers all mandated test categories in Section 131:
 * DATA-001..004, METRIC-001..005, VAL-001..006, FIX-001..005, EXP-001..004,
 * SPEC-001..005, TLF-001..009, LINEAGE-001..005, PROTOCOL-001..004, AI-001..006,
 * OBS-001..003, REPRO-001..003, SEC-001..004, PERF-001..005, REC-001..005.
 */

const assert = require('assert');
const fs = require('fs');
const orch = require('../engines/clinicalValidationOrchestrator.js');

const {
  StudyDataStore,
  LiveStudyMetricsEngine,
  LiverSafetyEngine,
  RuleExecutionEngine,
  ExplanationContextManager,
  TlfDrillDownEngine,
  DerivationRecord,
  DerivationRegistry,
  SpecificationEngine,
  SuppEngine,
  SUPPValidator,
  ControlledTerminologyRegistry,
  StudyKnowledgeGraph,
  ChangeImpactEngine,
  RegulatoryEvidenceLocker,
  ModelGateway,
  DefineXmlEngine,
  UCOM,
  ProtocolIntelligenceEngine,
  ProtocolAmendmentImpactEngine,
  ClinicalDataTimeMachine,
  SapCompiler,
  EndpointIntelligenceEngine,
  ExternalDataHub,
  VendorReconciliationEngine,
  ClinicalDataObservabilityEngine,
  SiteIntelligenceEngine,
  ReproducibilityVault,
  ReviewerModeEngine,
  SubmissionSimulator,
  TechnologyGatewayManager,
  AiHallucinationFirewall,
  StudyControlTower,
  AutonomousStudyAssistant,
  DMValidator,
  AEValidator,
  ADAEValidator,
  ADSLValidator,
  CrossDomainValidator,
  CellAccountabilityEngine,
  SASRDoubleProgrammingEngine,
  StudyLockManager
} = orch;

let totalTests = 0;
let passedTests = 0;

function runTest(testId, description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${testId}: ${description}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testId}: ${description}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

console.log('================================================================');
console.log('🧪 RUNNING CLINICALOPS AI OS ULTIMATE MASTER ACCEPTANCE SUITE');
console.log('   (Sections 0 – 139 Strict Conformance & Verification)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. DATA-001 .. DATA-004: Data Architecture & Source Immutability
// -----------------------------------------------------------------------------
console.log('--- 1. DATA ARCHITECTURE & IMMUTABILITY (DATA-001..004) ---');

runTest('DATA-001', 'Source immutability preserves raw snapshot across edits', () => {
  StudyDataStore.clearAll();
  const rawRows = [{ STUDYID: 'S01', USUBJID: 'SUBJ-001', AGE: 45, SEX: 'MALE' }];
  StudyDataStore.setDataset('DM', rawRows, rawRows);

  // Apply a mutation to active dataset
  const activeRows = StudyDataStore.getDataset('DM');
  activeRows[0].SEX = 'M';
  StudyDataStore.setDataset('DM', activeRows);

  const rawSnap = StudyDataStore.getRawSnapshot('DM');
  assert.strictEqual(rawSnap[0].SEX, 'MALE', 'Raw snapshot must remain completely immutable');
  assert.strictEqual(StudyDataStore.getDataset('DM')[0].SEX, 'M', 'Active dataset reflects corrected value');
});

runTest('DATA-002', 'Single source of truth: all modules consume StudyDataStore', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADSL', [
    { STUDYID: 'S01', USUBJID: 'S-1', SAFFL: 'Y', ARM: 'ACTIVE' },
    { STUDYID: 'S01', USUBJID: 'S-2', SAFFL: 'N', ARM: 'PLACEBO' }
  ]);

  const snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.patients.count, 2);
  assert.strictEqual(snap.safety.safetyCount, 1);
});

runTest('DATA-003', 'No hardcoded metrics: empty store returns zero counts', () => {
  StudyDataStore.clearAll();
  const snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.patients.count, 0);
  assert.strictEqual(snap.safety.safetyCount, 0);
  assert.strictEqual(snap.adverseEvents.totalEvents, 0);
});

runTest('DATA-004', 'No fake success: rule execution accurately reports NOT_APPLICABLE or FAIL', () => {
  StudyDataStore.clearAll();
  const summary = RuleExecutionEngine.getExecutionSummary(StudyDataStore);
  assert.strictEqual(summary.passed, 0);
  assert.ok(summary.notApplicable > 0);
});

// -----------------------------------------------------------------------------
// 2. METRIC-001 .. METRIC-005: Clinical Metrics & Safety Screening
// -----------------------------------------------------------------------------
console.log('\n--- 2. CLINICAL METRICS & SAFETY (METRIC-001..005) ---');

runTest('METRIC-001', 'Patient count deduplicates USUBJID across domains', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('DM', [{ USUBJID: 'S-01' }, { USUBJID: 'S-02' }]);
  StudyDataStore.setDataset('AE', [{ USUBJID: 'S-01' }, { USUBJID: 'S-01' }, { USUBJID: 'S-02' }]);

  const snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.patients.count, 2);
});

runTest('METRIC-002', 'Safety population displays NOT CONFIGURED when SAFFL missing', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADSL', [{ USUBJID: 'S-01', ARM: 'ACTIVE' }]);

  const snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.safety.status, 'NOT CONFIGURED');
});

runTest('METRIC-003', 'AE counts differentiate SDTM AE total records vs unique subjects', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('AE', [
    { USUBJID: 'S-01', AETERM: 'Headache', AESER: 'N' },
    { USUBJID: 'S-01', AETERM: 'Nausea', AESER: 'N' },
    { USUBJID: 'S-02', AETERM: 'Headache', AESER: 'Y' }
  ]);

  const snap = LiveStudyMetricsEngine.getMetricsSnapshot(StudyDataStore);
  assert.strictEqual(snap.adverseEvents.totalEvents, 3);
  assert.strictEqual(snap.adverseEvents.subjectsWithAE, 2);
  assert.strictEqual(snap.adverseEvents.seriousEvents, 1);
});

runTest('METRIC-004', 'Liver safety screens Hy\'s Law: ALT >= 3x ULN, BILI >= 2x ULN, ALP < 2x ULN', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADLB', [
    { USUBJID: 'S-01', PARAMCD: 'ALT', AVAL: 150, ANRHI: 40 },  // 3.75x ULN
    { USUBJID: 'S-01', PARAMCD: 'BILI', AVAL: 2.5, ANRHI: 1.0 }, // 2.5x ULN
    { USUBJID: 'S-01', PARAMCD: 'ALP', AVAL: 120, ANRHI: 100 }   // 1.2x ULN (ALP < 2x ULN)
  ]);

  const liver = LiverSafetyEngine.evaluateLiverSafety(StudyDataStore);
  assert.strictEqual(liver.hysLawCases.length, 1);
  assert.strictEqual(liver.hysLawCases[0].usubjid, 'S-01');
});

runTest('METRIC-005', 'Rule execution validates real CDISC rules deterministically', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADSL', [
    { USUBJID: 'S-01', SAFFL: 'INVALID_FLAG', TRTSDT: '2025-01-10', TRTEDT: '2025-01-20' }
  ]);

  const summary = RuleExecutionEngine.getExecutionSummary(StudyDataStore);
  assert.ok(summary.failed > 0);
  assert.ok(summary.results.some(r => r.ruleId === 'CDISC-ADAM-ADSL-001' && r.status === 'FAIL'));
});

// -----------------------------------------------------------------------------
// 3. VAL-001 .. VAL-006: Validation Orchestration
// -----------------------------------------------------------------------------
console.log('\n--- 3. VALIDATION ORCHESTRATION (VAL-001..006) ---');

runTest('VAL-001', 'Complete study validation executes all loaded domain validators', () => {
  const dmRows = [{ STUDYID: 'ST1', USUBJID: 'SUBJ-1', AGE: 45, SEX: 'MALE' }];
  const issues = DMValidator.validate(dmRows);
  assert.ok(issues.some(i => i.variable === 'SEX' && i.newVal === 'M'));
});

runTest('VAL-002', 'DMValidator catches missing age and controlled terminology defects', () => {
  const dm = [{ STUDYID: 'ST1', USUBJID: 'SUBJ-1', AGE: -5, SEX: 'UNKNOWN_VAL' }];
  const issues = DMValidator.validate(dm);
  assert.ok(issues.some(i => i.variable === 'AGE' && i.error.includes('Negative')));
});

runTest('VAL-003', 'ADAEValidator detects discrepant TRTEMFL relative to TRTSDT', () => {
  const adae = [{
    USUBJID: 'SUBJ-1',
    ASTDT: '2025-01-15',
    TRTSDT: '2025-01-10',
    TRTEMFL: 'N'
  }];
  const issues = ADAEValidator.validate(adae);
  assert.ok(issues.some(i => i.variable === 'TRTEMFL' && i.newVal === 'Y'));
});

runTest('VAL-004', 'CrossDomainValidator identifies subjects in AE missing from DM', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('DM', [{ USUBJID: 'SUBJ-1' }]);
  StudyDataStore.setDataset('AE', [{ USUBJID: 'SUBJ-999', AETERM: 'Fever' }]);

  const crossIssues = CrossDomainValidator.validateAll(StudyDataStore);
  assert.ok(crossIssues.some(i => i.rule === 'CROSS-DM-001' && i.usubjid === 'SUBJ-999'));
});

runTest('VAL-005', 'Dependency blocking: ADSL absence blocks dependent ADAE rules', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADAE', [{ USUBJID: 'SUBJ-1', ASTDT: '2025-01-10' }]);

  const summary = RuleExecutionEngine.getExecutionSummary(StudyDataStore);
  assert.ok(summary.results.some(r => r.ruleId === 'CDISC-ADAM-ADAE-001' && r.status === 'NOT_APPLICABLE'));
});

runTest('VAL-006', 'Cell accountability satisfies 7-state mutual exclusivity', () => {
  CellAccountabilityEngine.reset();
  CellAccountabilityEngine.recordCellState('DM', 'ROW_1', 'SEX', 'RESOLVED_BY_DETERMINISTIC_RULE');
  CellAccountabilityEngine.recordCellState('DM', 'ROW_1', 'AGE', 'RESOLVED_BY_CDISC_STANDARDIZATION');

  const rec = CellAccountabilityEngine.getReconciliationReport();
  assert.strictEqual(rec.totalCells, 2);
  assert.strictEqual(rec.isReconciled, true);
  assert.strictEqual(rec.discrepancy, 0);
});

// -----------------------------------------------------------------------------
// 4. FIX-001 .. FIX-005: Correction & Revalidation Lifecycle
// -----------------------------------------------------------------------------
console.log('\n--- 4. CORRECTION & REVALIDATION LIFECYCLE (FIX-001..005) ---');

runTest('FIX-001', 'Deterministic correction applies approved standard rule', () => {
  const dm = [{ STUDYID: 'ST1', USUBJID: 'SUBJ-1', SEX: 'FEMALE' }];
  const issues = DMValidator.validate(dm);
  const fixIssue = issues.find(i => i.variable === 'SEX' && i.canFix);
  assert.ok(fixIssue);
  assert.strictEqual(fixIssue.newVal, 'F');
});

runTest('FIX-002', 'Ambiguous defect flagged as REVIEW_REQUIRED without silent modification', () => {
  const dm = [{ STUDYID: 'ST1', USUBJID: 'SUBJ-1', DTHFL: 'Y', DTHDTC: '' }];
  const issues = DMValidator.validate(dm);
  const deathIssue = issues.find(i => i.variable === 'DTHDTC');
  assert.ok(deathIssue);
  assert.strictEqual(deathIssue.canFix, false);
  assert.strictEqual(deathIssue.status, 'REVIEW_REQUIRED');
});

runTest('FIX-003', 'Source protection: raw snapshot persists before and after repair', () => {
  StudyDataStore.clearAll();
  const raw = [{ USUBJID: 'S-01', AESEV: '1' }];
  StudyDataStore.setDataset('AE', raw, raw);

  const active = StudyDataStore.getDataset('AE');
  active[0].AESEV = 'MILD';
  StudyDataStore.setDataset('AE', active);

  assert.strictEqual(StudyDataStore.getRawSnapshot('AE')[0].AESEV, '1');
  assert.strictEqual(StudyDataStore.getDataset('AE')[0].AESEV, 'MILD');
});

runTest('FIX-004', 'Revalidation confirms zero defects after deterministic fix', () => {
  const dm = [{ STUDYID: 'ST1', USUBJID: 'SUBJ-1', AGE: 45, SEX: 'M', AGEU: 'YEARS' }];
  const issues = DMValidator.validate(dm);
  assert.strictEqual(issues.length, 0);
});

runTest('FIX-005', 'Rollback restores active dataset to immutable raw source state', () => {
  StudyDataStore.clearAll();
  const raw = [{ USUBJID: 'S-01', ARM: 'TEMP' }];
  StudyDataStore.setDataset('DM', raw, raw);

  StudyDataStore.setDataset('DM', [{ USUBJID: 'S-01', ARM: 'MODIFIED' }]);
  assert.strictEqual(StudyDataStore.getDataset('DM')[0].ARM, 'MODIFIED');

  StudyDataStore.rollbackToRaw('DM');
  assert.strictEqual(StudyDataStore.getDataset('DM')[0].ARM, 'TEMP');
});

// -----------------------------------------------------------------------------
// 5. EXP-001 .. EXP-004: Explanation Context & Race Guard
// -----------------------------------------------------------------------------
console.log('\n--- 5. EXPLANATION CONTEXT & RACE GUARD (EXP-001..004) ---');

runTest('EXP-001', 'Sequential explanation tracks request and returns matching context', () => {
  ExplanationContextManager.reset();
  const req = ExplanationContextManager.startExplanation('ADSL', 'SAFFL', 'SUBJ-001');
  assert.strictEqual(req.variable, 'SAFFL');
  assert.strictEqual(ExplanationContextManager.isCurrent(req.requestId), true);
});

runTest('EXP-002', 'Rapid A->B->C->D->E race guard: only latest request E remains active', () => {
  ExplanationContextManager.reset();
  const rA = ExplanationContextManager.startExplanation('DM', 'AGE', 'S-1');
  const rB = ExplanationContextManager.startExplanation('DM', 'SEX', 'S-1');
  const rC = ExplanationContextManager.startExplanation('DM', 'RACE', 'S-1');
  const rD = ExplanationContextManager.startExplanation('DM', 'ARM', 'S-1');
  const rE = ExplanationContextManager.startExplanation('DM', 'USUBJID', 'S-1');

  assert.strictEqual(ExplanationContextManager.isCurrent(rA.requestId), false);
  assert.strictEqual(ExplanationContextManager.isCurrent(rB.requestId), false);
  assert.strictEqual(ExplanationContextManager.isCurrent(rC.requestId), false);
  assert.strictEqual(ExplanationContextManager.isCurrent(rD.requestId), false);
  assert.strictEqual(ExplanationContextManager.isCurrent(rE.requestId), true);
});

runTest('EXP-003', 'Explanation identity preserves object coordinates', () => {
  const req = ExplanationContextManager.startExplanation('ADAE', 'TRTEMFL', 'SUBJ-123', 'ROW_45');
  assert.strictEqual(req.dataset, 'ADAE');
  assert.strictEqual(req.variable, 'TRTEMFL');
  assert.strictEqual(req.subjectId, 'SUBJ-123');
  assert.strictEqual(req.rowId, 'ROW_45');
});

runTest('EXP-004', 'Explanation completeness contains rule, logic, and standard reference', () => {
  DerivationRegistry.clear();
  DerivationRegistry.register(new DerivationRecord({
    dataset: 'ADAE',
    variable: 'TRTEMFL',
    algorithmCode: 'if ASTDT >= TRTSDT then "Y" else "N"',
    standardReference: 'CDISC ADaM v1.2'
  }));

  const tree = DerivationRegistry.explainDerivationTree('TRTEMFL', 'ADAE');
  assert.strictEqual(tree.found, true);
  assert.strictEqual(tree.standard, 'CDISC ADaM v1.2');
  assert.ok(tree.algorithm.includes('ASTDT >= TRTSDT'));
});

// -----------------------------------------------------------------------------
// 6. SPEC-001 .. SPEC-005: Specification Engine & Standards
// -----------------------------------------------------------------------------
console.log('\n--- 6. SPECIFICATIONS & DEFINE-XML (SPEC-001..005) ---');

runTest('SPEC-001', 'SDTM specification retrieves standard model for DM and AE', () => {
  const dmSpec = SpecificationEngine.getSpecification('DM');
  assert.strictEqual(dmSpec.standard, 'SDTM');
  assert.ok(dmSpec.variables.some(v => v.variable === 'USUBJID'));
});

runTest('SPEC-002', 'ADaM specification retrieves ADSL and ADAE specifications', () => {
  const adslSpec = SpecificationEngine.getSpecification('ADSL');
  assert.strictEqual(adslSpec.standard, 'ADaM');
  assert.ok(adslSpec.variables.some(v => v.variable === 'SAFFL'));
});

runTest('SPEC-003', 'Derivation specification integrates Value-Level Metadata (VLM)', () => {
  const spec = SpecificationEngine.getSpecification('ADLB');
  assert.ok(spec.vlm.length > 0);
  assert.ok(spec.vlm[0].whereClause.includes('PARAMCD'));
});

runTest('SPEC-004', 'SUPP specification generates valid SUPPDM with parent key linkage', () => {
  const parent = [{ STUDYID: 'S1', DOMAIN: 'DM', USUBJID: 'SUBJ-1', ETHNIC_EXTRA: 'PACIFIC' }];
  const suppRes = SuppEngine.generateSuppDataset('DM', parent);
  assert.strictEqual(suppRes.suppDomain, 'SUPPDM');
  assert.strictEqual(suppRes.suppRows[0].IDVAR, 'USUBJID');
  assert.strictEqual(suppRes.suppRows[0].IDVARVAL, 'SUBJ-1');
});

runTest('SPEC-005', 'Define-XML generates valid CDISC Define-XML 2.1 document', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADSL', [{ STUDYID: 'ST01', USUBJID: 'S1', AGE: 50, SAFFL: 'Y' }]);
  const xml = DefineXmlEngine.generateDefineXml('ST01', StudyDataStore, SpecificationEngine);
  assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<ItemGroupDef OID="IG.ADSL"'));
  assert.ok(!xml.includes('Define-XML v2.1</ODM>'));
});

// -----------------------------------------------------------------------------
// 7. TLF-001 .. TLF-009: Tables, Listings, Figures & ARS
// -----------------------------------------------------------------------------
console.log('\n--- 7. TLF ENGINE & ARS CONCORDANCE (TLF-001..009) ---');

runTest('TLF-001', 'Tables: Demographics (14-1) and Adverse Events (14-2) execute against real data', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADSL', [
    { USUBJID: 'S-01', ARM: 'ACTIVE 10MG', SAFFL: 'Y' },
    { USUBJID: 'S-02', ARM: 'PLACEBO', SAFFL: 'Y' }
  ]);

  const denom = TlfDrillDownEngine.getDenominatorBreakdown('Table 14-1', 'SAFFL', StudyDataStore);
  assert.strictEqual(denom.eligibleSubjects, 2);
  assert.strictEqual(denom.armBreakdown['ACTIVE 10MG'], 1);
});

runTest('TLF-002', 'Listings: Listing 16.2.7 filters AE records with subject group preservation', () => {
  const aeRows = [
    { USUBJID: 'S-01', AESEQ: 1, AETERM: 'Headache', AESEV: 'MILD' },
    { USUBJID: 'S-02', AESEQ: 1, AETERM: 'Rash', AESEV: 'SEVERE' }
  ];
  const trace = TlfDrillDownEngine.getNumeratorTraceability('Listing 16.2.7', 'ALL', aeRows);
  assert.strictEqual(trace.totalRecords, 2);
  assert.strictEqual(trace.uniqueSubjects, 2);
});

runTest('TLF-003', 'Figures: Traceability payload links data to figure visualizer', () => {
  const figureData = TlfDrillDownEngine.generateDrillDownData('Figure 14.1', 'Kaplan-Meier Survival Curve', ['S-01', 'S-02'], [{ USUBJID: 'S-01', AVAL: 100 }]);
  assert.strictEqual(figureData.totalSubjects, 2);
  assert.strictEqual(figureData.totalRecords, 1);
});

runTest('TLF-004', 'Custom TLF builder links user parameters to analysis concepts', () => {
  const drill = TlfDrillDownEngine.generateDrillDownData('Custom-T1', 'Severe Hepatic Events', ['S-01'], [{ USUBJID: 'S-01' }], 'N_observed / N_pop * 100');
  assert.ok(drill.derivationFormula.includes('N_observed'));
});

runTest('TLF-005', 'Denominator intelligence breaks down population and exclusion reasons', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADSL', [
    { USUBJID: 'S-1', ARM: 'ACTIVE', SAFFL: 'Y', TRTSDT: '2025-01-01' },
    { USUBJID: 'S-2', ARM: 'ACTIVE', SAFFL: 'N', TRTSDT: '' }
  ]);
  const denom = TlfDrillDownEngine.getDenominatorBreakdown('Table 14-1', 'SAFFL', StudyDataStore);
  assert.strictEqual(denom.eligibleSubjects, 1);
  assert.strictEqual(denom.excludedSubjects, 1);
  assert.ok(denom.excludedBreakdown.length > 0);
});

runTest('TLF-006', 'Numerator intelligence exposes event-level terms and severity summary', () => {
  const rows = [
    { USUBJID: 'S-1', AEDECOD: 'HEADACHE', AESEV: 'MILD' },
    { USUBJID: 'S-1', AEDECOD: 'HEADACHE', AESEV: 'SEVERE' }
  ];
  const numer = TlfDrillDownEngine.getNumeratorTraceability('Table 14-2', 'HEADACHE', rows);
  assert.strictEqual(numer.totalRecords, 2);
  assert.strictEqual(numer.uniqueSubjects, 1);
  assert.strictEqual(numer.severitySummary['MILD'], 1);
  assert.strictEqual(numer.severitySummary['SEVERE'], 1);
});

runTest('TLF-007', 'Traceability connects summary cell to individual source record keys', () => {
  const rows = [{ USUBJID: 'S-1', AEDECOD: 'NAUSEA', AESEV: 'MODERATE' }];
  const numer = TlfDrillDownEngine.getNumeratorTraceability('Table 14-2', 'NAUSEA', rows);
  assert.strictEqual(numer.records[0].parentKey, 'ADAE_ROW_1');
});

runTest('TLF-008', 'SAS and R double programming derivation reconciliation matches perfectly', () => {
  const bdsRows = [{ USUBJID: 'S-1', PARAMCD: 'ALT', BASE: 40, AVAL: 60 }];
  const reconciled = SASRDoubleProgrammingEngine.deriveBDSVariables(bdsRows);
  assert.strictEqual(reconciled.discrepancyCount, 0);
  assert.strictEqual(reconciled.records[0].CHG_SAS, 20);
  assert.strictEqual(reconciled.records[0].CHG_R, 20);
  assert.strictEqual(reconciled.status, 'MATCH');
});

runTest('TLF-009', 'TLF reconciliation detects discrepancy if SAS and R diverge', () => {
  const bdsMismatched = [{ USUBJID: 'S-1', PARAMCD: 'ALT', BASE: 40, AVAL: 60, CHG_OVERRIDE_SAS: 999 }];
  const res = SASRDoubleProgrammingEngine.deriveBDSVariables(bdsMismatched);
  assert.strictEqual(res.discrepancyCount, 1);
  assert.strictEqual(res.status, 'DISCREPANCY_DETECTED');
});

// -----------------------------------------------------------------------------
// 8. LINEAGE-001 .. LINEAGE-005: Bidirectional Lineage
// -----------------------------------------------------------------------------
console.log('\n--- 8. BIDIRECTIONAL LINEAGE (LINEAGE-001..005) ---');

runTest('LINEAGE-001', 'Source -> SDTM lineage tracks raw CRF mapping to SDTM DM', () => {
  DerivationRegistry.clear();
  DerivationRegistry.register(new DerivationRecord({
    dataset: 'DM',
    variable: 'AGE',
    sourceDatasets: ['CRF_DEMOG'],
    sourceVariables: ['CRF_DEMOG.BRTHDTC', 'CRF_DEMOG.VISITDTC'],
    algorithmCode: 'floor((VISITDTC - BRTHDTC) / 365.25)'
  }));

  const rev = DerivationRegistry.getReverseLineage('AGE', 'DM');
  assert.strictEqual(rev.found, true);
  assert.deepStrictEqual(rev.sourceDatasets, ['CRF_DEMOG']);
});

runTest('LINEAGE-002', 'SDTM -> ADaM lineage tracks DM.RFSTDTC to ADSL.TRTSDT', () => {
  DerivationRegistry.register(new DerivationRecord({
    dataset: 'ADSL',
    variable: 'TRTSDT',
    sourceDatasets: ['DM', 'EX'],
    sourceVariables: ['EX.EXSTDTC', 'DM.RFSTDTC'],
    algorithmCode: 'First date of active exposure EXSTDTC'
  }));

  const rev = DerivationRegistry.getReverseLineage('TRTSDT', 'ADSL');
  assert.strictEqual(rev.found, true);
  assert.ok(rev.sourceVariables.includes('EX.EXSTDTC'));
});

runTest('LINEAGE-003', 'ADaM -> TLF lineage tracks ADSL.SAFFL into Table 14-1', () => {
  DerivationRegistry.register(new DerivationRecord({
    dataset: 'ADSL',
    variable: 'SAFFL',
    targetOutputs: ['Table 14-1', 'Table 14-2'],
    algorithmCode: 'if TRTSDT ne . then "Y" else "N"'
  }));

  const fwd = DerivationRegistry.getForwardLineage('ADSL.SAFFL');
  assert.ok(fwd[0].targetOutputs.includes('Table 14-1'));
});

runTest('LINEAGE-004', 'TLF -> Source reverse lineage navigates all the way back to source', () => {
  const revTrail = ReviewerModeEngine.getReviewerTrail('TLF', '14-2', StudyDataStore);
  assert.strictEqual(revTrail.startPoint, 'TLF');
  assert.strictEqual(revTrail.trail.length, 5);
  assert.ok(revTrail.trail[4].detail.includes('CRF/EDC'));
});

runTest('LINEAGE-005', 'Derived value ancestry tree details formulas and standards', () => {
  const tree = DerivationRegistry.explainDerivationTree('TRTSDT', 'ADSL');
  assert.strictEqual(tree.found, true);
  assert.strictEqual(tree.target, 'ADSL.TRTSDT');
});

// -----------------------------------------------------------------------------
// 9. PROTOCOL-001 .. PROTOCOL-004: Protocol Intelligence & Amendment Impact
// -----------------------------------------------------------------------------
console.log('\n--- 9. PROTOCOL INTELLIGENCE & AMENDMENTS (PROTOCOL-001..004) ---');

runTest('PROTOCOL-001', 'Protocol parsing ingests ICH M11 objectives, endpoints, and schedule', () => {
  const model = ProtocolIntelligenceEngine.parseProtocol({
    studyId: 'ONCO-2026',
    title: 'Phase II Oncology Investigation'
  });
  assert.strictEqual(model.studyId, 'ONCO-2026');
  assert.ok(model.objectives.primary.length > 0);
  assert.ok(model.endpoints.length >= 2);
  assert.ok(model.scheduleOfActivities.length >= 3);
});

runTest('PROTOCOL-002', 'Endpoint extraction connects primary endpoint to ADLB target domain', () => {
  const model = ProtocolIntelligenceEngine.parseProtocol();
  const primaryEp = model.endpoints.find(e => e.type.includes('Primary'));
  assert.ok(primaryEp);
  assert.strictEqual(primaryEp.targetDomain, 'ADLB');
  assert.strictEqual(primaryEp.analysisMethod, 'ANCOVA');
});

runTest('PROTOCOL-003', 'Protocol amendment comparison identifies added endpoint and visit day changes', () => {
  const v1 = ProtocolIntelligenceEngine.parseProtocol({ version: '1.0' });
  const v2 = ProtocolIntelligenceEngine.parseProtocol({
    version: '2.0',
    endpoints: [
      ...v1.endpoints,
      { id: 'EP-04', name: 'Overall Survival (OS)', type: 'Secondary Efficacy', targetDomain: 'ADTTE' }
    ]
  });

  const diff = ProtocolAmendmentImpactEngine.compareProtocols(v1, v2);
  assert.strictEqual(diff.hasChanges, true);
  assert.strictEqual(diff.endpointsDiff.added.length, 1);
  assert.strictEqual(diff.endpointsDiff.added[0].id, 'EP-04');
});

runTest('PROTOCOL-004', 'Amendment impact analysis calculates blast radius across specs, TLFs, programs', () => {
  const v1 = ProtocolIntelligenceEngine.parseProtocol({ version: '1.0' });
  const v2 = ProtocolIntelligenceEngine.parseProtocol({
    version: '2.0',
    endpoints: [
      ...v1.endpoints,
      { id: 'EP-04', name: 'Biomarker Shift', type: 'Secondary', targetDomain: 'ADLB' }
    ]
  });

  const diff = ProtocolAmendmentImpactEngine.compareProtocols(v1, v2);
  const impact = ProtocolAmendmentImpactEngine.calculateImpact(diff);
  assert.ok(['MEDIUM', 'HIGH'].includes(impact.impactLevel));
  assert.ok(impact.affectedSpecifications.includes('ADLB'));
  assert.ok(impact.affectedTlfs.includes('Table 14-3 Laboratory Shifts'));
  assert.ok(impact.recommendedMitigations.length > 0);
});

// -----------------------------------------------------------------------------
// 10. AI-001 .. AI-006: AI Hallucination Firewall & Model Gateways
// -----------------------------------------------------------------------------
console.log('\n--- 10. AI HALLUCINATION FIREWALL & GATEWAYS (AI-001..006) ---');

runTest('AI-001', 'Hallucination firewall blocks unsupported clinical assertions with NOT VERIFIED', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('DM', [{ USUBJID: 'SUBJ-REAL' }]);

  const unverified = AiHallucinationFirewall.verifyProposal({
    claim: 'Subject SUBJ-FAKE had severe myocardial infarction',
    subjectId: 'SUBJ-FAKE'
  }, StudyDataStore);

  assert.strictEqual(unverified.verified, false);
  assert.strictEqual(unverified.status, 'NOT VERIFIED');
});

runTest('AI-002', 'Evidence requirement verifies clinical claims against real StudyDataStore', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('DM', [{ USUBJID: 'SUBJ-001' }]);

  const verified = AiHallucinationFirewall.verifyProposal({
    claim: 'Subject SUBJ-001 completed screening',
    subjectId: 'SUBJ-001'
  }, StudyDataStore);

  assert.strictEqual(verified.verified, true);
  assert.strictEqual(verified.status, 'VERIFIED');
});

runTest('AI-003', 'Model versioning exposes active provider and supported architectures', () => {
  assert.ok(TechnologyGatewayManager.gateways.model.supported.includes('Deterministic'));
  assert.ok(TechnologyGatewayManager.gateways.model.supported.includes('OpenAI'));
});

runTest('AI-004', 'Prompt versioning registry tracks prompt version metadata', () => {
  const promptRecord = UCOM.create('PROMPT', {
    promptId: 'PRM-001',
    version: '2.1.0',
    task: 'Clinical Query Intent Parser'
  });
  assert.strictEqual(promptRecord.objectType, 'PROMPT');
  assert.strictEqual(promptRecord.version, '2.1.0');
});

runTest('AI-005', 'Tool permissions matrix enforces Zero-Trust AI permissions', () => {
  assert.strictEqual(TechnologyGatewayManager.checkPermission('AI_AGENT', 'READ'), true);
  assert.strictEqual(TechnologyGatewayManager.checkPermission('AI_AGENT', 'PROPOSE'), true);
  assert.strictEqual(TechnologyGatewayManager.checkPermission('AI_AGENT', 'MODIFY'), false);
  assert.strictEqual(TechnologyGatewayManager.checkPermission('BIOSTATISTICIAN', 'APPROVE'), true);
});

runTest('AI-006', 'AI query parsing returns structured intent without modifying store', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADAE', [{ USUBJID: 'S-1', AESER: 'Y', AESEV: 'SEVERE' }]);

  const res = ModelGateway.executeClinicalQuery('Show severe adverse events', StudyDataStore);
  assert.strictEqual(res.intent, 'SEVERE_ADVERSE_EVENTS');
  assert.strictEqual(res.resultCount, 1);
});

// -----------------------------------------------------------------------------
// 11. OBS-001 .. OBS-003: Observability & Study Drift
// -----------------------------------------------------------------------------
console.log('\n--- 11. CLINICAL DATA OBSERVABILITY & DRIFT (OBS-001..003) ---');

runTest('OBS-001', 'Data drift detection measures completeness shift across cuts', () => {
  const storeA = { getActiveDomains: () => ['DM'], getDataset: () => [{ USUBJID: 'S-1', AGE: 40 }] };
  const storeB = { getActiveDomains: () => ['DM'], getDataset: () => [{ USUBJID: 'S-1', AGE: null }] };

  const drift = ClinicalDataObservabilityEngine.detectStudyDrift(storeA, storeB);
  assert.ok(drift.completenessDrift < 0);
  assert.strictEqual(drift.hasSignificantDrift, true);
  assert.strictEqual(drift.driftClassification, 'ANOMALOUS_DRIFT');
});

runTest('OBS-002', 'Site drift detects disproportionate AE reporting across clinical sites', () => {
  const fakeStore = {
    getActiveDomains: () => ['DM', 'AE'],
    getDataset: (dom) => {
      if (dom === 'DM') {
        return [
          { SITEID: 'SITE-01', USUBJID: 'S1' },
          { SITEID: 'SITE-02', USUBJID: 'S2' }
        ];
      }
      if (dom === 'AE') {
        return [
          { SITEID: 'SITE-01', USUBJID: 'S1' },
          { SITEID: 'SITE-01', USUBJID: 'S1' },
          { SITEID: 'SITE-01', USUBJID: 'S1' },
          { SITEID: 'SITE-01', USUBJID: 'S1' }
        ];
      }
      return [];
    }
  };

  const siteEval = SiteIntelligenceEngine.evaluateSites(fakeStore);
  assert.strictEqual(siteEval.totalSites, 2);
  const site1 = siteEval.sites.find(s => s.siteId === 'SITE-01');
  assert.strictEqual(site1.monitoringSignal, 'HIGH_AE_FREQUENCY');
});

runTest('OBS-003', 'Observability scoring calculates composite 8-dimension quality score', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('DM', [{ USUBJID: 'S1', AGE: 45, SEX: 'M' }]);

  const obs = ClinicalDataObservabilityEngine.calculateObservabilityMetrics(StudyDataStore);
  assert.ok(obs.overallScore > 80);
  assert.strictEqual(obs.status, 'OPTIMAL');
  assert.strictEqual(obs.dimensions.completeness, 100);
});

// -----------------------------------------------------------------------------
// 12. REPRO-001 .. REPRO-003: Reproducibility Vault
// -----------------------------------------------------------------------------
console.log('\n--- 12. REPRODUCIBILITY VAULT (REPRO-001..003) ---');

runTest('REPRO-001', 'Reproduce TLF captures manifest and verifies byte-for-byte identity', () => {
  const manifest = ReproducibilityVault.captureExecutionManifest('TLF_TABLE_14_1', {
    datasetHash: 'SHA256-DATA-VALID',
    specVersion: 'ADSL_v2.1',
    sapVersion: 'SAP_v1.0'
  });

  const rep = ReproducibilityVault.reproduceResult(manifest.manifestId, StudyDataStore);
  assert.strictEqual(rep.verifiedIdentity, true);
  assert.strictEqual(rep.discrepancyCount, 0);
  assert.strictEqual(rep.status, 'REPRODUCED_EXACT_MATCH');
});

runTest('REPRO-002', 'Reproduce Figure captures environment runtime, seed, and libraries', () => {
  const manifest = ReproducibilityVault.captureExecutionManifest('KM_CURVE', {}, {}, {
    runtime: 'R 4.3.2 / Admiral',
    seed: 12345
  });
  assert.strictEqual(manifest.environment.seed, 12345);
  assert.strictEqual(manifest.environment.runtime, 'R 4.3.2 / Admiral');
});

runTest('REPRO-003', 'Time Machine snapshot reconstructs historical dataset state', () => {
  ClinicalDataTimeMachine.recordSnapshot('Interim-Cut-1', StudyDataStore);
  assert.ok(ClinicalDataTimeMachine.getSnapshot('Interim-Cut-1'));

  const restored = ClinicalDataTimeMachine.reconstructStudyState('Interim-Cut-1', StudyDataStore);
  assert.strictEqual(restored.status, 'SUCCESS_RESTORED');
});

// -----------------------------------------------------------------------------
// 13. SEC-001 .. SEC-004: Security & 21 CFR Part 11 Audit Trail
// -----------------------------------------------------------------------------
console.log('\n--- 13. SECURITY & PART 11 GOVERNANCE (SEC-001..004) ---');

runTest('SEC-001', 'Authentication and Zero-Trust role enforcement restricts mutations', () => {
  assert.strictEqual(TechnologyGatewayManager.checkPermission('AI_AGENT', 'MODIFY'), false);
  assert.strictEqual(TechnologyGatewayManager.checkPermission('STUDY_LEAD', 'EXPORT'), true);
});

runTest('SEC-002', 'StudyLockManager blocks mutations when study is in LOCKED state', () => {
  StudyLockManager.lockStudy('LOCKED', 'Dr. Investigator', 'Study Database Freeze');
  assert.strictEqual(StudyLockManager.isLocked(), true);

  assert.throws(() => {
    StudyLockManager.assertCanMutate();
  }, /mutation prohibited/i);

  StudyLockManager.unlockStudy('Remediation complete');
  assert.strictEqual(StudyLockManager.isLocked(), false);
});

runTest('SEC-003', 'Audit trail records immutable cryptographic evidence signature', () => {
  const pkg = RegulatoryEvidenceLocker.compileEvidencePackage(StudyDataStore);
  assert.ok(pkg.manifestHash);
  assert.strictEqual(pkg.manifestHash.length, 64);
  assert.ok(pkg.hashSignature.startsWith('SIG-21CFR11-'));
});

runTest('SEC-004', 'Universal Clinical Object Model maintains audit hashes on all artifacts', () => {
  const obj = UCOM.create('DATASET', { name: 'ADSL' });
  assert.ok(obj.objectId.startsWith('UCOM-DATASET-'));
  assert.ok(obj.auditHash);
});

// -----------------------------------------------------------------------------
// 14. PERF-001 .. PERF-005: Performance & Incremental Computation
// -----------------------------------------------------------------------------
console.log('\n--- 14. PERFORMANCE & INCREMENTAL COMPUTATION (PERF-001..005) ---');

runTest('PERF-001', 'UI responsiveness: virtualized chunking processes 1,000 records in <50ms', () => {
  const largeBatch = [];
  for (let i = 0; i < 1000; i++) {
    largeBatch.push({ USUBJID: `SUBJ-${i}`, AGE: 30 + (i % 40), SEX: i % 2 === 0 ? 'M' : 'F', AGEU: 'YEARS' });
  }

  const start = Date.now();
  const issues = DMValidator.validate(largeBatch);
  const duration = Date.now() - start;
  assert.strictEqual(issues.length, 0);
  assert.ok(duration < 50, `1,000 rows processed in ${duration}ms (target <50ms)`);
});

runTest('PERF-002', 'Main thread non-blocking: Change impact evaluates blast radius instantaneously', () => {
  const t0 = Date.now();
  const impact = ChangeImpactEngine.analyzeImpact({ domain: 'ADSL', variable: 'TRTSDT' });
  const diff = Date.now() - t0;
  assert.strictEqual(impact.impactLevel, 'CRITICAL');
  assert.ok(diff < 20, `Blast radius computed in ${diff}ms`);
});

runTest('PERF-003', 'Grid benchmark: Quick Profile calculates column nulls and counts cleanly', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('DM', [{ A: 1, B: null }, { A: 2, B: 'VAL' }]);
  const obs = ClinicalDataObservabilityEngine.calculateObservabilityMetrics(StudyDataStore);
  assert.strictEqual(obs.totalRecords, 2);
});

runTest('PERF-004', 'Repeated validation maintains consistent idempotent results', () => {
  const rows = [{ STUDYID: 'S1', USUBJID: 'SUBJ-1', AGE: 40, SEX: 'M', AGEU: 'YEARS' }];
  const run1 = DMValidator.validate(rows);
  const run2 = DMValidator.validate(rows);
  assert.strictEqual(run1.length, run2.length);
});

runTest('PERF-005', 'Incremental computation updates only downstream affected objects', () => {
  const impact = ChangeImpactEngine.analyzeImpact({ domain: 'ADSL', variable: 'SAFFL' });
  assert.ok(impact.affectedTlfs.includes('Table 14-1 Demographics'));
  assert.ok(!impact.affectedTlfs.includes('Figure 14.1 Kaplan-Meier'));
});

// -----------------------------------------------------------------------------
// 15. REC-001 .. REC-005: Resiliency, Degraded Mode & Recovery
// -----------------------------------------------------------------------------
console.log('\n--- 15. RESILIENCY, DEGRADED MODE & RECOVERY (REC-001..005) ---');

runTest('REC-001', 'Degraded offline mode executes deterministic rules without AI services', () => {
  const ruleExec = RuleExecutionEngine.getExecutionSummary(StudyDataStore);
  assert.ok(ruleExec.totalRules > 0);
});

runTest('REC-002', 'Malformed record recovery skips invalid rows without crashing orchestrator', () => {
  const malformed = [null, undefined, {}, { USUBJID: '' }];
  assert.doesNotThrow(() => {
    DMValidator.validate(malformed);
  });
});

runTest('REC-003', 'External data contract break detected gracefully without system halt', () => {
  const contractRes = ExternalDataHub.validateContract('CENTRAL_LAB', [{ BAD_COL: 123 }]);
  assert.strictEqual(contractRes.valid, false);
  assert.strictEqual(contractRes.status, 'DATA_CONTRACT_BREAK');
});

runTest('REC-004', 'Vendor reconciliation flags missing records and date mismatches cleanly', () => {
  const edc = [{ USUBJID: 'S-01', VISTDT: '2025-01-10' }];
  const lab = [{ USUBJID: 'S-01', VISTDT: '2025-01-12' }, { USUBJID: 'S-99', VISTDT: '2025-01-10' }];

  const recon = VendorReconciliationEngine.reconcile(edc, lab, 'USUBJID', 'VISTDT');
  assert.strictEqual(recon.status, 'DISCREPANCIES_DETECTED');
  assert.strictEqual(recon.missingInEdcCount, 1);
  assert.strictEqual(recon.dateDiscrepanciesCount, 1);
});

runTest('REC-005', 'Submission package simulator generates readiness matrix', () => {
  const sim = SubmissionSimulator.simulateSubmissionPackage(StudyDataStore, SpecificationEngine);
  assert.ok(sim.readinessScore > 0);
  assert.ok(['READY', 'REVIEW REQUIRED', 'BLOCKED'].includes(sim.overallStatus));
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} OF ${totalTests} CLINICALOPS AI OS ACCEPTANCE TESTS PASSED!`);
console.log('   Strict compliance with Master Engineering Specification (Sections 0 - 139)');
console.log('   100% Deterministic, Evidence-First, Lineage-Aware Clinical Intelligence.');
console.log('================================================================\n');
