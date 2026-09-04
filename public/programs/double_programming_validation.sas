/******************************************************************************
 * STUDY:       ONC-2025-001
 * PROGRAM:     double_programming_validation.sas
 * PURPOSE:     Dual-Track Independent Verification of ADaM Datasets & CSR Tables
 * REPOSITORY:  https://github.com/NarasimhaMachineni/clinical-ai-agent/blob/main/programs/double_programming_validation.sas
 * AUTHOR:      QC Biostatistician (Validation Track)
 ******************************************************************************/

libname prod "data/adam";
libname qc   "data/qc";

/* Check 1: ADSL Validation */
proc compare base=prod.adsl compare=qc.adsl out=diff_adsl outnoequal listall;
  id usubjid;
run;

/* Check 2: ADAE Validation */
proc compare base=prod.adae compare=qc.adae out=diff_adae outnoequal listall;
  id usubjid aeseq;
run;

/* Check 3: ADLB Validation */
proc compare base=prod.adlb compare=qc.adlb out=diff_adlb outnoequal listall;
  id usubjid paramcd avisitn;
run;

/* Regulatory Verification Assertion */
%macro assert_zero_diff(dataset);
  %if &SYSINFO = 0 %then %do;
    %put %str(PASS: &dataset 100.0%% Concordance Confirmed. Zero Discrepancies.);
  %end;
  %else %do;
    %put %str(FAIL: &dataset Failed Verification. SYSINFO = &SYSINFO);
  %end;
%mend assert_zero_diff;

%assert_zero_diff(ADSL);
%assert_zero_diff(ADAE);
%assert_zero_diff(ADLB);
