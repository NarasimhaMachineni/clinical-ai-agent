const assert = require('assert');
const { verifyAndRepairClinicalData, determineCdiscVariableType } = require('../engines/clinicalVerificationEngine');

console.log('================================================================');
console.log('🧪 RUNNING CDISC SDTM IG & ADaM IG CLINICAL CALCULATIONS SUITE');
console.log('================================================================\n');

// --------------------------------------------------------------------------
// TEST 1: Study Day Calculations (--DY, --STDY, --ENDY, and Day 0 Prohibition)
// --------------------------------------------------------------------------
console.log('--- 1. Testing Study Day Calculations (--DY, --STDY, --ENDY) ---');

const aeStudyDayRows = [
  {
    STUDYID: 'ONC-001',
    USUBJID: 'ONC-001-01-001',
    RFSTDTC: '2025-01-10',
    AESTDTC: '2025-01-15', // On study Day 6
    AEENDTC: '2025-01-20', // On study Day 11
    AESTDY: '',            // BLANK -> should calculate 6
    AEENDY: 0,             // DAY 0 VIOLATION -> should calculate 11
    AETERM: 'Headache'
  },
  {
    STUDYID: 'ONC-001',
    USUBJID: 'ONC-001-01-002',
    RFSTDTC: '2025-01-10',
    AESTDTC: '2025-01-08', // Pre-study: 2 days before -> Day -2
    AEENDTC: '2025-01-09', // Pre-study: 1 day before -> Day -1
    AESTDY: '',            // BLANK -> should calculate -2
    AEENDY: '',            // BLANK -> should calculate -1
    AETERM: 'Nausea'
  }
];

const resAE = verifyAndRepairClinicalData('AE', aeStudyDayRows);
assert.strictEqual(resAE.cleanRows[0].AESTDY, 6, 'AESTDY for Row 1 must be calculated as 6');
assert.strictEqual(resAE.cleanRows[0].AEENDY, 11, 'AEENDY for Row 1 must be calculated as 11 (Day 0 reconciled)');
assert.strictEqual(resAE.cleanRows[1].AESTDY, -2, 'AESTDY for Row 2 must be calculated as -2 (pre-study)');
assert.strictEqual(resAE.cleanRows[1].AEENDY, -1, 'AEENDY for Row 2 must be calculated as -1 (pre-study, no Day 0)');

const dyAudit = resAE.auditLog.filter(a => a.variable === 'AESTDY' || a.variable === 'AEENDY');
assert(dyAudit.length >= 3, 'Audit log must record Study Day derivations');
console.log('  ✅ PASS: Positive, negative, and Day 0 study days calculated exactly per CDISC SDTMIG v3.3.\n');

// --------------------------------------------------------------------------
// TEST 2: Sequence Numbering Engine (--SEQ Partitioned by Subject)
// --------------------------------------------------------------------------
console.log('--- 2. Testing CDISC Sequence Numbering Engine (--SEQ) ---');

const seqRows = [
  { USUBJID: 'SUBJ-001', AETERM: 'Headache', AESEQ: '' },
  { USUBJID: 'SUBJ-001', AETERM: 'Fatigue', AESEQ: '' },
  { USUBJID: 'SUBJ-001', AETERM: 'Nausea', AESEQ: '' },
  { USUBJID: 'SUBJ-002', AETERM: 'Pyrexia', AESEQ: '' },
  { USUBJID: 'SUBJ-002', AETERM: 'Cough', AESEQ: '' }
];

const resSeq = verifyAndRepairClinicalData('AE', seqRows);
assert.strictEqual(resSeq.cleanRows[0].AESEQ, 1, 'SUBJ-001 AE 1 must be SEQ=1');
assert.strictEqual(resSeq.cleanRows[1].AESEQ, 2, 'SUBJ-001 AE 2 must be SEQ=2');
assert.strictEqual(resSeq.cleanRows[2].AESEQ, 3, 'SUBJ-001 AE 3 must be SEQ=3');
assert.strictEqual(resSeq.cleanRows[3].AESEQ, 1, 'SUBJ-002 AE 1 must be SEQ=1 (reset per subject)');
assert.strictEqual(resSeq.cleanRows[4].AESEQ, 2, 'SUBJ-002 AE 2 must be SEQ=2');
console.log('  ✅ PASS: Sequence numbering (--SEQ) partitioned 1-based by subject per CDISC SDTMIG §2.2.3.\n');

