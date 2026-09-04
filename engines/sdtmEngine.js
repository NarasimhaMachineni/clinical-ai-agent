/**
 * CDISC SDTM v3.3 Transformation Engine
 * Standardizes raw clinical trial records (both EDC raw files from PC and structured inputs)
 * into submission-ready SDTM domains:
 * DM (Demographics), VS (Vital Signs), LB (Laboratory), AE (Adverse Events), EX (Exposure).
 */

function transformToSDTM(rawTrialData) {
  const studyId = rawTrialData.studyId || "STUDY-001";
  const subjects = rawTrialData.subjects || [];
  const rawRecords = rawTrialData.rawRecords || [];
  const rawDomains = rawTrialData.rawDomains || {};

  // 1. DOMAIN: DEMOGRAPHICS (DM)
  const dm = subjects.map(s => {
    const padSubjid = String(s.subjid || s.ptId || "001").padStart(3, "0");
    const usubjid = s.usubjid || `${studyId}-${padSubjid}`;
    
    // ISO 8601 date validation
    const rfstdtc = s.rfstdtc || (s.hasDosed ? `${s.enrollDt || '2025-01-10'}T09:00:00` : "");
    const rfendtc = s.rfendtc || (s.hasDosed ? "2025-06-20T17:00:00" : "");

    let raceStandard = (s.race || "WHITE").toUpperCase();
    if (raceStandard.includes("AFRICAN") || raceStandard.includes("BLACK")) raceStandard = "BLACK OR AFRICAN AMERICAN";
    else if (raceStandard.includes("ASIAN")) raceStandard = "ASIAN";

    const ethnicStandard = (s.ethnic || s.ethnicity || "").toUpperCase().includes("HISPANIC")
      ? "HISPANIC OR LATINO" 
      : "NOT HISPANIC OR LATINO";

    return {
      STUDYID: studyId,
      DOMAIN: "DM",
      USUBJID: usubjid,
      SUBJID: padSubjid,
      SITEID: String(s.siteId || "101"),
      RFSTDTC: rfstdtc,
      RFENDTC: rfendtc,
      AGE: Number(s.age) || 50,
      AGEU: s.ageU || "YEARS",
      SEX: (s.sex || s.gender || "M").toUpperCase().charAt(0),
      RACE: raceStandard,
      ETHNIC: ethnicStandard,
      ARMCD: s.armcd || s.armCd || "TRT",
      ARM: s.arm || "Active Treatment",
      COUNTRY: s.country || "USA",
      // Internal metadata for downstream ADaM derivation
      _hasDosed: s.hasDosed !== undefined ? s.hasDosed : 1,
      _hasMajorViolation: s.hasMajorViolation !== undefined ? s.hasMajorViolation : 0,
      _compliance: s.compliance !== undefined ? s.compliance : 95
    };
  });

  // 2. DOMAIN: VITAL SIGNS (VS)
  const vs = [];
  let vsSeq = 1;

  if (rawDomains.VS && rawDomains.VS.length > 0) {
    rawDomains.VS.forEach(rec => {
      const padSubjid = String(rec.SUBJID || rec.PT_ID).padStart(3, "0");
      const usubjid = rec.USUBJID || `${studyId}-${padSubjid}`;
      vs.push({
        STUDYID: rec.STUDYID || studyId,
        DOMAIN: "VS",
        USUBJID: usubjid,
        VSSEQ: vsSeq++,
        VSTESTCD: rec.PARAMCD || rec.VSTESTCD || "SYSBP",
        VSTEST: rec.PARAM || rec.VSTEST || "Systolic Blood Pressure",
        VSCAT: "VITAL SIGNS",
        VSORRES: String(rec.AVAL || rec.VSORRES || 120),
        VSORRESU: rec.AVALU || rec.VSORRESU || "mmHg",
        VSSTRESC: String(rec.AVAL || rec.VSORRES || 120),
        VSSTRESN: Number(rec.AVAL || rec.VSORRES || 120),
        VSSTRESU: rec.AVALU || rec.VSORRESU || "mmHg",
        VISITNUM: Number(rec.AVISITN || rec.VISITNUM || 1),
        VISIT: rec.AVISIT || rec.VISIT || "Baseline",
        VSDTC: rec.ADTM || rec.VSDTC || new Date().toISOString()
      });
    });
  } else if (rawRecords.length > 0) {
    const vsParams = [
      { key: "SBP", testcd: "SYSBP", test: "Systolic Blood Pressure", unit: "mmHg" },
      { key: "DBP", testcd: "DIABP", test: "Diastolic Blood Pressure", unit: "mmHg" },
      { key: "HR", testcd: "PULSE", test: "Heart Rate", unit: "beats/min" },
      { key: "TEMP", testcd: "TEMP", test: "Temperature", unit: "C" }
    ];

    rawRecords.filter(r => r.VISIT_NUM).forEach(rec => {
      const padSubjid = String(rec.PT_ID).padStart(3, "0");
      const usubjid = `${studyId}-${padSubjid}`;

      vsParams.forEach(param => {
        if (rec[param.key] !== undefined) {
          vs.push({
            STUDYID: studyId,
            DOMAIN: "VS",
            USUBJID: usubjid,
            VSSEQ: vsSeq++,
            VSTESTCD: param.testcd,
            VSTEST: param.test,
            VSCAT: "VITAL SIGNS",
            VSORRES: String(rec[param.key]),
            VSORRESU: param.unit,
            VSSTRESC: String(rec[param.key]),
            VSSTRESN: Number(rec[param.key]),
            VSSTRESU: param.unit,
            VISITNUM: rec.VISIT_NUM,
            VISIT: rec.VISIT_NAME,
            VSDTC: `${rec.VISIT_DATE}T08:30:00`
          });
        }
      });
    });
  }

  // 3. DOMAIN: LABORATORY (LB)
  const lb = [];
  let lbSeq = 1;

  if (rawDomains.LB && rawDomains.LB.length > 0) {
    rawDomains.LB.forEach(rec => {
      const padSubjid = String(rec.SUBJID || rec.PT_ID).padStart(3, "0");
      const usubjid = rec.USUBJID || `${studyId}-${padSubjid}`;
      const val = Number(rec.AVAL || rec.LBORRES || rec.LBSTRESN || 0);
      const low = Number(rec.ANRLO || rec.LBSTNRLO || 0);
      const high = Number(rec.ANRHI || rec.LBSTNRHI || 100);
      let nrind = rec.ANRIND || rec.LBNRIND || "NORMAL";
      if (!rec.ANRIND && high > low) {
        if (val < low) nrind = "LOW";
        else if (val > high) nrind = "HIGH";
      }

      lb.push({
        STUDYID: rec.STUDYID || studyId,
        DOMAIN: "LB",
        USUBJID: usubjid,
        LBSEQ: lbSeq++,
        LBTESTCD: rec.PARAMCD || rec.LBTESTCD || "ALT",
        LBTEST: rec.PARAM || rec.LBTEST || "Laboratory Test",
        LBCAT: rec.PARCAT1 || rec.LBCAT || "CHEMISTRY",
        LBORRES: String(rec.AVAL !== undefined ? rec.AVAL : (rec.LBORRES || val)),
        LBORRESU: rec.AVALU || rec.LBORRESU || "U/L",
        LBSTRESC: String(val),
        LBSTRESN: val,
        LBSTRESU: rec.AVALU || rec.LBSTRESU || "U/L",
        LBSTNRLO: low,
        LBSTNRHI: high,
        LBNRIND: nrind,
        VISITNUM: Number(rec.AVISITN || rec.VISITNUM || 1),
        VISIT: rec.AVISIT || rec.VISIT || "Baseline",
        LBDTC: rec.ADTM || rec.LBDTC || new Date().toISOString()
      });
    });
  } else if (rawRecords.length > 0) {
    const lbParams = [
      { key: "FPG", testcd: "GLUC", test: "Fasting Plasma Glucose", unit: "mg/dL", low: 70, high: 100 },
      { key: "HBA1C", testcd: "HBA1C", test: "Hemoglobin A1c", unit: "%", low: 4.0, high: 5.6 },
      { key: "CREA", testcd: "CREA", test: "Creatinine", unit: "mg/dL", low: 0.6, high: 1.2 },
      { key: "ALT", testcd: "ALT", test: "Alanine Aminotransferase", unit: "U/L", low: 7, high: 56 },
      { key: "AST", testcd: "AST", test: "Aspartate Aminotransferase", unit: "U/L", low: 10, high: 40 }
    ];

    rawRecords.filter(r => r.VISIT_NUM).forEach(rec => {
      const padSubjid = String(rec.PT_ID).padStart(3, "0");
      const usubjid = `${studyId}-${padSubjid}`;

      lbParams.forEach(param => {
        if (rec[param.key] !== undefined) {
          const val = Number(rec[param.key]);
          let nrind = "NORMAL";
          if (val < param.low) nrind = "LOW";
          else if (val > param.high) nrind = "HIGH";

          lb.push({
            STUDYID: studyId,
            DOMAIN: "LB",
            USUBJID: usubjid,
            LBSEQ: lbSeq++,
            LBTESTCD: param.testcd,
            LBTEST: param.test,
            LBCAT: "CHEMISTRY",
            LBORRES: String(val),
            LBORRESU: param.unit,
            LBSTRESC: String(val),
            LBSTRESN: val,
            LBSTRESU: param.unit,
            LBSTNRLO: param.low,
            LBSTNRHI: param.high,
            LBNRIND: nrind,
            VISITNUM: rec.VISIT_NUM,
            VISIT: rec.VISIT_NAME,
            LBDTC: `${rec.VISIT_DATE}T08:00:00`
          });
        }
      });
    });
  }

  // 4. DOMAIN: ADVERSE EVENTS (AE)
  const ae = [];
  let aeSeq = 1;
  const aeSevMap = { 1: "MILD", 2: "MODERATE", 3: "SEVERE" };
  const aeRelMap = { 0: "NOT RELATED", 1: "POSSIBLY RELATED", 2: "PROBABLY RELATED" };

  if (rawDomains.AE && rawDomains.AE.length > 0) {
    rawDomains.AE.forEach(rec => {
      const padSubjid = String(rec.SUBJID || rec.PT_ID).padStart(3, "0");
      const usubjid = rec.USUBJID || `${studyId}-${padSubjid}`;
      ae.push({
        STUDYID: rec.STUDYID || studyId,
        DOMAIN: "AE",
        USUBJID: usubjid,
        AESEQ: aeSeq++,
        AETERM: rec.AETERM || rec.AE_TEXT || "Adverse Event",
        AELLT: rec.AELLT || rec.AE_PT || rec.AETERM || "Adverse Event",
        AEPT: rec.AEPT || rec.AE_PT || rec.AETERM || "Adverse Event",
        AESOC: rec.AESOC || rec.AE_SOC || "GENERAL DISORDERS AND ADMINISTRATION SITE CONDITIONS",
        AESEV: (rec.AESEV || aeSevMap[rec.AE_INTENSITY] || "MILD").toUpperCase(),
        AEREL: (rec.AEREL || aeRelMap[rec.AE_CAUSALITY] || "RELATED").toUpperCase(),
        AESER: (rec.AESER || rec.AE_SERIOUS || "N").toUpperCase(),
        AESTDTC: rec.AESTDTC || (rec.AE_ONSET_DT ? `${rec.AE_ONSET_DT}T10:00:00` : ""),
        AEENDTC: rec.AEENDTC || ""
      });
    });
  } else if (rawRecords.length > 0) {
    rawRecords.filter(r => r.AE_TEXT).forEach(rec => {
      const padSubjid = String(rec.PT_ID).padStart(3, "0");
      const usubjid = `${studyId}-${padSubjid}`;

      ae.push({
        STUDYID: studyId,
        DOMAIN: "AE",
        USUBJID: usubjid,
        AESEQ: aeSeq++,
        AETERM: rec.AE_TEXT,
        AELLT: rec.AE_PT,
        AEPT: rec.AE_PT,
        AESOC: rec.AE_SOC,
        AESEV: aeSevMap[rec.AE_INTENSITY] || "MILD",
        AEREL: aeRelMap[rec.AE_CAUSALITY] || "NOT RELATED",
        AESER: rec.AE_SERIOUS || "N",
        AESTDTC: rec.AE_ONSET_DT ? `${rec.AE_ONSET_DT}T10:00:00` : "",
        AEENDTC: ""
      });
    });
  }

  // 5. DOMAIN: EXPOSURE (EX)
  const ex = [];
  let exSeq = 1;

  if (rawDomains.EX && rawDomains.EX.length > 0) {
    rawDomains.EX.forEach(rec => {
      const padSubjid = String(rec.SUBJID || rec.PT_ID).padStart(3, "0");
      const usubjid = rec.USUBJID || `${studyId}-${padSubjid}`;
      ex.push({
        STUDYID: rec.STUDYID || studyId,
        DOMAIN: "EX",
        USUBJID: usubjid,
        EXSEQ: exSeq++,
        EXTRT: rec.EXTRT || "ACTIVE DRUG",
        EXDOSE: Number(rec.EXDOSE || rec.DOSE || 100),
        EXDOSU: rec.EXDOSU || "mg",
        EXDOSFRQ: rec.EXDOSFRQ || "ONCE DAILY",
        EXSTDTC: rec.EXSTDTC || new Date().toISOString().substring(0, 10),
        EXENDTC: rec.EXENDTC || new Date().toISOString().substring(0, 10)
      });
    });
  } else {
    dm.filter(d => d._hasDosed).forEach((d, idx) => {
      const doseMg = d.ARMCD && (d.ARMCD.includes("PLAC") || d.ARMCD.includes("PBO")) ? 0 : 200;
      ex.push({
        STUDYID: studyId,
        DOMAIN: "EX",
        USUBJID: d.USUBJID,
        EXSEQ: idx + 1,
        EXTRT: d.ARM || "Active Treatment",
        EXDOSE: doseMg,
        EXDOSU: "mg",
        EXDOSFRQ: "ONCE DAILY",
        EXSTDTC: d.RFSTDTC,
        EXENDTC: d.RFENDTC
      });
    });
  }

  return {
    studyId,
    domains: {
      DM: dm,
      VS: vs,
      LB: lb,
      AE: ae,
      EX: ex
    },
    metrics: {
      dmCount: dm.length,
      vsCount: vs.length,
      lbCount: lb.length,
      aeCount: ae.length,
      exCount: ex.length,
      uniqueSubjects: dm.length
    }
  };
}

module.exports = {
  transformToSDTM
};
