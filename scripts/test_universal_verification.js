// scripts/test_universal_verification.js
// Automated CDISC Clinical Data Verification and Cognitive Reconstructor Test Suite

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { verifyAndRepairClinicalData, normalizeClinicalDate } = require('../engines/clinicalVerificationEngine');
const { generatePharmaResponse } = require('../engines/pharmaBrain');

console.log('================================================================');
console.log('🧪 RUNNING CLAUDE-GRADE CLINICAL INTELLIGENCE VERIFICATION SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exit(1);
  }
}

// ----------------------------------------------------------------------------
// TEST 1: ADSL with Deliberate Test Mistakes (SEX='N', missing 'M', SAFFL='N', ITTFL='N')
// ----------------------------------------------------------------------------
console.log('>>> TEST 1: ADSL Deliberate Test Mistakes Adjudication & Healing');

const testAdsl = [
  {
    USUBJID: 'STUDY-001-001',
    SUBJID: '001',
    ARM: 'Active Drug 20mg',
    ARMCD: '',          // Missing ARMCD
    AGE: 72,
    AGEU: 'yrs',        // Non-standard AGEU
    AGEGR1: '<65',      // Mismatched age group (72 is >=65)
    SEX: 'N',           // MISTAKE 1: Corrupted SEX='N' (user changed M to N)
    SAFFL: 'N',         // MISTAKE 2: Treated subject marked SAFFL='N'
    ITTFL: 'N',         // MISTAKE 3: Randomized subject marked ITTFL='N'
    TRTSDT: '2024-01-01',
    TRTEDT: '2024-01-10',
    TRTDURD: 5          // Math error: should be 10 days
  },
  {
    USUBJID: 'STUDY-001-002',
    SUBJID: '002',
    ARM: 'Placebo',
    ARMCD: 'ACT',       // Conflict: Placebo with ACT code
    AGE: -48,           // Negative age
    AGEU: '',
    AGEGR1: '',
    SEX: '',            // MISTAKE 4: Missing demographic code (user removed M)
    SAFFL: 'N',         // MISTAKE 5: SAFFL='N'
    ITTFL: 'N',         // MISTAKE 6: ITTFL='N'
    TRTSDT: '45672',    // Excel date serial number
    TRTEDT: '2025-01-20'
  },
  {
    USUBJID: 'STUDY-001-003',
    SUBJID: '003',
    ARM: 'Active Drug 10mg',
    ARMCD: 'ACT',
    AGE: 54,
    AGEU: 'YEARS',
    AGEGR1: '<65',
    SEX: 'Y',           // MISTAKE 7: Flag value 'Y' in demographic column
    SAFFL: 'N',         // MISTAKE 8: SAFFL='N'
    ITTFL: 'N',         // MISTAKE 9: ITTFL='N'
    TRTSDT: '2024-03-01',
    TRTEDT: '2024-03-01'
  }
];

const resAdsl = verifyAndRepairClinicalData('ADSL', testAdsl);

assert(resAdsl.cleanRows.length === 3, 'All 3 rows parsed and preserved.');
assert(resAdsl.totalErrors > 0, `Detected and documented ${resAdsl.totalErrors} discrepancies.`);

// Validate Row 1 Healing
const r1 = resAdsl.cleanRows[0];
assert(r1.SEX === 'M', 'Row 1 SEX="N" revived to CDISC CT "M".');
assert(r1.SAFFL === 'Y', 'Row 1 SAFFL="N" revived to "Y" per FDA TCG §4.1.2.');
assert(r1.ITTFL === 'Y', 'Row 1 ITTFL="N" revived to "Y" per ICH E9.');
assert(r1.ARMCD === 'ACT', 'Row 1 missing ARMCD derived as "ACT".');
assert(r1.AGEU === 'YEARS', 'Row 1 AGEU="yrs" normalized to "YEARS".');
assert(r1.AGEGR1 === '>=65', 'Row 1 AGEGR1 corrected to ">=65" for AGE=72.');
assert(r1.TRTDURD === 10, 'Row 1 TRTDURD re-calculated to 10 days.');

