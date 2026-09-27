const assert = require('assert');
const fs = require('fs');

console.log('================================================================');
console.log('🧪 RUNNING V12.0 NEXT-GEN MASTER PLATFORM TEST SUITE');
console.log('   (Lineage, Specifications, SUPP, Denominators, Evidence Locker,');
console.log('    Controlled Terminology, Knowledge Graph, Model Gateway, Define-XML)');
console.log('================================================================');

// Load ClinicalValidationOrchestrator
const orch = require('../engines/clinicalValidationOrchestrator.js');
const {
  StudyDataStore,
  DerivationRecord,
  DerivationRegistry,
  SpecificationEngine,
  SuppEngine,
  SUPPValidator,
  TlfDrillDownEngine,
  ControlledTerminologyRegistry,
  StudyKnowledgeGraph,
  ChangeImpactEngine,
  RegulatoryEvidenceLocker,
  ModelGateway,
  DefineXmlEngine,
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
// 1. DerivationRecord & DerivationRegistry Tests
// -----------------------------------------------------------------------------
console.log('\n--- 1. DerivationRecord & DerivationRegistry (Bidirectional Lineage) ---');

test('DerivationRecord validates required fields on construction', () => {
  assert.throws(() => {
    new DerivationRecord({});
  }, /Missing mandatory DerivationRecord fields/);

  const rec = new DerivationRecord({
    targetDomain: 'ADAE',
    targetVariable: 'TRTEMFL',
    derivationType: 'LOGICAL_DERIVATION',
    sourceVariables: ['AE.AESTDTC', 'ADSL.TRTSDT'],
    derivationRule: 'AESTDTC >= TRTSDT',
    algorithmCode: "r.TRTEMFL = r.AESTDTC >= r.TRTSDT ? 'Y' : 'N'",
    standardReference: 'CDISC ADaM v1.2'
  });

  assert.strictEqual(rec.targetDomain, 'ADAE');
  assert.strictEqual(rec.targetVariable, 'TRTEMFL');
  assert.strictEqual(rec.sourceVariables.length, 2);
  assert.strictEqual(rec.derivationType, 'LOGICAL_DERIVATION');
});

test('DerivationRegistry registers derivations and supports forward & reverse lineage', () => {
  DerivationRegistry.clear();

  const rec1 = new DerivationRecord({
    targetDomain: 'ADSL',
    targetVariable: 'AGE',
    derivationType: 'CALCULATED_INTERVAL',
    sourceVariables: ['DM.BRTHDTC', 'DM.RFSTDTC'],
    derivationRule: 'floor((RFSTDTC - BRTHDTC) / 365.25)',
    algorithmCode: "floor((RFSTDTC - BRTHDTC) / 365.25)",
    standardReference: 'CDISC ADaM ADSL v1.2'
  });

  const rec2 = new DerivationRecord({
    targetDomain: 'ADAE',
    targetVariable: 'TRTEMFL',
    derivationType: 'LOGICAL_DERIVATION',
    sourceVariables: ['AE.AESTDTC', 'ADSL.TRTSDT'],
    derivationRule: 'AESTDTC >= TRTSDT',
    algorithmCode: "r.TRTEMFL = r.AESTDTC >= r.TRTSDT ? 'Y' : 'N'",
    standardReference: 'CDISC ADaM v1.2'
  });

  DerivationRegistry.registerDerivation(rec1);
  DerivationRegistry.registerDerivation(rec2);

  assert.strictEqual(DerivationRegistry.getAllDerivations().length, 2);

  // Reverse lineage: target -> sources
  const revAge = DerivationRegistry.getReverseLineage('AGE', 'ADSL');
  assert.strictEqual(revAge.found, true);
  assert.deepStrictEqual(revAge.sourceVariables, ['DM.BRTHDTC', 'DM.RFSTDTC']);

  // Forward lineage: source -> targets
  const fwdTrtsdt = DerivationRegistry.getForwardLineage('ADSL.TRTSDT');
  assert.strictEqual(fwdTrtsdt.length, 1);
  assert.strictEqual(fwdTrtsdt[0].targetVariable, 'TRTEMFL');

  // Ancestry explanation tree
  const tree = DerivationRegistry.explainDerivationTree('TRTEMFL', 'ADAE');
  assert.strictEqual(tree.found, true);
  assert.strictEqual(tree.target, 'ADAE.TRTEMFL');
  assert.strictEqual(tree.standard, 'CDISC ADaM v1.2');
  assert.strictEqual(tree.sourceVariables.length, 2);
});

// -----------------------------------------------------------------------------
// 2. SpecificationEngine Tests
// -----------------------------------------------------------------------------
console.log('\n--- 2. SpecificationEngine (SDTM & ADaM Data Models, VLM, Diff) ---');

test('SpecificationEngine initializes with reference models and retrieves them', () => {
  const adslSpec = SpecificationEngine.getSpecification('ADSL');
  assert.ok(adslSpec);
  assert.strictEqual(adslSpec.domain, 'ADSL');
  assert.strictEqual(adslSpec.standard, 'ADaM');
  assert.ok(adslSpec.variables.length > 5);

  const dmSpec = SpecificationEngine.getSpecification('DM');
  assert.ok(dmSpec);
  assert.strictEqual(dmSpec.domain, 'DM');
  assert.strictEqual(dmSpec.standard, 'SDTM');
});

test('SpecificationEngine supports VLM (Value-Level Metadata) and custom specs', () => {
  const customSpec = {
    domain: 'ADLB',
    standard: 'ADaM',
    variables: [
      { variable: 'STUDYID', core: 'Req', type: 'Char', length: 20 },
      { variable: 'USUBJID', core: 'Req', type: 'Char', length: 40 },
      { variable: 'PARAMCD', core: 'Req', type: 'Char', length: 8 },
      { variable: 'AVAL', core: 'Req', type: 'Num', length: 8 },
      { variable: 'BASE', core: 'Exp', type: 'Num', length: 8 }
    ],
    vlm: [
      { targetVar: 'AVAL', whereClause: 'PARAMCD == "ALT"', dataType: 'Float', length: 8, origin: 'Derived', derivation: 'LBSTRESN' },
      { targetVar: 'AVAL', whereClause: 'PARAMCD == "AST"', dataType: 'Float', length: 8, origin: 'Derived', derivation: 'LBSTRESN' }
    ]
  };

  SpecificationEngine.setSpecification('ADLB', customSpec);
  const retrieved = SpecificationEngine.getSpecification('ADLB');
  assert.strictEqual(retrieved.variables.length, 5);
  assert.strictEqual(retrieved.vlm.length, 2);
  assert.strictEqual(retrieved.vlm[0].whereClause, 'PARAMCD == "ALT"');
});

test('SpecificationEngine performs structured version comparison diff', () => {
  const v1 = {
    domain: 'ADSL',
    variables: [
      { variable: 'STUDYID', core: 'Req', type: 'Char', length: 20 },
      { variable: 'USUBJID', core: 'Req', type: 'Char', length: 40 },
      { variable: 'AGE', core: 'Exp', type: 'Num', length: 8 }
    ]
  };

  const v2 = {
    domain: 'ADSL',
    variables: [
      { variable: 'STUDYID', core: 'Req', type: 'Char', length: 20 },
      { variable: 'USUBJID', core: 'Req', type: 'Char', length: 40 },
      { variable: 'AGE', core: 'Req', type: 'Num', length: 8 }, // modified core
      { variable: 'SAFFL', core: 'Req', type: 'Char', length: 1 } // added
    ]
  };

  const diff = SpecificationEngine.compareSpecifications('ADSL', v1, v2);
  assert.strictEqual(diff.identical, false);
  assert.deepStrictEqual(diff.addedVariables, ['SAFFL']);
  assert.strictEqual(diff.removedVariables.length, 0);
  assert.strictEqual(diff.modifiedVariables.length, 1);
  assert.strictEqual(diff.modifiedVariables[0].variable, 'AGE');
  assert.strictEqual(diff.modifiedVariables[0].changes.core.from, 'Exp');
  assert.strictEqual(diff.modifiedVariables[0].changes.core.to, 'Req');
});

test('SpecificationEngine exports specification to JSON and CSV', () => {
  const jsonExport = SpecificationEngine.exportSpecification('ADSL', 'JSON');
  assert.ok(jsonExport.includes('"domain": "ADSL"'));

  const csvExport = SpecificationEngine.exportSpecification('ADSL', 'CSV');
  assert.ok(csvExport.includes('Variable,Label,Type,Length,Core'));
  assert.ok(csvExport.includes('STUDYID'));
});

// -----------------------------------------------------------------------------
// 3. SuppEngine & SUPPValidator Tests
// -----------------------------------------------------------------------------
console.log('\n--- 3. SuppEngine & SUPPValidator (Supplemental Qualifiers) ---');

test('SuppEngine correctly classifies standard vs non-standard variables', () => {
  assert.strictEqual(SuppEngine.classifyColumn('DM', 'USUBJID').isSupp, false);
  assert.strictEqual(SuppEngine.classifyColumn('DM', 'AGE').isSupp, false);
  assert.strictEqual(SuppEngine.classifyColumn('DM', 'DM_NON_STD_QUAL').isSupp, true);
  assert.strictEqual(SuppEngine.classifyColumn('AE', 'AE_LONG_VARIABLE_NAME').isSupp, true);
});

test('SuppEngine generates standard SUPP dataset with parent key linkage', () => {
  const parentDm = [
    { STUDYID: 'CDISC01', DOMAIN: 'DM', USUBJID: 'SUBJ-01', DMSEQ: 1, AGE: 45, SEX: 'M', ETHNIC_SUBGROUP: 'ASIAN_PACIFIC' },
    { STUDYID: 'CDISC01', DOMAIN: 'DM', USUBJID: 'SUBJ-02', DMSEQ: 2, AGE: 50, SEX: 'F', ETHNIC_SUBGROUP: 'HISPANIC_CARIB' }
  ];

  const suppResult = SuppEngine.generateSuppDataset('DM', parentDm);
  assert.strictEqual(suppResult.suppDomain, 'SUPPDM');
  assert.strictEqual(suppResult.suppRows.length, 2);

  const row1 = suppResult.suppRows[0];
  assert.strictEqual(row1.STUDYID, 'CDISC01');
  assert.strictEqual(row1.RDOMAIN, 'DM');
  assert.strictEqual(row1.USUBJID, 'SUBJ-01');
  assert.strictEqual(row1.IDVAR, 'USUBJID');
  assert.strictEqual(row1.IDVARVAL, 'SUBJ-01');
  assert.strictEqual(row1.QNAM, 'ETHNIC_S'); // 8 chars slice
  assert.strictEqual(row1.QVAL, 'ASIAN_PACIFIC');
  assert.strictEqual(row1.QORIG, 'CRF');
});

test('SUPPValidator validates compliance against CDISC SDTM SUPP rules', () => {
  const validSupp = [
    { STUDYID: 'CDISC01', RDOMAIN: 'DM', USUBJID: 'SUBJ-01', IDVAR: 'USUBJID', IDVARVAL: 'SUBJ-01', QNAM: 'ETHNICS', QVAL: 'ASIAN', QORIG: 'CRF' }
  ];
  const parent = [{ USUBJID: 'SUBJ-01' }];

  const resValid = SUPPValidator.validateSuppDataset('SUPPDM', validSupp, parent);
  assert.strictEqual(resValid.valid, true);
  assert.strictEqual(resValid.errors.length, 0);

  // Invalid: QNAM exceeds 8 characters and lowercase
  const invalidSupp = [
    { STUDYID: 'CDISC01', RDOMAIN: 'DM', USUBJID: 'SUBJ-01', IDVAR: 'DMSEQ', IDVARVAL: '1', QNAM: 'VERYLONGQNAM', QVAL: 'VAL', QORIG: 'CRF' }
  ];
  const resInvalid = SUPPValidator.validateSuppDataset('SUPPDM', invalidSupp, parent);
  assert.strictEqual(resInvalid.valid, false);
  assert.ok(resInvalid.errors.some(e => e.includes('exceeds 8 characters')));
});

// -----------------------------------------------------------------------------
// 4. TLF Denominator & Numerator Intelligence Tests
// -----------------------------------------------------------------------------
console.log('\n--- 4. TLF Denominator & Numerator Intelligence ---');

test('TlfDrillDownEngine calculates denominator breakdown and reasons for exclusion', () => {
  StudyDataStore.clearAll();
  const adslRows = [
    { STUDYID: 'STUDY01', USUBJID: 'SUBJ-001', ARM: 'ACTIVE 10MG', SAFFL: 'Y', TRTSDT: '2025-01-10' },
    { STUDYID: 'STUDY01', USUBJID: 'SUBJ-002', ARM: 'ACTIVE 10MG', SAFFL: 'Y', TRTSDT: '2025-01-12' },
    { STUDYID: 'STUDY01', USUBJID: 'SUBJ-003', ARM: 'PLACEBO', SAFFL: 'Y', TRTSDT: '2025-01-11' },
    { STUDYID: 'STUDY01', USUBJID: 'SUBJ-004', ARM: 'PLACEBO', SAFFL: 'N', TRTSDT: '' }, // Excluded: missing TRTSDT
    { STUDYID: 'STUDY01', USUBJID: 'SUBJ-005', ARM: 'SCRNFAIL', SAFFL: 'N', TRTSDT: '' } // Excluded: screen fail
  ];
  StudyDataStore.setDataset('ADSL', adslRows, adslRows);

  const denom = TlfDrillDownEngine.getDenominatorBreakdown('Table 14-1', 'ACTIVE 10MG', StudyDataStore);
  assert.strictEqual(denom.tableId, 'Table 14-1');
  assert.strictEqual(denom.populationFlag, 'SAFFL');
  assert.strictEqual(denom.totalStudySubjects, 5);
  assert.strictEqual(denom.eligibleSubjects, 3);
  assert.strictEqual(denom.excludedSubjects, 2);
  assert.strictEqual(denom.armBreakdown['ACTIVE 10MG'], 2);
  assert.strictEqual(denom.armBreakdown['PLACEBO'], 1);
  assert.strictEqual(denom.excludedBreakdown.length > 0, true);
});

test('TlfDrillDownEngine provides event-level numerator traceability', () => {
  const aeRows = [
    { USUBJID: 'SUBJ-001', AETERM: 'Headache', AEDECOD: 'HEADACHE', AESEV: 'MILD', AESER: 'N', AESEQ: 1, AESTDTC: '2025-01-15', AEENDTC: '2025-01-16' },
    { USUBJID: 'SUBJ-001', AETERM: 'Headache', AEDECOD: 'HEADACHE', AESEV: 'MODERATE', AESER: 'N', AESEQ: 2, AESTDTC: '2025-02-01', AEENDTC: '2025-02-02' },
    { USUBJID: 'SUBJ-002', AETERM: 'Nausea', AEDECOD: 'NAUSEA', AESEV: 'SEVERE', AESER: 'Y', AESEQ: 1, AESTDTC: '2025-01-20', AEENDTC: '2025-01-25' }
  ];

  const numer = TlfDrillDownEngine.getNumeratorTraceability('Table 14-2', 'Headache', aeRows);
  assert.strictEqual(numer.totalRecords, 3);
  assert.strictEqual(numer.uniqueSubjects, 2);
  assert.strictEqual(numer.eventTermsSummary['HEADACHE'], 2);
  assert.strictEqual(numer.eventTermsSummary['NAUSEA'], 1);
  assert.strictEqual(numer.severitySummary['MILD'], 1);
  assert.strictEqual(numer.severitySummary['MODERATE'], 1);
  assert.strictEqual(numer.severitySummary['SEVERE'], 1);
  assert.strictEqual(numer.records.length, 3);
});

// -----------------------------------------------------------------------------
// 5. ControlledTerminologyRegistry Tests
// -----------------------------------------------------------------------------
console.log('\n--- 5. ControlledTerminologyRegistry (CDISC Standards) ---');

test('ControlledTerminologyRegistry has version metadata and validates terms', () => {
  assert.ok(ControlledTerminologyRegistry.version.includes('P62 Baseline'));

  // Valid terms
  const validSex = ControlledTerminologyRegistry.validateTerm('SEX', 'M');
  assert.strictEqual(validSex.valid, true);
  assert.strictEqual(validSex.cCode, 'C20197');

  const validSexF = ControlledTerminologyRegistry.validateTerm('SEX', 'F');
  assert.strictEqual(validSexF.valid, true);
  assert.strictEqual(validSexF.cCode, 'C16576');

  const validSev = ControlledTerminologyRegistry.validateTerm('AESEV', 'SEVERE');
  assert.strictEqual(validSev.valid, true);
  assert.strictEqual(validSev.cCode, 'C48664');

  const validFatal = ControlledTerminologyRegistry.validateTerm('AEOUT', 'FATAL');
  assert.strictEqual(validFatal.valid, true);
  assert.strictEqual(validFatal.cCode, 'C48275');

  // Invalid term
  const invalidSex = ControlledTerminologyRegistry.validateTerm('SEX', 'MALE');
  assert.strictEqual(invalidSex.valid, false);
  assert.ok(invalidSex.suggestions.includes('M'));
});

// -----------------------------------------------------------------------------
// 6. StudyKnowledgeGraph & ChangeImpactEngine Tests
// -----------------------------------------------------------------------------
console.log('\n--- 6. StudyKnowledgeGraph & ChangeImpactEngine (Blast Radius) ---');

test('StudyKnowledgeGraph maps relationships and ChangeImpactEngine computes blast radius', () => {
  StudyKnowledgeGraph.clear();
  StudyKnowledgeGraph.buildDefaultClinicalGraph();

  assert.ok(StudyKnowledgeGraph.getNode('DOMAIN:ADSL'));
  assert.ok(StudyKnowledgeGraph.getNode('VAR:TRTSDT'));

  const impact = ChangeImpactEngine.analyzeImpact({ domain: 'ADSL', variable: 'TRTSDT' });
  assert.strictEqual(impact.variable, 'TRTSDT');
  assert.strictEqual(impact.impactLevel, 'CRITICAL');
  assert.ok(impact.affectedDerivations.some(d => d.targetVar === 'SAFFL'));
  assert.ok(impact.affectedDerivations.some(d => d.targetVar === 'TRTEMFL'));
  assert.ok(impact.affectedTlfs.length >= 2);
  assert.ok(impact.recommendedActions.length >= 2);
});

// -----------------------------------------------------------------------------
// 7. RegulatoryEvidenceLocker Tests
// -----------------------------------------------------------------------------
console.log('\n--- 7. RegulatoryEvidenceLocker (Cryptographic Audit & PRE-LOCK) ---');

test('RegulatoryEvidenceLocker compiles cryptographic package and evaluates Pre-Lock Readiness', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADSL', [
    { STUDYID: 'ST01', USUBJID: 'SUBJ-1', SAFFL: 'Y' },
    { STUDYID: 'ST01', USUBJID: 'SUBJ-2', SAFFL: 'Y' }
  ], [
    { STUDYID: 'ST01', USUBJID: 'SUBJ-1', SAFFL: 'Y' },
    { STUDYID: 'ST01', USUBJID: 'SUBJ-2', SAFFL: 'Y' }
  ]);

  const pkg = RegulatoryEvidenceLocker.compileEvidencePackage(StudyDataStore);
  assert.ok(pkg.manifestHash);
  assert.strictEqual(pkg.manifestHash.length, 64); // SHA-256
  assert.ok(pkg.packageId.startsWith('GXP-EVID-'));

  const preLock = RegulatoryEvidenceLocker.evaluatePreLockReadiness(StudyDataStore);
  assert.ok(['READY', 'REVIEW REQUIRED', 'BLOCKED'].includes(preLock.overallStatus));
  assert.ok(preLock.checks.length >= 4);
});

