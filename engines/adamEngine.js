/**
 * CDISC ADaM v1.2 Derivation Engine
 * Generates analysis-ready datasets:
 * - ADSL: Subject-Level Analysis Dataset with population flags (SAFFL, ITTFL, PPFL, FASFL)
 * - ADAE: Adverse Event Analysis Dataset (Occurrence Structure - OCCDS) with TRTEMFL
 * - ADLB: Laboratory Analysis Dataset (Basic Data Structure - BDS) with BASE, CHG, and toxicity grades
 */

function deriveADaM(sdtmResult) {
  const { studyId, domains } = sdtmResult;
  const { DM, VS, LB, AE, EX } = domains;

  // 1. ADSL (SUBJECT-LEVEL ANALYSIS DATASET)
  const adsl = DM.map(d => {
    const hasDosed = d._hasDosed;
    const hasMajorViolation = d._hasMajorViolation;
    const compliance = d._compliance;

    const trtsdt = hasDosed ? d.RFSTDTC.split("T")[0] : null;
    const trtedt = hasDosed ? d.RFENDTC.split("T")[0] : null;
    
    // Treatment duration in days
    let trtdurd = null;
    if (trtsdt && trtedt) {
      const dtStart = new Date(trtsdt);
      const dtEnd = new Date(trtedt);
      trtdurd = Math.floor((dtEnd - dtStart) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Population Flags
    const saffl = hasDosed ? "Y" : "N";
    const ittfl = "Y"; // All randomized
    const ppfl = (hasDosed && !hasMajorViolation && compliance >= 80) ? "Y" : "N";
    const fasfl = (hasDosed && !hasMajorViolation) ? "Y" : "N";
    const efffl = (d.ARMCD === "DMED" && hasDosed) ? "Y" : "N";
    const complfl = compliance >= 80 ? "Y" : "N";

    const agegr1 = d.AGE < 65 ? "<65" : ">=65";
    const agegr1n = d.AGE < 65 ? 1 : 2;

    const trt01p = d.ARM;
    const trt01pn = d.ARMCD === "DMED" ? 1 : 2;
    const trt01a = hasDosed ? d.ARM : "Not Treated";
    const trt01an = hasDosed ? trt01pn : 0;

    return {
      STUDYID: studyId,
      USUBJID: d.USUBJID,
      SUBJID: d.SUBJID,
      SITEID: d.SITEID,
      AGE: d.AGE,
      AGEGR1: agegr1,
      AGEGR1N: agegr1n,
      AGEU: d.AGEU,
      SEX: d.SEX,
      RACE: d.RACE,
      ETHNIC: d.ETHNIC,
      ARM: d.ARM,
      ARMCD: d.ARMCD,
      TRT01P: trt01p,
      TRT01PN: trt01pn,
      TRT01A: trt01a,
      TRT01AN: trt01an,
      TRTSDT: trtsdt,
      TRTEDT: trtedt,
      TRTDURD: trtdurd,
      // Analysis Population Flags
      ITTFL: ittfl,
      SAFFL: saffl,
      PPFL: ppfl,
      FASFL: fasfl,
      EFFFL: efffl,
      COMPLFL: complfl,
      COMPLIANCE: compliance,
      DISCONT: compliance < 80 ? "Y" : "N"
    };
  });

  // Create lookup for subject treatment & start date
  const adslMap = new Map();
  adsl.forEach(s => adslMap.set(s.USUBJID, s));

  // 2. ADAE (ADVERSE EVENTS - OCCURRENCE DATA STRUCTURE)
  const adae = AE.map(e => {
    const subj = adslMap.get(e.USUBJID);
    const onsetDt = e.AESTDTC ? e.AESTDTC.split("T")[0] : null;
    const trtsdt = subj ? subj.TRTSDT : null;

    // Relative Day (AEDY)
    let aedy = null;
    if (onsetDt && trtsdt) {
      const d1 = new Date(onsetDt);
      const d2 = new Date(trtsdt);
      const diff = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
      aedy = diff >= 0 ? diff + 1 : diff; // CDISC standard: no Day 0
    }

    // Treatment-Emergent AE Flag (TRTEMFL)
    const isEmergent = (onsetDt && trtsdt && onsetDt >= trtsdt);
    const trtemfl = isEmergent ? "Y" : "N";

    // Severity numeric
    let aasevn = 1;
    if (e.AESEV === "MODERATE") aasevn = 2;
    else if (e.AESEV === "SEVERE") aasevn = 3;

    // Causality flag
    const aerelfl = (e.AEREL === "POSSIBLY RELATED" || e.AEREL === "PROBABLY RELATED") ? "Y" : "N";

    return {
      STUDYID: studyId,
      USUBJID: e.USUBJID,
      AESEQ: e.AESEQ,
      AETERM: e.AETERM,
      AELLT: e.AELLT,
      AEPT: e.AEPT,
      AESOC: e.AESOC,
      AESTDTC: e.AESTDTC,
      AESTDT: onsetDt,
      AEDY: aedy,
      AESEV: e.AESEV,
      AESEVN: aasevn,
      AEREL: e.AEREL,
      AERELFL: aerelfl,
      AESER: e.AESER,
      TRTEMFL: trtemfl,
      TRT01A: subj ? subj.TRT01A : "",
      TRT01AN: subj ? subj.TRT01AN : 0,
      SAFFL: subj ? subj.SAFFL : "N"
    };
  });

  // 3. ADLB (LABORATORY - BASIC DATA STRUCTURE BDS)
  // Step 3a: Extract baseline values (Visit 2 = Baseline)
  const baselineMap = new Map(); // key: `${USUBJID}_${PARAMCD}`
  LB.forEach(l => {
    if (l.VISITNUM === 2) {
      baselineMap.set(`${l.USUBJID}_${l.LBTESTCD}`, l.LBSTRESN);
    }
  });

  const adlb = LB.map(l => {
    const subj = adslMap.get(l.USUBJID);
    const sampleDt = l.LBDTC ? l.LBDTC.split("T")[0] : null;
    const trtsdt = subj ? subj.TRTSDT : null;

    // Analysis Day (ADY)
    let ady = null;
    if (sampleDt && trtsdt) {
      const d1 = new Date(sampleDt);
      const d2 = new Date(trtsdt);
      const diff = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
      ady = diff >= 0 ? diff + 1 : diff;
    }

    const aval = l.LBSTRESN;
    const base = baselineMap.get(`${l.USUBJID}_${l.LBTESTCD}`) !== undefined 
      ? baselineMap.get(`${l.USUBJID}_${l.LBTESTCD}`) 
      : aval;
    
    const chg = Number((aval - base).toFixed(2));
    const pchg = base !== 0 ? Number(((chg / base) * 100).toFixed(1)) : 0;
    const ablfl = l.VISITNUM === 2 ? "Y" : "N";

    // Toxicity Grade (NCI-CTCAE standard approximation)
    let atoxgr = 0;
    if (l.LBSTNRHI && aval > l.LBSTNRHI) {
      const ratio = aval / l.LBSTNRHI;
      if (ratio > 3.0) atoxgr = 3;
      else if (ratio > 1.5) atoxgr = 2;
      else atoxgr = 1;
    }

    return {
      STUDYID: studyId,
      USUBJID: l.USUBJID,
      PARAMCD: l.LBTESTCD,
      PARAM: l.LBTEST,
      PARCAT1: l.LBCAT,
      AVAL: aval,
      AVALC: l.LBSTRESC,
      AVALU: l.LBSTRESU,
      BASE: base,
      CHG: chg,
      PCHG: pchg,
      ABLFL: ablfl,
      ANRLO: l.LBSTNRLO,
      ANRHI: l.LBSTNRHI,
      ANRIND: l.LBNRIND,
      ATOXGR: atoxgr,
      ADY: ady,
      AVISIT: l.VISIT,
      AVISITN: l.VISITNUM,
      ADTM: l.LBDTC,
      TRT01A: subj ? subj.TRT01A : "",
      TRT01AN: subj ? subj.TRT01AN : 0,
      SAFFL: subj ? subj.SAFFL : "N"
    };
  });

  return {
    studyId,
    datasets: {
      ADSL: adsl,
      ADAE: adae,
      ADLB: adlb
    },
    metrics: {
      adslCount: adsl.length,
      adaeCount: adae.length,
      adlbCount: adlb.length,
      safflCount: adsl.filter(s => s.SAFFL === "Y").length,
      ittflCount: adsl.filter(s => s.ITTFL === "Y").length,
      ppflCount: adsl.filter(s => s.PPFL === "Y").length,
      teaeCount: adae.filter(e => e.TRTEMFL === "Y").length,
      saeCount: adae.filter(e => e.AESER === "Y").length
    }
  };
}

module.exports = {
  deriveADaM
};
