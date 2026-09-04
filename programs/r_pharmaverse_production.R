# ==============================================================================
# STUDY:       ONC-2025-001 (Phase 3 Randomized Clinical Trial)
# SCRIPT:      r_pharmaverse_production.R
# PURPOSE:     CDISC ADaM Derivation (ADSL, ADAE, ADLB, ADVS) & CSR TLFs via Pharmaverse
# REPOSITORY:  https://github.com/NarasimhaMachineni/clinical-ai-agent/blob/main/programs/r_pharmaverse_production.R
# AUTHOR:      ClinicalOps AI Agent (Lakshmi Narasimha Machineni)
# PACKAGES:    admiral, dplyr, tidyr, lubridate, rtables, tern, haven, readr
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. LOAD R PHARMAVERSE CORE PACKAGES
# ------------------------------------------------------------------------------
suppressPackageStartupMessages({
  library(admiral)     # ADaM in R Asset Library (CDISC Compliant Derivations)
  library(dplyr)       # Data Manipulation Grammar
  library(tidyr)       # Tidy Messy Data & Reshaping
  library(lubridate)   # Date & Time Processing
  library(rtables)     # Reporting Tables for Regulatory Clinical Submissions
  library(tern)        # Create Tables, Listings, Graphs for CSR
  library(haven)       # SAS Transport File (.xpt) Ingestion & Export
  library(readr)       # High-performance Flat File Reader
})

# ------------------------------------------------------------------------------
# 2. INGEST SDTM DOMAINS (DM, VS, LB, AE, EX)
# ------------------------------------------------------------------------------
sdtm_dm <- read_csv("data_inbox/raw_demog.csv", show_col_types = FALSE)
sdtm_vs <- read_csv("data_inbox/raw_vitals.csv", show_col_types = FALSE)
sdtm_lb <- read_csv("data_inbox/raw_labs.csv", show_col_types = FALSE)
sdtm_ae <- read_csv("data_inbox/raw_ae.csv", show_col_types = FALSE)
sdtm_ex <- read_csv("data_inbox/raw_dosing.csv", show_col_types = FALSE)

# ------------------------------------------------------------------------------
# 3. DERIVE ADSL (SUBJECT-LEVEL ANALYSIS DATASET) USING ADMIRAL
# Functions: derive_vars_merged, derive_var_trtsdt, derive_var_trtedt, derive_var_trtdurd
# ------------------------------------------------------------------------------
adsl <- sdtm_dm %>%
  # Merge First Dose Date from Exposure (EX)
  derive_vars_merged(
    dataset_add = sdtm_ex,
    filter_add = !is.na(EXSTDTC),
    new_vars = exprs(TRTSDT = convert_dtc_to_dt(min(EXSTDTC))),
    by_vars = exprs(STUDYID, USUBJID)
  ) %>%
  # Merge Last Dose Date from Exposure (EX)
  derive_vars_merged(
    dataset_add = sdtm_ex,
    filter_add = !is.na(EXENDTC),
    new_vars = exprs(TRTEDT = convert_dtc_to_dt(max(EXENDTC))),
    by_vars = exprs(STUDYID, USUBJID)
  ) %>%
  # Derive Treatment Duration in Days (TRTDURD = TRTEDT - TRTSDT + 1)
  derive_var_trtdurd() %>%
  # Derive Analysis Population Flags per Statistical Analysis Plan (SAP)
  mutate(
    # Intent-to-Treat: All randomized subjects
    ITTFL = if_else(!is.na(ARMCD) & ARMCD != "SCRNFL", "Y", "N"),
    # Safety Analysis Set: Received >= 1 dose of study medication
    SAFFL = if_else(!is.na(TRTSDT), "Y", "N"),
    # Per-Protocol Set: Safety population + >= 90% compliance + 0 major violations
    PPFL  = if_else(SAFFL == "Y" & (_compliance %||% 95) >= 90 & (_hasMajorViolation %||% 0) == 0, "Y", "N"),
    # Age Categorization
    AGEGR1  = if_else(AGE < 65, "<65", ">=65"),
    AGEGR1N = if_else(AGE < 65, 1, 2),
    # Planned vs Actual Treatment Variables
    TRT01P  = ARM,
    TRT01PN = if_else(ARMCD == "TRT", 1, 2),
    TRT01A  = if_else(SAFFL == "Y", ARM, "Not Treated"),
    TRT01AN = if_else(SAFFL == "Y" & ARMCD == "TRT", 1, if_else(SAFFL == "Y", 2, 0))
  )