// -----------------------------------------------------------------------------
// 8. ModelGateway & Natural Language Clinical Query Tests
// -----------------------------------------------------------------------------
console.log('\n--- 8. ModelGateway (Deterministic Natural Language Clinical Queries) ---');

test('ModelGateway parses clinical queries deterministically against StudyDataStore', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADAE', [
    { USUBJID: 'S-01', AESEV: 'SEVERE', AEDECOD: 'HEPATOTOXICITY', AESER: 'Y' },
    { USUBJID: 'S-02', AESEV: 'MODERATE', AEDECOD: 'HEADACHE', AESER: 'N' },
    { USUBJID: 'S-03', AESEV: 'SEVERE', AEDECOD: 'NAUSEA', AESER: 'N' }
  ]);

  // Query 1: Severe adverse events
  const q1 = ModelGateway.executeClinicalQuery('Show subjects with severe adverse events', StudyDataStore);
  assert.strictEqual(q1.intent, 'SEVERE_ADVERSE_EVENTS');
  assert.strictEqual(q1.resultCount, 2);
  assert.deepStrictEqual(q1.subjects, ['S-01', 'S-03']);
  assert.strictEqual(q1.domain, 'ADAE');

  // Query 2: Serious adverse events (SAE)
  const q2 = ModelGateway.executeClinicalQuery('Which subjects experienced SAEs?', StudyDataStore);
  assert.strictEqual(q2.intent, 'SERIOUS_ADVERSE_EVENTS');
  assert.strictEqual(q2.resultCount, 1);
  assert.deepStrictEqual(q2.subjects, ['S-01']);

  // Query 3: Cohort size
  const q3 = ModelGateway.executeClinicalQuery('How many total patients are enrolled?', StudyDataStore);
  assert.strictEqual(q3.intent, 'TOTAL_PATIENTS_COUNT');
  assert.strictEqual(q3.resultCount, 3);
});

