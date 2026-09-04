# ==============================================================================
# STUDY:       ONC-2025-001
# SCRIPT:      modern_pharmaverse_adsl.R
# PURPOSE:     ADSL and ADAE derivation using modern pharmaverse packages
# PACKAGES:    admiral, dplyr, lubridate, rtables
# ==============================================================================

library(admiral)
library(dplyr)
library(lubridate)
library(rtables)

# 1. READ SDTM DOMAINS
sdtm_dm <- readRDS("data/sdtm/dm.rds")
sdtm_ex <- readRDS("data/sdtm/ex.rds")
sdtm_ae <- readRDS("data/sdtm/ae.rds")

# 2. DERIVE ADSL USING ADMIRAL
adsl <- sdtm_dm %>%
  # Merge treatment start date from EX
  derive_vars_merged(
    dataset_add = sdtm_ex,
    filter_add = !is.na(EXSTDTC),
    new_vars = exprs(TRTSDT = convert_dtc_to_dt(min(EXSTDTC))),
    by_vars = exprs(STUDYID, USUBJID)
  ) %>%
  # Merge treatment end date from EX
  derive_vars_merged(
    dataset_add = sdtm_ex,
    filter_add = !is.na(EXENDTC),
    new_vars = exprs(TRTEDT = convert_dtc_to_dt(max(EXENDTC))),
    by_vars = exprs(STUDYID, USUBJID)
  ) %>%
  # Derive Treatment Duration in Days
  derive_var_trtdurd() %>%
  # Derive Population Flags per SAP
  mutate(
    SAFFL = if_else(!is.na(TRTSDT), "Y", "N"),
    ITTFL = if_else(!is.na(ARMCD) & ARMCD != "SCRNFL", "Y", "N"),
    AGEGR1 = if_else(AGE < 65, "<65", ">=65"),
    AGEGR1N = if_else(AGE < 65, 1, 2),
    TRT01P = ARM,
    TRT01PN = if_else(ARMCD == "DMED", 1, 2),
    TRT01A = if_else(SAFFL == "Y", ARM, "Not Treated")
  )

# 3. DERIVE ADAE (OCCURRENCE DATA STRUCTURE)
adae <- sdtm_ae %>%
  derive_vars_merged(
    dataset_add = adsl,
    new_vars = exprs(TRTSDT, TRTEDT, TRT01A, SAFFL),
    by_vars = exprs(STUDYID, USUBJID)
  ) %>%
  mutate(
    AESTDT = convert_dtc_to_dt(AESTDTC),
    # Treatment-Emergent AE Definition: Onset on or after first dose
    TRTEMFL = if_else(!is.na(AESTDT) & !is.na(TRTSDT) & AESTDT >= TRTSDT, "Y", "N"),
    AESEVN = case_when(
      AESEV == "MILD" ~ 1,
      AESEV == "MODERATE" ~ 2,
      AESEV == "SEVERE" ~ 3,
      TRUE ~ NA_real_
    )
  )

# 4. GxP COMPLIANCE AUDIT
print(paste("ADSL generated with", nrow(adsl), "subjects."))
print(table(SAFFL = adsl$SAFFL, ITTFL = adsl$ITTFL))
print(table(TRTEMFL = adae$TRTEMFL, AESEV = adae$AESEV))
