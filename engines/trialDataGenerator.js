/**
 * Clinical Trial Data Generator
 * Generates realistic multi-domain raw clinical trial cohorts (Phase II Diabetes & Phase III Oncology)
 * compliant with CDISC CDASH/SDTM/ADaM ingestion specifications.
 */

function generateDiabetesTrial(nSubjects = 150) {
  const studyId = "DIAB-2024-001";
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
    const arm = armCd === "DMED" ? "Diabetes Medication 500mg" : "Placebo";
    const gender = Math.random() > 0.48 ? "M" : "F";
    const age = Math.floor(40 + Math.random() * 32);
    const race = races[Math.floor(Math.random() * races.length)];
    const ethnicity = race === "Hispanic" ? "Hispanic" : "Non-Hispanic";

    // Protocol deviation simulation (5% rate)
    const hasMajorViolation = Math.random() < 0.05 ? 1 : 0;
    const hasDosed = Math.random() < 0.98 ? 1 : 0; // 98% receive study drug
    const compliance = hasDosed ? Math.floor(82 + Math.random() * 18) : 0;

    // Dates
    const baseEnroll = new Date(2024, 0, 15);
    baseEnroll.setDate(baseEnroll.getDate() + Math.floor(Math.random() * 45));
    const enrollDtStr = baseEnroll.toISOString().split("T")[0];

    // Baseline clinical values
    const baseHbA1c = 7.8 + Math.random() * 2.4;
    const baseGlucose = 140 + Math.random() * 60;
    const baseALT = 22 + Math.random() * 25;
    const baseAST = 20 + Math.random() * 22;
    const baseCrea = 0.8 + Math.random() * 0.4;
    const baseSBP = Math.floor(125 + Math.random() * 25);
    const baseDBP = Math.floor(75 + Math.random() * 15);
    const baseHR = Math.floor(68 + Math.random() * 16);

    // Track subject metadata
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
      compliance
    });

    // Generate visits data
    visits.forEach((v) => {
      const vDate = new Date(baseEnroll);
      vDate.setDate(vDate.getDate() + v.dayOffset);
      const vDateStr = vDate.toISOString().split("T")[0];

      // Treatment effect on labs
      const progress = v.num / 6;
      let curHbA1c = baseHbA1c;
      let curGlucose = baseGlucose;

      if (v.num >= 2) {
        if (armCd === "DMED") {
          curHbA1c = baseHbA1c - (progress * 1.4) + (Math.random() * 0.2 - 0.1);
          curGlucose = baseGlucose - (progress * 35) + (Math.random() * 10 - 5);
        } else {
          curHbA1c = baseHbA1c + (Math.random() * 0.3 - 0.1);
          curGlucose = baseGlucose + (Math.random() * 12 - 6);
        }
      }

      // Small chance of outlier on liver enzymes
      const liverSpike = (armCd === "DMED" && Math.random() < 0.04) ? 3.5 : 1.0;
      const curALT = Number((baseALT * liverSpike + (Math.random() * 8 - 4)).toFixed(1));
      const curAST = Number((baseAST * liverSpike + (Math.random() * 6 - 3)).toFixed(1));

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
        TEMP: Number((36.6 + Math.random() * 0.5).toFixed(1)),
        // Labs
        FPG: Number(curGlucose.toFixed(1)),
        HBA1C: Number(curHbA1c.toFixed(2)),
        CREA: Number(baseCrea.toFixed(2)),
        ALT: curALT,
        AST: curAST,
        UNIT: "STANDARD"
      });
    });

    // Generate Adverse Events (25-30% of patients experience AEs)
    if (Math.random() < 0.32) {
      const numAe = Math.random() < 0.75 ? 1 : 2;
      for (let a = 0; a < numAe; a++) {
        const aeItem = aeCatalog[Math.floor(Math.random() * aeCatalog.length)];
        const aeDate = new Date(baseEnroll);
        aeDate.setDate(aeDate.getDate() + 5 + Math.floor(Math.random() * 70));

        // Severity: 1=Mild, 2=Moderate, 3=Severe
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
    trialName: "Phase II Placebo-Controlled Diabetes Efficacy & Safety Trial",
    nSubjects,
    subjects,
    rawRecords
  };
}

module.exports = {
  generateDiabetesTrial
};