// -----------------------------------------------------------------------------
// 9. DefineXmlEngine Live Generation Tests
// -----------------------------------------------------------------------------
console.log('\n--- 9. DefineXmlEngine (CDISC Define-XML 2.1 Live Generation) ---');

test('DefineXmlEngine generates structured Define-XML 2.1 document from StudyDataStore', () => {
  StudyDataStore.clearAll();
  StudyDataStore.setDataset('ADSL', [
    { STUDYID: 'STUDY001', USUBJID: 'S1', AGE: 45, SEX: 'M', SAFFL: 'Y' }
  ]);
  StudyDataStore.setDataset('ADAE', [
    { STUDYID: 'STUDY001', USUBJID: 'S1', AETERM: 'Rash', AESEV: 'MILD', TRTEMFL: 'Y' }
  ]);

  const xml = DefineXmlEngine.generateDefineXml('STUDY001', StudyDataStore, SpecificationEngine);
  assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<ODM xmlns="http://www.cdisc.org/ns/odm/v1.3"'));
  assert.ok(xml.includes('<MetaDataVersion'));
  assert.ok(xml.includes('<ItemGroupDef OID="IG.ADSL"'));
  assert.ok(xml.includes('<ItemGroupDef OID="IG.ADAE"'));
  assert.ok(xml.includes('<ItemRef ItemOID="IT.USUBJID"'));
  assert.ok(!xml.includes('<?xml version="1.0"?><ODM>Define-XML v2.1</ODM>')); // No static stub!
});