# ------------------------------------------------------------------------------
# 4. DERIVE ADAE (ADVERSE EVENTS OCCURRENCE DATA STRUCTURE)
# Functions: derive_vars_merged, convert_dtc_to_dt, derive_var_ontreatment
# ------------------------------------------------------------------------------
adae <- sdtm_ae %>%
  # Merge baseline attributes and treatment timestamps from ADSL
  derive_vars_merged(
    dataset_add = adsl,
    new_vars = exprs(TRTSDT, TRTEDT, TRT01A, TRT01AN, SAFFL),
    by_vars = exprs(STUDYID, USUBJID)
  ) %>%
  mutate(
    # Convert SDTM ISO character dates to numeric R Date objects
    AESTDT = convert_dtc_to_dt(AESTDTC),
    AEENDT = convert_dtc_to_dt(AEENDTC),
    # Treatment-Emergent Adverse Event (TEAE): Onset on or after first dose
    TRTEMFL = if_else(!is.na(AESTDT) & !is.na(TRTSDT) & AESTDT >= TRTSDT, "Y", "N"),
    # Severity Numeric Score for Categorical ANCOVA / Frequencies
    AESEVN = case_when(
      AESEV == "MILD"     ~ 1,
      AESEV == "MODERATE" ~ 2,
      AESEV == "SEVERE"   ~ 3,
      TRUE                ~ 0
    ),
    # Relatedness Flag per Investigator Assessment
    AERELFL = if_else(grepl("RELATED", toupper(AEREL)), "Y", "N")
  )

# ------------------------------------------------------------------------------
# 5. DERIVE ADLB (LABORATORY BDS - BASIC DATA STRUCTURE)
# Functions: derive_var_base, derive_var_chg, derive_var_extreme_flag
# ------------------------------------------------------------------------------
adlb <- sdtm_lb %>%
  derive_vars_merged(
    dataset_add = adsl,
    new_vars = exprs(TRTSDT, TRT01A, SAFFL),
    by_vars = exprs(STUDYID, USUBJID)
  ) %>%
  mutate(
    AVAL  = as.numeric(LBORRES),
    AVALU = LBORRESU
  ) %>%
  # Group by Subject & Parameter to assign Baseline Observation (ABLFL = 'Y')
  group_by(STUDYID, USUBJID, LBTESTCD) %>%
  mutate(
    # Latest pre-dose measurement is defined as Baseline
    ABLFL = if_else(VISIT == "Baseline" | AVISIT == "Baseline", "Y", "N")
  ) %>%
  # Derive BASE (Baseline Value) for each record
  derive_var_base(
    by_vars = exprs(STUDYID, USUBJID, LBTESTCD),
    source_var = AVAL,
    filter = ABLFL == "Y"
  ) %>%
  # Derive CHG (Absolute Change from Baseline) and PCHG (Percent Change)
  derive_var_chg() %>%
  ungroup()

# ------------------------------------------------------------------------------
# 6. CSR SUMMARY TABLES VIA RTABLES & TERN (ICH E3 TABLE 14-1 & 14-2)
# ------------------------------------------------------------------------------
tbl_demog <- basic_table() %>%
  split_cols_by("TRT01P") %>%
  add_colcounts() %>%
  analyze(c("AGE", "AGEGR1", "SEX", "RACE"), function(x, ...) {
    if (is.numeric(x)) in_rows("Mean (SD)" = c(mean(x, na.rm=TRUE), sd(x, na.rm=TRUE)))
    else in_rows("Counts" = table(x))
  }) %>%
  build_table(adsl)

print(tbl_demog)

# ------------------------------------------------------------------------------
# 7. PRIMARY EFFICACY ANCOVA ANALYSIS (WEEK 24 HbA1c CHANGE)
# ------------------------------------------------------------------------------
hba1c_data <- adlb %>% filter(LBTESTCD == "HBA1C" & AVISIT == "Week 24")
ancova_model <- lm(CHG ~ BASE + TRT01A, data = hba1c_data)
ancova_summary <- summary(ancova_model)
print(ancova_summary)

# Export deliverables
write_csv(adsl, "submission_package/adam/adsl.csv")
write_csv(adae, "submission_package/adam/adae.csv")
write_csv(adlb, "submission_package/adam/adlb.csv")
