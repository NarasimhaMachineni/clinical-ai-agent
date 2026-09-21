const assert = require('assert');
const { verifyAndRepairClinicalData, determineCdiscVariableType } = require('../engines/clinicalVerificationEngine');

console.log('================================================================');
console.log('🧪 RUNNING DM & UNIVERSAL MISSING DATA IMPUTATION TEST SUITE');
console.log('================================================================');

// 1. Test CDISC Variable Typing
console.log('\n--- 1. Testing Num vs Char Typing & Safeguards ---');
const subjidType = determineCdiscVariableType('SUBJID', ['001', '002', '003']);
assert.strictEqual(subjidType.type, 'Char', 'SUBJID must be Char');
assert.strictEqual(subjidType.isNumeric, false, 'SUBJID is not numeric');

const siteidType = determineCdiscVariableType('SITEID', ['01', '02']);
assert.strictEqual(siteidType.type, 'Char', 'SITEID must be Char');

const ageuType = determineCdiscVariableType('AGEU', ['YEARS', 'YEARS']);
assert.strictEqual(ageuType.type, 'Char', 'AGEU must be Char');

const ageType = determineCdiscVariableType('AGE', [45, 52]);
assert.strictEqual(ageType.type, 'Num', 'AGE must be Num');

const avalType = determineCdiscVariableType('AVAL', [120.5, 130.2]);
assert.strictEqual(avalType.type, 'Num', 'AVAL must be Num');

console.log('  ✅ PASS: SUBJID, SITEID, AGEU correctly classified as Char; AGE, AVAL classified as Num.');

// 2. Test DM Dataset with Intentional Mistakes
console.log('\n--- 2. Testing DM Dataset with Mistakes ---');
const testDm = [
  {
    STUDYID: '',
    DOMAIN: '',
    USUBJID: 'ONC-001-01-001',
    SUBJID: '001',
    SITEID: '01',
    BRTHDTC: '1982-04-12',
    AGE: '',
    AGEU: '',
    SEX: '',
    RACE: 'WHITE',
    ETHNIC: '',
    ARMCD: 'PBO',
    ARM: '',
    ACTARMCD: '',
    ACTARM: '',
    COUNTRY: 'USA',
    RFSTDTC: '2024-01-15'
  },
  {
    STUDYID: 'ONC-001',
    DOMAIN: 'DM',
    USUBJID: 'ONC-001-01-002',
    SUBJID: '002',
    SITEID: '01',
    BRTHDTC: '1975-08-20',
    AGE: '45 yrs',
    AGEU: 'YRS',
    SEX: 'MALE',
    RACE: '',
    ETHNIC: 'HISPANIC',
    ARMCD: '',
    ARM: 'Active 100mg',
    ACTARMCD: '',
    ACTARM: '',
    COUNTRY: '',
    RFSTDTC: '15-JAN-2024'
  },
  {
    STUDYID: 'ONC-001',
    DOMAIN: 'DM',
    USUBJID: 'ONC-001-02-003',
    SUBJID: '003',
    SITEID: '02',
    BRTHDTC: '',
    AGE: 50,
    AGEU: 'YEARS',
    SEX: 'N',
    RACE: 'CAUCASIAN',
    ETHNIC: 'NOT HISPANIC',
    ARMCD: 'ACT',
    ARM: 'Active 100mg',
    ACTARMCD: 'ACT',
    ACTARM: 'Active 100mg',
    COUNTRY: 'USA',
    RFSTDTC: '2024-02-01'
  }
];

const dmResult = verifyAndRepairClinicalData('DM', testDm);
const row1 = dmResult.cleanRows[0];
const row2 = dmResult.cleanRows[1];
const row3 = dmResult.cleanRows[2];

// Check Row 1
assert.strictEqual(row1.STUDYID, 'ONC-001', 'Row 1 STUDYID extracted from USUBJID');
assert.strictEqual(row1.DOMAIN, 'DM', 'Row 1 DOMAIN populated as DM');
assert.strictEqual(row1.SUBJID, '001', 'Row 1 SUBJID preserves leading zeros as string');
assert.strictEqual(row1.SITEID, '01', 'Row 1 SITEID preserves leading zeros as string');
assert.strictEqual(row1.AGE, 41, 'Row 1 AGE exactly calculated: floor((2024-01-15 - 1982-04-12)/365.25) = 41');
assert.strictEqual(row1.AGEU, 'YEARS', 'Row 1 AGEU standardized to YEARS');
assert.strictEqual(row1.ARM, 'Placebo', 'Row 1 ARM derived from ARMCD PBO');
assert.strictEqual(row1.ACTARM, 'Placebo', 'Row 1 ACTARM derived from ARM Placebo');
assert.strictEqual(row1.ACTARMCD, 'PBO', 'Row 1 ACTARMCD derived from ACTARM Placebo');
assert.strictEqual(row1.ETHNIC, 'HISPANIC OR LATINO', 'Row 1 ETHNIC standardized to CDISC CT');
assert.strictEqual(row1.SAFFL, undefined, 'Pure SDTM DM does not have SAFFL injected');

