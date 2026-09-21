# ==============================================================================
# STUDY:       ONC-2025-001
# SCRIPT:      production_adsl_admiral.R
# PURPOSE:     Modern CDISC Derivation (ADSL) via Pharmaverse R Architecture
# PACKAGES:    admiral, dplyr, tidyr, lubridate, rtables, tern, diffdf, haven
# STANDARDS:   CDISC SDTM-IG v3.3 / ADaM-IG v1.3 / FDA eCTD Technical Conformance
# GENERATED:   2026-09-21T16:57:46.223Z
# ==============================================================================

suppressPackageStartupMessages({
  library(admiral)     # CDISC ADaM Derivation Engine
  library(dplyr)       # Relational Grammar
  library(tidyr)       # Tidy Reshaping
  library(lubridate)   # ISO 8601 Date Parsing
  library(rtables)     # Regulatory Summary Tables
  library(tern)        # Biostatistical Tables & Figures
  library(diffdf)      # Independent Double Programming Verification
  library(haven)       # SAS Transport File Ingestion (.xpt)
})

# 1. READ RAW / SDTM DATASETS
raw_data <- read_csv("data_inbox/adsl.csv", show_col_types = FALSE)

# 2. ADMIRAL DERIVATION PIPELINE FOR ADSL
ADSL <- raw_data %>%
  # Ensure STUDYID consistency
  mutate(STUDYID = "ONC-2025-001") %>%
  # ISO 8601 Date Conversions
  mutate(across(matches("DTC$"), ~ convert_dtc_to_dt(.x), .names = "{.col}_DT"))


# ADSL Specific Population Flags & Baseline Cohorts
ADSL <- ADSL %>%
  mutate(
    # Intent-to-Treat: All randomized subjects
    ITTFL = if_else(!is.na(ARMCD) & ARMCD != "SCRNFL", "Y", "N"),
    # Safety Analysis Set: Received >= 1 dose
    SAFFL = if_else(!is.na(TRTSDT_DT), "Y", "N"),
    # Categorical Age Groups
    AGEGR1 = if_else(AGE < 65, "<65", ">=65"),
    AGEGR1N = if_else(AGE < 65, 1, 2),
    # Planned vs Actual Treatment
    TRT01P = ARM,
    TRT01PN = if_else(ARMCD == "TRT", 1, 2),
    TRT01A = if_else(SAFFL == "Y", ARM, "Not Treated")
  )


# 3. SUPPLEMENTAL QUALIFIER (SUPP) EXTRACTION VIA TIDYR
supp_adsl <- ADSL %>%
  select(STUDYID, USUBJID, matches("^(AE|LB|VS|CM|DM)_[A-Z0-9_]+$")) %>%
  pivot_longer(
    cols = -c(STUDYID, USUBJID),
    names_to = "QNAM",
    values_to = "QVAL"
  ) %>%
  filter(!is.na(QVAL) & QVAL != "") %>%
  mutate(
    RDOMAIN = "SL",
    IDVAR = "SLSEQ",
    IDVARVAL = as.character(row_number()),
    QLABEL = QNAM,
    QORIG = "CRF"
  )

# 4. INDEPENDENT DOUBLE PROGRAMMING VALIDATION (SAS VS R)
qc_data <- readRDS("data_qc/adsl_qc.rds")

# diffdf: Identical Double-Programming Tolerance Verification
diff_report <- diffdf(
  ADSL, 
  qc_data, 
  keys = c("STUDYID", "USUBJID"),
  tolerance = 1e-8,
  scale = 1
)

if (diffdf_has_issues(diff_report)) {
  warning("[GxP FAIL] Discrepancies detected between SAS and R pipelines!")
  print(diffdf_issuerows(diff_report))
} else {
  message("[GxP AUDIT PASS] 100% Mathematical Concordance Verified between SAS 9.4 and R Admiral.")
}
