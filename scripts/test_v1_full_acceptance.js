const assert = require('assert');
const {
  verifyAndRepairClinicalData,
  generate16SectionDataQualityReport,
  determineCdiscVariableType,
  CLINICAL_RULE_REGISTRY
} = require('../engines/clinicalVerificationEngine');

console.log('================================================================');
console.log('🧪 RUNNING CLINICALOPS v1.0 MASTER ACCEPTANCE SUITE (39 SECTIONS)');
console.log('================================================================\n');

// 1. Full 100% cell review with no sampling
console.log('--- 1. 100% Cell Review & Immutability Check ---');
const rawDM = [
  { STUDYID: 'STUDY-101', DOMAIN: 'DM', USUBJID: '001', SUBJID: '001', RFSTDTC: '2024-01-10', BRTHDTC: '1980-01-10', AGE: ' >44 ', AGEU: 'years', SEX: 'm', ARM: 'Drug A' },
  { STUDYID: 'STUDY-101', DOMAIN: 'DM', USUBJID: '002', SUBJID: '002', RFSTDTC: '2024-01-12', BRTHDTC: '1990-05-20', AGE: '', AGEU: '', SEX: 'Female', ARM: 'Placebo' }
];

const sourceSnapshot = JSON.parse(JSON.stringify(rawDM));
const auditDM = verifyAndRepairClinicalData('DM', rawDM);

// Source data immutability:
assert.deepStrictEqual(rawDM, sourceSnapshot, 'Source data MUST NOT be mutated');
console.log('  ✅ PASS: Source data strictly immutable.');

// 100% cells audited: 2 rows * 10 columns = 20 cells
assert.strictEqual(auditDM.cellSummary.cellsAudited, 20, 'Every cell must be audited');
console.log(`  ✅ PASS: 100% of cells audited (${auditDM.cellSummary.cellsAudited} cells).`);

// 2. Harmless numeric cleaning
console.log('\n--- 2. Harmless Numeric Text Stripping (Section 9) ---');
assert.strictEqual(auditDM.cleanRows[0].AGE, 44, 'Age ">44" must be cleaned to 44');
assert.strictEqual(auditDM.cleanRows[0].AGEU, 'YEARS', 'AGEU standardized to YEARS');
assert.strictEqual(auditDM.cleanRows[0].SEX, 'M', 'SEX "m" standardized to "M"');
console.log('  ✅ PASS: Harmless text stripping and controlled terminology verified.');

// 3. Imputation of Age from Birthdate & Reference Start Date
console.log('\n--- 3. Age Imputation & Bi-Directional Mathematical Derivation ---');
assert.strictEqual(auditDM.cleanRows[1].AGE, 33, 'Age imputed from 1990-05-20 to 2024-01-12');
assert.strictEqual(auditDM.cleanRows[1].AGEU, 'YEARS', 'AGEU imputed to YEARS');
console.log('  ✅ PASS: Age accurately derived as 33 YEARS.');

// 4. Cascade Revalidation (Section 27 & 28)
console.log('\n--- 4. Cascade Revalidation for BMI and MAP ---');
const rawVS = [
  {
    STUDYID: 'STUDY-101',
    USUBJID: '001',
    PARAMCD: 'SYSBP',
    SYSBP: '120 mmHg',
    DIABP: '80',
    MAP: '999', // Discrepant MAP
    HEIGHT: '180 cm',
    WEIGHT: '75.5 kg',
    BMI: '10' // Discrepant BMI
  }
];

const auditVS = verifyAndRepairClinicalData('VS', rawVS);
// Expected BMI = 75.5 / (1.80^2) = 23.3
assert.strictEqual(auditVS.cleanRows[0].BMI, 23.3, 'BMI cascaded and revalidated to 23.3');
// Expected MAP = (2*80 + 120)/3 = 93.3
assert.strictEqual(auditVS.cleanRows[0].MAP, 93.3, 'MAP cascaded and revalidated to 93.3');
assert.strictEqual(auditVS.cleanRows[0].SYSBP, 120, 'SYSBP cleaned from text to numeric 120');
assert.strictEqual(auditVS.cleanRows[0].HEIGHT, 180, 'HEIGHT cleaned from text to numeric 180');
assert.strictEqual(auditVS.cleanRows[0].WEIGHT, 75.5, 'WEIGHT cleaned from text to numeric 75.5');
console.log('  ✅ PASS: Cascade revalidation for BMI and MAP executed with exact physiological math.');

// 5. Section 25 Uncertain Severity Detection
console.log('\n--- 5. Section 25 Uncertain Severity Rule ---');
const rawAE = [
  {
    STUDYID: 'STUDY-101',
    USUBJID: '001',
    AETERM: 'Headache',
    AESEV: 'High'
  }
];

const auditAE = verifyAndRepairClinicalData('ADAE', rawAE);
const reviewIssue = auditAE.auditLog.find(l => l.variable === 'AESEV');
assert(reviewIssue, 'Issue should be recorded for AESEV');
assert.strictEqual(reviewIssue.status, 'REVIEW_REQUIRED', 'Ambiguous High must require review');
assert.strictEqual(reviewIssue.autoFixAllowed, false, 'Auto-fix must NOT be allowed on ambiguous value');
console.log('  ✅ PASS: Ambiguous "High" correctly marked REVIEW_REQUIRED without guessing.');

// 6. Section 35 16-Section Regulatory Report
console.log('\n--- 6. Section 35 16-Section Data Quality Report ---');
const report = generate16SectionDataQualityReport(
  'DM',
  rawDM,
  auditDM.cleanRows,
  auditDM.auditLog,
  auditDM.cellAuditMatrix,
  auditDM.cellSummary
);

for (let s = 1; s <= 16; s++) {
  assert(report.includes(`## ${s}.`), `Report must include Section ${s}`);
}
console.log('  ✅ PASS: All 16 mandatory regulatory report sections verified.');

console.log('\n================================================================');
console.log('🎉 ALL CLINICALOPS v1.0 MASTER ACCEPTANCE TESTS PASSED (100%)!');
console.log('================================================================\n');
