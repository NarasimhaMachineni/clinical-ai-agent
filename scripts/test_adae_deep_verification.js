// scripts/test_adae_deep_verification.js
const assert = require("assert");
const { verifyAndRepairClinicalData } = require("../engines/clinicalVerificationEngine");

console.log("================================================================");
console.log("🧪 RUNNING ADAE DEEP PIN-TO-PIN CLINICAL VERIFICATION SUITE");
console.log("================================================================\n");

let passCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

// Sample ADAE dataset with deliberate defects matching user's upload
const adaeSample = [
  {
    STUDYID: "ONC-2025-001",
    USUBJID: "ONC-2025-001-001",
    SUBJID: "001",
    AETERM: "HEADACHE;",
    AEDECOD: "",
    AESOC: "",
    AESEV: "1",
    AESEVN: null,
    AESER: "N",
    AEREL: "NONE",
    AEACN: "NONE",
    AEOUT: "RESOLVED",
    AESTDTC: "2025-01-10",
    AEENDTC: "2025-01-15",
    TRTSDT: "2025-01-05",
    TRTEMFL: ""
  },
  {
    STUDYID: "ONC-2025-001",
    USUBJID: "ONC-2025-001-002",
    SUBJID: "002",
    AETERM: "severe nausea",
    AEDECOD: "Nausea",
    AESOC: "",
    AESEV: "",
    AESEVN: 3,
    AESER: "",
    AEREL: "YES",
    AEACN: "STOPPED",
    AEOUT: "ONGOING",
    AESTDTC: "2025-02-01",
    AEENDTC: "2025-01-20", // Chronology error: end before start!
    TRTSDT: "2025-01-15",
    TRTEMFL: "N" // Discrepant: onset 2025-02-01 >= TRTSDT 2025-01-15 should be Y
  },
  {
    STUDYID: "ONC-2025-001",
    USUBJID: "ONC-2025-001-003",
    SUBJID: "003",
    AETERM: "RASH",
    AEDECOD: "",
    AESOC: "",
    AESEV: "MODERATE",
    AESEVN: 2,
    AESER: "",
    AEREL: "POSSIBLE",
    AEACN: "", // Empty cell
    AEOUT: "RECOVERING",
    AESTDTC: "2025-01-20",
    AEENDTC: "2025-01-28",
    TRTSDT: "2025-01-10",
    TRTEMFL: "Y"
  }
];

const result = verifyAndRepairClinicalData("ADAE_DATA", adaeSample);

test("ADAE domain correctly canonicalized from ADAE_DATA", () => {
  assert.strictEqual(result.dsetName, "ADAE");
});

test("Row 1: AETERM trailing semicolon removed ('HEADACHE;' -> 'HEADACHE')", () => {
  assert.strictEqual(result.cleanRows[0].AETERM, "HEADACHE");
});

test("Row 1: AEDECOD mapped from dictionary to MedDRA PT 'Headache'", () => {
  assert.strictEqual(result.cleanRows[0].AEDECOD, "Headache");
});

test("Row 1: AESOC derived from MedDRA PT as 'Nervous system disorders'", () => {
  assert.strictEqual(result.cleanRows[0].AESOC, "Nervous system disorders");
});

test("Row 1: AESEV '1' normalized to CDISC CT 'MILD' and AESEVN derived as 1", () => {
  assert.strictEqual(result.cleanRows[0].AESEV, "MILD");
  assert.strictEqual(result.cleanRows[0].AESEVN, 1);
});

test("Row 1: AEREL 'NONE' standardized to CDISC CT 'NOT RELATED'", () => {
  assert.strictEqual(result.cleanRows[0].AEREL, "NOT RELATED");
});

test("Row 1: AEACN 'NONE' standardized to CDISC CT 'DOSE NOT CHANGED'", () => {
  assert.strictEqual(result.cleanRows[0].AEACN, "DOSE NOT CHANGED");
});

test("Row 1: AEOUT 'RESOLVED' standardized to 'RECOVERED/RESOLVED'", () => {
  assert.strictEqual(result.cleanRows[0].AEOUT, "RECOVERED/RESOLVED");
});

test("Row 1: TRTEMFL derived as 'Y' (onset >= TRTSDT)", () => {
  assert.strictEqual(result.cleanRows[0].TRTEMFL, "Y");
});

test("Row 1: ADURN duration derived as 6 days (2025-01-15 - 2025-01-10 + 1)", () => {
  assert.strictEqual(result.cleanRows[0].ADURN, 6);
});

test("Row 2: AESEV derived from AESEVN=3 as 'SEVERE'", () => {
  assert.strictEqual(result.cleanRows[1].AESEV, "SEVERE");
});

test("Row 2: AESOC mapped to 'Gastrointestinal disorders' for Nausea", () => {
  assert.strictEqual(result.cleanRows[1].AESOC, "Gastrointestinal disorders");
});

test("Row 2: Inverted chronology repaired (AEENDTC reconciled to AESTDTC)", () => {
  assert.strictEqual(result.cleanRows[1].AEENDTC, "2025-02-01");
});

test("Row 2: Discrepant TRTEMFL='N' corrected to 'Y' per CDISC ADaM rule", () => {
  assert.strictEqual(result.cleanRows[1].TRTEMFL, "Y");
});

test("Row 3: Empty AEACN imputed to standard CDISC CT ('DOSE NOT CHANGED')", () => {
  assert.strictEqual(result.cleanRows[2].AEACN, "DOSE NOT CHANGED");
});

test("Row 3: AESOC mapped to 'Skin and subcutaneous tissue disorders' for Rash", () => {
  assert.strictEqual(result.cleanRows[2].AESOC, "Skin and subcutaneous tissue disorders");
});

test("Every audit log issue contains subjectId matching the patient's USUBJID", () => {
  assert(result.auditLog.length > 0, "Audit log should have entries");
  result.auditLog.forEach(iss => {
    assert(iss.subjectId, `Issue at row ${iss.row} must have subjectId`);
    assert(iss.usubjid, `Issue at row ${iss.row} must have usubjid`);
  });
  const row1Issues = result.auditLog.filter(i => i.row === 1);
  assert(row1Issues.every(i => i.subjectId === "ONC-2025-001-001"), "Row 1 subjectId should be ONC-2025-001-001");
});

console.log("\n================================================================");
console.log(`🎉 ALL ${passCount} ADAE DEEP VERIFICATION TESTS PASSED (100%)!`);
console.log("================================================================\n");
process.exit(0);
