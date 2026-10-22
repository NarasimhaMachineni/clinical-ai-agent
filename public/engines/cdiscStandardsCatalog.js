/**
 * CDISC SDTMIG v3.3 & ADaMIG v1.2 Complete Standards Catalog
 * Exhaustive regulatory metadata for all 64 clinical trial domains and analysis datasets.
 */

const CDISC_STANDARDS_CATALOG = [
  // ============================================================================
  // 1. SPECIAL PURPOSE DOMAINS (SDTM)
  // ============================================================================
  {
    code: "DM",
    name: "Demographics",
    standard: "SDTM",
    class: "Special Purpose",
    description: "Core subject baseline data including age, sex, race, ethnicity, and assigned treatment arm. Mandatory anchor domain for all clinical trials.",
    structure: "Exactly one record per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "SUBJID", "RFSTDTC", "RFENDTC", "SITEID", "AGE", "AGEU", "SEX", "RACE", "ETHNIC", "ARMCD", "ARM", "COUNTRY"],
    analysisPurpose: "Primary population anchor. Determines safety, ITT, and per-protocol population denominators.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DM", USUBJID: "ONC-2025-001-001", SUBJID: "001", RFSTDTC: "2025-01-10T09:00:00", AGE: 58, SEX: "F", RACE: "WHITE", ARM: "Dexpramipexole 150mg BID" }
  },
  {
    code: "CO",
    name: "Comments",
    standard: "SDTM",
    class: "Special Purpose",
    description: "Free-text unstructured investigator, coordinator, or site comments linked to specific records, visits, or general subject observations.",
    structure: "One or more records per subject or per record.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "COSEQ", "RDOMAIN", "IDVAR", "IDVARVAL", "COEVAL", "COVAL", "CODTC"],
    analysisPurpose: "Audited during clinical monitoring and medical review for protocol non-compliance clues or adverse event context.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "CO", USUBJID: "ONC-2025-001-001", COSEQ: 1, RDOMAIN: "AE", IDVAR: "AESEQ", IDVARVAL: "1", COVAL: "Mild headache resolved spontaneously after hydration", CODTC: "2025-01-15" }
  },
  {
    code: "SE",
    name: "Subject Elements",
    standard: "SDTM",
    class: "Special Purpose",
    description: "Documents the actual transition and duration of subjects across trial design building blocks (Screening, Run-in, Treatment, Washout, Follow-up).",
    structure: "One record per element transition per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "SESEQ", "ETCD", "ELEMENT", "SESTDTC", "SEENDTC", "TAETORD", "EPOCH"],
    analysisPurpose: "Calculates epoch-specific exposure intervals and identifies protocol pathway transitions.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "SE", USUBJID: "ONC-2025-001-001", SESEQ: 1, ETCD: "SCRN", ELEMENT: "Screening Period", SESTDTC: "2025-01-02", SEENDTC: "2025-01-09", EPOCH: "SCREENING" }
  },
  {
    code: "SV",
    name: "Subject Visits",
    standard: "SDTM",
    class: "Special Purpose",
    description: "Chronicles actual visits attended, missed, or conducted out-of-window by the subject, including visit start and end dates.",
    structure: "One record per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "VISITNUM", "VISIT", "SVSTDTC", "SVENDTC", "SVUPDES"],
    analysisPurpose: "Enables protocol visit window derivations (AVISIT/AVISITN) and compliance auditing.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "SV", USUBJID: "ONC-2025-001-001", VISITNUM: 1, VISIT: "Screening Visit 1", SVSTDTC: "2025-01-02T10:15:00", SVENDTC: "2025-01-02T14:30:00" }
  },
  {
    code: "SM",
    name: "Subject Milestones",
    standard: "SDTM",
    class: "Special Purpose",
    description: "Significant non-visit milestones achieved by the subject, such as date of informed consent, date of randomization, or enrollment.",
    structure: "One record per milestone per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "SMSEQ", "SMTERM", "SMCAT", "SMDTC"],
    analysisPurpose: "Calculates screening duration, time from consent to randomization, and regulatory milestone compliance.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "SM", USUBJID: "ONC-2025-001-001", SMSEQ: 1, SMTERM: "Informed Consent Signed", SMCAT: "REGULATORY", SMDTC: "2025-01-02" }
  },

  // ============================================================================
  // 2. INTERVENTIONS DOMAINS (SDTM)
  // ============================================================================
  {
    code: "AG",
    name: "Procedure Agents",
    standard: "SDTM",
    class: "Interventions",
    description: "Specialized agents administered specifically in support of diagnostic, imaging, or therapeutic procedures (e.g., contrast dyes, local anesthetics).",
    structure: "One record per procedure agent administration per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "AGSEQ", "AGTRT", "AGDOSE", "AGDOSU", "AGROUTE", "AGSTDTC"],
    analysisPurpose: "Surveillance of procedural safety and adverse reactions to imaging/contrast media.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "AG", USUBJID: "ONC-2025-001-001", AGSEQ: 1, AGTRT: "Iopamidol 370", AGDOSE: 100, AGDOSU: "mL", AGROUTE: "INTRAVENOUS", AGSTDTC: "2025-01-05" }
  },
  {
    code: "CM",
    name: "Concomitant Medications",
    standard: "SDTM",
    class: "Interventions",
    description: "Prior, ongoing, and concomitant medications, over-the-counter drugs, biologics, and herbal supplements taken during the trial.",
    structure: "One record per recorded medication per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "CMSEQ", "CMTRT", "CMDECOD", "CMCLAS", "CMDOSE", "CMDOSU", "CMROUTE", "CMDOSFRQ", "CMSTDTC", "CMENDTC"],
    analysisPurpose: "Derivation of ADCM, co-medication safety profiling, and prohibited medication screening.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "CM", USUBJID: "ONC-2025-001-001", CMSEQ: 1, CMTRT: "Metformin HCl", CMDECOD: "METFORMIN", CMCLAS: "BIGUANIDES", CMDOSE: 500, CMDOSU: "mg", CMDOSFRQ: "BID", CMSTDTC: "2024-03-12" }
  },
  {
    code: "EC",
    name: "Exposure as Collected",
    standard: "SDTM",
    class: "Interventions",
    description: "Raw study drug dosing records as recorded directly on electronic Case Report Forms prior to reconciliation with protocol rules.",
    structure: "One record per collected dosing instance per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "ECSEQ", "ECTRT", "ECDOSE", "ECDOSU", "ECROUTE", "ECSTDTC", "ECENDTC"],
    analysisPurpose: "Source audit domain for clinical data management and reconciliation into domain EX.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "EC", USUBJID: "ONC-2025-001-001", ECSEQ: 1, ECTRT: "Study Drug", ECDOSE: 150, ECDOSU: "mg", ECROUTE: "ORAL", ECSTDTC: "2025-01-10T08:00:00" }
  },
  {
    code: "EX",
    name: "Exposure",
    standard: "SDTM",
    class: "Interventions",
    description: "Protocol-specified investigational product administration, defining exact doses, units, route, duration, and formulation received.",
    structure: "One record per constant dosing interval per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "EXSEQ", "EXTRT", "EXDOSE", "EXDOSU", "EXDOSFRM", "EXROUTE", "EXDOSFRQ", "EXSTDTC", "EXENDTC"],
    analysisPurpose: "Determines first dose (TRTSDT), last dose (TRTEDT), total exposure duration, and dose intensity.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "EX", USUBJID: "ONC-2025-001-001", EXSEQ: 1, EXTRT: "Dexpramipexole", EXDOSE: 150, EXDOSU: "mg", EXDOSFRM: "TABLET", EXROUTE: "ORAL", EXDOSFRQ: "BID", EXSTDTC: "2025-01-10T09:00:00", EXENDTC: "2025-06-20T21:00:00" }
  },
  {
    code: "ML",
    name: "Meal Data",
    standard: "SDTM",
    class: "Interventions",
    description: "Dietary intake, standard breakfast/test meals, and caloric timing relative to pharmacokinetics dosing in Phase I and bioequivalence studies.",
    structure: "One record per meal occurrence per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "MLSEQ", "MLTRT", "MLCAT", "MLDOSE", "MLSTDTC"],
    analysisPurpose: "Assesses food effect on drug absorption ($C_{max}$, $T_{max}$, $AUC$).",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "ML", USUBJID: "ONC-2025-001-001", MLSEQ: 1, MLTRT: "Standard FDA High-Fat Breakfast", MLCAT: "PK DIET", MLSTDTC: "2025-01-10T07:30:00" }
  },
  {
    code: "PR",
    name: "Procedures",
    standard: "SDTM",
    class: "Interventions",
    description: "Diagnostic, surgical, exploratory, and therapeutic procedures performed on the subject during or prior to the clinical trial.",
    structure: "One record per procedure per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "PRSEQ", "PRTRT", "PRDECOD", "PRCAT", "PRSTDTC", "PRENDTC"],
    analysisPurpose: "Documents protocol compliance, surgery history, biopsy collection, and therapeutic interventions.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "PR", USUBJID: "ONC-2025-001-001", PRSEQ: 1, PRTRT: "Core Needle Biopsy of Liver", PRDECOD: "LIVER BIOPSY", PRCAT: "DIAGNOSTIC", PRSTDTC: "2025-01-04" }
  },
  {
    code: "SU",
    name: "Substance Use",
    standard: "SDTM",
    class: "Interventions",
    description: "Subject historical and ongoing consumption patterns of tobacco, nicotine products, alcohol, and caffeine.",
    structure: "One record per substance use category per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "SUSEQ", "SUTRT", "SUCAT", "SUDOSE", "SUDOSU", "SUSTATUS", "SUSTDTC"],
    analysisPurpose: "Evaluates baseline confounding covariates (e.g., pack-years of smoking, alcohol use) in statistical efficacy and safety models.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "SU", USUBJID: "ONC-2025-001-001", SUSEQ: 1, SUTRT: "Cigarettes", SUCAT: "TOBACCO", SUDOSE: 10, SUDOSU: "CIGARETTES/DAY", SUSTATUS: "FORMER", SUSTDTC: "2010" }
  },

  // ============================================================================
  // 3. EVENTS DOMAINS (SDTM)
  // ============================================================================
  {
    code: "AE",
    name: "Adverse Events",
    standard: "SDTM",
    class: "Events",
    description: "Untoward medical occurrences, toxicities, CTCAE grading, serious adverse events (SAEs), and suspected causal relationships.",
    structure: "One record per adverse event per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "AESEQ", "AETERM", "AELLT", "AEPT", "AEHLT", "AEBODSYS", "AESOC", "AESEV", "AESER", "AEREL", "AESTDTC", "AEENDTC"],
    analysisPurpose: "Mandatory regulatory safety surveillance, MedDRA incidence tabulations, and derivation of ADAE.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "AE", USUBJID: "ONC-2025-001-001", AESEQ: 1, AETERM: "Headache", AEPT: "Headache", AESOC: "NERVOUS SYSTEM DISORDERS", AESEV: "MILD", AESER: "N", AEREL: "POSSIBLE", AESTDTC: "2025-01-14T14:20:00" }
  },
  {
    code: "CE",
    name: "Clinical Events",
    standard: "SDTM",
    class: "Events",
    description: "Pre-specified clinical events or endpoints evaluated by an independent Clinical Event Committee (CEC) or adjudication charter.",
    structure: "One record per clinical event per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "CESEQ", "CETERM", "CECAT", "CESEV", "CESTDTC", "CEADJ"],
    analysisPurpose: "Validates major cardiovascular events (MACE), stroke, or adjudications for regulatory approval.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "CE", USUBJID: "ONC-2025-001-001", CESEQ: 1, CETERM: "Myocardial Infarction", CECAT: "MACE", CESTDTC: "2025-03-22", CEADJ: "CONFIRMED" }
  },
  {
    code: "DS",
    name: "Disposition",
    standard: "SDTM",
    class: "Events",
    description: "Subject disposition milestones, study completion, screening failures, protocol completion, and primary reasons for early discontinuation.",
    structure: "One record per disposition event or epoch per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "DSSEQ", "DSTERM", "DSDECOD", "DSCAT", "EPOCH", "DSSTDTC"],
    analysisPurpose: "Derivation of study completion status, primary reason for withdrawal, and consort diagram figures.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DS", USUBJID: "ONC-2025-001-001", DSSEQ: 1, DSTERM: "Completed Treatment Period", DSDECOD: "COMPLETED", DSCAT: "DISPOSITION EVENT", EPOCH: "TREATMENT", DSSTDTC: "2025-06-20" }
  },
  {
    code: "DV",
    name: "Protocol Deviations",
    standard: "SDTM",
    class: "Events",
    description: "Deviations, exceptions, and violations of protocol requirements identified during site monitoring or automated system QC audits.",
    structure: "One record per deviation per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "DVSEQ", "DVTERM", "DVDECOD", "DVCAT", "DVSTDTC"],
    analysisPurpose: "Critical for defining the Per-Protocol (PPFL / PPROTFL) analysis population in ADSL.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DV", USUBJID: "ONC-2025-001-001", DVSEQ: 1, DVTERM: "Visit window exceeded by 14 days", DVDECOD: "VISIT WINDOW DEVIATION", DVCAT: "MINOR", DVSTDTC: "2025-04-10" }
  },
  {
    code: "HO",
    name: "Healthcare Encounters",
    standard: "SDTM",
    class: "Events",
    description: "Inpatient hospital admissions, Intensive Care Unit (ICU) stays, emergency department visits, and outpatient clinic encounters.",
    structure: "One record per healthcare encounter per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "HOSEQ", "HOTERM", "HODECOD", "HOCAT", "HOSTDTC", "HOENDTC"],
    analysisPurpose: "Health economics and outcomes research (HEOR), resource utilization, and hospitalization rate modeling.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "HO", USUBJID: "ONC-2025-001-001", HOSEQ: 1, HOTERM: "Emergency Room Visit for Dehydration", HODECOD: "EMERGENCY ROOM", HOSTDTC: "2025-02-18", HOENDTC: "2025-02-18" }
  },
  {
    code: "MH",
    name: "Medical History",
    standard: "SDTM",
    class: "Events",
    description: "Pre-existing medical conditions, chronic illnesses, prior surgical operations, and significant historical pathology.",
    structure: "One record per medical history condition per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "MHSEQ", "MHTERM", "MHDECOD", "MHSOCCD", "MHBODSYS", "MHCAT", "MHSTDTC", "MHENDTC", "MHENRTP"],
    analysisPurpose: "Baseline disease stratification, confounding assessment, and baseline disease duration derivation.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "MH", USUBJID: "ONC-2025-001-001", MHSEQ: 1, MHTERM: "Type 2 Diabetes Mellitus", MHDECOD: "TYPE 2 DIABETES MELLITUS", MHBODSYS: "METABOLIC AND NUTRITIONAL DISORDERS", MHSTDTC: "2018-05-15", MHENRTP: "ONGOING" }
  },

  // ============================================================================
  // 4. FINDINGS DOMAINS (SDTM)
  // ============================================================================
  {
    code: "CF",
    name: "Clinical Findings About",
    standard: "SDTM",
    class: "Findings",
    description: "Additional, specialized clinical observations related directly to a parent event or finding.",
    structure: "One record per clinical finding per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "CFSEQ", "CFTYPE", "CFTEST", "CFSTRESC", "CFDTC"],
    analysisPurpose: "Granular symptom profiling and secondary clinical attributes.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "CF", USUBJID: "ONC-2025-001-001", CFSEQ: 1, CFTEST: "Post-dose Flushing Intensity", CFSTRESC: "MODERATE", CFDTC: "2025-01-10T11:00:00" }
  },
  {
    code: "CV",
    name: "Cardiovascular Findings",
    standard: "SDTM",
    class: "Findings",
    description: "Echocardiography, Doppler hemodynamics, ejection fraction, cardiac index, and specialized structural cardiology assessments.",
    structure: "One or more records per parameter per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "CVSEQ", "CVTESTCD", "CVTEST", "CVORRES", "CVSTRESN", "CVSTRESU", "VISIT", "CVDTC"],
    analysisPurpose: "Evaluates cardiotoxicity, left ventricular ejection fraction (LVEF) reductions, and heart failure progression.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "CV", USUBJID: "ONC-2025-001-001", CVSEQ: 1, CVTESTCD: "LVEF", CVTEST: "Left Ventricular Ejection Fraction", CVSTRESN: 62, CVSTRESU: "%", VISIT: "Baseline", CVDTC: "2025-01-08" }
  },
  {
    code: "DA",
    name: "Drug Accountability",
    standard: "SDTM",
    class: "Findings",
    description: "Dispensed, returned, lost, and wasted unit counts of investigational product across treatment periods.",
    structure: "One record per accountability assessment per kit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "DASEQ", "DATESTCD", "DATEST", "DAORRES", "DASTRESN", "VISIT", "DADTC"],
    analysisPurpose: "Calculates subject treatment compliance percentage in ADSL (COMPLFL).",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DA", USUBJID: "ONC-2025-001-001", DASEQ: 1, DATESTCD: "DISPUNIT", DATEST: "Units Dispensed", DASTRESN: 60, VISIT: "Cycle 1 Day 1", DADTC: "2025-01-10" }
  },
  {
    code: "DD",
    name: "Death Details",
    standard: "SDTM",
    class: "Findings",
    description: "Official mortality records, primary cause of death, autopsy results, and coroner findings.",
    structure: "One record per death assessment per deceased subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "DDSEQ", "DDTESTCD", "DDTEST", "DDORRES", "DDSTRESC", "DDDTC"],
    analysisPurpose: "FDA/EMA mortality adjudication and Overall Survival (OS) censoring validation in ADTTE.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DD", USUBJID: "ONC-2025-001-009", DDSEQ: 1, DDTESTCD: "CAUSDTH", DDTEST: "Primary Cause of Death", DDSTRESC: "Disease Progression", DDDTC: "2025-05-12" }
  },
  {
    code: "EG",
    name: "ECG Results",
    standard: "SDTM",
    class: "Findings",
    description: "Standard 12-lead Electrocardiogram quantitative measurements (QT, QTcB, QTcF, PR interval, QRS duration, Heart Rate) and qualitative interpretations.",
    structure: "One or more records per parameter per replicate per timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "EGSEQ", "EGTESTCD", "EGTEST", "EGORRES", "EGSTRESN", "EGSTRESU", "VISIT", "EGTPT", "EGDTC"],
    analysisPurpose: "FDA E14 Thorough QT/QTc cardiotoxicity assessment, threshold outlier flags ($QTc > 500 ms$, $Delta QTc > 60 ms$).",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "EG", USUBJID: "ONC-2025-001-001", EGSEQ: 1, EGTESTCD: "QTCF", EGTEST: "QTcF Interval Fridericia", EGSTRESN: 412, EGSTRESU: "ms", VISIT: "Baseline", EGDTC: "2025-01-09T10:00:00" }
  },
  {
    code: "FA",
    name: "Findings About",
    standard: "SDTM",
    class: "Findings",
    description: "Generic structured observations about events or interventions (e.g., severity of nausea, injection site erythema diameter).",
    structure: "One record per observation per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "FASEQ", "FATESTCD", "FATEST", "FAOBJ", "FASTRESC", "FADTC"],
    analysisPurpose: "Captures protocol-mandated specific toxicity features or intervention outcomes.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "FA", USUBJID: "ONC-2025-001-001", FASEQ: 1, FATESTCD: "SEV", FATEST: "Severity", FAOBJ: "NAUSEA", FASTRESC: "GRADE 1", FADTC: "2025-01-14" }
  },
  {
    code: "FT",
    name: "Functional Tests",
    standard: "SDTM",
    class: "Findings",
    description: "Standardized physical and cognitive assessments (e.g., 6-Minute Walk Test, Grip Strength, Mini-Mental State Exam).",
    structure: "One record per test per timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "FTSEQ", "FTTESTCD", "FTTEST", "FTSTRESN", "FTSTRESU", "VISIT", "FTDTC"],
    analysisPurpose: "Primary functional efficacy endpoints in neurology, pulmonary, and rheumatology trials.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "FT", USUBJID: "ONC-2025-001-001", FTSEQ: 1, FTTESTCD: "6MWT", FTTEST: "6-Minute Walk Distance", FTSTRESN: 420, FTSTRESU: "m", VISIT: "Week 12", FTDTC: "2025-04-03" }
  },
  {
    code: "GF",
    name: "Genomics Findings",
    standard: "SDTM",
    class: "Findings",
    description: "Genomic, transcriptomic, and molecular diagnostic measurements, genetic variant alleles, and sequencing mutation calls.",
    structure: "One record per genetic variant per assay per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "GFSEQ", "GFTESTCD", "GFTEST", "GFGENE", "GFSTRESC", "GFDTC"],
    analysisPurpose: "Precision medicine stratification, biomarker-driven subgroup analyses, and companion diagnostics.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "GF", USUBJID: "ONC-2025-001-001", GFSEQ: 1, GFTESTCD: "EGFRMUT", GFTEST: "EGFR Mutation", GFGENE: "EGFR", GFSTRESC: "L858R MUTATION DETECTED", GFDTC: "2025-01-03" }
  },
  {
    code: "IE",
    name: "Inclusion / Exclusion",
    standard: "SDTM",
    class: "Findings",
    description: "Specific protocol inclusion and exclusion criteria that were violated or unmet during screening.",
    structure: "One record per criterion violated per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "IESEQ", "IETESTCD", "IETEST", "IECAT", "IEORRES", "IEDTC"],
    analysisPurpose: "Audit screening failures, protocol waiver documentation, and regulatory eligibility checks.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "IE", USUBJID: "ONC-2025-001-002", IESEQ: 1, IETESTCD: "INCL03", IETEST: "HbA1c between 7.0% and 10.5%", IECAT: "INCLUSION", IEORRES: "N", IEDTC: "2025-01-05" }
  },
  {
    code: "IS",
    name: "Immunogenicity Specimen",
    standard: "SDTM",
    class: "Findings",
    description: "Anti-drug antibody (ADA) titers, neutralizing antibodies (NAb), assay optical densities, and confirmation tests.",
    structure: "One record per immunogenicity assay per timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "ISSEQ", "ISTESTCD", "ISTEST", "ISORRES", "ISSTRESC", "VISIT", "ISDTC"],
    analysisPurpose: "Safety assessment of biological therapeutics, immune neutralization, and loss of efficacy correlation.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "IS", USUBJID: "ONC-2025-001-001", ISSEQ: 1, ISTESTCD: "ADATITR", ISTEST: "Anti-Drug Antibody Titer", ISSTRESC: "NEGATIVE", VISIT: "Baseline", ISDTC: "2025-01-10" }
  },
  {
    code: "LB",
    name: "Laboratory Results",
    standard: "SDTM",
    class: "Findings",
    description: "Central and local laboratory clinical chemistry, hematology, urinalysis, endocrine, and coagulation assays.",
    structure: "One or more records per analyte per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "LBSEQ", "LBTESTCD", "LBTEST", "LBCAT", "LBORRES", "LBSTRESN", "LBSTRESU", "LBSTRESC", "LBSTNRHI", "LBSTNRLO", "VISIT", "LBDTC"],
    analysisPurpose: "Hy's Law hepatotoxicity surveillance, NCI-CTCAE toxicity grading, shift tables, and derivation of ADLB.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "LB", USUBJID: "ONC-2025-001-001", LBSEQ: 1, LBTESTCD: "ALT", LBTEST: "Alanine Aminotransferase", LBCAT: "CHEMISTRY", LBSTRESN: 26.5, LBSTRESU: "U/L", LBSTNRHI: 56, LBSTNRLO: 7, VISIT: "Baseline", LBDTC: "2025-01-10T08:30:00" }
  },
  {
    code: "MB",
    name: "Microbiology Specimen",
    standard: "SDTM",
    class: "Findings",
    description: "Microorganism isolation, viral titers, bacterial strain identification, and quantitative culture counts.",
    structure: "One record per organism per specimen per timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "MBSEQ", "MBTESTCD", "MBTEST", "MBORRES", "MBSTRESC", "MBSPEC", "MBDTC"],
    analysisPurpose: "Infectious disease efficacy endpoints, microbiological eradication rates, and viral load log-reduction.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "MB", USUBJID: "ONC-2025-001-001", MBSEQ: 1, MBTESTCD: "VIRLOAD", MBTEST: "HCV RNA Viral Load", MBSTRESC: "UNDETECTABLE", MBSPEC: "PLASMA", MBDTC: "2025-03-10" }
  },
  {
    code: "MI",
    name: "Microscopic Findings",
    standard: "SDTM",
    class: "Findings",
    description: "Histopathology, tissue biopsy microscopic descriptions, cellular morphology, and immunohistochemistry staining.",
    structure: "One record per microscopic observation per specimen per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "MISEQ", "MITESTCD", "MITEST", "MISPEC", "MISTRESC", "MIDTC"],
    analysisPurpose: "Pathology review, histological disease grading, and tissue-based treatment effect confirmation.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "MI", USUBJID: "ONC-2025-001-001", MISEQ: 1, MITESTCD: "FIBROSIS", MITEST: "Liver Fibrosis Ishak Score", MISPEC: "LIVER", MISTRESC: "STAGE 1", MIDTC: "2025-01-04" }
  },
  {
    code: "MK",
    name: "Musculoskeletal Findings",
    standard: "SDTM",
    class: "Findings",
    description: "Joint swelling, tenderness, range of motion, muscle strength grading, and rheumatology articular counts.",
    structure: "One record per joint/muscle evaluated per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "MKSEQ", "MKTESTCD", "MKTEST", "MKLOC", "MKSTRESC", "VISIT", "MKDTC"],
    analysisPurpose: "ACR20/50/70 component score derivation in rheumatoid arthritis and orthopedic assessments.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "MK", USUBJID: "ONC-2025-001-001", MKSEQ: 1, MKTESTCD: "SWELL", MKTEST: "Joint Swelling", MKLOC: "RIGHT KNEE", MKSTRESC: "ABSENT", VISIT: "Week 4", MKDTC: "2025-02-07" }
  },
  {
    code: "MO",
    name: "Morphology",
    standard: "SDTM",
    class: "Findings",
    description: "Gross anatomy descriptions and morphological features of tissues, skin lesions, and organs observed during clinical exams.",
    structure: "One record per morphological assessment per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "MOSEQ", "MOTESTCD", "MOTEST", "MOLOC", "MOSTRESC", "MODTC"],
    analysisPurpose: "Surgical inspection records and dermatological lesion categorization.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "MO", USUBJID: "ONC-2025-001-001", MOSEQ: 1, MOTESTCD: "COLSHP", MOTEST: "Lesion Appearance", MOLOC: "UPPER BACK", MOSTRESC: "ERYTHEMATOUS MACULE", MODTC: "2025-01-10" }
  },
  {
    code: "MS",
    name: "Microbiology Susceptibility",
    standard: "SDTM",
    class: "Findings",
    description: "Minimum Inhibitory Concentration (MIC) values, Kirby-Bauer disk diffusion diameters, and CLSI susceptibility ratings (S/I/R).",
    structure: "One record per antibiotic per isolate per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "MSSEQ", "MSTESTCD", "MSTEST", "MSORRES", "MSSTRESC", "MSDTC"],
    analysisPurpose: "Antibiotic resistance surveillance, pathogen susceptibility profile, and antimicrobial efficacy endpoints.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "MS", USUBJID: "ONC-2025-001-001", MSSEQ: 1, MSTESTCD: "VANCOMIC", MSTEST: "Vancomycin MIC", MSSTRESC: "SUSCEPTIBLE", MSDTC: "2025-01-06" }
  },
  {
    code: "NV",
    name: "Nervous System Findings",
    standard: "SDTM",
    class: "Findings",
    description: "Neurological physical exams, cranial nerve function, deep tendon reflexes, and specialized sensory test results.",
    structure: "One record per neurological test per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "NVSEQ", "NVTESTCD", "NVTEST", "NVLOC", "NVSTRESC", "VISIT", "NVDTC"],
    analysisPurpose: "Neuropathy surveillance, CNS drug safety profiling, and neurodegenerative disease monitoring.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "NV", USUBJID: "ONC-2025-001-001", NVSEQ: 1, NVTESTCD: "PINPRK", NVTEST: "Pinprick Sensation", NVLOC: "BILATERAL FEET", NVSTRESC: "NORMAL", VISIT: "Baseline", NVDTC: "2025-01-09" }
  },
  {
    code: "OE",
    name: "Ophthalmic Examinations",
    standard: "SDTM",
    class: "Findings",
    description: "Visual acuity scores (ETDRS), intraocular pressure (IOP), slit-lamp biomicroscopy, and fundoscopic retina findings.",
    structure: "One record per parameter per eye (OD/OS/OU) per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "OESEQ", "OETESTCD", "OETEST", "OELOC", "OELAT", "OESTRESN", "OESTRESC", "VISIT", "OEDTC"],
    analysisPurpose: "Ophthalmology efficacy endpoints, glaucoma progression, and ocular drug toxicity monitoring.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "OE", USUBJID: "ONC-2025-001-001", OESEQ: 1, OETESTCD: "BCVA", OETEST: "Best Corrected Visual Acuity", OELAT: "RIGHT", OESTRESN: 85, OESTRESC: "85 LETTERS", VISIT: "Baseline", OEDTC: "2025-01-08" }
  },
  {
    code: "PC",
    name: "PK Concentrations",
    standard: "SDTM",
    class: "Findings",
    description: "Quantified drug parent molecule and metabolite concentrations measured in serum, plasma, urine, or tissue matrices over time.",
    structure: "One record per analyte per specimen per collection timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "PCSEQ", "PCTESTCD", "PCTEST", "PCORRES", "PCSTRESN", "PCSTRESU", "VISIT", "PCTPT", "PCTPTNUM", "PCDTC"],
    analysisPurpose: "Direct input into non-compartmental pharmacokinetic (NCA) derivations and ADPC/ADPP.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "PC", USUBJID: "ONC-2025-001-001", PCSEQ: 1, PCTESTCD: "DEXCONC", PCTEST: "Dexpramipexole Concentration", PCSTRESN: 142.6, PCSTRESU: "ng/mL", VISIT: "Cycle 1 Day 1", PCTPT: "2 HR POST-DOSE", PCTPTNUM: 2, PCDTC: "2025-01-10T11:00:00" }
  },
  {
    code: "PE",
    name: "Physical Examination",
    standard: "SDTM",
    class: "Findings",
    description: "Comprehensive baseline and post-baseline body system assessments (HEENT, Cardiovascular, Pulmonary, Abdomen, Extremities).",
    structure: "One record per body system per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "PESEQ", "PETESTCD", "PETEST", "PEBODSYS", "PEORRES", "PESTRESC", "VISIT", "PEDTC"],
    analysisPurpose: "Clinical baseline eligibility verification and emergent physical abnormality tracking.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "PE", USUBJID: "ONC-2025-001-001", PESEQ: 1, PETESTCD: "ABDOMEN", PETEST: "Abdominal Exam", PEBODSYS: "GASTROINTESTINAL", PESTRESC: "NORMAL", VISIT: "Screening", PEDTC: "2025-01-03" }
  },
  {
    code: "PP",
    name: "PK Parameters",
    standard: "SDTM",
    class: "Findings",
    description: "Non-compartmental pharmacokinetic (NCA) parameters derived from concentration-time curves ($AUC_{0-t}$, $AUC_{0-\infty}$, $C_{max}$, $t_{1/2}$, $CL/F$, $V_z/F$).",
    structure: "One record per parameter per analyte per profile per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "PPSEQ", "PPTESTCD", "PPTEST", "PPORRES", "PPSTRESN", "PPSTRESU", "VISIT", "PPDTC"],
    analysisPurpose: "Dose proportionality, clearance, bioavailability, and bioequivalence statistical evaluation.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "PP", USUBJID: "ONC-2025-001-001", PPSEQ: 1, PPTESTCD: "CMAX", PPTEST: "Maximum Observed Concentration", PPSTRESN: 185.4, PPSTRESU: "ng/mL", VISIT: "Cycle 1 Day 1", PPDTC: "2025-01-10" }
  },
  {
    code: "QS",
    name: "Questionnaires",
    standard: "SDTM",
    class: "Findings",
    description: "Patient-Reported Outcomes (PROs), surveys, depression inventories (PHQ-9), pain rating scales (VAS), and health-related Quality of Life (QoL).",
    structure: "One record per questionnaire item or subscore per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "QSSEQ", "QSTESTCD", "QSTEST", "QSCAT", "QSORRES", "QSSTRESN", "VISIT", "QSDTC"],
    analysisPurpose: "Primary and secondary patient-centric quality of life efficacy outcomes in ADQS.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "QS", USUBJID: "ONC-2025-001-001", QSSEQ: 1, QSTESTCD: "EQ5D01", QSTEST: "Mobility", QSCAT: "EQ-5D-5L", QSSTRESN: 1, VISIT: "Baseline", QSDTC: "2025-01-09" }
  },
  {
    code: "RE",
    name: "Reproductive System Findings",
    standard: "SDTM",
    class: "Findings",
    description: "Menstrual cycle tracking, lactation observations, pregnancy test results (serum/urine hCG), and fertility surveillance.",
    structure: "One record per test per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "RESEQ", "RETESTCD", "RETEST", "RESTRESC", "VISIT", "REDTC"],
    analysisPurpose: "Ensures protocol pregnancy safety compliance and teratogenic risk management.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "RE", USUBJID: "ONC-2025-001-001", RESEQ: 1, RETESTCD: "PREGTEST", RETEST: "Urine Pregnancy hCG", RESTRESC: "NEGATIVE", VISIT: "Cycle 1 Day 1", REDTC: "2025-01-10" }
  },
  {
    code: "RP",
    name: "Reproductive System Findings (Historic)",
    standard: "SDTM",
    class: "Findings",
    description: "Historical obstetrics data, parity, gravidity, prior pregnancy outcomes, and menopausal status.",
    structure: "One record per obstetric observation per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "RPSEQ", "RPTESTCD", "RPTEST", "RPSTRESC", "RPDTC"],
    analysisPurpose: "Demographic and baseline reproductive history stratification.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "RP", USUBJID: "ONC-2025-001-001", RPSEQ: 1, RPTESTCD: "MENOPSTS", RPTEST: "Menopausal Status", RPSTRESC: "POST-MENOPAUSAL", RPDTC: "2025-01-02" }
  },
  {
    code: "RS",
    name: "Disease Response",
    standard: "SDTM",
    class: "Findings",
    description: "Clinical disease response assessments adjudicated per validated criteria (RECIST 1.1, Lugano, Cheson, iRECIST).",
    structure: "One record per response criteria evaluation per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "RSSEQ", "RSTESTCD", "RSTEST", "RSSTRESC", "RSEVAL", "VISIT", "RSDTC"],
    analysisPurpose: "Determination of Best Overall Response (BOR), Complete Response (CR), Partial Response (PR), and Objective Response Rate (ORR).",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "RS", USUBJID: "ONC-2025-001-001", RSSEQ: 1, RSTESTCD: "OVRESP", RSTEST: "Overall Response per RECIST 1.1", RSSTRESC: "PARTIAL RESPONSE", RSEVAL: "INDEPENDENT REVIEW FACILITY", VISIT: "Week 12", RSDTC: "2025-04-04" }
  },
  {
    code: "SC",
    name: "Subject Characteristics",
    standard: "SDTM",
    class: "Findings",
    description: "Non-demographic static subject characteristics (e.g., eye color, hair color, dominant hand, Fitzpatrick skin type).",
    structure: "One record per characteristic per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "SCSEQ", "SCTESTCD", "SCTEST", "SCSTRESC", "SCDTC"],
    analysisPurpose: "Specific exploratory subgroup comparisons and device handling assessments.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "SC", USUBJID: "ONC-2025-001-001", SCSEQ: 1, SCTESTCD: "DOMHAND", SCTEST: "Dominant Hand", SCSTRESC: "RIGHT", SCDTC: "2025-01-02" }
  },
  {
    code: "SR",
    name: "Skin Response",
    standard: "SDTM",
    class: "Findings",
    description: "Dermal assessments, patch test ratings, cutaneous reactions, and local injection site reactions (erythema, induration).",
    structure: "One record per skin evaluation site per timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "SRSEQ", "SRTESTCD", "SRTEST", "SRLOC", "SRSTRESC", "SRDTC"],
    analysisPurpose: "Vaccine reactogenicity and subcutaneous injection site safety profiling.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "SR", USUBJID: "ONC-2025-001-001", SRSEQ: 1, SRTESTCD: "ERYTHEMA", SRTEST: "Injection Site Erythema", SRLOC: "LEFT DELTOID", SRSTRESC: "NONE", SRDTC: "2025-01-10T10:00:00" }
  },
  {
    code: "SS",
    name: "Subject Status",
    standard: "SDTM",
    class: "Findings",
    description: "Survival status and vital status checks during long-term post-study follow-up contact calls.",
    structure: "One record per follow-up contact per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "SSSEQ", "SSTESTCD", "SSTEST", "SSSTRESC", "SSDTC"],
    analysisPurpose: "Updates vital status for 5-year Overall Survival (OS) curves in oncology and cardiovascular trials.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "SS", USUBJID: "ONC-2025-001-001", SSSEQ: 1, SSTESTCD: "SURVSTAT", SSTEST: "Survival Status", SSSTRESC: "ALIVE", SSDTC: "2025-12-15" }
  },
  {
    code: "TR",
    name: "Tumor Results",
    standard: "SDTM",
    class: "Findings",
    description: "Quantitative tumor measurements, lesion longest diameters (SLD), lymph node short axis measurements per CT/MRI scan.",
    structure: "One record per lesion per imaging assessment per timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "TRSEQ", "TRLINKID", "TRTESTCD", "TRTEST", "TRORRES", "TRSTRESN", "TRSTRESU", "VISIT", "TRDTC"],
    analysisPurpose: "Derivation of Sum of Longest Diameters (SLD) and percentage change in target lesions for ADTR.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "TR", USUBJID: "ONC-2025-001-001", TRSEQ: 1, TRLINKID: "T01", TRTESTCD: "DIAMETER", TRTEST: "Longest Diameter", TRSTRESN: 24.5, TRSTRESU: "mm", VISIT: "Baseline", TRDTC: "2025-01-05" }
  },
  {
    code: "TU",
    name: "Tumor Identification",
    standard: "SDTM",
    class: "Findings",
    description: "Baseline and post-baseline lesion identification, tracking records, organ location, and designation (Target, Non-Target, New).",
    structure: "One record per identified tumor lesion per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "TUSEQ", "TULINKID", "TUTESTCD", "TUTEST", "TUORRES", "TULOC", "TUDTC"],
    analysisPurpose: "Tracks lesion emergence over time and establishes target lesion baseline sets for ADTU.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "TU", USUBJID: "ONC-2025-001-001", TUSEQ: 1, TULINKID: "T01", TUTESTCD: "TUMIDENT", TUTEST: "Tumor Identification", TUORRES: "TARGET", TULOC: "LIVER RIGHT LOBE", TUDTC: "2025-01-05" }
  },
  {
    code: "UR",
    name: "Urinary System Findings",
    standard: "SDTM",
    class: "Findings",
    description: "Specialized urological tests, 24-hour urine collection chemistry, creatinine clearance, and bladder residual volume.",
    structure: "One or more records per parameter per visit per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "URSEQ", "URTESTCD", "URTEST", "URORRES", "URSTRESN", "URSTRESU", "VISIT", "URDTC"],
    analysisPurpose: "Renal safety monitoring, glomerular filtration rate (GFR) assessment, and nephrology endpoints.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "UR", USUBJID: "ONC-2025-001-001", URSEQ: 1, URTESTCD: "CRCL24H", URTEST: "24-Hour Creatinine Clearance", URSTRESN: 110, URSTRESU: "mL/min", VISIT: "Baseline", URDTC: "2025-01-09" }
  },
  {
    code: "VS",
    name: "Vital Signs",
    standard: "SDTM",
    class: "Findings",
    description: "Core physiological measurements: Blood pressure (systolic/diastolic), pulse rate, respiratory rate, body temperature, height, weight, BMI.",
    structure: "One or more records per vital sign parameter per position per timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "VSSEQ", "VSTESTCD", "VSTEST", "VSORRES", "VSSTRESN", "VSSTRESU", "VSPOS", "VISIT", "VSDTC"],
    analysisPurpose: "Safety vital signs shifts, orthostatic hypotension derivations, and derivation of ADVS.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "VS", USUBJID: "ONC-2025-001-001", VSSEQ: 1, VSTESTCD: "SYSBP", VSTEST: "Systolic Blood Pressure", VSSTRESN: 124, VSSTRESU: "mmHg", VSPOS: "SITTING", VISIT: "Baseline", VSDTC: "2025-01-10T08:15:00" }
  },
  {
    code: "XP",
    name: "Respiratory Findings",
    standard: "SDTM",
    class: "Findings",
    description: "Pulmonary function tests (PFTs), spirometry metrics (FEV1, FVC, FEV1/FVC ratio), and peak expiratory flow (PEF).",
    structure: "One record per respiratory test per timepoint per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "XPSEQ", "XPTESTCD", "XPTEST", "XPSTRESN", "XPSTRESU", "VISIT", "XPDTC"],
    analysisPurpose: "Asthma, COPD, and pulmonary fibrosis primary efficacy endpoints.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "XP", USUBJID: "ONC-2025-001-001", XPSEQ: 1, XPTESTCD: "FEV1", XPTEST: "Forced Expiratory Volume in 1 sec", XPSTRESN: 2.85, XPSTRESU: "L", VISIT: "Baseline", XPDTC: "2025-01-08" }
  },

  // ============================================================================
  // 5. TRIAL DESIGN & RELATIONSHIP DATASETS (SDTM)
  // ============================================================================
  {
    code: "TA",
    name: "Trial Arms",
    standard: "SDTM",
    class: "Trial Design",
    description: "Planned sequential path of design elements for each treatment arm defined in the protocol.",
    structure: "One record per element within each treatment arm.",
    keyVariables: ["STUDYID", "DOMAIN", "ARMCD", "ARM", "TAETORD", "ETCD", "ELEMENT", "TABRANCH", "TATRANS"],
    analysisPurpose: "Defines planned treatment sequences for cross-over and parallel study designs.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "TA", ARMCD: "DMED", ARM: "Dexpramipexole 150mg BID", TAETORD: 1, ETCD: "TRT", ELEMENT: "Active Treatment" }
  },
  {
    code: "TE",
    name: "Trial Elements",
    standard: "SDTM",
    class: "Trial Design",
    description: "Planned building blocks of time in a study (e.g., Screening, Treatment, Washout, Safety Follow-Up).",
    structure: "One record per trial element.",
    keyVariables: ["STUDYID", "DOMAIN", "ETCD", "ELEMENT", "TEDUR"],
    analysisPurpose: "Standardizes study phases and duration across the protocol.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "TE", ETCD: "TRT", ELEMENT: "Active Treatment Period", TEDUR: "P24W" }
  },
  {
    code: "TI",
    name: "Trial Inclusion/Exclusion",
    standard: "SDTM",
    class: "Trial Design",
    description: "Master reference text and rule repository of all protocol-specified Inclusion and Exclusion criteria.",
    structure: "One record per I/E criterion.",
    keyVariables: ["STUDYID", "DOMAIN", "IETESTCD", "IETEST", "IECAT", "TIRLDTC"],
    analysisPurpose: "Regulatory review of patient eligibility criteria rigor.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "TI", IETESTCD: "INCL01", IETEST: "Adult subjects aged >= 18 and <= 75 years", IECAT: "INCLUSION" }
  },
  {
    code: "TM",
    name: "Trial Milestones",
    standard: "SDTM",
    class: "Trial Design",
    description: "Protocol-planned study-level target milestone dates (e.g., First Patient In, Last Patient Out, Database Lock).",
    structure: "One record per planned milestone.",
    keyVariables: ["STUDYID", "DOMAIN", "MIDS", "MISTNAME", "MIDATE"],
    analysisPurpose: "Regulatory study timelines and operational audit verification.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "TM", MIDS: "FPI", MISTNAME: "First Patient First Visit", MIDATE: "2025-01-02" }
  },
  {
    code: "TS",
    name: "Trial Summary",
    standard: "SDTM",
    class: "Trial Design",
    description: "Trial metadata parameters: study phase, therapeutic area, blinding type, randomized arms, investigational drug name.",
    structure: "One record per trial summary parameter.",
    keyVariables: ["STUDYID", "DOMAIN", "TSPARMCD", "TSPARM", "TSVAL"],
    analysisPurpose: "Mandatory FDA electronic submission metadata read by regulatory automated validation tools.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "TS", TSPARMCD: "PHASE", TSPARM: "Trial Phase", TSVAL: "Phase 3" }
  },
  {
    code: "TV",
    name: "Trial Visits",
    standard: "SDTM",
    class: "Trial Design",
    description: "Planned visit structure, target day timing relative to Day 1, and allowable window days.",
    structure: "One record per planned protocol visit.",
    keyVariables: ["STUDYID", "DOMAIN", "VISITNUM", "VISIT", "ARMCD", "TVSTDAY", "TVENDAY"],
    analysisPurpose: "Derivation of analysis visits (AVISIT/AVISITN) in ADaM BDS datasets.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "TV", VISITNUM: 1, VISIT: "Screening", TVSTDAY: -14, TVENDAY: -1 }
  },
  {
    code: "RELREC",
    name: "Related Records",
    standard: "SDTM",
    class: "Relationship",
    description: "Identifies relationships between records across distinct domains (e.g., Adverse Event linked directly to Concomitant Medication).",
    structure: "One record per relationship pair.",
    keyVariables: ["STUDYID", "RDOMAIN", "USUBJID", "IDVAR", "IDVARVAL", "RELTYPE", "RELID"],
    analysisPurpose: "Auditing AE-to-treatment linkages and multi-domain traceability.",
    sampleData: { STUDYID: "ONC-2025-001", RDOMAIN: "AE", USUBJID: "ONC-2025-001-001", IDVAR: "AESEQ", IDVARVAL: "1", RELTYPE: "ONE", RELID: "REL01" }
  },
  {
    code: "RELSUB",
    name: "Related Subjects",
    standard: "SDTM",
    class: "Relationship",
    description: "Documents relationships between different subjects within a trial (e.g., twin studies, mother-infant pairs, familial genetics).",
    structure: "One record per subject relationship pair.",
    keyVariables: ["STUDYID", "USUBJID", "POOLID", "RSUBJID", "SREL"],
    analysisPurpose: "Family-based linkage analysis and pediatric trial safety.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", RSUBJID: "ONC-2025-001-002", SREL: "SIBLING" }
  },
  {
    code: "SUPP--",
    name: "Supplemental Qualifiers",
    standard: "SDTM",
    class: "Relationship",
    description: "Standardized extension tables (SUPPDM, SUPPAE, SUPPLB, etc.) storing variables that do not fit into the standard domain models.",
    structure: "One record per non-standard variable per parent record.",
    keyVariables: ["STUDYID", "RDOMAIN", "USUBJID", "IDVAR", "IDVARVAL", "QNAM", "QLABEL", "QVAL", "QORIG"],
    analysisPurpose: "Preserves study-specific sponsor variables without violating strict CDISC core variable names.",
    sampleData: { STUDYID: "ONC-2025-001", RDOMAIN: "AE", USUBJID: "ONC-2025-001-001", IDVAR: "AESEQ", IDVARVAL: "1", QNAM: "AEACNTH", QLABEL: "Other Action Taken", QVAL: "Dose Reduced to 100mg" }
  },

  // ============================================================================
  // 6. MEDICAL DEVICE DOMAINS (SDTMIG-MD)
  // ============================================================================
  {
    code: "DI",
    name: "Device Identifier",
    standard: "SDTM",
    class: "Medical Devices",
    description: "Static device attributes, Unique Device Identifier (UDI), model name, serial number, lot number, and software version.",
    structure: "One record per medical device instance.",
    keyVariables: ["STUDYID", "DOMAIN", "SPDEVTYP", "UDI", "DISEVTYP", "DILOT", "DISERNUM", "DISWVER"],
    analysisPurpose: "Mandatory FDA device tracking and post-market safety surveillance.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DI", SPDEVTYP: "Continuous Glucose Monitor", UDI: "(01)00854920005012", DISERNUM: "SN-98210", DISWVER: "v4.2.1" }
  },
  {
    code: "DO",
    name: "Device In-Use Operations",
    standard: "SDTM",
    class: "Medical Devices",
    description: "Operational settings, flow rates, voltage, battery status, and operating modes while the device is actively running.",
    structure: "One record per operational parameter per timepoint.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "DOSEQ", "DOTESTCD", "DOTEST", "DOORRES", "DOSTRESN", "DODTC"],
    analysisPurpose: "Verifies whether investigational devices functioned at targeted protocol parameters.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DO", USUBJID: "ONC-2025-001-001", DOSEQ: 1, DOTESTCD: "FLOWRATE", DOTEST: "Infusion Flow Rate", DOSTRESN: 2.5, DODTC: "2025-01-10T10:00:00" }
  },
  {
    code: "DR",
    name: "Device Properties",
    standard: "SDTM",
    class: "Medical Devices",
    description: "Physical, chemical, and mechanical attributes of the device (dimensions, catheter gauge, material composition).",
    structure: "One record per property per device instance.",
    keyVariables: ["STUDYID", "DOMAIN", "SPDEVTYP", "DRTESTCD", "DRTEST", "DRORRES", "DRSTRESC"],
    analysisPurpose: "Physical device specification compliance verification.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DR", SPDEVTYP: "Vascular Stent", DRTESTCD: "DIAMETER", DRTEST: "Stent Diameter", DRSTRESC: "3.5 mm" }
  },
  {
    code: "DT",
    name: "Device Tracking",
    standard: "SDTM",
    class: "Medical Devices",
    description: "Location, custody, calibration, and shipment tracking of trial devices across study sites and depots.",
    structure: "One record per tracking milestone per device.",
    keyVariables: ["STUDYID", "DOMAIN", "SPDEVTYP", "DTSEQ", "DTTESTCD", "DTTEST", "DTEVENT", "DTLOC", "DTDTC"],
    analysisPurpose: "Traceability of investigational device lifecycle and site custody.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DT", SPDEVTYP: "CGM Monitor", DTSEQ: 1, DTTESTCD: "CALIB", DTTEST: "Factory Calibration", DTEVENT: "PASSED", DTDTC: "2024-12-18" }
  },
  {
    code: "DU",
    name: "Device Tracking & Use",
    standard: "SDTM",
    class: "Medical Devices",
    description: "Tracks which subject used which specific device, attachment sites, and the precise duration of application.",
    structure: "One record per subject-device usage period.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "DUSEQ", "DUTESTCD", "DUTEST", "DUORRES", "DULOC", "DUSTDTC", "DUENDTC"],
    analysisPurpose: "Determines exact subject device exposure duration.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DU", USUBJID: "ONC-2025-001-001", DUSEQ: 1, DUTESTCD: "DEVAPPL", DUTEST: "Device Application", DULOC: "POSTERIOR UPPER ARM", DUSTDTC: "2025-01-10", DUENDTC: "2025-01-24" }
  },
  {
    code: "DX",
    name: "Device-Subject Relations",
    standard: "SDTM",
    class: "Medical Devices",
    description: "Documents the relationship between subjects and permanently implanted or attached medical devices.",
    structure: "One record per implanted device relation.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "DXSEQ", "SPDEVTYP", "DXRELS", "DXDTC"],
    analysisPurpose: "Clinical tracking of implants (e.g., pacemakers, orthopedic joints, valves).",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DX", USUBJID: "ONC-2025-001-001", DXSEQ: 1, SPDEVTYP: "Intra-arterial Sensor", DXRELS: "PRIMARY IMPLANT", DXDTC: "2025-01-08" }
  },
  {
    code: "DE",
    name: "Device Events",
    standard: "SDTM",
    class: "Medical Devices",
    description: "Malfunctions, software crashes, alarms, breakages, and physical deficiencies of investigational devices.",
    structure: "One record per device event per subject.",
    keyVariables: ["STUDYID", "DOMAIN", "USUBJID", "DESEQ", "DETERM", "DEDECOD", "DECAT", "DESEV", "DESTDTC"],
    analysisPurpose: "FDA Center for Devices and Radiological Health (CDRH) safety reporting and defect tracking.",
    sampleData: { STUDYID: "ONC-2025-001", DOMAIN: "DE", USUBJID: "ONC-2025-001-001", DESEQ: 1, DETERM: "Sensor Signal Disconnection Alarm", DEDECOD: "DEVICE ALARM", DECAT: "MALFUNCTION", DESTDTC: "2025-01-12T04:15:00" }
  },

  // ============================================================================
  // 7. ADaM: SUBJECT-LEVEL ANALYSIS DATASET (ADSL)
  // ============================================================================
  {
    code: "ADSL",
    name: "Subject-Level Analysis Dataset",
    standard: "ADaM",
    class: "ADSL",
    description: "Mandatory anchor dataset containing one record per subject. Merges demographics, planned and actual treatment groups, stratification factors, key trial dates (randomization, first/last dose, death), and population flags.",
    structure: "Exactly one record per subject.",
    keyVariables: ["STUDYID", "USUBJID", "SUBJID", "SITEID", "AGE", "AGEGR1", "SEX", "RACE", "ETHNIC", "ARM", "ARMCD", "TRT01P", "TRT01PN", "TRT01A", "TRT01AN", "TRTSDT", "TRTEDT", "TRTDURD", "SAFFL", "ITTFL", "PPROTFL", "COMPLFL"],
    analysisPurpose: "Universal denominator source for all summary tables, incidence calculations, and secondary ADaM dataset merges.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", AGE: 58, SEX: "F", TRT01P: "Dexpramipexole 150mg BID", SAFFL: "Y", ITTFL: "Y", PPROTFL: "Y", TRTSDT: "2025-01-10", TRTEDT: "2025-06-20" }
  },

  // ============================================================================
  // 8. ADaM: BASIC DATA STRUCTURE (BDS)
  // ============================================================================
  {
    code: "ADVS",
    name: "Vital Signs Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Standardized vital signs measurements across visits with baseline definitions, change from baseline, percent change, and toxicity/normal range shift flags.",
    structure: "One or more records per subject per parameter per analysis timepoint.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "AVALC", "BASE", "CHG", "PCHG", "AVISIT", "AVISITN", "ANL01FL", "TRTP", "TRTA"],
    analysisPurpose: "Summarizes blood pressure, pulse rate, weight shifts, and orthostatic changes.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "SYSBP", PARAM: "Systolic Blood Pressure (mmHg)", AVAL: 118, BASE: 124, CHG: -6, AVISIT: "Week 12", AVISITN: 12, ANL01FL: "Y" }
  },
  {
    code: "ADLB",
    name: "Laboratory Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Standardized laboratory results with baseline values, change from baseline, NCI-CTCAE toxicity grades (ATOXGR), baseline shifts (L/N/H), and Hy's Law flags.",
    structure: "One or more records per subject per laboratory parameter per visit.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "PARCAT1", "AVAL", "BASE", "CHG", "ANRHI", "ANRLO", "ANRIND", "ATOXGR", "AVISIT", "AVISITN", "ANL01FL"],
    analysisPurpose: "Drug-induced liver injury (DILI) surveillance, renal shift tables, and hematological toxicity incidence.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "ALT", PARAM: "Alanine Aminotransferase (U/L)", AVAL: 28.0, BASE: 26.5, CHG: 1.5, ANRIND: "NORMAL", AVISIT: "Week 12", ANL01FL: "Y" }
  },
  {
    code: "ADEG",
    name: "ECG Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Electrocardiogram parameters (QT, QTcB, QTcF, PR, HR) with baseline determinations, change from baseline, and regulatory threshold outlier flags.",
    structure: "One or more records per subject per ECG parameter per timepoint.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "BASE", "CHG", "AVISIT", "AVISITN", "CRIT1FL", "CRIT2FL", "ANL01FL"],
    analysisPurpose: "Identifies QTc prolongation >450 ms, >500 ms or change >30 ms, >60 ms per ICH E14 guidance.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "QTCF", PARAM: "QTcF Fridericia (ms)", AVAL: 418, BASE: 412, CHG: 6, AVISIT: "Week 12", CRIT1FL: "N" }
  },
  {
    code: "ADQS",
    name: "Questionnaire / PRO Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Patient-Reported Outcomes (PROs) and functional surveys, deriving total scores, domain subscales, and changes from baseline.",
    structure: "One or more records per subject per score/subscale per visit.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "PARCAT1", "AVAL", "BASE", "CHG", "PCHG", "AVISIT", "AVISITN", "ANL01FL"],
    analysisPurpose: "Assesses patient-reported symptom burden, depression scores, and quality of life improvements.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "EQ5DTOT", PARAM: "EQ-5D-5L Index Score", AVAL: 0.88, BASE: 0.74, CHG: 0.14, AVISIT: "Week 12" }
  },
  {
    code: "ADEFF",
    name: "Efficacy Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Primary and secondary efficacy endpoints across visits, including ANCOVA covariates, responder flags, and percentage reductions.",
    structure: "One or more records per subject per efficacy parameter per visit.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "BASE", "CHG", "PCHG", "AVISIT", "AVISITN", "CRIT1FL", "ANL01FL"],
    analysisPurpose: "Evaluates trial primary objective (e.g., HbA1c reduction, ACR20 response, DAS28 score).",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "HBA1C", PARAM: "Glycated Hemoglobin (%)", AVAL: 6.9, BASE: 8.4, CHG: -1.5, AVISIT: "Week 12", CRIT1FL: "Y" }
  },
  {
    code: "ADPC",
    name: "PK Concentrations Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Standardized pharmacokinetic concentrations with nominal and actual relative times, below limit of quantitation (BLQ) rules, and imputation flags.",
    structure: "One or more records per subject per analyte per timepoint.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "AVALU", "ARFSTDTC", "NFRLT", "AFRLT", "BLQFL", "ANL01FL"],
    analysisPurpose: "Generates concentration-time profile plots and inputs for non-compartmental pharmacokinetic modeling.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "DEXPC", PARAM: "Plasma Concentration (ng/mL)", AVAL: 142.6, NFRLT: 2.0, AFRLT: 2.05, BLQFL: "N" }
  },
  {
    code: "ADPP",
    name: "PK Parameters Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Derived non-compartmental pharmacokinetic parameters (AUC 0-t, AUC 0-inf, Cmax, clearance, volume of distribution).",
    structure: "One record per subject per parameter per analyte per profile.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "AVALU", "TRTP", "ANL01FL"],
    analysisPurpose: "Evaluates drug exposure, bioequivalence ratios, and dose linearity.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "AUCINF", PARAM: "AUC 0 to Infinity (h*ng/mL)", AVAL: 1240.5, AVALU: "h*ng/mL", ANL01FL: "Y" }
  },
  {
    code: "ADTR",
    name: "Tumor Results Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Sum of Longest Diameters (SLD) of target lesions across imaging visits, percentage change from baseline, and nadir determinations.",
    structure: "One or more records per subject per assessment visit.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "BASE", "NADIR", "CHG", "PCHG", "AVISIT", "ANL01FL"],
    analysisPurpose: "Primary tumor shrinkage measurement for oncology RECIST evaluation.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "SLD", PARAM: "Sum of Longest Diameters (mm)", AVAL: 18.2, BASE: 24.5, CHG: -6.3, PCHG: -25.7, AVISIT: "Week 12" }
  },
  {
    code: "ADTU",
    name: "Tumor Tracking Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Lesion tracking over time (Present, Absent, Unequivocal Progression, New Lesion emergence).",
    structure: "One record per lesion per subject per timepoint.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "TULINKID", "AVALC", "AVISIT", "ANL01FL"],
    analysisPurpose: "Granular lesion-level monitoring for oncology trials.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "TUSTAT", PARAM: "Target Lesion Status", TULINKID: "T01", AVALC: "PRESENT", AVISIT: "Week 12" }
  },
  {
    code: "ADRS",
    name: "Disease Response Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Best Overall Response (CR, PR, SD, PD), confirmation visits, and disease control ratings per RECIST 1.1.",
    structure: "One record per response parameter per evaluation per subject.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVALC", "AVISIT", "ANL01FL"],
    analysisPurpose: "Calculates Objective Response Rate (ORR) and Disease Control Rate (DCR).",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "BOR", PARAM: "Best Overall Response", AVALC: "PARTIAL RESPONSE", ANL01FL: "Y" }
  },
  {
    code: "ADMB",
    name: "Microbiology Analysis",
    standard: "ADaM",
    class: "BDS",
    description: "Microbial eradication, viral load log10 reductions, pathogen clearance rates, and seroconversion.",
    structure: "One or more records per subject per organism per visit.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "BASE", "CHG", "AVISIT", "ANL01FL"],
    analysisPurpose: "Anti-infective efficacy analysis and sustained virological response (SVR) calculations.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "LOGVL", PARAM: "Log10 Viral Load (IU/mL)", AVAL: 1.2, BASE: 6.4, CHG: -5.2, AVISIT: "Week 12" }
  },

  // ============================================================================
  // 9. ADaM: OCCURRENCE DATA STRUCTURE (OCCDS)
  // ============================================================================
  {
    code: "ADAE",
    name: "Adverse Events Analysis",
    standard: "ADaM",
    class: "OCCDS",
    description: "Adverse events with Treatment-Emergent flags (TRTEMFL), MedDRA hierarchy coding (AESOC, AEPT), maximum severity, serious adverse event (SAE) classification, and drug-related flags.",
    structure: "One record per adverse event occurrence per subject.",
    keyVariables: ["STUDYID", "USUBJID", "ASTDT", "AENDT", "ADURN", "AEDECOD", "AEBODSYS", "AESOC", "AEPT", "AESEV", "AESER", "AEREL", "TRTEMFL", "TRTP", "TRTA"],
    analysisPurpose: "Generates primary ICH E3 safety tables, TEAE incidence summaries, and hepatotoxicity events.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", AEDECOD: "HEADACHE", AESOC: "NERVOUS SYSTEM DISORDERS", AESEV: "MILD", TRTEMFL: "Y", ASTDT: "2025-01-14", AEREL: "POSSIBLE" }
  },
  {
    code: "ADCM",
    name: "Concomitant Meds Analysis",
    standard: "ADaM",
    class: "OCCDS",
    description: "Concomitant medications with prior/concomitant flags (PREFL, ONTRTFL), WHO Drug dictionary coding, and Anatomical Therapeutic Chemical (ATC) classification.",
    structure: "One record per recorded medication per subject.",
    keyVariables: ["STUDYID", "USUBJID", "ASTDT", "AENDT", "CMDECOD", "CMCLAS", "PREFL", "ONTRTFL", "TRTP"],
    analysisPurpose: "Summarizes concomitant medication intake by ATC class and evaluates drug-drug interaction risks.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", CMDECOD: "METFORMIN", CMCLAS: "BIGUANIDES", PREFL: "Y", ONTRTFL: "Y", ASTDT: "2024-03-12" }
  },
  {
    code: "ADMH",
    name: "Medical History Analysis",
    standard: "ADaM",
    class: "OCCDS",
    description: "Medical history conditions classified by MedDRA System Organ Class and Preferred Term, with ongoing status flags at baseline.",
    structure: "One record per medical condition per subject.",
    keyVariables: ["STUDYID", "USUBJID", "MHTERM", "MHDECOD", "MHBODSYS", "MHCAT", "ASTDT", "MHONGOFL"],
    analysisPurpose: "Generates Table 14.1.2 Baseline Medical History by treatment arm.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", MHDECOD: "TYPE 2 DIABETES MELLITUS", MHBODSYS: "METABOLIC AND NUTRITIONAL DISORDERS", MHONGOFL: "Y" }
  },
  {
    code: "ADPR",
    name: "Procedures Analysis",
    standard: "ADaM",
    class: "OCCDS",
    description: "Prior and on-study procedures, classified by standard dictionary terms and timing relative to study drug.",
    structure: "One record per procedure occurrence per subject.",
    keyVariables: ["STUDYID", "USUBJID", "PRDECOD", "PRCAT", "ASTDT", "ONTRTFL"],
    analysisPurpose: "Summarizes surgical history and on-study interventions.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PRDECOD: "LIVER BIOPSY", PRCAT: "DIAGNOSTIC", ASTDT: "2025-01-04", ONTRTFL: "N" }
  },
  {
    code: "ADCE",
    name: "Clinical Events Analysis",
    standard: "ADaM",
    class: "OCCDS",
    description: "Adjudicated clinical events (e.g., MACE endpoints, stroke, hospitalization for heart failure).",
    structure: "One record per clinical event per subject.",
    keyVariables: ["STUDYID", "USUBJID", "CETERM", "CECAT", "CEADJ", "ASTDT", "TRTEMFL"],
    analysisPurpose: "Primary cardiovascular safety outcome tabulations.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", CETERM: "Myocardial Infarction", CEADJ: "CONFIRMED", ASTDT: "2025-03-22", TRTEMFL: "Y" }
  },
  {
    code: "ADDV",
    name: "Protocol Deviations Analysis",
    standard: "ADaM",
    class: "OCCDS",
    description: "Protocol deviations categorized as Major vs. Minor, defining reasons for exclusion from Per-Protocol populations.",
    structure: "One record per protocol deviation per subject.",
    keyVariables: ["STUDYID", "USUBJID", "DVDECOD", "DVCAT", "ASTDT", "EXCLPPFL"],
    analysisPurpose: "Per-protocol population auditing and audit inspection tables.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", DVDECOD: "VISIT WINDOW DEVIATION", DVCAT: "MINOR", EXCLPPFL: "N" }
  },
  {
    code: "ADDS",
    name: "Disposition Analysis",
    standard: "ADaM",
    class: "OCCDS",
    description: "Trial milestones, discontinuation reasons, and epoch completion status across treatment phases.",
    structure: "One record per disposition milestone per subject.",
    keyVariables: ["STUDYID", "USUBJID", "DSDECOD", "DSCAT", "EPOCH", "ASTDT", "COMPLFL"],
    analysisPurpose: "Generates Subject Disposition Summary Table and CONSORT flow diagrams.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", DSDECOD: "COMPLETED", EPOCH: "TREATMENT", COMPLFL: "Y", ASTDT: "2025-06-20" }
  },
  {
    code: "ADHO",
    name: "Healthcare Encounters Analysis",
    standard: "ADaM",
    class: "OCCDS",
    description: "Hospitalizations, emergency department admissions, ICU lengths of stay, and direct medical resource encounters.",
    structure: "One record per healthcare encounter per subject.",
    keyVariables: ["STUDYID", "USUBJID", "HODECOD", "HOCAT", "ASTDT", "AENDT", "ADURN"],
    analysisPurpose: "Health economics and pharmacoeconomic modeling.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", HODECOD: "EMERGENCY ROOM", ASTDT: "2025-02-18", ADURN: 1 }
  },

  // ============================================================================
  // 10. ADaM: TIME-TO-EVENT ANALYSIS (BDS-TTE)
  // ============================================================================
  {
    code: "ADTTE",
    name: "Time-to-Event Analysis",
    standard: "ADaM",
    class: "BDS-TTE",
    description: "Dedicated time-to-event datasets modeling Overall Survival (OS), Progression-Free Survival (PFS), Time to Treatment Failure (TTF), or Duration of Response (DoR).",
    structure: "One record per subject per time-to-event parameter.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "STARTDT", "ADT", "AVAL", "AVALU", "CNSR", "EVNTDESC", "TRTP"],
    analysisPurpose: "Generates Kaplan-Meier survival curves, Hazard Ratios (Cox Proportional Hazards model), and log-rank p-values.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "PFS", PARAM: "Progression-Free Survival (Months)", STARTDT: "2025-01-10", ADT: "2025-06-20", AVAL: 5.3, AVALU: "MONTHS", CNSR: 1, EVNTDESC: "Censored at Study Completion" }
  },

  // ============================================================================
  // 11. SPECIALIZED ADaM EXTENSIONS
  // ============================================================================
  {
    code: "ADEX",
    name: "Exposure Analysis",
    standard: "ADaM",
    class: "Specialized ADaM",
    description: "Calculates cumulative dose received, relative dose intensity (RDI), treatment interruptions, and dose modifications.",
    structure: "One record per subject or per dosing interval per subject.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "AVALU", "CUMDOSE", "RDI", "TRTP"],
    analysisPurpose: "Assesses drug compliance and tolerability-driven dose titrations.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "CUMDOSE", PARAM: "Cumulative Dexpramipexole Dose", AVAL: 48600, AVALU: "mg", RDI: 96.5 }
  },
  {
    code: "ADMD",
    name: "Medical Device Analysis",
    standard: "ADaM",
    class: "Specialized ADaM",
    description: "Analyzes device operational duration, malfunction rates, alarm frequencies, and device-related adverse occurrences.",
    structure: "One record per device or per operational event per subject.",
    keyVariables: ["STUDYID", "USUBJID", "SPDEVTYP", "UDI", "PARAMCD", "PARAM", "AVAL", "AVALC"],
    analysisPurpose: "Premarket approval (PMA) device safety and efficacy demonstration.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", SPDEVTYP: "CGM Monitor", PARAMCD: "MALFRATE", PARAM: "Malfunction Frequency", AVAL: 0 }
  },
  {
    code: "ADSUB",
    name: "Sub-study / Biomarker Analysis",
    standard: "ADaM",
    class: "Specialized ADaM",
    description: "Specialized pharmacogenomics, molecular profiling, single-cell cytometry, and sub-study biomarker endpoints.",
    structure: "One or more records per biomarker parameter per subject.",
    keyVariables: ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "PARCAT1", "AVAL", "BASE", "CHG", "ANL01FL"],
    analysisPurpose: "Exploratory translational medicine and biomarker discovery.",
    sampleData: { STUDYID: "ONC-2025-001", USUBJID: "ONC-2025-001-001", PARAMCD: "EOSINOP", PARAM: "Blood Eosinophil Count (x10^9/L)", AVAL: 0.08, BASE: 0.45, CHG: -0.37, ANL01FL: "Y" }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CDISC_STANDARDS_CATALOG };
}
