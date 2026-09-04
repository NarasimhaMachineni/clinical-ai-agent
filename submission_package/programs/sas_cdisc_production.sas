/******************************************************************************
 * STUDY:       ONC-2025-001 (Phase 3 Randomized Clinical Trial)
 * PROGRAM:     sas_cdisc_production.sas
 * PURPOSE:     CDISC SDTM v3.3 & ADaM v1.2 Production Pipeline with Full PROC Steps
 * REPOSITORY:  https://github.com/NarasimhaMachineni/clinical-ai-agent/blob/main/programs/sas_cdisc_production.sas
 * AUTHOR:      ClinicalOps AI Agent (Lakshmi Narasimha Machineni)
 * STANDARDS:   CDISC SDTM-IG v3.3 / ADaM-IG v1.2 / FDA Technical Conformance Guide
 ******************************************************************************/

/* ----------------------------------------------------------------------------
   1. SETUP LIBNAMES & SYSTEM OPTIONS
   ---------------------------------------------------------------------------- */
options nodate pageno=1 linesize=120 pagesize=60 mprint symbolgen;
libname sdtm "data/sdtm";
libname adam "data/adam";
libname qc   "data/qc";

/* ----------------------------------------------------------------------------
   2. PROC FORMAT: REGULATORY CONTROLLED TERMINOLOGY CODELISTS
   ---------------------------------------------------------------------------- */
proc format;
  value $saffl
    "Y" = "Safety Analysis Set"
    "N" = "Excluded from Safety";
    
  value $ittfl
    "Y" = "Intent-to-Treat Set"
    "N" = "Excluded from ITT";
    
  value $ppfl
    "Y" = "Per-Protocol Set"
    "N" = "Excluded from PP";

  value $aesev
    "MILD"     = "Grade 1 - Mild"
    "MODERATE" = "Grade 2 - Moderate"
    "SEVERE"   = "Grade 3 - Severe";

  value $anrind
    "NORMAL" = "Normal Range"
    "LOW"    = "Below Lower Limit"
    "HIGH"   = "Above Upper Limit";
run;

/* ----------------------------------------------------------------------------
   3. DATA STEP: ADaM ADSL (SUBJECT-LEVEL ANALYSIS DATASET)
   Techniques: ATTRIB, MERGE, IN= flags, DO loops, INTCK, INTNX, ISO8601 formatting
   ---------------------------------------------------------------------------- */
data adam.adsl(label="Subject-Level Analysis Dataset per ADaMIG v1.2");
  attrib
    STUDYID   length=$20  label="Study Identifier"
    USUBJID   length=$40  label="Unique Subject Identifier"
    SUBJID    length=$10  label="Subject Identifier"
    SITEID    length=$10  label="Study Site Identifier"
    AGE       length=8    label="Age (Years)"
    AGEGR1    length=$10  label="Pooled Age Group 1"
    AGEGR1N   length=8    label="Pooled Age Group 1 (N)"
    SEX       length=$1   label="Sex"
    RACE      length=$40  label="Race"
    ETHNIC    length=$40  label="Ethnicity"
    ARM       length=$40  label="Description of Planned Arm"
    ARMCD     length=$20  label="Planned Arm Code"
    TRT01P    length=$40  label="Planned Treatment for Period 01"
    TRT01PN   length=8    label="Planned Treatment for Period 01 (N)"
    TRT01A    length=$40  label="Actual Treatment for Period 01"
    TRT01AN   length=8    label="Actual Treatment for Period 01 (N)"
    TRTSDT    length=8    format=yymmdd10. label="Date of First Exposure to Treatment"
    TRTEDT    length=8    format=yymmdd10. label="Date of Last Exposure to Treatment"
    TRTDURD   length=8    label="Total Treatment Duration (Days)"
    SAFFL     length=$1   format=$saffl.   label="Safety Population Flag"
    ITTFL     length=$1   format=$ittfl.   label="Intent-to-Treat Population Flag"
    PPFL      length=$1   format=$ppfl.    label="Per-Protocol Population Flag";

  /* Merge SDTM Demographics with Exposure first/last dose */
  merge sdtm.dm(in=in_dm) sdtm.ex(in=in_ex keep=usubjid exstdtc exendtc);
  by usubjid;
  if in_dm;

  /* Derive Treatment Start and End Dates */
  if not missing(exstdtc) then TRTSDT = input(substr(exstdtc, 1, 10), yymmdd10.);
  if not missing(exendtc) then TRTEDT = input(substr(exendtc, 1, 10), yymmdd10.);
  
  if not missing(TRTSDT) and not missing(TRTEDT) then 
    TRTDURD = (TRTEDT - TRTSDT) + 1;

  /* Derive Population Flags per Protocol Specification */
  ITTFL = "Y";
  if not missing(TRTSDT) then SAFFL = "Y"; else SAFFL = "N";
  
  /* Per-protocol: Compliance >= 90% and zero major protocol violations */
  if SAFFL = "Y" and _compliance >= 90 and _hasMajorViolation = 0 then 
    PPFL = "Y"; 
  else 
    PPFL = "N";

  /* Age Groups */
  if AGE < 65 then do;
    AGEGR1 = "<65";
    AGEGR1N = 1;
  end;
  else do;
    AGEGR1 = ">=65";
    AGEGR1N = 2;
  end;

  TRT01P  = ARM;
  TRT01PN = ifn(ARMCD="TRT", 1, 2);
  
  if SAFFL = "Y" then do;
    TRT01A  = ARM;
    TRT01AN = TRT01PN;
  end;
  else do;
    TRT01A  = "Not Treated";
    TRT01AN = 0;
  end;
