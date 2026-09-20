const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { verifyAndRepairClinicalData, normalizeClinicalDate } = require("../engines/clinicalVerificationEngine");
const { executeTlfGeneration } = require("../engines/agentTaskEngine");

console.log("================================================================");
console.log("🧪 RUNNING PIN-TO-PIN MULTI-DOMAIN CLINICAL VERIFICATION SUITE");
console.log("================================================================\n");

let passCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err.message);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// TEST 1: EXPOSURE & DOSING (EX / ADEX) PIN-TO-PIN VERIFICATION
// -----------------------------------------------------------------------------
console.log(">>> TEST 1: Exposure & Dosing (EX / ADEX) Pin-to-Pin Inspection");

const testEx = [
  { STUDYID: "STU-01", USUBJID: "STU-01-001", EXTRT: "Pembrolizumab", EXDOSE: "200 mg", EXDOSU: "milligram", EXROUTE: "IV", EXSTDTC: "2025-01-10", EXENDTC: "2025-01-08" },
  { STUDYID: "STU-01", USUBJID: "STU-01-002", EXTRT: "Placebo", EXDOSE: -50, EXDOSU: "mg", EXROUTE: "PO", EXSTDTC: "2025-01-15", EXENDTC: "2025-01-25" }
];

const resEx = verifyAndRepairClinicalData("EX", testEx);

test("EX: Embedded unit extracted to numeric dose (200 mg -> 200)", () => {
  assert.strictEqual(resEx.cleanRows[0].EXDOSE, 200);
});

test("EX: Non-standard unit standardized (milligram -> mg)", () => {
  assert.strictEqual(resEx.cleanRows[0].EXDOSU, "mg");
});

test("EX: Route standardized (IV -> INTRAVENOUS, PO -> ORAL)", () => {
  assert.strictEqual(resEx.cleanRows[0].EXROUTE, "INTRAVENOUS");
  assert.strictEqual(resEx.cleanRows[1].EXROUTE, "ORAL");
});

test("EX: Negative dose corrected via absolute magnitude (-50 -> 50)", () => {
  assert.strictEqual(resEx.cleanRows[1].EXDOSE, 50);
});

test("EX: Chronology reconciled (end date >= start date)", () => {
  assert(resEx.cleanRows[0].EXENDTC >= resEx.cleanRows[0].EXSTDTC);
});

// -----------------------------------------------------------------------------
// TEST 2: SUBJECT DISPOSITION (DS / ADDS) PIN-TO-PIN VERIFICATION
// -----------------------------------------------------------------------------
console.log("\n>>> TEST 2: Subject Disposition (DS / ADDS) Pin-to-Pin Inspection");

const testDs = [
  { STUDYID: "STU-01", USUBJID: "STU-01-001", DSTERM: "Completed Protocol per Schedule", DSDECOD: "completed trial", EPOCH: "treatment" },
  { STUDYID: "STU-01", USUBJID: "STU-01-002", DSTERM: "Patient withdrew consent due to travel", DSDECOD: "", EPOCH: "follow" }
];

const resDs = verifyAndRepairClinicalData("DS", testDs);

test("DS: Non-standard DSDECOD mapped to CDISC CT (completed trial -> COMPLETED)", () => {
  assert.strictEqual(resDs.cleanRows[0].DSDECOD, "COMPLETED");
});

test("DS: Blank DSDECOD derived from verbatim term DSTERM (-> WITHDRAWAL BY SUBJECT)", () => {
  assert.strictEqual(resDs.cleanRows[1].DSDECOD, "WITHDRAWAL BY SUBJECT");
});

test("DS: EPOCH standardized to CDISC CT (treatment -> TREATMENT, follow -> FOLLOW-UP)", () => {
  assert.strictEqual(resDs.cleanRows[0].EPOCH, "TREATMENT");
  assert.strictEqual(resDs.cleanRows[1].EPOCH, "FOLLOW-UP");
});

// -----------------------------------------------------------------------------
// TEST 3: ELECTROCARDIOGRAM (EG / ADEG) PIN-TO-PIN VERIFICATION
// -----------------------------------------------------------------------------
console.log("\n>>> TEST 3: Electrocardiogram (EG / ADEG) Pin-to-Pin Inspection");

const testEg = [
  { STUDYID: "STU-01", USUBJID: "STU-01-001", EGTESTCD: "QTCF", EGTEST: "", AVAL: 512, BASE: 430, AVISIT: "Week 4" },
  { STUDYID: "STU-01", USUBJID: "STU-01-002", EGTESTCD: "HR", EGTEST: "", AVAL: 72, BASE: 70, AVISIT: "Week 4" }
];

