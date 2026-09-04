# ClinicalOps AI Agent — Autonomous PC Task Engine & GitHub Synchronizer

> **Autonomous Clinical Data Science & Regulatory Operations Agent** for biostatisticians, statistical programmers, and clinical data managers. Directly integrates with your local PC filesystem to execute end-to-end CDISC pipelines, run Pinnacle 21 validation audits, conduct safety surveillance, format CSR tables, and synchronize deliverables to GitHub.

---

## Architecture Overview

```mermaid
flowchart LR
    A["Raw EDC Files (data_inbox/)"] -->|PC File Watcher / Upload| B["Real Data Ingestion Engine"]
    B --> C["CDISC SDTM v3.3 Mapping"]
    C --> D["ADaM v1.2 Derivation (BDS/OCCDS)"]
    D --> E["Python Pinnacle 21 & CDISC QC"]
    E --> F["Hy's Law & Safety Surveillance"]
    F --> G["ICH E3 CSR Statistical Tables"]
    G --> H["CDISC Define-XML v2.1 Dossier"]
    H -->|Auto-Commit & Push| I["GitHub Repository"]
```

---

## Key Capabilities

- **Zero Synthetic Mock Data**: Ingests real clinical trial EDC files directly from your PC (`demog.csv`, `ae.csv`, `labs.csv`, `vitals.csv`, `dosing.csv`).
- **Autonomous Local PC File Watcher**: Actively monitors your inbox folder (`data_inbox/` or any custom folder path on your machine) and automatically triggers the end-to-end pipeline upon file changes.
- **CDISC SDTM v3.3 & ADaM v1.2 Engines**: Maps raw records to standard domains (`DM`, `VS`, `LB`, `AE`, `EX`) and derives analysis datasets (`ADSL`, `ADAE`, `ADLB`) with strict population flags (`SAFFL`, `ITTFL`, `PPFL`).
- **Automated Pinnacle 21 & Regulatory QC**: Powered by Python scripts executing core CDISC submission assertions (1-to-1 subject preservation, `TRTEMFL` chronology, `USUBJID` uniqueness).
- **Independent Double-Programming QC**: Simulates SAS `PROC COMPARE` across libraries, enforcing `&SYSINFO = 0` zero-discrepancy validation.
- **FDA Safety & Hy's Law Hepatotoxicity Surveillance**: Real-time screening for transaminase and bilirubin spikes ($ALT/AST \ge 3\times\text{ULN} \land TBL \ge 2\times\text{ULN}$) and MedDRA System Organ Class (SOC) distributions.
- **CSR Table Suite (ICH E3)**: Automatically computes and formats statistical summary tables:
  - Table 14-1: Demographics & Baseline Characteristics
  - Table 14-2: Summary of Treatment-Emergent Adverse Events (TEAE)
  - Table 14-3: Primary Efficacy ANCOVA for HbA1c change from baseline
- **eCTD Module 5 Packaging & Define-XML v2.1**: Emits standard schema-compliant Define-XML and dual-track production code (SAS 9.4 and R pharmaverse `admiral`).
- **GitHub Version Control Integration**: Automated GxP commits for every pipeline run, with instant push and pull capabilities.
- **PC System Agent**: Run PowerShell and Python commands directly on your PC, inspect hardware health (CPU, RAM, runtimes), and schedule recurring background tasks.

---

## Project Structure

```
clinical-ai-agent/
├── data_inbox/               # Watched folder on PC for real incoming EDC CSV files
│   ├── raw_demog.csv
│   ├── raw_ae.csv
│   ├── raw_labs.csv
│   ├── raw_vitals.csv
│   └── raw_dosing.csv
├── engines/
│   ├── agentTaskEngine.js        # Main autonomous task orchestrator & state machine
│   ├── realDataIngestionEngine.js# Ingestion parser for real CSV/JSON EDC records
│   ├── pcWatcherEngine.js        # Real-time PC directory watcher (fs.watch)
│   ├── pcSystemAgentEngine.js    # Universal PC command runner, diagnostics & scheduler
│   ├── githubEngine.js           # Git & GitHub version control integration
│   ├── sdtmEngine.js             # CDISC SDTM v3.3 mapping engine
│   ├── adamEngine.js             # CDISC ADaM v1.2 derivation engine
│   ├── defineXmlEngine.js        # CDISC Define-XML v2.1 XML generator
│   └── codeGenEngine.js          # Dual-track SAS 9.4 and R pharmaverse code generator
├── public/                       # Workstation web interface
│   ├── index.html                # Task Commander, Pipeline tracker, & Artifact tabs
│   ├── style.css                 # Professional clinical dark theme
│   └── app.js                    # Client workstation engine & streaming console
├── scripts/
│   └── cdisc_qc_audit.py         # Python Pinnacle 21 regulatory rule assertions
├── submission_package/           # eCTD Module 5 output deliverables
│   ├── define.xml
│   ├── sdtm/
│   ├── adam/
│   ├── reports/
│   └── programs/
├── server.js                     # Express API & execution backend
└── package.json
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0 or later (v24 recommended)
- **Python**: v3.10 or later (v3.13 tested)
- **Git**: v2.40 or later

### Installation & Launch

1. Clone the repository:
   ```bash
   git clone https://github.com/NarasimhaMachineni/clinical-ai-agent.git
   cd clinical-ai-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the ClinicalOps AI Agent:
   ```bash
   npm start
   # or
   node server.js
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3050
   ```

---

## How to Use

1. **Automatic Execution on PC**:
   Drop your raw EDC CSV files into `data_inbox/` or upload them via the **Upload EDC** button. The agent automatically detects the files, runs the pipeline, and updates reports.
2. **Task Commander**:
   Type any task into the top input bar:
   - `"Run daily full clinical pipeline on real PC data"`
   - `"Run Pinnacle 21 validation audit"`
   - `"Check for Hy's Law liver signals and SAEs"`
   - `"Perform independent double programming comparison"`
   - `"Synchronize deliverables to GitHub"`
3. **PC Diagnostics & Command Runner**:
   Navigate to the **🖥️ PC System Agent** tab to view your PC's hardware status (RAM, OS, CPU, runtimes) and execute PowerShell or Python commands directly on your machine.
4. **GitHub Synchronization**:
   Click **"Sync GitHub"** in the header or type `"Push to GitHub"` to commit and push all derived datasets, Define-XML, TLFs, and code.

---

## Author
**Lakshmi Narasimha Machineni**  
GitHub: [@NarasimhaMachineni](https://github.com/NarasimhaMachineni)