run;

/* ----------------------------------------------------------------------------
   4. DATA STEP: ADaM ADAE (ADVERSE EVENTS OCCURRENCE DATASET)
   ---------------------------------------------------------------------------- */
data adam.adae(label="Adverse Events Analysis Dataset per ADaMIG v1.2");
  merge sdtm.ae(in=in_ae) adam.adsl(in=in_sl keep=usubjid trtsdt trtedt trt01a trt01an saffl);
  by usubjid;
  if in_ae and saffl = "Y";

  if not missing(aestdtc) then AESTDT = input(substr(aestdtc, 1, 10), yymmdd10.);
  if not missing(aeendtc) then AEENDT = input(substr(aeendtc, 1, 10), yymmdd10.);
  
  /* Treatment-Emergent Adverse Event Rule */
  if not missing(AESTDT) and not missing(TRTSDT) and AESTDT >= TRTSDT then 
    TRTEMFL = "Y";
  else 
    TRTEMFL = "N";

  /* Numeric Severity Rating */
  select(AESEV);
    when("MILD")     AESEVN = 1;
    when("MODERATE") AESEVN = 2;
    when("SEVERE")   AESEVN = 3;
    otherwise        AESEVN = 0;
  end;
run;

/* ----------------------------------------------------------------------------
   5. PROC COMPARE: INDEPENDENT DOUBLE PROGRAMMING RECONCILIATION
   ---------------------------------------------------------------------------- */
proc sort data=adam.adsl out=adsl_sort nodupkey; by usubjid; run;
proc sort data=qc.adsl   out=qc_adsl_sort nodupkey; by usubjid; run;

proc compare base=adsl_sort compare=qc_adsl_sort 
  out=comp_diff outnoequal outbase outcomp;
  id usubjid;
run;

%macro verify_sysinfo;
  %if &SYSINFO = 0 %then %do;
    %put NOTE: [GxP AUDIT PASS] Zero discrepancies detected between Production and QC libraries. &SYSINFO = 0;
  %end;
  %else %do;
    %put ERROR: [GxP AUDIT FAIL] Discrepancies detected in independent double programming. SYSINFO = &SYSINFO;
  %end;
%mend verify_sysinfo;
%verify_sysinfo;

/* ----------------------------------------------------------------------------
   6. PROC GLM & PROC MIXED: PRIMARY EFFICACY ANCOVA MODEL (ICH E3 TABLE 14-3)
   ---------------------------------------------------------------------------- */
proc glm data=adam.adlb;
  where paramcd = "HBA1C" and avisit = "Week 24";
  class trt01a;
  model chg = base trt01a / solution clparm;
  lsmeans trt01a / pdiff=all cl alpha=0.05;
run;
quit;

proc mixed data=adam.adlb method=reml;
  where paramcd = "HBA1C";
  class trt01a avisitn usubjid;
  model chg = base trt01a avisitn trt01a*avisitn / ddfm=kr;
  repeated avisitn / subject=usubjid type=un;
  lsmeans trt01a*avisitn / slice=avisitn pdiff cl;
run;
quit;

/* ----------------------------------------------------------------------------
   7. PROC FREQ: MEDDRA SYSTEM ORGAN CLASS (SOC) ADVERSE EVENT DISTRIBUTION
   ---------------------------------------------------------------------------- */
proc freq data=adam.adae;
  where trtemfl = "Y";
  tables trt01a * aesoc / norow nocol nopercent chisq;
run;

/* ----------------------------------------------------------------------------
   8. PROC MEANS: SUMMARY STATISTICS FOR CSR TABLE 14-1
   ---------------------------------------------------------------------------- */
proc means data=adam.adsl n mean std median min max clm;
  class trt01p;
  var age trtdurd;
  output out=adam.adsl_summary n=n mean=mean std=std median=median min=min max=max;
run;

/* ----------------------------------------------------------------------------
   9. PROC REPORT: ICH E3 CSR TABLE 14-1 DEMOGRAPHIC SUMMARY
   ---------------------------------------------------------------------------- */
proc report data=adam.adsl headline headskip split='*';
  columns trt01p n (age,(mean std median min max));
  define trt01p / group 'Treatment Arm' width=25;
  define n      / 'N' format=4.0 width=6;
  define age    / analysis 'Age (Years)';
  define mean   / format=6.1 'Mean';
  define std    / format=6.2 'Std Dev';
  define median / format=6.1 'Median';
  define min    / format=6.0 'Min';
  define max    / format=6.0 'Max';
run;

/* ----------------------------------------------------------------------------
   10. PROC TRANSPOSE: LONGITUDINAL RESTRUCTURING FOR TIME-SERIES PROFILES
   ---------------------------------------------------------------------------- */
proc sort data=adam.adlb out=adlb_sort;
  by usubjid paramcd;
run;

proc transpose data=adlb_sort out=adam.adlb_transposed(drop=_name_) prefix=VISIT_;
  by usubjid paramcd;
  id avisitn;
  var aval;
run;

/* ----------------------------------------------------------------------------
   11. PROC SQL: RELATIONAL INTEGRITY, POPULATION SUMMARY & AUDIT COUNTS
   ---------------------------------------------------------------------------- */
proc sql;
  create table adam.adsl_pop_counts as
  select 
    trt01p,
    count(distinct usubjid) as N_ITT,
    sum(case when saffl = 'Y' then 1 else 0 end) as N_SAFETY,
    sum(case when ppfl  = 'Y' then 1 else 0 end) as N_PER_PROTOCOL,
    mean(age) as MEAN_AGE format=5.1
  from adam.adsl
  group by trt01p
  order by trt01p;
quit;