// -----------------------------------------------------------------------------
// 10. Zero Mock / HTML Reactive Badges Tests
// -----------------------------------------------------------------------------
console.log('\n--- 10. Reactive UI Badges & Zero Synthetic Mock Verification ---');

test('HTML default states do not display hardcoded 100% GxP Validated badges without data', () => {
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  
  // Verify that the static 100% badges are replaced with reactive elements
  assert.ok(htmlContent.includes('id="review-gxp-badge"'));
  assert.ok(htmlContent.includes('STATUS: NOT EVALUATED'));
  assert.ok(htmlContent.includes('id="badge-pin-conformance"'));
  assert.ok(htmlContent.includes('GxP: AWAITING EVALUATION'));
  assert.ok(htmlContent.includes('id="tlf-concordance-badge"'));
  assert.ok(htmlContent.includes('TLF AUDIT: AWAITING AUDIT'));

  // Ensure public/index.html matches index.html
  const publicHtml = fs.readFileSync('public/index.html', 'utf8');
  assert.strictEqual(htmlContent, publicHtml);
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} OF ${totalTests} V12.0 PLATFORM TESTS PASSED!`);
console.log('   Strict GxP compliance, zero synthetic metrics, single store,');
console.log('   full forward/reverse derivation lineage, and specification engine.');
console.log('================================================================\n');