// --------------------------------------------------------------------------
// TEST 3: Vital Signs Unit Conversions and Hemodynamic Calculations (MAP, BMI)
// --------------------------------------------------------------------------
console.log('--- 3. Testing Vital Signs Unit Conversions and Calculations ---');

const vsRows = [
  {
    USUBJID: 'SUBJ-001',
    VSTESTCD: 'WEIGHT',
    VSORRES: '150',
    VSORRESU: 'LBS',
    VSSTRESN: '',       // BLANK -> should convert 150 lbs to 68.0 kg
    VSSTRESU: ''
  },
  {
    USUBJID: 'SUBJ-001',
    VSTESTCD: 'HEIGHT',
    VSORRES: '68',
    VSORRESU: 'INCHES',
    VSSTRESN: '',       // BLANK -> should convert 68 in to 172.7 cm
    VSSTRESU: ''
  },
  {
    USUBJID: 'SUBJ-001',
    VSTESTCD: 'TEMP',
    VSORRES: '98.6',
    VSORRESU: 'F',
    VSSTRESN: '',       // BLANK -> should convert 98.6 F to 37.0 C
    VSSTRESU: ''
  },
  {
    USUBJID: 'SUBJ-001',
    VSTESTCD: 'BP',
    SYSBP: '120',
    DIABP: '80',
    MAP: ''             // BLANK -> should calculate 80 + (120 - 80)/3 = 93.3 mmHg
  }
];

const resVS = verifyAndRepairClinicalData('VS', vsRows);
assert.strictEqual(resVS.cleanRows[0].VSSTRESN, 68.0, '150 lbs must convert to 68.0 kg');
assert.strictEqual(resVS.cleanRows[0].VSSTRESU, 'KG', 'Unit must be KG');
assert.strictEqual(resVS.cleanRows[1].VSSTRESN, 172.7, '68 inches must convert to 172.7 cm');
assert.strictEqual(resVS.cleanRows[1].VSSTRESU, 'CM', 'Unit must be CM');
assert.strictEqual(resVS.cleanRows[2].VSSTRESN, 37.0, '98.6 F must convert to 37.0 C');
assert.strictEqual(resVS.cleanRows[2].VSSTRESU, 'C', 'Unit must be C');
assert.strictEqual(resVS.cleanRows[3].MAP, 93.3, 'MAP must be calculated as 93.3 mmHg');
console.log('  ✅ PASS: Weight, height, temperature conversions and MAP calculated with full accuracy.\n');

// --------------------------------------------------------------------------
// TEST 4: ADaM BDS Mathematical Engine (AVAL, BASE, CHG, PCHG, Normal Ranges)
// --------------------------------------------------------------------------
console.log('--- 4. Testing ADaM BDS Mathematical Engine ---');

const bdsRows = [
  {
    USUBJID: 'SUBJ-001',
    PARAMCD: 'ALT',
    AVAL: 136.4,
    BASE: 124.0,
    CHG: '',            // BLANK -> should calculate 136.4 - 124.0 = 12.4
    PCHG: '',           // BLANK -> should calculate (12.4 / 124.0) * 100 = 10.0%
    ANRLO: 7.0,
    ANRHI: 56.0,
    ANRIND: ''          // BLANK -> should evaluate to 'HIGH' (136.4 > 56.0)
  },
  {
    USUBJID: 'SUBJ-001',
    PARAMCD: 'AST',
    AVAL: '',           // BLANK -> should derive from BASE (40) + CHG (15) = 55
    BASE: 40.0,
    CHG: 15.0,
    PCHG: '',           // BLANK -> should derive (15 / 40) * 100 = 37.5%
    ANRLO: 10.0,
    ANRHI: 45.0,
    ANRIND: 'NORMAL'    // DISCREPANCY -> 55 > 45, should be repaired to 'HIGH'
  }
];

