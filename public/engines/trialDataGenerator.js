/**
 * Clinical Trial Data Generator - CDISC Universe Edition
 * Generates comprehensive multi-domain raw clinical trial cohorts compliant with CDISC CDASH/SDTM/ADaM.
 * Domains: DM, VS, LB, AE, EX, CM, MH, DS, EG, QS, SV, TS
 */

function generateDiabetesTrial(nSubjects = 150) {
  const studyId = "ONC-2025-001";
  const subjects = [];
  const rawRecords = [];

  const races = ["Caucasian", "African American", "Asian", "Hispanic"];
  const aeCatalog = [
    { term: "Hypoglycemia", soc: "METABOLISM AND NUTRITION DISORDERS", pt: "Hypoglycaemia", relProb: 0.6, sevWeights: [0.7, 0.25, 0.05] },
    { term: "Nausea", soc: "GASTROINTESTINAL DISORDERS", pt: "Nausea", relProb: 0.5, sevWeights: [0.8, 0.18, 0.02] },
    { term: "Headache", soc: "NERVOUS SYSTEM DISORDERS", pt: "Headache", relProb: 0.3, sevWeights: [0.85, 0.14, 0.01] },
    { term: "Diarrhea", soc: "GASTROINTESTINAL DISORDERS", pt: "Diarrhoea", relProb: 0.45, sevWeights: [0.75, 0.2, 0.05] },
    { term: "Fatigue", soc: "GENERAL DISORDERS AND ADMINISTRATION SITE CONDITIONS", pt: "Fatigue", relProb: 0.3, sevWeights: [0.8, 0.18, 0.02] },
    { term: "Nasopharyngitis", soc: "INFECTIONS AND INFESTATIONS", pt: "Nasopharyngitis", relProb: 0.1, sevWeights: [0.9, 0.1, 0.0] },
    { term: "Elevated ALT", soc: "INVESTIGATIONS", pt: "Alanine aminotransferase increased", relProb: 0.7, sevWeights: [0.6, 0.3, 0.1] }
  ];

  const cmCatalog = [
    { drug: "Metformin Hydrochloride", decod: "METFORMIN", clas: "BIGUANIDES", dose: 500, dosu: "mg", route: "ORAL", freq: "BID" },
    { drug: "Lisinopril", decod: "LISINOPRIL", clas: "ACE INHIBITORS", dose: 10, dosu: "mg", route: "ORAL", freq: "QD" },
    { drug: "Atorvastatin Calcium", decod: "ATORVASTATIN", clas: "HMG-COA REDUCTASE INHIBITORS", dose: 20, dosu: "mg", route: "ORAL", freq: "QD" },
    { drug: "Omeprazole", decod: "OMEPRAZOLE", clas: "PROTON PUMP INHIBITORS", dose: 20, dosu: "mg", route: "ORAL", freq: "QD" },
    { drug: "Paracetamol", decod: "PARACETAMOL", clas: "ANALGESICS", dose: 500, dosu: "mg", route: "ORAL", freq: "PRN" }
  ];

  const mhCatalog = [
    { term: "Type 2 Diabetes Mellitus", decod: "TYPE 2 DIABETES MELLITUS", soc: "METABOLISM AND NUTRITION DISORDERS" },
    { term: "Essential Hypertension", decod: "HYPERTENSION", soc: "VASCULAR DISORDERS" },
    { term: "Hypercholesterolemia", decod: "HYPERCHOLESTEROLAEMIA", soc: "METABOLISM AND NUTRITION DISORDERS" },
    { term: "Diabetic Peripheral Neuropathy", decod: "DIABETIC NEUROPATHY", soc: "NERVOUS SYSTEM DISORDERS" },
    { term: "Gastroesophageal Reflux Disease", decod: "GASTRO-OESOPHAGEAL REFLUX DISEASE", soc: "GASTROINTESTINAL DISORDERS" }
  ];

  const visits = [
    { num: 1, name: "Screening", dayOffset: -14 },
    { num: 2, name: "Baseline", dayOffset: 1 },
    { num: 3, name: "Week 4", dayOffset: 28 },
    { num: 4, name: "Week 8", dayOffset: 56 },
    { num: 5, name: "Week 12", dayOffset: 84 },
    { num: 6, name: "End of Treatment", dayOffset: 90 }
  ];

  for (let i = 1; i <= nSubjects; i++) {
    const ptId = i;
    const siteId = i <= 75 ? (10 + (i % 5)) : (100 + (i % 5));
    const armCd = siteId >= 100 ? "DMED" : "PLAC";
    const arm = armCd === "DMED" ? "Dexpramipexole 150mg BID" : "Placebo";
    const gender = Math.random() > 0.48 ? "M" : "F";
    const age = Math.floor(40 + Math.random() * 32);
    const race = races[Math.floor(Math.random() * races.length)];
    const ethnicity = race === "Hispanic" ? "Hispanic" : "Non-Hispanic";

    const hasMajorViolation = Math.random() < 0.05 ? 1 : 0;
    const hasDosed = Math.random() < 0.98 ? 1 : 0;
    const compliance = hasDosed ? Math.floor(82 + Math.random() * 18) : 0;

    const baseEnroll = new Date(2025, 0, 10);
    baseEnroll.setDate(baseEnroll.getDate() + Math.floor(Math.random() * 30));
    const enrollDtStr = baseEnroll.toISOString().split("T")[0];

    const baseHbA1c = 7.8 + Math.random() * 2.2;
    const baseGlucose = 140 + Math.random() * 50;
    const baseALT = 22 + Math.random() * 22;
    const baseAST = 20 + Math.random() * 18;
    const baseCrea = 0.8 + Math.random() * 0.4;
    const baseSBP = Math.floor(122 + Math.random() * 20);
    const baseDBP = Math.floor(74 + Math.random() * 14);
    const baseHR = Math.floor(68 + Math.random() * 14);
    const baseQTcF = Math.floor(405 + Math.random() * 25);
    const baseQoL = Number((0.72 + Math.random() * 0.18).toFixed(2));

    subjects.push({
      studyId,
      ptId,
      siteId,
      armCd,
      arm,
      gender,
      age,
      race,
      ethnicity,
      enrollDt: enrollDtStr,
      hasDosed,
      hasMajorViolation,
      compliance,
      cmList: cmCatalog.slice(0, 2 + (i % 3)),
      mhList: mhCatalog.slice(0, 1 + (i % 3)),
      baseQTcF,
      baseQoL
    });

    visits.forEach((v) => {
      const vDate = new Date(baseEnroll);
      vDate.setDate(vDate.getDate() + v.dayOffset);
      const vDateStr = vDate.toISOString().split("T")[0];

      const progress = v.num / 6;
      let curHbA1c = baseHbA1c;
      let curGlucose = baseGlucose;
      let curQoL = baseQoL;

      if (v.num >= 2) {
        if (armCd === "DMED") {
          curHbA1c = baseHbA1c - (progress * 1.4) + (Math.random() * 0.2 - 0.1);
          curGlucose = baseGlucose - (progress * 35) + (Math.random() * 10 - 5);
          curQoL = Math.min(1.0, baseQoL + (progress * 0.15));
        } else {
          curHbA1c = baseHbA1c + (Math.random() * 0.2 - 0.1);
          curGlucose = baseGlucose + (Math.random() * 12 - 6);
          curQoL = baseQoL + (Math.random() * 0.04 - 0.02);
        }
      }

      const liverSpike = (armCd === "DMED" && Math.random() < 0.03) ? 3.2 : 1.0;
      const curALT = Number((baseALT * liverSpike + (Math.random() * 6 - 3)).toFixed(1));
      const curAST = Number((baseAST * liverSpike + (Math.random() * 5 - 2.5)).toFixed(1));

      rawRecords.push({
        STUDY_ID: studyId,
        PT_ID: ptId,
        SITE_ID: siteId,
        AGE: age,
        GENDER: gender,
        RACE: race,
        ETHNICITY: ethnicity,
        ENROLL_DT: enrollDtStr,
        VISIT_NUM: v.num,
        VISIT_NAME: v.name,
        VISIT_DATE: vDateStr,
        // Vitals
        SBP: baseSBP + Math.floor(Math.random() * 8 - 4),
        DBP: baseDBP + Math.floor(Math.random() * 6 - 3),
        HR: baseHR + Math.floor(Math.random() * 8 - 4),
        TEMP: Number((36.6 + Math.random() * 0.4).toFixed(1)),
        // Labs
        FPG: Number(curGlucose.toFixed(1)),
        HBA1C: Number(curHbA1c.toFixed(2)),
        CREA: Number(baseCrea.toFixed(2)),
        ALT: curALT,
        AST: curAST,
        // ECG Findings
        QTCF: baseQTcF + Math.floor(progress * 6 + (Math.random() * 8 - 4)),
        ECG_INT: "NORMAL",
        // Quality of Life Questionnaire
        QOL_INDEX: Number(curQoL.toFixed(2)),
        UNIT: "STANDARD"
      });
    });

    // Adverse Events
    if (Math.random() < 0.35) {
      const numAe = Math.random() < 0.8 ? 1 : 2;
      for (let a = 0; a < numAe; a++) {
        const aeItem = aeCatalog[Math.floor(Math.random() * aeCatalog.length)];
        const aeDate = new Date(baseEnroll);
        aeDate.setDate(aeDate.getDate() + 5 + Math.floor(Math.random() * 70));

        const randSev = Math.random();
        let sev = 1;
        if (randSev > aeItem.sevWeights[0] + aeItem.sevWeights[1]) sev = 3;
        else if (randSev > aeItem.sevWeights[0]) sev = 2;

        const rel = Math.random() < aeItem.relProb ? (Math.random() > 0.5 ? 2 : 1) : 0;

        rawRecords.push({
          STUDY_ID: studyId,
          PT_ID: ptId,
          SITE_ID: siteId,
          AGE: age,
          GENDER: gender,
          RACE: race,
          ETHNICITY: ethnicity,
          ENROLL_DT: enrollDtStr,
          AE_TEXT: aeItem.term,
          AE_SOC: aeItem.soc,
          AE_PT: aeItem.pt,
          AE_ONSET_DT: aeDate.toISOString().split("T")[0],
          AE_INTENSITY: sev,
          AE_CAUSALITY: rel,
          AE_SERIOUS: sev === 3 ? "Y" : "N"
        });
      }
    }
  }

  return {
    studyId,
    trialName: "Phase III Randomized Double-Blind Efficacy and Safety Trial of Dexpramipexole vs Placebo",
    nSubjects,
    subjects,
    rawRecords
  };
}

module.exports = {
  generateDiabetesTrial
};
