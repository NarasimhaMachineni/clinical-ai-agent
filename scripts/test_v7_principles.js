const assert = require('assert');

// Test suite for ClinicalOps AI Agent v7.0 principles
console.log('================================================================');
console.log('🧪 RUNNING CLINICALOPS AI AGENT v7.0 ARCHITECTURE & PRINCIPLES TEST');
console.log('================================================================');

const {
  verifyAndRepairClinicalData,
  determineCdiscVariableType,
  evaluateQualityGates,
  computeDatasetHash,
  CLINICAL_RULE_REGISTRY
} = require('../engines/clinicalVerificationEngine');

// 1. Versioned Rule Registry Integrity
console.log('\n--- 1. Testing Versioned Rule Registry ---');
assert(CLINICAL_RULE_REGISTRY, 'CLINICAL_RULE_REGISTRY must exist');
const ruleKeys = Object.keys(CLINICAL_RULE_REGISTRY);
assert(ruleKeys.length >= 10, 'Rule registry must have at least 10 core CDISC/ADaM rules');
ruleKeys.forEach(k => {
  const r = CLINICAL_RULE_REGISTRY[k];
  assert(r.ruleId, `Rule ${k} must have ruleId`);
  assert(r.ruleName, `Rule ${k} must have ruleName`);
  assert(r.category, `Rule ${k} must have category`);
  assert(r.severity, `Rule ${k} must have severity`);
  assert(typeof r.autoFixAllowed === 'boolean', `Rule ${k} must declare autoFixAllowed boolean`);
});
console.log(`  ✅ PASS: Versioned Rule Registry contains ${ruleKeys.length} standard-compliant rules.`);

// 2. Cryptographic Dataset Hashing
console.log('\n--- 2. Testing Cryptographic Dataset Hashing ---');
const hash1 = computeDatasetHash([{ USUBJID: '001', AGE: 45 }]);
const hash2 = computeDatasetHash([{ USUBJID: '001', AGE: 45 }]);
const hash3 = computeDatasetHash([{ USUBJID: '001', AGE: 46 }]);
assert.strictEqual(hash1, hash2, 'Identical datasets must produce identical hashes');
assert.notStrictEqual(hash1, hash3, 'Modified datasets must produce different hashes');
assert(hash1.length >= 8, 'Hash must be at least 8 characters');
console.log(`  ✅ PASS: Deterministic dataset hashing verified (${hash1}).`);

// 3. Three Execution Modes & Source Immutability
console.log('\n--- 3. Testing 3 Execution Modes & Source Immutability ---');
const testData = [
  { USUBJID: 'SUBJ-01', AESTDTC: '2024-01-15', RFSTDTC: '2024-01-15', AESTDY: 0, AESEV: 'mild' }
];

// Mode 1: AUDIT_ONLY
const mode1 = verifyAndRepairClinicalData('AE', testData, { executionMode: 'AUDIT_ONLY' });
assert.strictEqual(mode1.cleanRows[0].AESTDY, 0, 'Mode 1 (AUDIT_ONLY) must not modify source data');
assert.strictEqual(mode1.cleanRows[0].AESEV, 'mild', 'Mode 1 must not modify case/CT');
assert(mode1.auditLog.length > 0, 'Mode 1 must still detect and log issues');
console.log('  ✅ PASS: Mode 1 (AUDIT_ONLY) performs read-only analysis without altering source records.');

// Mode 2: SUGGEST_FIXES
const mode2 = verifyAndRepairClinicalData('AE', testData, { executionMode: 'SUGGEST_FIXES' });
assert.strictEqual(mode2.cleanRows[0].AESTDY, 0, 'Mode 2 (SUGGEST_FIXES) leaves data unmodified until approval');
const dyIssue = mode2.auditLog.find(iss => iss.variable === 'AESTDY');
assert(dyIssue, 'AESTDY issue must be logged');
assert.strictEqual(dyIssue.status, 'PROPOSED', 'Mode 2 logs issues with PROPOSED status');
assert.strictEqual(dyIssue.proposedVal, 1, 'Mode 2 proposes Day 1 repair');
console.log('  ✅ PASS: Mode 2 (SUGGEST_FIXES) generates proposed values without mutating records.');