const resBDS = verifyAndRepairClinicalData('ADLB', bdsRows);
assert.strictEqual(resBDS.cleanRows[0].CHG, 12.4, 'CHG must be calculated as 12.4');
assert.strictEqual(resBDS.cleanRows[0].PCHG, 10.0, 'PCHG must be calculated as 10.0%');
assert.strictEqual(resBDS.cleanRows[0].ANRIND, 'HIGH', 'ANRIND must be evaluated as HIGH');
assert.strictEqual(resBDS.cleanRows[1].AVAL, 55.0, 'AVAL must be derived as 55.0 from BASE + CHG');
assert.strictEqual(resBDS.cleanRows[1].PCHG, 37.5, 'PCHG must be derived as 37.5%');
assert.strictEqual(resBDS.cleanRows[1].ANRIND, 'HIGH', 'Discrepant ANRIND corrected to HIGH');
console.log('  ✅ PASS: BDS formulas (CHG, PCHG, reverse AVAL) and normal ranges verified.\n');

// --------------------------------------------------------------------------
// TEST 5: Visit Mapping & Concomitant Medication Timing Flags (PREFL, ONTRTFL)
// --------------------------------------------------------------------------
console.log('--- 5. Testing Visit Mapping & Conmed Timing Flags ---');

const cmRows = [
  {
    USUBJID: 'SUBJ-001',
    CMTRT: 'Aspirin',
    TRTSDT: '2025-01-10',
    TRTEDT: '2025-01-20',
    CMSTDTC: '2025-01-05', // Prior to treatment -> PREFL='Y'
    CMENDTC: '2025-01-15', // Overlaps treatment -> ONTRTFL='Y'
    PREFL: '',
    ONTRTFL: '',
    VISIT: 'Screening',
    VISITNUM: ''           // BLANK -> should derive 1
  }
];

const resCM = verifyAndRepairClinicalData('CM', cmRows);
assert.strictEqual(resCM.cleanRows[0].PREFL, 'Y', 'PREFL must be Y for start date prior to treatment');
assert.strictEqual(resCM.cleanRows[0].ONTRTFL, 'Y', 'ONTRTFL must be Y for medication overlapping treatment');
assert.strictEqual(resCM.cleanRows[0].VISITNUM, 1, 'VISITNUM for Screening must be 1');
console.log('  ✅ PASS: Visit mapping and concomitant medication timing flags verified.\n');

// --------------------------------------------------------------------------
// TEST 6: Zero Mock Data Verification (Metrics and Fallback Elimination)
// --------------------------------------------------------------------------
console.log('--- 6. Testing Zero Mock Data Verification ---');

// Verify that an empty dataset returns 0 cells, 0 errors, 0 imputed values
const emptyRows = [];
const resEmpty = verifyAndRepairClinicalData('ADSL', emptyRows);
assert.strictEqual(resEmpty.totalErrors, 0, 'Empty dataset must have 0 errors');
assert.strictEqual(resEmpty.cleanRows.length, 0, 'Clean rows must be 0');

// Verify that a clean dataset has exactly 0 discrepancies
const cleanRow = [{ STUDYID: 'S1', USUBJID: 'S1-01-001', SUBJID: '001', SITEID: '01', AGE: 45, AGEU: 'YEARS', SEX: 'M', RACE: 'WHITE', ETHNIC: 'NOT HISPANIC OR LATINO', ARM: 'Placebo', ARMCD: 'PBO' }];
const resClean = verifyAndRepairClinicalData('DM', cleanRow);
assert.strictEqual(resClean.totalErrors, 0, 'Pristine DM dataset must have 0 errors (no synthetic fallbacks)');
console.log('  ✅ PASS: Zero mock data confirmed; clean dataset has exactly 0 false-positive errors.\n');

console.log('================================================================');
console.log('🎉 ALL CDISC SDTM IG & ADaM IG CALCULATION TESTS PASSED (100%)!');
console.log('================================================================');
