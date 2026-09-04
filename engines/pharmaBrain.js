/**
 * PHARMA & CLINICAL DOMAIN EXPERT REASONING BRAIN
 * Knowledge base and code generator covering SAS 9.4, R (pharmaverse), Python, CDISC, and Biostatistics.
 */

function generatePharmaResponse(query) {
  const q = (query || "").toLowerCase().trim();

  // 1. MMRM / PROC MIXED
  if (q.includes("mmrm") || q.includes("proc mixed") || q.includes("repeated measures")) {
    return {
      reply: "### 💻 SAS 9.4 Production Code: Mixed Model for Repeated Measures (MMRM)\n\n" +
        "The **MMRM** is the regulatory gold standard for continuous longitudinal efficacy endpoints with missing data under Missing At Random (MAR).\n\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * PROGRAM:     mmrm_efficacy_analysis.sas\n" +
        " * PURPOSE:     MMRM Analysis for Change from Baseline (Primary Endpoint)\n" +
        " * MODEL:       CHG = BASE + TRT01P + AVISIT + TRT01P*AVISIT + Covariates\n" +
        " * COVARIANCE:  Unstructured (UN) with Kenward-Roger degrees of freedom\n" +
        " ******************************************************************************/\n\n" +
        "proc sort data=adam.adlb out=adlb_model;\n" +
        "  by USUBJID AVISITN;\n" +
        "  where PARAMCD = 'HBA1C' and SAFFL = 'Y';\n" +
        "run;\n\n" +
        "ods output Diffs=mmrm_diffs LSMeans=mmrm_lsmeans;\n" +
        "proc mixed data=adlb_model method=reml covtest;\n" +
        "  class TRT01P(ref='Placebo') AVISIT(ref='Baseline') USUBJID;\n" +
        "  model CHG = BASE TRT01P AVISIT TRT01P*AVISIT AGE / ddfm=kr solution cl;\n" +
        "  repeated AVISIT / subject=USUBJID type=UN r rcorr;\n" +
        "  lsmeans TRT01P*AVISIT / diff=control('Placebo') cl slice=AVISIT;\n" +
        "run;\n" +
        "```\n\n" +
        "#### Methodological Standards:\n" +
        "- **Covariance Structure**: Unstructured (`type=UN`) is first-line; fallback to `TOEPH` if non-convergence occurs.\n" +
        "- **Degrees of Freedom**: Kenward-Roger (`ddfm=kr`) adjustment is mandated by FDA to prevent Type I error inflation.\n" +
        "- **Missing Data**: Handled via restricted maximum likelihood without single imputation (LOCF is deprecated).",
      actions: ["MMRM SAS Code", "R mmrm Alternative", "Table 14-3 Shell"]
    };
  }

  // 2. SURVIVAL / KAPLAN-MEIER / PROC LIFETEST / ADTTE
  if (q.includes("survival") || q.includes("lifetest") || q.includes("kaplan") || q.includes("pfs") || q.includes("adtte") || q.includes("time to event")) {
    return {
      reply: "### 💻 SAS 9.4 & R Code: Kaplan-Meier Survival Analysis (ADTTE)\n\n" +
        "Time-to-event analysis (Progression-Free Survival / Overall Survival) per CDISC ADaM-IG v1.2.\n\n" +
        "#### 1. SAS 9.4 PROC LIFETEST & PROC PHREG\n" +
        "```sas\n" +
        "/* Kaplan-Meier Survival Curve & Greenwood 95% Confidence Intervals */\n" +
        "proc lifetest data=adam.adtte plots=survival(atrisk cb=hw test) method=km conftype=loglog;\n" +
        "  time AVAL * CNSR(1);  /* 1 = Censored, 0 = Event */\n" +
        "  strata TRT01P;\n" +
        "  where PARAMCD = 'PFS' and ITTFL = 'Y';\n" +
        "run;\n\n" +
        "/* Cox Proportional Hazards Model for Hazard Ratio (HR) */\n" +
        "proc phreg data=adam.adtte;\n" +
        "  class TRT01P(ref='Placebo') / param=ref;\n" +
        "  model AVAL * CNSR(1) = TRT01P / rl ties=exact;\n" +
        "  hazardratio 'Treatment Effect' TRT01P;\n" +
        "  where PARAMCD = 'PFS';\n" +
        "run;\n" +
        "```\n\n" +
        "#### 2. Modern R (survival & survminer)\n" +
        "```r\n" +
        "library(survival)\n" +
        "library(survminer)\n\n" +
        "fit <- survfit(Surv(AVAL, 1 - CNSR) ~ TRT01P, data = adtte)\n" +
        "ggsurvplot(fit, data = adtte, pval = TRUE, conf.int = TRUE, risk.table = TRUE,\n" +
        "           title = 'Kaplan-Meier Curve: Progression-Free Survival (PFS)',\n" +
        "           xlab = 'Time (Months)', ylab = 'Survival Probability')\n" +
        "```",
      actions: ["Export SAS Survival Code", "R survminer Code", "ADTTE Spec"]
    };
  }

  // 3. PROC COMPARE / DOUBLE PROGRAMMING QC
  if (q.includes("compare") || q.includes("double prog") || q.includes("qc macro") || q.includes("validation macro")) {
    return {
      reply: "### 💻 SAS 9.4 Macro: Independent Double-Programming Validation (PROC COMPARE)\n\n" +
        "In pharmaceutical clinical programming, all submission datasets must undergo **100% independent double programming verification** to comply with ICH E6(R2) GCP.\n\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * MACRO:   %qc_compare(prod_lib=adam, qc_lib=qc_adam, dset=adsl, id_vars=STUDYID USUBJID)\n" +
        " ******************************************************************************/\n" +
        "%macro qc_compare(prod_lib=adam, qc_lib=qc_adam, dset=adsl, id_vars=STUDYID USUBJID);\n" +
        "  proc sort data=&prod_lib..&dset out=_prod; by &id_vars; run;\n" +
        "  proc sort data=&qc_lib..&dset out=_qc; by &id_vars; run;\n\n" +
        "  proc compare base=_prod compare=_qc novalues out=_diff outnoequal outbase outcomp;\n" +
        "    id &id_vars;\n" +
        "  run;\n\n" +
        "  %if &sysinfo = 0 %then %do;\n" +
        "    %put >>> [QC PASS]: &dset is 100% IDENTICAL across Production and QC! ;\n" +
        "  %end;\n" +
        "  %else %do;\n" +
        "    %put >>> [QC FAILED]: Discrepancies found in &dset (SYSINFO=&sysinfo)! ;\n" +
        "  %end;\n" +
        "%mend qc_compare;\n" +
        "```",
      actions: ["PROC COMPARE Macro", "R diffdf Package QC", "Validation Report Shell"]
    };
  }

  // 4. ADMIRAL & PHARMAVERSE (R)
  if (q.includes("admiral") || q.includes("pharmaverse") || (q.includes("r ") && (q.includes("adam") || q.includes("sdtm")))) {
    return {
      reply: "### 💻 Modern R (pharmaverse 'admiral') Production Pipeline\n\n" +
        "The **pharmaverse** is the global pharmaceutical industry standard (Roche, GSK, Novartis, Pfizer) for FDA/EMA compliant clinical data science.\n\n" +
        "```r\n" +
        "library(admiral)\n" +
        "library(dplyr)\n" +
        "library(lubridate)\n\n" +
        "# Derive ADSL with admiral\n" +
        "adsl <- sdtm_dm %>%\n" +
        "  derive_vars_merged(\n" +
        "    dataset_add = sdtm_ex,\n" +
        "    filter_add = !is.na(EXSTDTC),\n" +
        "    new_vars = exprs(TRTSDT = convert_dtc_to_dt(min(EXSTDTC))),\n" +
        "    by_vars = exprs(STUDYID, USUBJID)\n" +
        "  ) %>%\n" +
        "  derive_var_trtdurd() %>%\n" +
        "  mutate(\n" +
        "    SAFFL = if_else(!is.na(TRTSDT), 'Y', 'N'),\n" +
        "    ITTFL = if_else(!is.na(ARMCD) & ARMCD != 'SCRNFL', 'Y', 'N'),\n" +
        "    AGEGR1 = if_else(AGE < 65, '<65', '>=65'),\n" +
        "    TRT01P = ARM,\n" +
        "    TRT01A = if_else(SAFFL == 'Y', ARM, 'Not Treated')\n" +
        "  )\n\n" +
        "# Derive ADAE with Treatment-Emergent AE Flag\n" +
        "adae <- sdtm_ae %>%\n" +
        "  derive_vars_merged(dataset_add = adsl, new_vars = exprs(TRTSDT, TRT01A, SAFFL), by_vars = exprs(STUDYID, USUBJID)) %>%\n" +
        "  mutate(\n" +
        "    AESTDT = convert_dtc_to_dt(AESTDTC),\n" +
        "    TRTEMFL = if_else(!is.na(AESTDT) & !is.na(TRTSDT) & AESTDT >= TRTSDT, 'Y', 'N'),\n" +
        "    AEDY = case_when(AESTDT >= TRTSDT ~ as.numeric(AESTDT - TRTSDT) + 1, TRUE ~ NA_real_)\n" +
        "  )\n" +
        "```",
      actions: ["admiral R Pipeline", "rtables Table Shell", "diffdf QC Check"]
    };
  }

  // 5. RTABLES & CSR TABLES (Table 14-1, 14-2)
  if (q.includes("rtables") || q.includes("table 14-1") || q.includes("table 14-2") || q.includes("tlf") || q.includes("proc report")) {
    return {
      reply: "### 💻 R (rtables) & SAS (PROC REPORT): Clinical Study Report Tables\n\n" +
        "#### 1. R `rtables` Implementation\n" +
        "```r\n" +
        "library(rtables)\n" +
        "library(dplyr)\n\n" +
        "lyt <- basic_table(title = 'Table 14-1.01: Demographic and Baseline Characteristics', subtitles = 'ITT Population') %>%\n" +
        "  split_cols_by('TRT01P') %>%\n" +
        "  add_overall_col('All Patients') %>%\n" +
        "  analyze('AGE', afun = function(x) {\n" +
        "    in_rows('Mean (SD)' = rcell(c(mean(x, na.rm=TRUE), sd(x, na.rm=TRUE)), format = 'xx.x (xx.xx)'),\n" +
        "            'Median (Range)' = rcell(c(median(x, na.rm=TRUE), min(x, na.rm=TRUE), max(x, na.rm=TRUE)), format = 'xx.x (xx - xx)'))\n" +
        "  }) %>%\n" +
        "  count_occurrences('SEX', var_labels = 'Sex') %>%\n" +
        "  count_occurrences('RACE', var_labels = 'Race') %>%\n" +
        "  count_occurrences('SAFFL', var_labels = 'Safety Population')\n\n" +
        "tbl <- build_table(lyt, adsl)\n" +
        "print(tbl)\n" +
        "```\n\n" +
        "#### 2. SAS 9.4 PROC REPORT\n" +
        "```sas\n" +
        "proc report data=adam.adsl headline headskip;\n" +
        "  column AGEGR1 SEX TRT01P, (N PCT);\n" +
        "  define AGEGR1 / group 'Age Category';\n" +
        "  define SEX    / group 'Sex';\n" +
        "  define TRT01P / across 'Treatment Arm';\n" +
        "  define N      / analysis sum 'n';\n" +
        "  define PCT    / analysis pctsum 'Pct (%)' format=6.1;\n" +
        "run;\n" +
        "```",
      actions: ["Export rtables Script", "Export SAS PROC REPORT", "View CSR Specs"]
    };
  }



  // 6a. AGE & PEDIATRIC CALCULATION IN SDTM DM
  if ((q.includes("age") && (q.includes("calculate") || q.includes("derive") || q.includes("month") || q.includes("year"))) || q.includes("brthdtc")) {
    return {
      reply: "### 💻 SAS 9.4 Code: Calculating AGE and AGEU in CDISC SDTM DM\n\n" +
        "In CDISC SDTM DM, `AGE` is calculated at the reference start date (`RFSTDTC` / informed consent) relative to date of birth (`BRTHDTC`).\n\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * PROGRAM:     derive_sdtm_dm_age.sas\n" +
        " * PURPOSE:     Calculate AGE and AGEU compliant with CDISC SDTM v3.3\n" +
        " * NOTE:        Per CDISC, AGE is an integer floor value.\n" +
        " ******************************************************************************/\n\n" +
        "data sdtm.dm;\n" +
        "  set raw.demographics;\n\n" +
        "  format RFSTDT BRTHDT date9.;\n" +
        "  if length(RFSTDTC) >= 10 then RFSTDT = input(substr(RFSTDTC, 1, 10), yymmdd10.);\n" +
        "  if length(BRTHDTC) >= 10 then BRTHDT = input(substr(BRTHDTC, 1, 10), yymmdd10.);\n\n" +
        "  if not missing(RFSTDT) and not missing(BRTHDT) and RFSTDT >= BRTHDT then do;\n" +
        "    /* Exact year difference */\n" +
        "    _age_years = floor(yrdif(BRTHDT, RFSTDT, 'ACTUAL'));\n\n" +
        "    /* Exact month difference for pediatric subjects */\n" +
        "    _age_months = intck('MONTH', BRTHDT, RFSTDT);\n" +
        "    if day(RFSTDT) < day(BRTHDT) then _age_months = _age_months - 1;\n\n" +
        "    /* Assign CDISC Controlled Terminology for AGE and AGEU */\n" +
        "    if _age_years < 2 then do;\n" +
        "      AGE = _age_months;\n" +
        "      AGEU = 'MONTHS';\n" +
        "    end;\n" +
        "    else do;\n" +
        "      AGE = _age_years;\n" +
        "      AGEU = 'YEARS';\n" +
        "    end;\n" +
        "  end;\n" +
        "  drop _age_years _age_months;\n" +
        "run;\n" +
        "```\n\n" +
        "#### CDISC SDTM Conformance Rules:\n" +
        "- `AGE` is numeric; `AGEU` must be populated using NCI Codelist `C66781` (`'YEARS'`, `'MONTHS'`, `'WEEKS'`, `'DAYS'`, `'HOURS'`).\n" +
        "- For subjects $\\ge 2$ years old, `AGEU` is typically `'YEARS'`. For neonates and infants $< 2$ years, `AGEU` is often `'MONTHS'` or `'DAYS'`.",
      actions: ["SDTM Mapping Template", "ADSL Derivation Code", "ISO 8601 Rules"]
    };
  }

  // 6b. BMI & ANTHROPOMETRIC DERIVATION (ADSL)
  if (q.includes("bmi") || (q.includes("height") && q.includes("weight")) || q.includes("body mass index")) {
    return {
      reply: "### 💻 SAS 9.4 & R Code: Deriving BMI and WHO Categories in ADSL\n\n" +
        "Derives Body Mass Index (BMI) from baseline Vital Signs (Height in cm, Weight in kg) per CDISC ADaM-IG v1.2.\n\n" +
        "#### 1. SAS 9.4 ADSL Derivation Step\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * PROGRAM:     derive_bmi_adsl.sas\n" +
        " * FORMULA:     BMI = WEIGHT(kg) / (HEIGHT(m)^2) = WEIGHT / ((HEIGHT/100)**2)\n" +
        " ******************************************************************************/\n\n" +
        "data adam.adsl;\n" +
        "  set sdtm.dm;\n\n" +
        "  /* Merge baseline height and weight from SDTM VS */\n" +
        "  /* Assuming HEIGHT is in cm and WEIGHT is in kg */\n" +
        "  if not missing(HEIGHT) and not missing(WEIGHT) and HEIGHT > 0 then do;\n" +
        "    BMI = round(WEIGHT / ((HEIGHT / 100)**2), 0.1);\n" +
        "    label BMI = 'Body Mass Index (kg/m2)';\n\n" +
        "    /* WHO Standard Categorization */\n" +
        "    length BMIGR1 $15;\n" +
        "    if BMI < 18.5 then BMIGR1 = '<18.5 (Underweight)';\n" +
        "    else if BMI < 25.0 then BMIGR1 = '18.5-<25 (Normal)';\n" +
        "    else if BMI < 30.0 then BMIGR1 = '25-<30 (Overweight)';\n" +
        "    else BMIGR1 = '>=30 (Obese)';\n" +
        "    label BMIGR1 = 'Pooled BMI Category 1';\n" +
        "  end;\n" +
        "run;\n" +
        "```\n\n" +
        "#### 2. Modern R (`admiral` / `dplyr`)\n" +
        "```r\n" +
        "library(dplyr)\n\n" +
        "adsl <- adsl %>%\n" +
        "  mutate(\n" +
        "    BMI = round(WEIGHT / ((HEIGHT / 100)^2), 1),\n" +
        "    BMIGR1 = case_when(\n" +
        "      BMI < 18.5 ~ '<18.5 (Underweight)',\n" +
        "      BMI < 25.0 ~ '18.5-<25 (Normal)',\n" +
        "      BMI < 30.0 ~ '25-<30 (Overweight)',\n" +
        "      BMI >= 30.0 ~ '>=30 (Obese)',\n" +
        "      TRUE ~ NA_character_\n" +
        "    )\n" +
        "  )\n" +
        "```",
      actions: ["ADSL Derivation Code", "Table 14-1 Demographics", "BDS Laboratory Derivations"]
    };
  }

  // 6c. BDS BASELINE, CHANGE, & % CHANGE (BASE, CHG, PCHG, ABLFL)
  if (q.includes("chg") || q.includes("base") || q.includes("ablfl") || (q.includes("change") && q.includes("baseline"))) {
    return {
      reply: "### 💻 SAS 9.4 & R Code: CDISC BDS Baseline & Change Derivation (BASE, CHG, PCHG)\n\n" +
        "Per CDISC ADaM BDS standard (ADLB, ADVS), baseline is defined as the last non-missing assessment prior to or on first dose date (`TRTSDT`).\n\n" +
        "#### 1. SAS 9.4 BDS Derivation\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * STEP 1: Identify Baseline Flag (ABLFL)\n" +
        " ******************************************************************************/\n" +
        "proc sort data=sdtm.lb out=lb_sort;\n" +
        "  by USUBJID PARAMCD ADT AVAL;\n" +
        "  where not missing(AVAL) and ADT <= TRTSDT;\n" +
        "run;\n\n" +
        "data lb_base;\n" +
        "  set lb_sort;\n" +
        "  by USUBJID PARAMCD;\n" +
        "  if last.PARAMCD then do;\n" +
        "    ABLFL = 'Y';\n" +
        "    BASE = AVAL;\n" +
        "    output;\n" +
        "  end;\n" +
        "run;\n\n" +
        "/******************************************************************************\n" +
        " * STEP 2: Merge BASE into post-baseline records and compute CHG / PCHG\n" +
        " ******************************************************************************/\n" +
        "data adam.adlb;\n" +
        "  merge sdtm.lb(in=a) lb_base(keep=USUBJID PARAMCD BASE in=b);\n" +
        "  by USUBJID PARAMCD;\n" +
        "  if a;\n\n" +
        "  /* Calculate Change from Baseline */\n" +
        "  if not missing(AVAL) and not missing(BASE) then do;\n" +
        "    CHG = AVAL - BASE;\n" +
        "    label CHG = 'Change from Baseline';\n\n" +
        "    /* Percentage Change from Baseline */\n" +
        "    if BASE ^= 0 then do;\n" +
        "      PCHG = round(((AVAL - BASE) / abs(BASE)) * 100, 0.1);\n" +
        "      label PCHG = 'Percent Change from Baseline';\n" +
        "    end;\n" +
        "  end;\n" +
        "run;\n" +
        "```\n\n" +
        "#### 2. Modern R (`admiral`)\n" +
        "```r\n" +
        "library(admiral)\n\n" +
        "adlb <- adlb %>%\n" +
        "  derive_var_extreme_flag(\n" +
        "    by_vars = exprs(STUDYID, USUBJID, PARAMCD),\n" +
        "    order = exprs(ADT, AVAL),\n" +
        "    new_var = ABLFL,\n" +
        "    filter = !is.na(AVAL) & ADT <= TRTSDT,\n" +
        "    mode = 'last'\n" +
        "  ) %>%\n" +
        "  derive_var_base(by_vars = exprs(STUDYID, USUBJID, PARAMCD)) %>%\n" +
        "  derive_var_chg() %>%\n" +
        "  derive_var_pchg()\n" +
        "```",
      actions: ["MMRM Repeated Measures", "Lab Shift Tables", "ADLB BDS Rules"]
    };
  }

  // 6d. ADVERSE EVENT STUDY DAY & TRTEMFL (AEDY, ASTDY, TRTEMFL)
  if (q.includes("aedy") || q.includes("astdy") || q.includes("trtemfl") || (q.includes("study day") && q.includes("ae"))) {
    return {
      reply: "### 💻 SAS 9.4 & R Code: Adverse Event Study Day & Treatment-Emergent Flag\n\n" +
        "Per CDISC standard, there is **NO Day 0** in clinical trial analysis.\n\n" +
        "#### 1. SAS 9.4 Calculation\n" +
        "```sas\n" +
        "data adam.adae;\n" +
        "  set sdtm.ae;\n\n" +
        "  /* Analysis Start Study Day (ASTDY) */\n" +
        "  if not missing(AESTDT) and not missing(TRTSDT) then do;\n" +
        "    if AESTDT >= TRTSDT then ASTDY = AESTDT - TRTSDT + 1;\n" +
        "    else ASTDY = AESTDT - TRTSDT;\n" +
        "    label ASTDY = 'Analysis Start Study Day';\n" +
        "  end;\n\n" +
        "  /* Treatment-Emergent Flag (TRTEMFL) */\n" +
        "  /* On or after TRTSDT, and within 30 days of last dose */\n" +
        "  if not missing(AESTDT) and not missing(TRTSDT) then do;\n" +
        "    if AESTDT >= TRTSDT and (missing(TRTEDT) or AESTDT <= TRTEDT + 30) then TRTEMFL = 'Y';\n" +
        "    else TRTEMFL = 'N';\n" +
        "    label TRTEMFL = 'Treatment Emergent Flag';\n" +
        "  end;\n" +
        "run;\n" +
        "```\n\n" +
        "#### 2. Modern R (`admiral`)\n" +
        "```r\n" +
        "library(admiral)\n\n" +
        "adae <- sdtm_ae %>%\n" +
        "  derive_vars_dt(new_vars_prefix = 'AEST', dtc = AESTDTC) %>%\n" +
        "  derive_vars_merged(dataset_add = adsl, new_vars = exprs(TRTSDT, TRTEDT), by_vars = exprs(STUDYID, USUBJID)) %>%\n" +
        "  derive_var_trtemfl(\n" +
        "    new_var = TRTEMFL,\n" +
        "    start_date = AESTDT,\n" +
        "    end_date = AEENDT,\n" +
        "    trt_start_date = TRTSDT,\n" +
        "    trt_end_date = TRTEDT,\n" +
        "    end_window = 30\n" +
        "  ) %>%\n" +
        "  derive_vars_dy(reference_date = TRTSDT, source_vars = exprs(AESTDT))\n" +
        "```",
      actions: ["Table 14-2 Adverse Events", "ADAE OCCDS Structure", "MedDRA Coding Macro"]
    };
  }

  // 6e. PROC TRANSPOSE (BDS WIDE / LONG CONVERSIONS)
  if (q.includes("transpose") || q.includes("proc transpose") || q.includes("wide to long") || q.includes("long to wide")) {
    return {
      reply: "### 💻 SAS 9.4 Code: `PROC TRANSPOSE` for Clinical Datasets\n\n" +
        "Converts long-format BDS findings (e.g. repeated visits) to wide-format for statistical models or patient profile listings.\n\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * Transpose Long BDS (ADLB) to Wide format across visits\n" +
        " ******************************************************************************/\n" +
        "proc sort data=adam.adlb out=adlb_sorted;\n" +
        "  by USUBJID PARAMCD AVISIT;\n" +
        "  where PARAMCD = 'HBA1C' and SAFFL = 'Y';\n" +
        "run;\n\n" +
        "proc transpose data=adlb_sorted out=adlb_wide(drop=_name_) prefix=VAL_;\n" +
        "  by USUBJID;\n" +
        "  id AVISIT;\n" +
        "  var AVAL;\n" +
        "run;\n\n" +
        "/* Invert Wide back to Long */\n" +
        "proc transpose data=adlb_wide out=adlb_long(rename=(col1=AVAL _name_=VISIT_VAR));\n" +
        "  by USUBJID;\n" +
        "  var VAL_:;\n" +
        "run;\n" +
        "```",
      actions: ["BDS Structure Rules", "MMRM PROC MIXED", "Patient Profile Shell"]
    };
  }

  // 6f. PROC FREQ / CHI-SQUARE & FISHER'S EXACT TEST
  if (q.includes("proc freq") || q.includes("fisher") || q.includes("chi-square") || q.includes("chisq") || q.includes("relative risk")) {
    return {
      reply: "### 💻 SAS 9.4 & R Code: Categorical Association (`PROC FREQ` & Fisher's Exact)\n\n" +
        "#### 1. SAS 9.4 (`PROC FREQ`)\n" +
        "```sas\n" +
        "proc freq data=adam.adae;\n" +
        "  tables TRT01P * AESER / chisq exact relrisk riskdiff;\n" +
        "  where TRTEMFL = 'Y';\n" +
        "  title 'Serious Adverse Event Incidence by Treatment Arm';\n" +
        "run;\n" +
        "```\n\n" +
        "#### 2. Modern R Implementation\n" +
        "```r\n" +
        "tab <- table(adae$TRT01P, adae$AESER)\n" +
        "chisq.test(tab)\n" +
        "fisher.test(tab)\n" +
        "```",
      actions: ["Logistic Regression", "Table 14-2 Adverse Events", "Risk Difference CI"]
    };
  }

  // 6g. CDISC SDTM & DEFINE-XML
  if (q.includes("sdtm") || q.includes("cdash") || q.includes("define.xml") || q.includes("define-xml") || q.includes("iso 8601")) {
    return {
      reply: "### 🧬 CDISC SDTM v3.3/3.4 & Define-XML v2.1 Architecture\n\n" +
        "The **Study Data Tabulation Model (SDTM)** organizes raw trial data into standardized domains for FDA/EMA submissions.\n\n" +
        "| Class | Domains | Key Standard Variables |\n" +
        "| :--- | :--- | :--- |\n" +
        "| **Special Purpose** | `DM`, `CO`, `SE`, `SV` | `STUDYID`, `DOMAIN`, `USUBJID`, `SUBJID`, `RFSTDTC`, `ARMCD` |\n" +
        "| **Interventions** | `EX`, `CM`, `PR`, `SU` | `--TRT`, `--DOSE`, `--DOSU`, `--DOSFRQ`, `--STDTC`, `--ENDTC` |\n" +
        "| **Events** | `AE`, `MH`, `DS`, `DV` | `--TERM`, `--LLT`, `--PT`, `--SOC`, `--SEV`, `--SER`, `--STDTC` |\n" +
        "| **Findings** | `LB`, `VS`, `QS`, `EG`, `PE` | `--TESTCD`, `--TEST`, `--ORRES`, `--STRESN`, `--STRESU`, `--NRIND` |\n" +
        "| **Relationships** | `RELREC`, `SUPP--` | `RDOMAIN`, `USUBJID`, `IDVAR`, `IDVARVAL`, `QNAM`, `QVAL` |\n\n" +
        "#### ISO 8601 Imputation Rules:\n" +
        "- Partial dates (e.g., month and year only) are recorded as `2024-03` in SDTM.\n" +
        "- In ADaM, imputed dates populate `ASTDT`, with imputation flags `ASTDTF = 'D'` (Day imputed) or `ASTDTF = 'M'` (Month imputed).",
      actions: ["SDTM Mapping Template", "Define-XML 2.1 Spec", "SAS SDTM Macro"]
    };
  }

  // 7. ADAM & POPULATION FLAGS
  if (q.includes("adam") || q.includes("adsl") || q.includes("saffl") || q.includes("ittfl") || q.includes("ppfl") || q.includes("bds") || q.includes("occds")) {
    return {
      reply: "### 🧬 CDISC ADaM v1.2 / v1.3 Architecture & Derivations\n\n" +
        "#### 1. Population Flags Standard:\n" +
        "- **SAFFL (Safety Population)**: `Y` for subjects receiving at least 1 dose of study medication (`EXSTDTC` non-missing).\n" +
        "- **ITTFL (Intent-to-Treat)**: `Y` for all randomized subjects, regardless of whether treatment was administered.\n" +
        "- **PPFL (Per-Protocol)**: `Y` for compliant subjects (e.g., $\\ge 80\\%$ exposure, no major protocol deviations).\n" +
        "- **FASFL (Full Analysis Set)**: Per ICH E9, as close to ITT as possible excluding major eligibility failures.\n\n" +
        "#### 2. ADaM Structures:\n" +
        "- **ADSL**: Subject-Level dataset (1 row per subject).\n" +
        "- **BDS (Basic Data Structure)**: ADLB, ADVS (1 row per subject per parameter per visit, containing `PARAMCD`, `AVAL`, `BASE`, `CHG`).\n" +
        "- **OCCDS (Occurrence Structure)**: ADAE, ADCM (1 row per event, containing `TRTEMFL`, `AEDY`, `AESEVN`).",
      actions: ["ADSL Derivation Code", "ADAE OCCDS Structure", "ADLB BDS Rules"]
    };
  }

  // 8. PINNACLE 21 & REGULATORY (FDA / EMA / 21 CFR)
  if (q.includes("pinnacle") || q.includes("p21") || q.includes("fda") || q.includes("ectd") || q.includes("21 cfr") || q.includes("audit") || q.includes("qc")) {
    return {
      reply: "### ⚖️ Regulatory Intelligence & Pinnacle 21 Validation Rules\n\n" +
        "#### 1. Pinnacle 21 Fatal Submission Check Rules:\n" +
        "- **Rule SD0001 / AD0001 (1-to-1 Subject Preservation)**: Every subject in SDTM `DM` must exist in ADaM `ADSL`. Count mismatch triggers FDA eCTD technical rejection.\n" +
        "- **Rule AD0018 (Safety Flag Derivation)**: If `TRTSDT` is present, `SAFFL` must strictly equal `'Y'`.\n" +
        "- **Rule AD0047 (TRTEMFL Chronology)**: Adverse Events starting strictly before `TRTSDT` cannot have `TRTEMFL = 'Y'`.\n" +
        "- **Rule SD0022 (ISO 8601 Conformance)**: Dates must conform strictly to ISO 8601 standards.\n\n" +
        "#### 2. FDA eCTD Module 5 Structure:\n" +
        "- **5.3.5.1**: Clinical Study Reports (CSR per ICH E3).\n" +
        "- **5.3.5.2 Tabulations**: SDTM XPT v5 files, `define.xml`, and Study Data Reviewer's Guide (`csdrg.pdf`).\n" +
        "- **5.3.5.3 Analysis**: ADaM XPT v5 files, `define.xml`, ADRG (`adrg.pdf`), and execution source programs (`*.sas`, `*.R`).",
      actions: ["P21 Audit Assertion Script", "eCTD Folder Shell", "SDRG Template"]
    };
  }

  // 9. MEDICAL CODING (MedDRA & WHODrug)
  if (q.includes("meddra") || q.includes("whodrug") || q.includes("medical coding") || /(soc|pt|llt|hlt|hlgt|smq)/i.test(q)) {
    return {
      reply: "### 💊 Medical Coding Standards: MedDRA & WHODrug\n\n" +
        "#### 1. MedDRA 5-Level Hierarchy (Adverse Events & Medical History):\n" +
        "```\n" +
        "System Organ Class (SOC)\n" +
        "  └─ High Level Group Term (HLGT)\n" +
        "      └─ High Level Term (HLT)\n" +
        "          └─ Preferred Term (PT)    <-- PRIMARY REGULATORY ANALYSIS LEVEL\n" +
        "              └─ Lowest Level Term (LLT)\n" +
        "```\n" +
        "- Standardised MedDRA Queries (SMQs): Groupings of PTs to evaluate specific safety signals (e.g., Hepatic Failure, Cardiac Arrhythmias, Rhabdomyolysis).\n\n" +
        "#### 2. WHODrug (Concomitant Medications):\n" +
        "- Maps verbatim trade/generic medications to **Drug Record Number (DrugRecNo)** and **ATC (Anatomical Therapeutic Chemical)** classification levels 1 through 5.",
      actions: ["MedDRA Coding SAS Macro", "WHODrug Derivation Rules", "TEAE by SOC Template"]
    };
  }

  // 9b. ONCOLOGY VISUALIZATION (SPIDER, WATERFALL, & SWIMMER PLOTS)
  if (q.includes("spider") || q.includes("waterfall") || q.includes("swimmer") || q.includes("recist")) {
    return {
      reply: "### 📊 R (`ggplot2`) Production Code: Oncology Trial Visualizations (RECIST 1.1)\n\n" +
        "Visualizing tumor response dynamics per RECIST 1.1 guidelines.\n\n" +
        "#### 1. Spider Plot (Tumor Burden Change over Time)\n" +
        "```r\n" +
        "library(ggplot2)\n" +
        "library(dplyr)\n\n" +
        "# Spider plot for percentage change in sum of target lesion diameters\n" +
        "ggplot(adtr, aes(x = AVISITN, y = PCHG, group = USUBJID, color = TRT01P)) +\n" +
        "  geom_line(alpha = 0.7, linewidth = 0.8) +\n" +
        "  geom_point(size = 1.5) +\n" +
        "  geom_hline(yintercept = -30, linetype = 'dashed', color = '#10b981', linewidth = 0.7) + # Partial Response\n" +
        "  geom_hline(yintercept = 20, linetype = 'dashed', color = '#ef4444', linewidth = 0.7) +  # Progressive Disease\n" +
        "  scale_x_continuous(breaks = c(0, 6, 12, 18, 24), labels = paste('Wk', c(0, 6, 12, 18, 24))) +\n" +
        "  labs(\n" +
        "    title = 'Spider Plot: Target Lesion % Change from Baseline over Time',\n" +
        "    subtitle = 'RECIST 1.1 Thresholds: -30% (PR), +20% (PD)',\n" +
        "    x = 'Study Assessment Visit',\n" +
        "    y = 'Change in Sum of Diameters (%)',\n" +
        "    color = 'Treatment Arm'\n" +
        "  ) +\n" +
        "  theme_minimal(base_size = 13)\n" +
        "```\n\n" +
        "#### 2. Waterfall Plot (Best Percentage Change in Target Lesions)\n" +
        "```r\n" +
        "# Waterfall plot sorted by best percentage reduction\n" +
        "adtr_best <- adtr %>%\n" +
        "  group_by(USUBJID, TRT01P) %>%\n" +
        "  summarise(BEST_PCHG = min(PCHG, na.rm = TRUE), .groups = 'drop') %>%\n" +
        "  arrange(BEST_PCHG)\n\n" +
        "ggplot(adtr_best, aes(x = reorder(USUBJID, BEST_PCHG), y = BEST_PCHG, fill = TRT01P)) +\n" +
        "  geom_col(width = 0.8) +\n" +
        "  geom_hline(yintercept = -30, linetype = 'dashed', color = '#10b981') +\n" +
        "  geom_hline(yintercept = 20, linetype = 'dashed', color = '#ef4444') +\n" +
        "  labs(\n" +
        "    title = 'Waterfall Plot: Maximum Reduction in Target Lesions (RECIST 1.1)',\n" +
        "    x = 'Patient ID (Rank Ordered)',\n" +
        "    y = 'Best % Change from Baseline',\n" +
        "    fill = 'Treatment Arm'\n" +
        "  ) +\n" +
        "  theme_minimal() +\n" +
        "  theme(axis.text.x = element_blank(), axis.ticks.x = element_blank())\n" +
        "```",
      actions: ["Kaplan-Meier Survival Plot", "Swimmer Plot Code", "RECIST 1.1 Criteria"]
    };
  }

  // 10. ANCOVA / PROC GLM
  if (q.includes("ancova") || q.includes("proc glm") || (q.includes("baseline") && q.includes("covariate"))) {
    return {
      reply: "### 💻 SAS 9.4 & R Code: Analysis of Covariance (ANCOVA)\n\n" +
        "ANCOVA is the standard model for evaluating continuous efficacy endpoints when measurements are taken at baseline and a single primary post-baseline milestone per ICH E9.\n\n" +
        "#### 1. SAS 9.4 ANCOVA Implementation (`PROC GLM`)\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * PROGRAM:     ancova_primary_endpoint.sas\n" +
        " * PURPOSE:     ANCOVA for Change from Baseline at Week 24\n" +
        " * MODEL:       CHG = BASE + TRT01P (Treatment Difference with 95% CI)\n" +
        " ******************************************************************************/\n\n" +
        "proc glm data=adam.adlb;\n" +
        "  class TRT01P(ref='Placebo');\n" +
        "  model CHG = BASE TRT01P / solution clparm;\n" +
        "  lsmeans TRT01P / pdiff=control('Placebo') cl stderr;\n" +
        "  where PARAMCD = 'LDL' and AVISIT = 'Week 24' and SAFFL = 'Y';\n" +
        "run;\n" +
        "quit;\n" +
        "```\n\n" +
        "#### 2. Modern R ANCOVA (`lm` & `emmeans`)\n" +
        "```r\n" +
        "library(emmeans)\n" +
        "library(dplyr)\n\n" +
        "# Fit linear model with baseline as covariate\n" +
        "fit_ancova <- lm(CHG ~ BASE + TRT01P, data = adlb_wk24)\n\n" +
        "# Calculate Least-Squares Means & Pairwise Contrasts\n" +
        "lsmeans_trt <- emmeans(fit_ancova, pairwise ~ TRT01P)\n" +
        "summary(lsmeans_trt, infer = c(TRUE, TRUE))\n" +
        "```\n\n" +
        "#### Regulatory Considerations:\n" +
        "- **Testing Parallelism**: Per ICH E9, test for Treatment-by-Baseline interaction (`BASE*TRT01P`). If not significant ($p > 0.10$), drop the interaction term.",
      actions: ["MMRM Repeated Measures", "Table 14-3 Shell", "PROC REG Diagnostics"]
    };
  }

  // 11. LOGISTIC REGRESSION & ODDS RATIOS
  if (q.includes("logistic") || q.includes("proc logistic") || q.includes("odds ratio") || q.includes("binary responder")) {
    return {
      reply: "### 💻 SAS 9.4 & R Code: Logistic Regression & Odds Ratios\n\n" +
        "Evaluates binary clinical endpoints (e.g., Clinical Response: Yes/No, Adverse Event Occurrence).\n\n" +
        "#### 1. SAS 9.4 (`PROC LOGISTIC`)\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * PROGRAM:     logistic_responder_analysis.sas\n" +
        " * ENDPOINT:    AVALC = 'Responder' (1) vs 'Non-Responder' (0)\n" +
        " ******************************************************************************/\n\n" +
        "proc logistic data=adam.adresp descending;\n" +
        "  class TRT01P(ref='Placebo') SEX(ref='Male') / param=ref;\n" +
        "  model RESPFL(event='Y') = TRT01P BASE AGE SEX / clodds=wald;\n" +
        "  oddsratio TRT01P / at(BASE=mean);\n" +
        "  roc 'Model Discrimination' TRT01P BASE AGE SEX;\n" +
        "run;\n" +
        "```\n\n" +
        "#### 2. Modern R (`glm` & `broom`)\n" +
        "```r\n" +
        "library(broom)\n\n" +
        "fit_logit <- glm(RESPFL_NUM ~ TRT01P + BASE + AGE + SEX, data = adresp, family = binomial(link = 'logit'))\n" +
        "tidy(fit_logit, exponentiate = TRUE, conf.int = TRUE)\n" +
        "```",
      actions: ["ANCOVA Comparison", "PROC GLIMMIX Repeated Binary", "ROC Curve Plot"]
    };
  }

  // 12. PROC GLIMMIX & PROC GENMOD (GEE)
  if (q.includes("glimmix") || q.includes("genmod") || q.includes("gee") || q.includes("repeated binary") || q.includes("poisson")) {
    return {
      reply: "### 💻 SAS 9.4 Code: Longitudinal Binary & Count Models (`PROC GLIMMIX` & `PROC GENMOD`)\n\n" +
        "#### 1. Generalized Estimating Equations (GEE) via `PROC GENMOD`\n" +
        "```sas\n" +
        "/* Repeated binary outcome with exchangeable correlation matrix */\n" +
        "proc genmod data=adam.adresp descending;\n" +
        "  class USUBJID TRT01P(ref='Placebo') AVISIT;\n" +
        "  model RESPFL(event='Y') = TRT01P AVISIT TRT01P*AVISIT / dist=bin link=logit;\n" +
        "  repeated subject=USUBJID / type=exch corrw;\n" +
        "run;\n" +
        "```\n\n" +
        "#### 2. Generalized Linear Mixed Model (GLMM) via `PROC GLIMMIX`\n" +
        "```sas\n" +
        "/* Subject-specific random intercepts */\n" +
        "proc glimmix data=adam.adresp method=quad;\n" +
        "  class USUBJID TRT01P(ref='Placebo') AVISIT;\n" +
        "  model RESPFL(event='Y') = TRT01P AVISIT TRT01P*AVISIT / dist=binary link=logit solution;\n" +
        "  random intercept / subject=USUBJID;\n" +
        "  lsmeans TRT01P*AVISIT / diff oddsratio ilink cl;\n" +
        "run;\n" +
        "```",
      actions: ["PROC LOGISTIC Single Point", "MMRM Continuous", "Poisson Count Model"]
    };
  }

  // 13. MULTIPLE IMPUTATION / PROC MI & MIANALYZE
  if (q.includes("multiple imputation") || q.includes("proc mi") || q.includes("mianalyze") || q.includes("rubin")) {
    return {
      reply: "### 💻 SAS 9.4 Code: Multiple Imputation (`PROC MI` & `PROC MIANALYZE`)\n\n" +
        "FDA/ICH E9(R1) compliant handling of non-monotone and monotone missing clinical efficacy data.\n\n" +
        "```sas\n" +
        "/******************************************************************************\n" +
        " * STEP 1: Impute missing values (20 imputations via FCS method)\n" +
        " ******************************************************************************/\n" +
        "proc mi data=adam.adlb out=mi_imputed nimpute=20 seed=98765;\n" +
        "  class TRT01P;\n" +
        "  fcs nbiter=10 reg(CHG_WK12 = BASE TRT01P AGE);\n" +
        "  var BASE AGE CHG_WK12;\n" +
        "run;\n\n" +
        "/******************************************************************************\n" +
        " * STEP 2: Analyze each imputed dataset (ANCOVA)\n" +
        " ******************************************************************************/\n" +
        "proc glm data=mi_imputed outstat=mi_stats;\n" +
        "  by _Imputation_;\n" +
        "  class TRT01P(ref='Placebo');\n" +
        "  model CHG_WK12 = BASE TRT01P / solution;\n" +
        "  ods output ParameterEstimates=mi_params;\n" +
        "run;\n" +
        "quit;\n\n" +
        "/******************************************************************************\n" +
        " * STEP 3: Combine parameter estimates and standard errors using Rubin's Rules\n" +
        " ******************************************************************************/\n" +
        "proc mianalyze parms=mi_params;\n" +
        "  class TRT01P;\n" +
        "  modeleffects TRT01P;\n" +
        "run;\n" +
        "```",
      actions: ["MMRM (Direct Likelihood)", "ICH E9(R1) Estimands", "Tipping Point Sensitivity"]
    };
  }

  // 14. SAFETY SURVEILLANCE & HY'S LAW
  if (q.includes("hy's law") || q.includes("hys law") || q.includes("dili") || q.includes("liver") || q.includes("safety signal")) {
    return {
      reply: "### 🩺 Clinical Safety Surveillance: Drug-Induced Liver Injury (Hy's Law)\n\n" +
        "Hy's Law indicates severe drug-induced hepatotoxicity with ~10% case mortality.\n\n" +
        "#### FDA Hy's Law Diagnostic Criteria:\n" +
        "1. **Aminotransferases**: `ALT` or `AST` $\\ge 3 \\times \\text{ULN}$ (Upper Limit of Normal).\n" +
        "2. **Total Bilirubin**: Total Bilirubin $\\ge 2 \\times \\text{ULN}$ without initial findings of cholestasis.\n" +
        "3. **Alkaline Phosphatase**: `ALP` $< 2 \\times \\text{ULN}$ (rules out cholestatic jaundice).\n" +
        "4. **No Other Confounders**: Viral hepatitis, alcohol abuse, or pre-existing cirrhosis ruled out.\n\n" +
        "```sas\n" +
        "/* SAS Hy's Law Screening Flag in ADLB */\n" +
        "data adlb_hyslaw;\n" +
        "  set adam.adlb;\n" +
        "  where PARAMCD in ('ALT', 'AST', 'BILI', 'ALP');\n" +
        "  if PARAMCD in ('ALT', 'AST') and AVAL >= 3 * ANRHI then LIVER_ALT_AST_FL = 'Y';\n" +
        "  if PARAMCD = 'BILI' and AVAL >= 2 * ANRHI then LIVER_BILI_FL = 'Y';\n" +
        "  if PARAMCD = 'ALP'  and AVAL < 2 * ANRHI  then LIVER_ALP_NORM_FL = 'Y';\n" +
        "run;\n" +
        "```",
      actions: ["Hy's Law Quadrant Plot", "Lab Shift Tables", "ADLB BDS Derivation"]
    };
  }

  // 15. ICH E9(R1) ESTIMANDS FRAMEWORK
  if (q.includes("estimand") || q.includes("e9(r1)") || q.includes("e9 r1") || q.includes("intercurrent")) {
    return {
      reply: "### 📐 ICH E9(R1) Addendum: Estimands & Intercurrent Events Framework\n\n" +
        "The **Estimand Framework** aligns clinical trial objectives, design, conduct, and statistical analysis.\n\n" +
        "#### 5 Core Attributes of an Estimand:\n" +
        "1. **Treatment Condition**: Investigational regimen vs comparator.\n" +
        "2. **Target Population**: Defined by inclusion/exclusion protocol.\n" +
        "3. **Variable (Endpoint)**: Measured clinical outcome to evaluate effect.\n" +
        "4. **Intercurrent Events (ICE) Strategy**: Protocol deviations, discontinuation, rescue medication handling.\n" +
        "5. **Population-Level Summary**: Numerical summary (Difference in LSMeans, Odds Ratio, Hazard Ratio).\n\n" +
        "#### 5 Strategies for Handling Intercurrent Events:\n" +
        "- **Treatment Policy**: Collect and analyze measurements regardless of ICE (ITT principle).\n" +
        "- **Composite**: The ICE is integrated into the endpoint definition (e.g. Non-responder if rescue taken).\n" +
        "- **Hypothetical**: Evaluates outcome in the scenario where ICE did not occur.\n" +
        "- **Principal Stratum**: Evaluates effect only in subjects who would not experience the ICE.\n" +
        "- **While on Treatment**: Evaluates measurements prior to ICE occurrence.",
      actions: ["MMRM MAR Model", "Multiple Imputation Strategy", "Tipping Point Sensitivity"]
    };
  }

  // 16. DOSE ESCALATION (ONCOLOGY 3+3 DESIGN)
  if (q.includes("3+3") || q.includes("dose escalation") || q.includes("crm") || q.includes("boin") || q.includes("phase 1")) {
    return {
      reply: "### 💊 Oncology Phase I Dose-Escalation Designs\n\n" +
        "#### Traditional 3+3 Rule Design\n" +
        "Used to determine the **Maximum Tolerated Dose (MTD)** based on Dose-Limiting Toxicities (DLTs) observed during Cycle 1:\n\n" +
        "1. Enroll 3 patients at Dose Level $k$:\n" +
        "   - If **0/3 DLTs**: Escalate to Dose Level $k+1$.\n" +
        "   - If **1/3 DLTs**: Enroll 3 additional patients at Dose Level $k$ (total 6 patients):\n" +
        "     - If **1/6 DLTs**: Escalate to Dose Level $k+1$.\n" +
        "     - If $\\ge 2/6$ DLTs: Dose Level $k$ exceeds MTD; de-escalate or declare Dose Level $k-1$ as MTD.\n" +
        "   - If $\\ge 2/3$ DLTs: Dose Level $k$ exceeds MTD; stop escalation.\n\n" +
        "#### Modern Model-Assisted Alternatives:\n" +
        "- **BOIN (Bayesian Optimal Interval Design)**: Dynamically escalates/de-escalates based on target toxicity rate boundaries.\n" +
        "- **CRM (Continual Reassessment Method)**: Bayesian adaptive parametric dose-toxicity curve updating.",
      actions: ["BOIN Design R Code", "DLT Analysis Specs", "Kaplan-Meier Survival"]
    };
  }

  // 17. SAMPLE SIZE & POWER CALCULATION
  if (q.includes("sample size") || q.includes("power") || q.includes("proc power") || q.includes("pwr")) {
    return {
      reply: "### 📊 Sample Size & Statistical Power Calculations\n\n" +
        "#### 1. SAS 9.4 `PROC POWER` (Two-Sample Continuous T-Test)\n" +
        "```sas\n" +
        "proc power;\n" +
        "  twosamplemeans test=diff\n" +
        "    meandiff = 0.5        /* Expected difference between arms */\n" +
        "    stddev = 1.2          /* Pooled standard deviation */\n" +
        "    groupweights = (1 1)  /* 1:1 randomization */\n" +
        "    alpha = 0.05          /* Two-sided alpha */\n" +
        "    power = 0.90          /* 90% power */\n" +
        "    ntotal = .;\n" +
        "run;\n" +
        "```\n\n" +
        "#### 2. R (`survival` package) - Survival Log-Rank Sample Size\n" +
        "```r\n" +
        "# Freedman formula for survival event sizing\n" +
        "hr <- 0.70; alpha <- 0.05; beta <- 0.20\n" +
        "events_needed <- ((qnorm(1 - alpha/2) + qnorm(1 - beta)) / log(hr))^2 * 4\n" +
        "cat('Target number of PFS events required:', ceiling(events_needed), '\\n')\n" +
        "```",
      actions: ["MMRM Sample Size", "Binary Sample Size", "Non-Inferiority Delta"]
    };
  }

  // 18. DYNAMIC UNIVERSAL CLINICAL & STATISTICAL CODE SYNTHESIZER
  return synthesizeDynamicClinicalQuery(query);
}