console.log('  ✅ PASS: Row 1 all mistakes repaired with exact calculations.');

// Check Row 2
assert.strictEqual(row2.SUBJID, '002', 'Row 2 SUBJID preserves leading zeros');
assert.strictEqual(row2.RFSTDTC, '2024-01-15', 'Row 2 RFSTDTC normalized from 15-JAN-2024');
assert.strictEqual(row2.AGE, 48, 'Row 2 AGE corrected from 45 to exact 48 from BRTHDTC');
assert.strictEqual(row2.AGEU, 'YEARS', 'Row 2 AGEU standardized from YRS');
assert.strictEqual(row2.SEX, 'M', 'Row 2 SEX standardized from MALE');
assert.strictEqual(row2.ETHNIC, 'HISPANIC OR LATINO', 'Row 2 ETHNIC standardized from HISPANIC');
assert.strictEqual(row2.ARMCD, 'ACT', 'Row 2 ARMCD derived from ARM');
assert.strictEqual(row2.ACTARM, 'Active 100mg', 'Row 2 ACTARM derived from ARM');
assert.strictEqual(row2.ACTARMCD, 'ACT', 'Row 2 ACTARMCD derived from ACTARM');
assert.strictEqual(row2.COUNTRY, 'USA', 'Row 2 COUNTRY imputed from site hierarchy');

console.log('  ✅ PASS: Row 2 date, age discrepancy, codes, and ethnicity standardized.');

// Check Row 3
assert.strictEqual(row3.SUBJID, '003', 'Row 3 SUBJID preserves leading zeros');
assert.strictEqual(row3.BRTHDTC, '1974-01-01', 'Row 3 BRTHDTC calculated from RFSTDTC (2024) - AGE (50) = 1974');
assert.strictEqual(row3.SEX, 'M', 'Row 3 SEX healed from corrupted N to M');
assert.strictEqual(row3.RACE, 'WHITE', 'Row 3 RACE standardized from CAUCASIAN');
assert.strictEqual(row3.ETHNIC, 'NOT HISPANIC OR LATINO', 'Row 3 ETHNIC standardized from NOT HISPANIC');

console.log('  ✅ PASS: Row 3 missing BRTHDTC inverse derivation and CT repair.');

// 3. Test Explanations in Audit Trail
console.log('\n--- 3. Testing Audit Trail Explanations ---');
dmResult.auditLog.forEach(item => {
  assert(item.row > 0, 'Audit item has row number');
  assert(item.variable, 'Audit item has variable name');
  assert(item.error, 'Audit item has error description');
  assert(item.newVal !== undefined, 'Audit item has newVal');
  assert(item.justification && item.justification.length > 10, `Audit item for ${item.variable} has detailed explanation`);
  assert(item.method, `Audit item for ${item.variable} has method name`);
  assert.strictEqual(item.status, 'FIXED', 'Audit item status is FIXED');
});
console.log(`  ✅ PASS: All ${dmResult.auditLog.length} audit trail entries contain comprehensive justifications and methodologies.`);

// 4. Test Arbitrary Raw Dataset Missing Value Imputation
console.log('\n--- 4. Testing Arbitrary Raw Dataset Universal Imputation ---');
const rawData = [
  { SUBJID: '101', VISIT: 'Baseline', SYSBP: '120', DIABP: '80', LABVAL: 5.4, REMARK: 'Normal' },
  { SUBJID: '102', VISIT: 'Baseline', SYSBP: '135', DIABP: '88', LABVAL: '', REMARK: '' },
  { SUBJID: '103', VISIT: 'Week 4', SYSBP: '', DIABP: '', LABVAL: 6.2, REMARK: 'Check again' }
];

const rawResult = verifyAndRepairClinicalData('RAW_DATA', rawData);
assert.strictEqual(rawResult.cleanRows[1].LABVAL, 5.8, 'LABVAL row 2 imputed to median (5.8)');
assert.strictEqual(rawResult.cleanRows[1].REMARK, 'Normal', 'REMARK row 2 imputed to mode (Normal)');
assert.strictEqual(rawResult.cleanRows[2].SYSBP, 127.5, 'SYSBP row 3 imputed to median (127.5)');
assert.strictEqual(rawResult.cleanRows[2].DIABP, 84, 'DIABP row 3 imputed to median (84)');

console.log('  ✅ PASS: 100% of missing cells in arbitrary raw dataset accurately calculated, filled, and explained.');

console.log('\n================================================================');
console.log('🎉 ALL DM & UNIVERSAL IMPUTATION TESTS PASSED (100%)!');
console.log('================================================================');
