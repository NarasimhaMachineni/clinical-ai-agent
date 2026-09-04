/******************************************************************************
 * STUDY:       ONC-2025-001
 * PROGRAM:     production_cdisc_pipeline.sas
 * PURPOSE:     End-to-End CDISC SDTM and ADaM derivation pipeline
 * STANDARDS:   CDISC SDTM-IG v3.3 / ADaM-IG v1.2 / FDA eCTD Module 5
 * AUTHOR:      Advanced Clinical Domain AI Agent
 ******************************************************************************/

/* 1. SETUP LIBRARIES */
libname raw  "data/raw";
libname sdtm "data/sdtm";
libname adam "data/adam";

/* ============================================================================
   STEP 1: PRODUCTION SAS MACRO - SDTM DM DOMAIN
   ============================================================================ */
%macro derive_sdtm_dm(in_raw=raw.demog, out_sdtm=sdtm.dm);
  data &out_sdtm(label="Demographics");
    attrib 
      STUDYID   length=$20  label="Study Identifier"
      DOMAIN    length=$2   label="Domain Abbreviation"
      USUBJID   length=$40  label="Unique Subject Identifier"
      SUBJID    length=$10  label="Subject Identifier"
      RFSTDTC   length=$19  label="Subject Reference Start Date/Time"
      RFENDTC   length=$19  label="Subject Reference End Date/Time"
      AGE       length=8    label="Age"
      AGEU      length=$10  label="Age Units"
      SEX       length=$1   label="Sex"
      RACE      length=$40  label="Race"
      ETHNIC    length=$30  label="Ethnicity"
      ARMCD     length=$20  label="Planned Arm Code"
      ARM       length=$40  label="Description of Planned Arm"
      COUNTRY   length=$3   label="Country";

    set &in_raw;
    
    STUDYID = "ONC-2025-001";
    DOMAIN  = "DM";
    SUBJID  = put(pt_id, z3.);
    USUBJID = catx("-", STUDYID, SUBJID);
    
    /* ISO 8601 Date Standard */
    if not missing(first_dose_date) then 
      RFSTDTC = put(first_dose_date, is8601dt.);
    if not missing(last_dose_date) then 
      RFENDTC = put(last_dose_date, is8601dt.);
      
    AGE   = floor((intck('month', dob, first_dose_date) - (day(first_dose_date) < day(dob))) / 12);
    AGEU  = "YEARS";
    SEX   = upcase(raw_gender);
    RACE  = upcase(raw_race);
    ETHNIC= ifc(raw_ethnicity="Hispanic", "HISPANIC OR LATINO", "NOT HISPANIC OR LATINO");
    
    ARMCD = upcase(assigned_arm_code);
    ARM   = ifc(ARMCD="DMED", "Diabetes Medication 500mg", "Placebo");
    COUNTRY = "USA";
  run;
%mend derive_sdtm_dm;

/* ============================================================================
   STEP 2: PRODUCTION SAS MACRO - ADAM ADSL DATASET
   ============================================================================ */
%macro derive_adam_adsl(in_dm=sdtm.dm, in_ex=sdtm.ex, out_adsl=adam.adsl);
  proc sql;
    create table &out_adsl as
    select 
      a.STUDYID,
      a.USUBJID,
      a.SUBJID,
      a.SITEID,
      a.AGE,
      case when a.AGE < 65 then "<65" else ">=65" end as AGEGR1 length=$10,
      case when a.AGE < 65 then 1 else 2 end as AGEGR1N,
      a.AGEU,
      a.SEX,
      a.RACE,
      a.ETHNIC,
      a.ARM,
      a.ARMCD,
      a.ARM as TRT01P,
      case when a.ARMCD = "DMED" then 1 else 2 end as TRT01PN,
      case when b.USUBJID is not null then a.ARM else "Not Treated" end as TRT01A,
      
      /* Treatment start and end dates */
      input(scan(b.EXSTDTC, 1, 'T'), yymmdd10.) as TRTSDT format=yymmdd10.,
      input(scan(b.EXENDTC, 1, 'T'), yymmdd10.) as TRTEDT format=yymmdd10.,
      
      /* Safety Population Flag: Received >= 1 dose */
      case when b.USUBJID is not null then "Y" else "N" end as SAFFL length=$1,
      
      /* Intent-to-Treat: All randomized subjects */
      "Y" as ITTFL length=$1,
      
      /* Per-Protocol Flag */
      case when b.USUBJID is not null and c.VIOLATION is null then "Y" else "N" end as PPFL length=$1
      
    from &in_dm a
    left join &in_ex b on a.USUBJID = b.USUBJID
    left join raw.deviations c on a.USUBJID = c.USUBJID;
  quit;

  /* Validation cross-tabulation */
  proc freq data=&out_adsl;
    tables ITTFL * SAFFL * PPFL / list missing;
    title "ADSL Population Flag Distribution Validation";
  run;
%mend derive_adam_adsl;
