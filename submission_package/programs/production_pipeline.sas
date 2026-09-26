/******************************************************************************
 * STUDY:       ONC-2025-001
 * PROGRAM:     production_adsl_derivation.sas
 * PURPOSE:     CDISC SDTM / ADaM Production Pipeline for Domain ADSL
 * STANDARDS:   CDISC SDTM-IG v3.3 / ADaM-IG v1.3 / FDA Technical Conformance Guide
 * VALIDATION:  Independent Double Programming with PROC COMPARE (&SYSINFO = 0)
 * GENERATED:   2026-09-26T05:47:10.347Z
 ******************************************************************************/

/* 1. SETUP REGULATORY LIBRARIES & COMPILER OPTIONS */
options nodate pageno=1 linesize=120 pagesize=60 mprint symbolgen;
libname raw  "data/raw";
libname sdtm "data/sdtm";
libname adam "data/adam";
libname qc   "data/qc";

/* 2. REGULATORY FORMAT DEFINITIONS */
proc format;
  value $saffl  "Y"="Safety Analysis Set" "N"="Excluded from Safety";
  value $ittfl  "Y"="Intent-to-Treat Set"  "N"="Excluded from ITT";
  value $ppfl   "Y"="Per-Protocol Set"     "N"="Excluded from PP";
  value $aesev  "MILD"="Grade 1 - Mild" "MODERATE"="Grade 2 - Moderate" "SEVERE"="Grade 3 - Severe";
  value $anrind "NORMAL"="Normal Range" "LOW"="Below Normal" "HIGH"="Above Normal";
run;

/* ============================================================================
   STEP 1: DATA STEP WITH EXPLICIT ATTRIB DICTIONARY (Domain: ADSL)
   ============================================================================ */
data adam.adsl(label="ADSL Regulatory Dataset per CDISC Standards");
  attrib 
      STUDYID      length=$100    label="STUDYID Analysis Variable for ADSL"
      USUBJID      length=$100    label="USUBJID Analysis Variable for ADSL"
      SUBJID       length=$100    label="SUBJID Analysis Variable for ADSL"
      ARM          length=$100    label="ARM Analysis Variable for ADSL"
      AGE          length=8       label="AGE Analysis Variable for ADSL"
      SEX          length=$100    label="SEX Analysis Variable for ADSL";

  set raw.adsl;

  /* ISO 8601 Character Date Cleaning & Numeric Date Conversions */
  %if %sysfunc(exist(raw.adsl)) %then %do;
    if not missing(RFSTDTC) then RFSTDT = input(substr(RFSTDTC, 1, 10), yymmdd10.);
    if not missing(AESTDTC) then AESTDT = input(substr(AESTDTC, 1, 10), yymmdd10.);
    if not missing(TRTSDTC) then TRTSDT = input(substr(TRTSDTC, 1, 10), yymmdd10.);
  %end;

  /* Deterministic Population Flags */
  if missing(STUDYID) then STUDYID = "ONC-2025-001";
  if not missing(TRTSDT) then SAFFL = "Y"; else SAFFL = "N";
  ITTFL = "Y";

  /* Treatment Duration & Physiological Imputation */
  %if "&dom" = "ADSL" %then %do;
    if not missing(TRTSDT) and not missing(TRTEDT) then 
      TRTDURD = (TRTEDT - TRTSDT) + 1;
    if AGE < 65 then do; AGEGR1 = "<65"; AGEGR1N = 1; end;
    else do; AGEGR1 = ">=65"; AGEGR1N = 2; end;
  %end;
  %else %if "&dom" = "ADAE" %then %do;
    if not missing(AESTDT) and not missing(TRTSDT) and AESTDT >= TRTSDT then TRTEMFL = "Y";
    else TRTEMFL = "N";
    select(upcase(AESEV));
      when("MILD")     AESEVN = 1;
      when("MODERATE") AESEVN = 2;
      when("SEVERE")   AESEVN = 3;
      otherwise        AESEVN = 0;
    end;
  %end;
  %else %if "&dom" = "ADLB" or "&dom" = "ADVS" %then %do;
    if not missing(AVAL) and not missing(BASE) then do;
      CHG  = AVAL - BASE;
      PCHG = ((AVAL - BASE) / (BASE + 1e-12)) * 100;
    end;
  %end;
run;

/* ============================================================================
   STEP 2: SUPPLEMENTAL QUALIFIER EXTRACTION (SUPPSL)
   ============================================================================ */
%macro extract_suppqual(inds=adam.adsl, outds=sdtm.suppsl);
  data &outds(label="Supplemental Qualifiers for ADSL");
    attrib
      STUDYID   length=$20  label="Study Identifier"
      RDOMAIN   length=$2   label="Related Domain Abbreviation"
      USUBJID   length=$40  label="Unique Subject Identifier"
      IDVAR     length=$8   label="Identifying Variable"
      IDVARVAL  length=$40  label="Identifying Variable Value"
      QNAM      length=$8   label="Qualifier Variable Name"
      QLABEL    length=$40  label="Qualifier Variable Label"
      QVAL      length=$200 label="Data Value"
      QORIG     length=$20  label="Origin"
      QEVAL     length=$20  label="Evaluator";
    set &inds;
    RDOMAIN = "SL";
    IDVAR = "SLSEQ";
    IDVARVAL = put(_n_, z4.);
    QORIG = "CRF";
  run;
%mend extract_suppqual;

/* ============================================================================
   STEP 3: INDEPENDENT DOUBLE PROGRAMMING RECONCILIATION (PROC COMPARE)
   ============================================================================ */
proc sort data=adam.adsl out=prod_sort; 
  by STUDYID USUBJID; 
run;
proc sort data=qc.adsl out=qc_sort; 
  by STUDYID USUBJID; 
run;

proc compare base=prod_sort compare=qc_sort 
  out=comp_diff outnoequal outbase outcomp;
  id STUDYID USUBJID;
run;

%macro evaluate_double_programming;
  %if &SYSINFO = 0 %then %do;
    %put NOTE: [GxP AUDIT PASS] 100% Mathematical Concordance Verified between Production and QC (&SYSINFO = 0).;
  %end;
  %else %do;
    %put ERROR: [GxP AUDIT FAIL] Discrepancies detected between Production and QC models (SYSINFO = &SYSINFO).;
  %end;
%mend evaluate_double_programming;
%evaluate_double_programming;