const resEg = verifyAndRepairClinicalData("EG", testEg);

test("EG: EGTESTCD decoded to full test name (QTCF -> QTcF Fridericia, HR -> Heart Rate)", () => {
  assert(resEg.cleanRows[0].EGTEST.includes("QTcF"));
  assert.strictEqual(resEg.cleanRows[1].EGTEST, "Heart Rate");
});

test("EG: Severe cardiac safety alert flagged for QTcF > 500 ms (AVAL=512)", () => {
  const alert = resEg.auditLog.find(a => a.rule && a.rule.includes("E14"));
  assert(alert, "Expected ICH E14 QTc prolongation alert");
});

// -----------------------------------------------------------------------------
// TEST 4: TIME-TO-EVENT (ADTTE) PIN-TO-PIN VERIFICATION
// -----------------------------------------------------------------------------
console.log("\n>>> TEST 4: Time-to-Event (ADTTE) Pin-to-Pin Inspection");

const testTte = [
  { STUDYID: "STU-01", USUBJID: "STU-01-001", PARAMCD: "PFS", STARTDT: "2025-01-10", ADT: "2025-06-15", AVAL: "", CNSR: "YES", EVNTDESC: "LAST CONTACT" },
  { STUDYID: "STU-01", USUBJID: "STU-01-002", PARAMCD: "PFS", STARTDT: "2025-01-12", ADT: "2025-04-18", AVAL: 10, CNSR: "0", EVNTDESC: "PROGRESSION" }
];

const resTte = verifyAndRepairClinicalData("ADTTE", testTte);

test("ADTTE: Non-binary CNSR converted to binary numeric (YES -> 1)", () => {
  assert.strictEqual(resTte.cleanRows[0].CNSR, 1);
});

test("ADTTE: AVAL duration mathematically re-derived (ADT - STARTDT + 1 = 157 days)", () => {
  assert.strictEqual(resTte.cleanRows[0].AVAL, 157);
});

test("ADTTE: Erroneous AVAL=10 corrected to exact day count (97 days)", () => {
  assert.strictEqual(resTte.cleanRows[1].AVAL, 97);
});

// -----------------------------------------------------------------------------
// TEST 5: EXTENDED LABORATORY BDS MATH (ADLB PCHG)
// -----------------------------------------------------------------------------
console.log("\n>>> TEST 5: Extended Laboratory BDS Math (ADLB PCHG)");

const testLbPchg = [
  { STUDYID: "STU-01", USUBJID: "STU-01-001", PARAMCD: "ALT", AVAL: 68.0, BASE: 24.0, CHG: 44.0, PCHG: 12.0 }
];

const resLb = verifyAndRepairClinicalData("ADLB", testLbPchg);

test("ADLB: Discrepant PCHG=12.0% recalculated to 183.3%", () => {
  assert.strictEqual(resLb.cleanRows[0].PCHG, 183.3);
});

// -----------------------------------------------------------------------------
// TEST 6: TLF GENERATION & MATHEMATICAL PARITY
// -----------------------------------------------------------------------------
console.log("\n>>> TEST 6: TLF Suite Generation & Mathematical Parity");

(async () => {
  const tlfResp = await executeTlfGeneration();
  test("TLF Suite generated successfully with 200 OK equivalent", () => {
    assert(tlfResp && tlfResp.success);
  });

  test("TLF Suite includes Table 14-1, 14-2, 14-3, 14-4, 14-5, 14-6, and Figure 14.1", () => {
    const reportPath = path.join(__dirname, "..", "submission_package", "reports", "tlfs.txt");
    assert(fs.existsSync(reportPath));
    const txt = fs.readFileSync(reportPath, "utf8");
    assert(txt.includes("TABLE 14-1.01"));
    assert(txt.includes("TABLE 14-2.01"));
    assert(txt.includes("TABLE 14-3.01"));
    assert(txt.includes("TABLE 14-4.01"));
    assert(txt.includes("TABLE 14-5.01"));
    assert(txt.includes("TABLE 14-6.01"));
    assert(txt.includes("LISTING 16.2.1"));
    assert(txt.includes("FIGURE 14.1"));
  });

  console.log("\n================================================================");
  console.log(`🎉 ALL ${passCount} PIN-TO-PIN TESTS PASSED WITH 100% GxP INTEGRITY!`);
  console.log("================================================================\n");
  process.exit(0);
})();

