# ClinicalOps AI Agent Enterprise Edition — From Data to Decisions

> **Enterprise Clinical Statistical Programming, CDISC Intelligence, SAS/R Validation & Quality Engineering Workbench** for Pharmaceutical Sponsors, Biotechnology Companies, and CROs. Built on CDISC SDTMIG v3.3/3.4, CDISC ADaMIG v1.3, Define-XML v2.1, ICH E3, ICH E6(R3), ICH E9, ICH M11, and 21 CFR Part 11 principles.

[![Validation Tests](https://img.shields.io/badge/Acceptance%20Tests-252%2F252%20Pass-10b981.svg)](#automated-validation--testing)
[![Design System](https://img.shields.io/badge/Design%20System-Apple%20Liquid%20Glass-2dd4bf.svg)](#1-apple-inspired-liquid-glass-design-system)
[![CDISC Standards](https://img.shields.io/badge/CDISC-SDTM%20v3.4%20%7C%20ADaM%20v1.3-38bdf8.svg)](#cdisc-standards--validation-coverage)
[![Evidence Vault](https://img.shields.io/badge/21%20CFR%20Part%2011-SHA--256%20Cryptographic%20Passport-a855f7.svg)](#5-high-value-clinical-differentiators)
[![Hosting](https://img.shields.io/badge/Deployment-GitHub%20Pages%20Ready-0284c7.svg)](https://narasimhamachineni.github.io/clinical-ai-agent/)

---

## 1. End-to-End Enterprise Study Pipeline

ClinicalOps AI Agent Enterprise Edition provides a continuous, traceable clinical study pipeline connecting raw data ingestion to validated submission deliverables:

```
[1. Ingestion & Profiling] ──▶ [2. Study Specs & Metadata] ──▶ [3. SDTM Mapping & QC]
            │                                                              │
            ▼                                                              ▼
[6. Concordance & Release] ◀── [5. TLF Studio & Cell QC] ◀─── [4. ADaM Derivation & QC]
```

1. **Ingestion & Profiling**: Raw file intake (.csv, .json, tabular EDC), schema detection, and columnar data profiling.
2. **Study Specs & Metadata**: Configurable Phase I-IV study setup, parallel/crossover/dose-escalation designs, protocol endpoints, estimands, and SAP rules.
3. **SDTM Mapping & QC**: Source-to-target mapping, sequence numbers (--SEQ), study days (--DY), ISO 8601 timestamps (--DTC), and CDISC CT codelist checks.
4. **ADaM Derivation & QC**: Specification-driven derivation of ADSL, ADAE, BDS (ADLB, ADVS, ADQS), treatment-emergent logic (TRTEMFL), and population flags.
5. **TLF Studio & Cell QC**: Specification-driven Tables, Listings, Figures with denominator reconciliation and record-level drill-down.
6. **Concordance & Release**: Independent SAS vs R reconciliation (PROC COMPARE & diffdf) and GxP Evidence Passport with SHA-256 seal.

---

## 2. Six Core Workspaces Architecture

The platform organizes clinical operations into six primary workspaces:

| Workspace ID | Primary View Name | Core Capabilities |
| :--- | :--- | :--- |
| `01. tab-overview` | **Study Overview** | Executive telemetry, milestone tracker, data health radar, patient enrollment counts. |
| `02. tab-study-workspace` | **Study Workspace** | Ingestion & profiling, metadata management, Define-XML v2.1 viewer, Phase I-IV study configuration. |
| `03. tab-quality-validation` | **Quality & Validation** | SDTM compliance, ADaM conformance, Define-XML checks, cross-domain referential integrity. |
| `04. tab-programming-impact` | **Programming & Impact** | SAS/R code editor, Change Impact Simulator (blast radius), execution adapter runners. |
| `05. tab-analysis-deliverables`| **Analysis & Deliverables** | CSR Tables, Listings, Figures (TLFs), denominator reconciliation, cell-level drill-down. |
| `06. tab-evidence-governance` | **Evidence & Governance** | Independent SAS/R Concordance Engine, 5-Tier Data Detective, Risk Radar, Evidence Passport. |

---

## 3. High-Value Clinical Differentiators

### 1. Clinical Data Detective (5-Tier Forensic Trace)
- Traces any deliverable cell down to its exact source:
  - **Tier 1**: Reported TLF Cell (Value, Denominator $N$, Flag)
  - **Tier 2**: Mathematical Derivation Rule & SAP Algorithm
  - **Tier 3**: Contributing ADaM Analysis Records
  - **Tier 4**: Underlying SDTM Standard Domain Variables
  - **Tier 5**: Raw Source / eCRF Audit Evidence
- Strictly separates deterministic facts (`[DETERMINISTIC FACT]`) from AI drafts (`[AI CODE DRAFT]`).

### 2. Change Impact Simulator & Blast Radius Engine
- Simulates modifications in specifications, data formats, or derivation windows.
- Automatically maps:
  - Dependent ADaM variables impacted.
  - Downstream CSR TLFs invalidated and flagged as **STALE**.
  - Affected regulatory validation rules (FDA SDTM / ADaM).
  - Recommended selective re-execution queue to minimize compute cost.

### 3. Clinical Quality Risk Radar
- Multi-factor anomaly prioritization algorithm:
  $$\text{Risk Score} = 0.35 \times \text{Endpoint Impact} + 0.30 \times \text{Patient Safety} + 0.20 \times \text{Downstream Dependencies} + 0.15 \times \text{Regulatory Severity}$$
- Automatically stratifies findings into 4 tiers:
  - **Tier 1**: Critical Submission Blockers (Score $\ge 80$)
  - **Tier 2**: High Statistical Risk (Score $60-79$)
  - **Tier 3**: Moderate Data Hygiene (Score $40-59$)
  - **Tier 4**: Minor Informational (Score $< 40$)

### 4. SAS & R Execution Adapters Architecture
- Transparent dual execution architecture:
  - **Adapter 1 (Active)**: Built-in client-side deterministic validator & reconciler (no server dependency).
  - **Adapter 2**: SAS 9.4 / Viya Batch REST & CLI connector with return code parsing (`RC=0`, `RC=4`, `RC=8`).
  - **Adapter 3**: R 4.4 / Pharmaverse execution connector (`admiral`, `rtables`, `diffdf`, `tern`).

### 5. TLF Cell Subject-Level Drill-Down
- Clicking any cell in a summary table opens the exact contributing subject records (demographics, arm, dose date, parameter values) with one-click cohort CSV export.

### 6. GxP Evidence Passport & SHA-256 Vault
- Generates a cryptographically sealed submission readiness package containing SHA-256 fingerprints across raw data, specs, SDTM, ADaM, TLFs, SAS/R code, and 21 CFR Part 11 audit trails.

---

## 4. Automated Validation & Testing

The platform maintains automated acceptance test suites covering 100% of claimed functionality:

```text
========================================================================================
SUITE                                              SCOPE               TESTS   STATUS
========================================================================================
scripts/test_v13_ultimate_clinical_os.js           Core Architecture    73     100% PASS
scripts/test_tab_sync_and_copilot.js               Copilot & Healing    25     100% PASS
scripts/test_v14_clinical_os_and_features.js       Clinical Features    21     100% PASS
scripts/test_v14_standards_and_integrity.js        CDISC Validation     40     100% PASS
scripts/test_v15_master_refactor.js                Workbench & GxP      21     100% PASS
scripts/test_v16_product_transformation.js         Product Overhaul     29     100% PASS
scripts/test_v17_clinicalops_2_0.js                Glass UI & Diff      19     100% PASS
scripts/test_v18_enterprise_edition.js             Enterprise Platform  24     100% PASS
========================================================================================
TOTAL AUTOMATED ACCEPTANCE TESTS:                                      252     100% PASS
========================================================================================
```

To execute all acceptance suites:
```bash
node scripts/test_v18_enterprise_edition.js
```

---

## 5. Dual-Location Parity

To ensure flawless static deployment on GitHub Pages alongside local Node.js execution, all primary files maintain 100% byte-for-byte identity:
- `index.html` $\longleftrightarrow$ `public/index.html`
- `app.js` $\longleftrightarrow$ `public/app.js`
- `style.css` $\longleftrightarrow$ `public/style.css`
- `README.md` $\longleftrightarrow$ `public/README.md`

---

## 6. GxP Computerized System Validation Notice

> **Regulatory Compliance Notice**: This software operates strictly deterministically in-browser. No patient data or PHI is transmitted to external AI endpoints without explicit authorization. AI-assisted remediation drafts are segregated from deterministic facts and require human review. Automated validation results do not substitute for formal study-specific Computerized System Validation (CSV) protocols under 21 CFR Part 11 and ICH E6(R3).