// Mode 3: CONTROLLED_AUTO_FIX
const mode3 = verifyAndRepairClinicalData('AE', testData, { executionMode: 'CONTROLLED_AUTO_FIX' });
assert.strictEqual(mode3.cleanRows[0].AESTDY, 1, 'Mode 3 (CONTROLLED_AUTO_FIX) executes approved auto-fix rules (DY=0 -> DY=1)');
assert.strictEqual(mode3.cleanRows[0].AESEV, 'MILD', 'Mode 3 executes CT standardization (mild -> MILD)');
console.log('  ✅ PASS: Mode 3 (CONTROLLED_AUTO_FIX) applies deterministic authorized rules.');

// Source Immutability Check: Ensure original testData array was NOT mutated in-place
assert.strictEqual(testData[0].AESTDY, 0, 'Original source input array must remain 100% immutable');
console.log('  ✅ PASS: Source data immutability confirmed.');

// 4. Lineage Map & Cell Traceability
console.log('\n--- 4. Testing Cell-Level Lineage Generation ---');
assert(mode3.lineageMap, 'Result must include lineageMap');
const cellLineage = mode3.lineageMap['1_AESTDY'];
assert(cellLineage, 'Lineage must be generated for modified cell 1_AESTDY');
assert(cellLineage.sourceDataset === 'AE' || cellLineage.sourceDataset === 'ADAE', 'sourceDataset must be AE or ADAE');
assert.strictEqual(cellLineage.sourceVariable, 'AESTDY');
assert.strictEqual(cellLineage.value, 1);
assert(cellLineage.derivationFormula, 'Lineage must contain derivation formula');
assert(cellLineage.ruleId, 'Lineage must contain rule ID');
assert(cellLineage.specRef, 'Lineage must contain specification reference');
assert(cellLineage.sasStatus, 'Lineage must contain SAS status');
assert(cellLineage.rStatus, 'Lineage must contain R status');
assert(cellLineage.auditId, 'Lineage must contain audit tracking ID');
console.log('  ✅ PASS: Full cell lineage generated with all 8 required traceability dimensions.');

// 5. 11 Technical Conformance Quality Gates
console.log('\n--- 5. Testing 11 Technical Conformance Quality Gates ---');
// Empty study test
const emptyGates = evaluateQualityGates({}, {}, {}, {});
assert.strictEqual(emptyGates.overallStatus, 'NOT EVALUATED', 'Empty study must return NOT EVALUATED');
assert.strictEqual(emptyGates.gates.length, 11, 'Must evaluate exactly 11 gates');
emptyGates.gates.forEach(g => {
  assert.strictEqual(g.status, 'NOT EVALUATED', `Gate ${g.id} (${g.name}) must be NOT EVALUATED when empty`);
});
console.log('  ✅ PASS: Empty study state correctly evaluates all 11 gates as NOT EVALUATED.');

// Populated study test
const populatedStudy = {
  DM: [
    { STUDYID: 'ST-01', DOMAIN: 'DM', USUBJID: 'ST-01-001', SUBJID: '001', SITEID: '01', AGE: 45, AGEU: 'YEARS', SEX: 'M', RACE: 'WHITE', ETHNIC: 'NOT HISPANIC OR LATINO', ARM: 'Active', ARMCD: 'ACT', RFSTDTC: '2024-01-01' }
  ],
  AE: [
    { STUDYID: 'ST-01', DOMAIN: 'AE', USUBJID: 'ST-01-001', AESEQ: 1, AETERM: 'Headache', AEDECOD: 'HEADACHE', AESEV: 'MILD', AESER: 'N', AESTDTC: '2024-01-02', AESTDY: 2 }
  ]
};
const activeGates = evaluateQualityGates(populatedStudy, {}, {}, { studyId: 'ST-01' });
assert.strictEqual(activeGates.gates.length, 11, 'Populated study must evaluate 11 gates');
const gate1 = activeGates.gates.find(g => g.id === 1);
assert.strictEqual(gate1.status, 'PASS', 'Gate 1 (Data Integrity) should PASS on valid data');
const gate3 = activeGates.gates.find(g => g.id === 3);
assert.strictEqual(gate3.status, 'PASS', 'Gate 3 (CDISC Conformity) should PASS on valid SDTM');
console.log(`  ✅ PASS: Populated study successfully evaluated 11 gates with live conformance metrics.`);

console.log('\n================================================================');
console.log('🎉 ALL CLINICALOPS AI AGENT v7.0 PRINCIPLE TESTS PASSED (100%)!');
console.log('================================================================');