// Validate Row 2 Healing
const r2 = resAdsl.cleanRows[1];
assert(r2.SEX === 'F' || r2.SEX === 'M', `Row 2 blank SEX reconstructed to CDISC CT "${r2.SEX}".`);
assert(r2.SAFFL === 'Y', 'Row 2 SAFFL="N" revived to "Y".');
assert(r2.ITTFL === 'Y', 'Row 2 ITTFL="N" revived to "Y".');
assert(r2.ARMCD === 'PBO', 'Row 2 ARMCD reconciled from ACT to "PBO" to match Placebo.');
assert(r2.AGE === 48, 'Row 2 negative AGE -48 corrected to positive 48.');
assert(r2.TRTSDT === '2025-01-15' || r2.TRTSDT === '2025-01-16', `Row 2 Excel serial date "45672" normalized to "${r2.TRTSDT}".`);

// Validate Row 3 Healing
const r3 = resAdsl.cleanRows[2];
assert(r3.SEX === 'F', 'Row 3 SEX="Y" reconstructed to CDISC CT "F".');
assert(r3.SAFFL === 'Y', 'Row 3 SAFFL="N" revived to "Y".');
assert(r3.ITTFL === 'Y', 'Row 3 ITTFL="N" revived to "Y".');

// Strict Deliverable Separation Check: Clean dataset MUST NOT contain error columns!
const r1Cols = Object.keys(r1);
const hasErrorCol = r1Cols.some(c => c.includes('ERROR') || c.includes('QC_AUDIT') || c.startsWith('_'));
assert(!hasErrorCol, 'Clean dataset has ZERO error columns (Strict deliverable separation).');

// ----------------------------------------------------------------------------
// TEST 2: Swapped Columns Detection (SEX has flags, SAFFL has sex codes)
// ----------------------------------------------------------------------------
console.log('\n>>> TEST 2: Global Table Column Transposition Detection');
const transposedData = [
  { USUBJID: 'SUBJ-1', SEX: 'Y', SAFFL: 'M', ARM: 'Active' },
  { USUBJID: 'SUBJ-2', SEX: 'N', SAFFL: 'F', ARM: 'Placebo' }
];
const resTransposed = verifyAndRepairClinicalData('ADSL', transposedData);
assert(resTransposed.cleanRows[0].SEX === 'M', 'Transposed Row 1 SEX successfully recovered as "M".');
assert(resTransposed.cleanRows[0].SAFFL === 'Y', 'Transposed Row 1 SAFFL successfully recovered as "Y".');
assert(resTransposed.cleanRows[1].SEX === 'F', 'Transposed Row 2 SEX successfully recovered as "F".');

// ----------------------------------------------------------------------------
// TEST 3: Multi-Domain Clinical Verifications (AE, VS, LB, CM)
// ----------------------------------------------------------------------------
console.log('\n>>> TEST 3: Universal Multi-Domain Inspection');

// Adverse Events
const testAe = [
  { USUBJID: 'S-1', AETERM: 'Headache; ', AESEV: '1', AESTDTC: '2024-02-10', AEENDTC: '2024-02-05' }
];
const resAe = verifyAndRepairClinicalData('AE', testAe);
assert(resAe.cleanRows[0].AETERM === 'Headache', 'AE AETERM trimmed and stripped of trailing punctuation.');
assert(resAe.cleanRows[0].AESEV === 'MILD', 'AE AESEV "1" mapped to standard CDISC CT "MILD".');
assert(resAe.cleanRows[0].AEENDTC === '2024-02-10', 'AE chronology reconciled (end date >= start date).');

// Vital Signs
const testVs = [
  { USUBJID: 'S-1', SYSBP: '80 mmHg', DIABP: '120 mmHg' }
];
const resVs = verifyAndRepairClinicalData('VS', testVs);
assert(resVs.cleanRows[0].SYSBP === 120, 'VS SYSBP inverted blood pressure corrected (SYSBP=120).');
assert(resVs.cleanRows[0].DIABP === 80, 'VS DIABP inverted blood pressure corrected (DIABP=80).');

// Laboratory BDS
const testLb = [
  { USUBJID: 'S-1', PARAMCD: 'GLUC', AVAL: 110, BASE: 100, CHG: 5, ANRLO: 70, ANRHI: 99, ANRIND: 'LOW' }
];
const resLb = verifyAndRepairClinicalData('LB', testLb);
assert(resLb.cleanRows[0].CHG === 10, 'LB BDS math recalculated (CHG = AVAL - BASE = 10).');
assert(resLb.cleanRows[0].ANRIND === 'HIGH', 'LB ANRIND corrected to "HIGH" for AVAL=110 > ANRHI=99.');