function synthesizeDynamicClinicalQuery(rawQuery) {
  const q = (rawQuery || "").toLowerCase();
  
  let isR = q.includes(" r ") || q.startsWith("r ") || q.includes("r script") || q.includes("tidyverse") || q.includes("ggplot");
  let isPy = q.includes("python") || q.includes("pandas") || q.includes("statsmodels") || q.includes("pyreadstat");
  let isSas = !isR && !isPy;

  let targetDset = "ADaM / SDTM Dataset";
  if (q.includes("adsl") || q.includes("demographic")) targetDset = "ADSL (Subject-Level Analysis Dataset)";
  else if (q.includes("adae") || q.includes("adverse") || q.includes("teae")) targetDset = "ADAE (Adverse Events Occurrence)";
  else if (q.includes("adlb") || q.includes("lab")) targetDset = "ADLB (Laboratory BDS)";
  else if (q.includes("advs") || q.includes("vital")) targetDset = "ADVS (Vital Signs BDS)";
  else if (q.includes("adtte") || q.includes("survival") || q.includes("time to event")) targetDset = "ADTTE (Time-to-Event Analysis)";
  else if (q.includes("dm")) targetDset = "SDTM DM (Demographics)";
  else if (q.includes("ae")) targetDset = "SDTM AE (Adverse Events)";

  let codeBlock = "";

  if (isSas) {
    codeBlock += "#### SAS 9.4 Production Code\n" +
      "```sas\n" +
      "/******************************************************************************\n" +
      " * PROGRAM:     clinical_data_solution.sas\n" +
      " * TARGET:      " + targetDset + "\n" +
      " * STANDARDS:   CDISC ADaM-IG v1.2 / SDTM v3.3 & FDA eCTD Guidelines\n" +
      " ******************************************************************************/\n\n" +
      "/* Step 1: Prepare and sort cohort */\n" +
      "proc sort data=adam.adsl out=work.analysis_cohort;\n" +
      "  by STUDYID USUBJID;\n" +
      "  where SAFFL = 'Y';\n" +
      "run;\n\n" +
      "/* Step 2: Derivations and Analysis Flags */\n" +
      "data work.derived_output;\n" +
      "  set work.analysis_cohort;\n" +
      "  \n" +
      "  /* Stratification and categorization */\n" +
      "  if not missing(AGE) then do;\n" +
      "    if AGE < 65 then AGEGR1 = '<65';\n" +
      "    else AGEGR1 = '>=65';\n" +
      "  end;\n\n" +
      "  format TRTSDT TRTEDT date9.;\n" +
      "run;\n\n" +
      "/* Step 3: Analytical Summary & Reporting */\n" +
      "proc freq data=work.derived_output;\n" +
      "  tables TRT01P * AGEGR1 / chisq cmh;\n" +
      "  title 'Clinical Trial Cohort Breakdown';\n" +
      "run;\n" +
      "```";
  } else if (isR) {
    codeBlock += "#### Modern R (pharmaverse / tidyverse) Code\n" +
      "```r\n" +
      "library(dplyr)\n" +
      "library(admiral)\n\n" +
      "# Data pipeline for " + targetDset + "\n" +
      "df_analysis <- analysis_data %>%\n" +
      "  filter(SAFFL == 'Y') %>%\n" +
      "  mutate(\n" +
      "    AGEGR1 = if_else(AGE < 65, '<65', '>=65'),\n" +
      "    TRT01P = factor(TRT01P)\n" +
      "  )\n\n" +
      "# Tabulation Summary\n" +
      "summary_table <- df_analysis %>%\n" +
      "  group_by(TRT01P, AGEGR1) %>%\n" +
      "  summarise(n = n(), .groups = 'drop')\n\n" +
      "print(summary_table)\n" +
      "```";
  } else {
    codeBlock += "#### Python Clinical Data Science Implementation\n" +
      "```python\n" +
      "import pandas as pd\n" +
      "import numpy as np\n\n" +
      "# Load clinical dataset\n" +
      "df = pd.read_sas('adsl.sas7bdat', encoding='latin1')\n" +
      "df_clean = df[df['SAFFL'] == 'Y'].copy()\n" +
      "df_clean['AGEGR1'] = np.where(df_clean['AGE'] < 65, '<65', '>=65')\n" +
      "print(df_clean.groupby(['TRT01P', 'AGEGR1']).size().unstack(fill_value=0))\n" +
      "```";
  }

  return {
    reply: "### 🧬 Autonomous Clinical Analysis & Code Synthesis\n\n" +
      "**Target Context**: " + targetDset + "\n" +
      "**Compliance**: CDISC Standards, ICH Guidelines (E3, E6, E9), 21 CFR Part 11.\n\n" +
      codeBlock + "\n\n" +
      "#### Technical & Compliance Notes:\n" +
      "- Traceability to raw SDTM collection sources is fully preserved.\n" +
      "- SAS transport (XPT v5) regulatory formatting maintained (max 8 characters for variable names).\n" +
      "- Independent double programming validation is recommended prior to formal eCTD CSR assembly.",
    actions: ["Export Complete Script", "Pinnacle 21 QC Check", "Table Shell Template"]
  };
}

module.exports = {
  generatePharmaResponse
};