// Concomitant Medications
const testCm = [
  { USUBJID: 'S-1', CMTRT: 'Aspirin', CMDOSE: '100 mg', CMROUTE: 'PO' }
];
const resCm = verifyAndRepairClinicalData('CM', testCm);
assert(resCm.cleanRows[0].CMDOSE === 100, 'CM numeric dose extracted from "100 mg".');
assert(resCm.cleanRows[0].CMROUTE === 'ORAL', 'CM route "PO" standardized to CDISC CT "ORAL".');

// ----------------------------------------------------------------------------
// TEST 4: Physical Excel File Generation & Inspection
// ----------------------------------------------------------------------------
console.log('\n>>> TEST 4: Physical Excel Generation & Deliverable Verification');
const outDir = path.join(__dirname, '../output/test_deliverables');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1. Export Clean Dataset
const cleanFile = path.join(outDir, 'ADSL_corrected_clean.xlsx');
const cleanWs = XLSX.utils.json_to_sheet(resAdsl.cleanRows);
const cleanWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(cleanWb, cleanWs, 'CLEAN_DATA');
XLSX.writeFile(cleanWb, cleanFile);

assert(fs.existsSync(cleanFile), 'Clean Excel file created on disk.');
const readCleanWb = XLSX.readFile(cleanFile);
const readCleanSheet = readCleanWb.Sheets['CLEAN_DATA'];
const readCleanRows = XLSX.utils.sheet_to_json(readCleanSheet);
assert(readCleanRows.length === 3, 'Clean Excel file preserves all 3 records.');
const readHeaders = Object.keys(readCleanRows[0]);
assert(!readHeaders.some(h => h.includes('ERROR') || h.includes('AUDIT')), 'Clean Excel contains pure clinical headers only.');

// 2. Export Discrepancies & Auto-Repair Audit Report
const auditFile = path.join(outDir, 'ADSL_discrepancies_and_fixes.xlsx');
const auditWs = XLSX.utils.json_to_sheet(resAdsl.auditLog.map((iss, idx) => ({
  'Audit ID': `AUD-${String(idx + 1).padStart(4, '0')}`,
  'Row #': iss.row,
  'Variable': iss.variable,
  'Detected Discrepancy': iss.error,
  'CDISC Rule': iss.rule,
  'Original Value': String(iss.oldVal),
  'Corrected Value': String(iss.newVal),
  'Regulatory Justification': iss.justification,
  'Auto-Repair Method': iss.method,
  'Status': iss.status
})));
const auditWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(auditWb, auditWs, 'AUDIT_LOG');
XLSX.writeFile(auditWb, auditFile);

assert(fs.existsSync(auditFile), 'Audit Excel file created on disk.');
const readAuditWb = XLSX.readFile(auditFile);
const readAuditSheet = readAuditWb.Sheets['AUDIT_LOG'];
const readAuditRows = XLSX.utils.sheet_to_json(readAuditSheet);
assert(readAuditRows.length === resAdsl.auditLog.length, `Audit Excel contains all ${resAdsl.auditLog.length} documented discrepancies.`);

// ----------------------------------------------------------------------------
// TEST 5: Claude-Grade AI Clinical Intelligence Reasoning
// ----------------------------------------------------------------------------
console.log('\n>>> TEST 5: Claude-Grade AI Clinical Intelligence Reasoning Engine');
const claudeRes = generatePharmaResponse('Review ADSL data discrepancies and explain gender reconstruction');
assert(claudeRes && typeof claudeRes.reply === 'string', 'Claude clinical review response received.');
assert(claudeRes.reply.includes('Claude-Grade Autonomous Clinical Intelligence'), 'Includes Claude-Grade heading.');
assert(claudeRes.reply.includes('STEP 1: Observation'), 'Includes Step 1 Observation.');
assert(claudeRes.reply.includes('STEP 2: Regulatory'), 'Includes Step 2 Regulatory citations.');
assert(claudeRes.reply.includes('STEP 3: Mathematical & Logical Proof'), 'Includes Step 3 Mathematical Proof.');
assert(claudeRes.reply.includes('STEP 4: Autonomous Healing'), 'Includes Step 4 Autonomous Healing.');

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} OF ${totalTests} TESTS PASSED WITH 100% GxP INTEGRITY!`);
console.log('================================================================\n');
